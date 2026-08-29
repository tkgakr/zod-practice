import assert from "node:assert/strict"
import * as z from "zod"

// nickname の「無い」をどう表現するかだけが違う3つのスキーマ。
const OptionalUser = z.object({ nickname: z.string().optional() })
const NullableUser = z.object({ nickname: z.string().nullable() })
const NullishUser = z.object({ nickname: z.string().nullish() })

// 4種類の入力。同じ値を使い回さないよう毎回新しいオブジェクトを作る。
const inputs = {
  // プロパティ自体が無い。
  absent: () => ({}),
  // キーはあるが値が undefined。
  undef: () => ({ nickname: undefined }),
  // キーがあり、明示的に null。
  null: () => ({ nickname: null }),
  // 通常の文字列。
  string: () => ({ nickname: "taka" })
}

// --- 検証結果の一覧表 -----------------------------------------------------
// OK の括弧内は parse 後の出力。「キー無し」は Object.hasOwn が false になる状態。
//
// 入力＼スキーマ        | .optional()      | .nullable()  | .nullish()
// ---------------------|------------------|--------------|------------------
// {}            (省略) | OK (キー無し)    | NG           | OK (キー無し)
// { nickname: undefined } | OK (undefined) | NG         | OK (undefined)
// { nickname: null }   | NG               | OK (null)    | OK (null)
// { nickname: "taka" } | OK ("taka")      | OK ("taka")  | OK ("taka")
//
// 読み方:
//   .optional() は「値が undefined でもよい」= 省略を許す。null は別物として拒否。
//   .nullable() は「値が null でもよい」。キーは必須なので省略も undefined も拒否。
//   .nullish()  = .optional() + .nullable()。4入力すべてを受け入れる。
//   NG はいずれも invalid_type。undefined/null は型が合わない値として扱われる。

// --- .optional() ----------------------------------------------------------
const optAbsent = OptionalUser.parse(inputs.absent())
assert.deepEqual(optAbsent, {})
// 省略された場合、出力にもキーは生えない (default() と違い補完されない)。
assert.equal(Object.hasOwn(optAbsent, "nickname"), false)

const optUndef = OptionalUser.parse(inputs.undef())
assert.equal(optUndef.nickname, undefined)
// 一方、明示的に undefined を渡した場合はキーが残る。
// deepEqual では {} と区別できないため hasOwn で確かめる。
assert.equal(Object.hasOwn(optUndef, "nickname"), true)

assert.equal(OptionalUser.safeParse(inputs.null()).success, false)
assert.equal(OptionalUser.parse(inputs.string()).nickname, "taka")

// --- .nullable() ----------------------------------------------------------
// キー自体が必須なので、省略も undefined も通らない。
assert.equal(NullableUser.safeParse(inputs.absent()).success, false)
assert.equal(NullableUser.safeParse(inputs.undef()).success, false)
assert.deepEqual(NullableUser.parse(inputs.null()), { nickname: null })
assert.equal(NullableUser.parse(inputs.string()).nickname, "taka")

// --- .nullish() -----------------------------------------------------------
const nishAbsent = NullishUser.parse(inputs.absent())
assert.equal(Object.hasOwn(nishAbsent, "nickname"), false)
assert.equal(Object.hasOwn(NullishUser.parse(inputs.undef()), "nickname"), true)
assert.deepEqual(NullishUser.parse(inputs.null()), { nickname: null })
assert.equal(NullishUser.parse(inputs.string()).nickname, "taka")

// 失敗はすべて invalid_type で、path は nickname を指す。
const failed = NullableUser.safeParse(inputs.absent())
assert.equal(failed.success, false)
const issue = failed.error.issues[0]
assert.ok(issue)
assert.equal(issue.code, "invalid_type")
assert.deepEqual(issue.path, ["nickname"])
console.log("nullable + 省略:", { code: issue.code, message: issue.message })

// --- exactOptionalPropertyTypes との関係 ----------------------------------
// このリポジトリは exactOptionalPropertyTypes: true。
// 手書きの `?:` は「キーを省略してよい」だけを意味し、明示的な undefined の代入は拒否される。
type HandWritten = { nickname?: string }
const handWrittenOk: HandWritten = {}
void handWrittenOk
// @ts-expect-error exactOptionalPropertyTypes により、明示的な undefined は代入できない。
const handWrittenNg: HandWritten = { nickname: undefined }
void handWrittenNg

// 一方 z.infer<typeof OptionalUser> は `nickname?: string | undefined` になる。
// `| undefined` が付いているため、省略と明示的な undefined の両方を代入できる。
// これは上で確認した実行時の挙動 (どちらも parse を通る) と一致している。
type OptionalUser = z.infer<typeof OptionalUser>
const inferredAbsent: OptionalUser = {}
const inferredUndef: OptionalUser = { nickname: undefined }
void inferredAbsent
void inferredUndef

// ただし型が同じでも、出力オブジェクトにキーがあるかは実行時に異なる (上の hasOwn)。
// JSON.stringify や Object.keys、DB のUPDATE対象を組み立てる処理では、この差が効く。
assert.deepEqual(Object.keys(optAbsent), [])
assert.deepEqual(Object.keys(optUndef), ["nickname"])

// nullable はキーが必須なので `nickname: string | null`、
// nullish は `nickname?: string | null | undefined`。
type NullableUser = z.infer<typeof NullableUser>
// @ts-expect-error nullable ではキーを省略できない。
const nullableNg: NullableUser = {}
void nullableNg
const nullableOk: NullableUser = { nickname: null }
void nullableOk

// --- 「省略」と「明示的な null」を区別すべきケース ------------------------
// 典型例は PATCH のような部分更新。
//   - キーが無い   = 「この項目は触らない」
//   - null         = 「この項目を明示的に空にする」
//   - "taka"       = 「この値に更新する」
// この3つを1つのスキーマで表すには .nullish() が必要になる。
// .optional() だけだと「未指定」と「消したい」を区別できず、
// .nullable() だけだと部分更新のたびに全項目を送らせることになる。
const PatchUser = z.object({ nickname: z.string().nullish() })

// 更新対象のカラムだけを組み立てる。undefined と「キー無し」はどちらも無視し、
// null は「NULL を書き込む」意図として扱う。
function toUpdatePatch(input: unknown): Record<string, string | null> {
  const parsed = PatchUser.parse(input)
  const patch: Record<string, string | null> = {}
  // in 演算子ではなく hasOwn + undefined 判定で「触らない」を確実に落とす。
  if (Object.hasOwn(parsed, "nickname") && parsed.nickname !== undefined) {
    patch["nickname"] = parsed.nickname
  }
  return patch
}

assert.deepEqual(toUpdatePatch({}), {})
assert.deepEqual(toUpdatePatch({ nickname: undefined }), {})
assert.deepEqual(toUpdatePatch({ nickname: null }), { nickname: null })
assert.deepEqual(toUpdatePatch({ nickname: "taka" }), { nickname: "taka" })
console.log("patch (null):", toUpdatePatch({ nickname: null }))

// 逆に区別が不要な場面もある。表示用のレスポンスのように
// 「値が無い」を1通りに正規化したいなら、.optional() に寄せて
// 送信側へ「null は送るな」と要求したほうが後段の分岐が減る。
