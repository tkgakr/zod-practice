import assert from "node:assert/strict"
import * as z from "zod"

// 同じ shape を3つのモードで比較する。差が出るのは「未知のキー」の扱いだけ。
const shape = { name: z.string() }

// 既定: 未知のキーは黙って除去される (strip)。
const Strip = z.object(shape)
// 未知のキーがあれば検証エラーにする。
const Strict = z.strictObject(shape)
// 未知のキーをそのまま出力に残す (passthrough)。
const Loose = z.looseObject(shape)

// スキーマで定義していない admin を含む入力。
// 3つのスキーマへ同じ入力を渡すため、毎回新しいオブジェクトを作る。
const input = () => ({ name: "atakagi", admin: true })

// --- z.object(): 除去される ---------------------------------------------
const stripped = Strip.parse(input())
assert.deepEqual(stripped, { name: "atakagi" })
// 出力型にも admin は存在しないので、実行時にもキー自体が消える。
assert.equal(Object.hasOwn(stripped, "admin"), false)
console.log("z.object():", stripped)

// --- z.strictObject(): 拒否される ----------------------------------------
const strict = Strict.safeParse(input())
assert.equal(strict.success, false)

const unrecognized = strict.error.issues.map((issue) => ({
  code: issue.code,
  path: issue.path.join("."),
  message: issue.message
}))
console.log("z.strictObject():", unrecognized)

// 未知キーのエラーは unrecognized_keys。path はオブジェクト自身 (空) を指し、
// どのキーが余分かは issue.keys から分かる。
const issue = strict.error.issues[0]
assert.ok(issue)
assert.equal(issue.code, "unrecognized_keys")
assert.deepEqual(issue.path, [])
assert.ok(issue.code === "unrecognized_keys" && issue.keys.includes("admin"))

// --- z.looseObject(): 保持される -----------------------------------------
const loose = Loose.parse(input())
assert.deepEqual(loose, { name: "atakagi", admin: true })
// 出力型は { name: string } & { [k: string]: unknown } なので、
// admin へは型としては unknown 経由でしか触れない (実行時には残っている)。
assert.equal(loose["admin"], true)
console.log("z.looseObject():", loose)

// 正常系: 未知のキーがなければ3モードとも同じ結果になる。
const clean = { name: "atakagi" }
assert.deepEqual(Strip.parse(clean), clean)
assert.deepEqual(Strict.parse(clean), clean)
assert.deepEqual(Loose.parse(clean), clean)

// --- 判断基準 -------------------------------------------------------------
// API入力 (外部から来る信頼できないデータ):
//   既定の z.object() を使う。クライアントが送ってきた余分なフィールドで
//   後続処理が汚染されるのを防げるうえ、フィールド追加に対して前方互換に保てる。
//   ただし「権限昇格につながるキーを黙って捨てたくない」場合や、
//   内部サービス間の契約のように送信側も自分で管理している場合は
//   z.strictObject() にして、タイプミスや契約違反を早期に落とす。
//
// 設定ファイル (人間が手で書く):
//   z.strictObject() を選ぶ。`prot: 3000` のような綴り間違いが
//   strip で黙殺されると「設定したのに効かない」という最悪のデバッグになる。
//
// z.looseObject():
//   自分は一部のキーしか関心がなく、残りをそのまま次の層へ渡す
//   プロキシ的な処理に限定する。未知の値が unknown 型のまま出力へ混ざるため、
//   そのまま保存・返却する経路では情報漏えいの経路になり得る。
