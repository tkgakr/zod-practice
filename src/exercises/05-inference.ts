import assert from "node:assert/strict"
import * as z from "zod"

// スキーマが唯一の定義元。型は手書きせず、ここから導出する。
const Product = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(100),
  // 価格は円単位の非負整数として扱う。
  priceYen: z.int().nonnegative(),
  category: z.enum(["book", "food", "other"]),
  // 消費税率。省略時は標準税率10%。
  taxRate: z.number().min(0).max(1).default(0.1)
})

// z.infer は「検証後 (output) の型」。default() があるため taxRate は必須プロパティになる。
type Product = z.infer<typeof Product>

// 税込価格 (円未満は切り捨て)。引数は推論された型なので、スキーマ変更が
// そのままこの関数のコンパイルエラーとして跳ね返る。
function grossPriceYen(product: Product): number {
  return Math.floor(product.priceYen * (1 + product.taxRate))
}

// --- 正常系: 実行時検証 → 推論型として利用 --------------------------------
const parsed = Product.parse({
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name: "  Zod 実践入門  ",
  priceYen: 2800,
  category: "book"
})

// trim と default が効いているので、入力と出力は同じ形ではない。
assert.deepEqual(parsed, {
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name: "Zod 実践入門",
  priceYen: 2800,
  category: "book",
  taxRate: 0.1
})
assert.equal(grossPriceYen(parsed), 3080)
console.log("gross:", grossPriceYen(parsed))

// 入力側の型 (z.input) では taxRate は省略可能。output との差はここに出る。
const draft: z.input<typeof Product> = {
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name: "軽減税率の食品",
  priceYen: 1000,
  category: "food",
  taxRate: 0.08
}
assert.equal(grossPriceYen(Product.parse(draft)), 1080)

// --- コンパイル時に落ちる誤り ---------------------------------------------
// @ts-expect-error priceYen が string。実行するまでもなく tsc が検出する。
const wrongType: Product = { ...parsed, priceYen: "2800" }
void wrongType

// @ts-expect-error category に enum 外の値。
const wrongEnum: Product = { ...parsed, category: "gadget" }
void wrongEnum

// @ts-expect-error 必須プロパティ name の欠落。
const missing: Product = {
  id: parsed.id,
  priceYen: 100,
  category: "other",
  taxRate: 0.1
}
void missing

// --- 実行時にしか落ちない誤り ---------------------------------------------
// 型の上では Product を満たすが、id が UUID でなく priceYen が負。
// TypeScript は「string」「number」までしか見ないので、ここは Zod の担当。
const typeOkButInvalid: Product = {
  id: "not-a-uuid",
  name: "型は通るが不正なデータ",
  priceYen: -1,
  category: "other",
  taxRate: 0.1
}
const rejected = Product.safeParse(typeOkButInvalid)
assert.equal(rejected.success, false)
console.log(
  "runtime issues:",
  rejected.error.issues.map((issue) => ({
    code: issue.code,
    path: issue.path.join("."),
    message: issue.message
  }))
)

// 外部から来た unknown は、そもそも代入自体がコンパイルエラーになる。
const fromNetwork: unknown = JSON.parse('{"id":"not-a-uuid"}')
// @ts-expect-error unknown を Product として扱うことはできない。
const unchecked: Product = fromNetwork
void unchecked
// 正しい橋渡しは型アサーションではなく parse (ここでは失敗する)。
assert.equal(Product.safeParse(fromNetwork).success, false)

// --- 実行時検証とコンパイル時型検査の違い ---------------------------------
// TypeScript の型は tsc が消してしまうため、実行時には何も残らない。
//   - 守れる範囲: 自分のコードが書いた値の形 (プロパティ名・プリミティブ種別)。
//   - 守れない範囲: JSON.parse、fetch のレスポンス、process.env、DB の行など
//     境界の外から来た値。これらは unknown として扱うしかない。
// Zod のスキーマは実行時に存在する値なので、UUID 形式や 0 以上といった
// 「型では表現しきれない制約」まで境界で確かめられる。
// そのうえで z.infer により、検証済みの値へ静的な型が付く。
// 結果として「境界で1回 parse し、内側では推論型を信じる」という形になり、
// 手書きの interface を二重管理する必要がなくなる。
