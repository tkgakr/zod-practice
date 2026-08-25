import assert from "node:assert/strict"
import * as z from "zod"

// 1以上999以下の整数。int() で小数を弾き、min/max で範囲を絞る。
const Quantity = z.int().min(1).max(999)

const inputs: { label: string; input: unknown }[] = [
  // 正常系
  { label: "valid min", input: 1 },
  { label: "valid max", input: 999 },
  // 小数 -> invalid_type ("expected int, received number")
  { label: "not an integer", input: 1.5 },
  // 範囲外 -> too_small / too_big
  { label: "below range", input: 0 },
  { label: "above range", input: 1000 },
  // 型違い -> invalid_type ("1" は自動変換されない)
  { label: "string", input: "1" }
]

let successCount = 0
let failureCount = 0

for (const { label, input } of inputs) {
  // safeParse は例外を投げず、判別可能なユニオンを返す。
  const result = Quantity.safeParse(input)

  if (result.success) {
    // ここでは result.data が number に絞り込まれている (result.error は存在しない)。
    successCount += 1
    console.log(`${label}: success`, result.data)
  } else {
    // ここでは result.error が ZodError に絞り込まれている (result.data は存在しない)。
    failureCount += 1
    for (const issue of result.error.issues) {
      console.log(`${label}: failure`, {
        code: issue.code,
        // トップレベルの値なので path は空配列になる。
        path: issue.path,
        message: issue.message
      })
    }
  }
}

assert.equal(successCount, 2)
assert.equal(failureCount, 4)

// 完了条件の確認: 小数・範囲外・文字列がすべて失敗する。
assert.equal(Quantity.safeParse(1.5).success, false)
assert.equal(Quantity.safeParse(0).success, false)
assert.equal(Quantity.safeParse(1000).success, false)
assert.equal(Quantity.safeParse("1").success, false)

// parse() と safeParse() の使い分け:
// - parse(): 失敗が「プログラムのバグ」や「回復不能な起動時エラー」に相当する場所で使う。
//   例外で処理を止めたいケース (設定ファイルの読み込み時など)。
// - safeParse(): 失敗が「想定内の入力ミス」である場所で使う。
//   例外を制御フローに使わず、result.success で分岐してエラー内容を利用者へ返せる
//   (フォーム入力、HTTP リクエストボディなど)。
// 失敗を必ずハンドリングしたい境界では safeParse を既定にすると、
// try/catch の抜けによる予期しないクラッシュを防げる。
