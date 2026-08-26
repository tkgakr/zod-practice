import assert from "node:assert/strict"
import * as z from "zod"

const Todo = z.object({
  id: z.uuid(),
  // trim() は検証の前に前後の空白を落とす変換なので、
  // "  a  " は "a" になってから min(1)/max(100) を通る。
  title: z.string().trim().min(1).max(100),
  // 3値のいずれか。それ以外は invalid_value になる。
  status: z.enum(["todo", "doing", "done"]),
  // 省略時は default() が空配列を補うので、出力には必ず tags が存在する。
  tags: z.array(z.string()).default([]),
  // YYYY-MM-DD 形式のみ。省略可能なので出力では undefined になり得る。
  dueDate: z.iso.date().optional()
})

// スキーマを唯一の定義元として型を導出する (手書きの interface は作らない)。
type Todo = z.infer<typeof Todo>

const id = "3f7c1f2e-9a4b-4c6d-8e1f-2b3c4d5e6f70"

// 正常系: tags と dueDate を省略した入力。
const created: Todo = Todo.parse({
  id,
  title: "  Zod を学ぶ  ",
  status: "todo"
})

// trim() により入力と出力が変わる。
assert.equal(created.title, "Zod を学ぶ")
// default() により、入力になかった tags が出力には存在する。
assert.deepEqual(created.tags, [])
assert.equal(created.dueDate, undefined)
console.log("created:", created)

// 正常系: すべてのプロパティを指定した入力。
const full = Todo.parse({
  id,
  title: "リリース準備",
  status: "doing",
  tags: ["work", "urgent"],
  dueDate: "2026-01-31"
})
assert.deepEqual(full.tags, ["work", "urgent"])
assert.equal(full.dueDate, "2026-01-31")
console.log("full:", full)

// 異常系: ネストした値を含めてまとめて失敗させ、path で問題箇所を特定する。
const invalid = Todo.safeParse({
  id: "not-a-uuid",
  title: "   ",
  status: "archived",
  tags: ["ok", 123],
  dueDate: "2026/01/31"
})

assert.equal(invalid.success, false)

const issues = invalid.error.issues.map((issue) => ({
  // path は配列。配列要素の issue には ["tags", 1] のようにインデックスが入る。
  path: issue.path.join("."),
  code: issue.code,
  message: issue.message
}))
console.log("invalid issues:", issues)

const paths = issues.map((issue) => issue.path)
assert.deepEqual([...paths].sort(), [
  "dueDate",
  "id",
  "status",
  "tags.1",
  "title"
])

// 配列要素の issue は "tags.1" を指すので、何番目の要素が壊れているか分かる。
const tagIssue = issues.find((issue) => issue.path === "tags.1")
assert.ok(tagIssue)
assert.equal(tagIssue.code, "invalid_type")

// title は trim() 後に空文字となるため、min(1) の too_small で落ちる
// (入力自体は3文字の空白なので、trim なしなら通ってしまう)。
const titleIssue = issues.find((issue) => issue.path === "title")
assert.equal(titleIssue?.code, "too_small")

// 入力型と出力型の違い: tags は入力では省略可能、出力では必須。
type TodoInput = z.input<typeof Todo>
const minimalInput: TodoInput = { id, title: "x", status: "done" }
assert.deepEqual(Todo.parse(minimalInput).tags, [])
