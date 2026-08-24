import assert from "node:assert/strict"
import * as z from "zod"

const User = z.object({
  username: z.string().min(3).max(20).regex(/^[a-z0-9_]+$/)
})

// 正常系: 3〜20文字、英小文字・数字・アンダースコアのみ
const ok = User.parse({ username: "abc_123" })
assert.equal(ok.username, "abc_123")
console.log("ok:", ok)

// 異常系: 制約ごとに1件ずつ用意する
const invalidInputs: { label: string; input: unknown }[] = [
  // string ではない -> invalid_type
  { label: "not a string", input: { username: 12345 } },
  // 3文字未満 -> too_small
  { label: "too short", input: { username: "ab" } },
  // 大文字とハイフンを含む -> invalid_format (regex)
  { label: "invalid characters", input: { username: "Abc-123" } }
]

for (const { label, input } of invalidInputs) {
  assert.throws(
    () => User.parse(input),
    (error: unknown) => {
      assert.ok(error instanceof z.ZodError)
      // issue の code / path から、どの制約で落ちたかを特定できる
      console.log(
        `${label}:`,
        error.issues.map((issue) => ({
          code: issue.code,
          path: issue.path,
          message: issue.message
        }))
      )
      return true
    }
  )
}

// 21文字は max(20) で落ちる (too_big) ことも safeParse で確認する
const tooLong = User.safeParse({ username: "a".repeat(21) })
assert.equal(tooLong.success, false)
console.log("too long:", tooLong.error.issues[0]?.code)

// なぜ TypeScript の型注釈だけでは実行時検証にならないのか:
// 型注釈は tsc がコンパイル時に消去する (型は JS に残らない)。
// そのため JSON.parse や fetch、環境変数のように「実行時に外から来る値」は、
// 型を書いても実際の中身が保証されない。
// 下のように as で型を主張しても、実行時には number のまま通ってしまう。
const untrusted: unknown = JSON.parse('{"username": 12345}')
const pretend = untrusted as { username: string }
console.log("type assertion only:", typeof pretend.username) // "number"
assert.equal(typeof pretend.username, "number")
// Zod は同じ値を実行時に検査して弾くので、境界での検証はスキーマで行う。
assert.equal(User.safeParse(untrusted).success, false)
