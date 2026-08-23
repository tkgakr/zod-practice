# Zod 4 ハンズオン演習

この演習は、1問解くたびに1つのファイルを追加し、1コミットする前提で構成しています。前の問題のコードを変更せず、成果と学習履歴を残しながら進めてください。

## 進め方

1. `src/exercises`ディレクトリに、各問で指定されたファイルを作成する。
2. 正常系と異常系の両方を、`node:assert/strict`または明示的な条件分岐で確認する。
3. 次のコマンドが成功することを確認する。

   ```bash
   npm run check
   npm run build
   node dist/exercises/<作成したファイル名>.js
   ```

4. 問題に記載された完了条件を満たしたら、その問題だけをコミットする。
5. コミット後に次の問題へ進む。

コード例をそのまま写すことより、「なぜこの入力が成功または失敗したのか」を説明できることを重視します。

---

## 問1：プリミティブ値を検証する

`src/exercises/01-primitives.ts`を作成してください。

ユーザー名を表すスキーマを定義し、次の制約をすべて満たす文字列だけを`parse()`で受け入れてください。

- 文字列である
- 3文字以上、20文字以下である
- 英小文字、数字、アンダースコアだけで構成される

正常な入力を1つ、制約の異なる異常な入力を3つ用意して、結果を確認してください。

### 完了条件

- 正常な入力から文字列を取得できる。
- 異常な入力では`ZodError`が投げられることを確認できる。
- TypeScriptの型注釈だけでは実行時検証にならない理由を説明できる。

### 公式ドキュメント

- [Basic usage: Defining a schema / Parsing data](https://zod.dev/basics)
- [Defining schemas: Strings](https://zod.dev/api#strings)

コミット例：`feat(exercise): solve 01 primitive validation`

---

## 問2：`safeParse`で成功と失敗を分岐する

`src/exercises/02-safe-parse.ts`を作成してください。

1以上999以下の整数を表すスキーマを定義し、複数の`unknown`値を`safeParse()`で検証してください。例外は使用せず、成功時は値、失敗時は各issueの`code`、`path`、`message`を出力してください。

### 完了条件

- `result.success`によって結果を安全に絞り込める。
- 小数、範囲外の数、文字列が失敗する。
- `parse()`と`safeParse()`の使い分けを説明できる。

### 公式ドキュメント

- [Basic usage: Handling errors](https://zod.dev/basics#handling-errors)
- [Defining schemas: Numbers](https://zod.dev/api#numbers)

コミット例：`feat(exercise): solve 02 safe parse`

---

## 問3：オブジェクト、配列、enumを組み合わせる

`src/exercises/03-todo-schema.ts`を作成してください。

次の形を持つTodoのスキーマを定義してください。

| プロパティ | 条件 |
| --- | --- |
| `id` | UUID |
| `title` | 前後の空白を除去した後、1文字以上100文字以下 |
| `status` | `todo`、`doing`、`done`のいずれか |
| `tags` | 文字列の配列。省略時は空配列 |
| `dueDate` | `YYYY-MM-DD`形式。省略可能 |

入力に`tags`がなくても、出力には`tags: []`が存在することを確認してください。

### 完了条件

- ネストした異常値について、issueの`path`から問題箇所を特定できる。
- `trim()`と`default()`によって入力と出力が変わることを確認できる。
- スキーマを唯一の定義元としてTodo型を推論できる。

### 公式ドキュメント

- [Defining schemas: Objects](https://zod.dev/api#objects)
- [Defining schemas: Arrays](https://zod.dev/api#arrays)
- [Defining schemas: Enums](https://zod.dev/api#enums)
- [Defining schemas: Defaults](https://zod.dev/api#defaults)

コミット例：`feat(exercise): solve 03 todo schema`

---

## 問4：未知のプロパティをどう扱うか比較する

`src/exercises/04-object-modes.ts`を作成してください。

`name: string`を持つ入力に、スキーマで定義していない`admin: true`を追加します。同じ入力を次の3種類で検証し、結果の違いを比較してください。

- `z.object()`
- `z.strictObject()`
- `z.looseObject()`

### 完了条件

- 未知のキーが除去される、拒否される、保持されるケースをそれぞれ確認できる。
- API入力や設定ファイルで、どのモードを選ぶか自分の判断基準を書ける。

### 公式ドキュメント

- [Defining schemas: Objects](https://zod.dev/api#objects)
- [Defining schemas: z.strictObject](https://zod.dev/api#zstrictobject)
- [Defining schemas: z.looseObject](https://zod.dev/api#zlooseobject)

コミット例：`feat(exercise): solve 04 object modes`

---

## 問5：推論された型を利用する

`src/exercises/05-inference.ts`を作成してください。

商品スキーマを定義し、`z.infer`で商品型を取り出してください。その型を引数に受け取り、税込価格を返す関数を作成します。また、意図的に誤った商品オブジェクトを`@ts-expect-error`付きで記述し、コンパイラが誤りを検出することを確認してください。

### 完了条件

- スキーマと同じ構造の`interface`や`type`を手書きで重複させていない。
- `npm run check`が成功する。
- 実行時のZod検証と、コンパイル時のTypeScript型検査の違いを説明できる。

### 公式ドキュメント

- [Basic usage: Inferring types](https://zod.dev/basics#inferring-types)

コミット例：`feat(exercise): solve 05 type inference`

---

## 問6：optional、nullable、nullishを区別する

`src/exercises/06-absence.ts`を作成してください。

`nickname`というプロパティについて、次の3種類のユーザースキーマを作り、プロパティなし、`undefined`、`null`、文字列の4入力を比較してください。

- `.optional()`
- `.nullable()`
- `.nullish()`

### 完了条件

- 3種類それぞれの成功・失敗を表にしてコードコメントへ残している。
- 「省略」と「明示的な`null`」を区別すべきケースを説明できる。
- このリポジトリの`exactOptionalPropertyTypes`設定との関係を確認している。

### 公式ドキュメント

- [Defining schemas: Optionals](https://zod.dev/api#optionals)
- [Defining schemas: Nullables](https://zod.dev/api#nullables)
- [Defining schemas: Nullish](https://zod.dev/api#nullish)

コミット例：`feat(exercise): solve 06 absence values`

---

## 問7：文字列入力を数値へ変換する

`src/exercises/07-input-output.ts`を作成してください。

環境変数から受け取ったポート番号を想定し、文字列`"3000"`を数値`3000`へ変換してください。ポート番号は1以上65535以下の整数に制限します。空文字、数値化できない文字列、範囲外の値も検証してください。

さらに`z.input<typeof Schema>`と`z.output<typeof Schema>`を使い、変換前後の型が異なることをコード上で示してください。

### 完了条件

- 正常な文字列入力が数値として出力される。
- 不正な入力を安易に有効値へ変換していない。
- coercionまたはtransformを選んだ理由をコメントに残している。

### 公式ドキュメント

- [Defining schemas: Coercion](https://zod.dev/api#coercion)
- [Defining schemas: Transforms](https://zod.dev/api#transforms)
- [Basic usage: Input and output types](https://zod.dev/basics#inferring-types)

コミット例：`feat(exercise): solve 07 input output types`

---

## 問8：複数項目にまたがるルールを検証する

`src/exercises/08-refine.ts`を作成してください。

パスワード変更フォームを表すスキーマを作成してください。

- `password`は8文字以上
- `confirmPassword`は`password`と一致する
- 不一致エラーの`path`は`confirmPassword`を指す

### 完了条件

- 組み込みバリデーションと`.refine()`を適切に使い分けている。
- 不一致時のissueが`confirmPassword`を指している。
- refinementの中で例外を投げていない。

### 公式ドキュメント

- [Defining schemas: Refinements](https://zod.dev/api#refinements)

コミット例：`feat(exercise): solve 08 cross field refinement`

---

## 問9：状態ごとに異なるデータ構造を表現する

`src/exercises/09-discriminated-union.ts`を作成してください。

決済結果を次の2状態で表現し、`status`を判別キーとしたスキーマを作成してください。

- 成功：`status: "success"`、`transactionId: string`、`amount: 正の数`
- 失敗：`status: "failed"`、`errorCode: string`、`retryable: boolean`

検証後の値を受け取る関数を作り、`status`で分岐した各ブロック内で、その状態固有のプロパティへ型安全にアクセスしてください。

### 完了条件

- `z.discriminatedUnion()`を使用している。
- 成功と失敗の両方を処理できる。
- 状態とプロパティが矛盾した入力を拒否できる。

### 公式ドキュメント

- [Defining schemas: Discriminated unions](https://zod.dev/api#discriminated-unions)

コミット例：`feat(exercise): solve 09 discriminated union`

---

## 問10：既存スキーマを再利用する

`src/exercises/10-schema-composition.ts`を作成してください。

問3とは独立したTodoスキーマを定義したうえで、次の用途別スキーマを元のshapeから組み立ててください。

- 一覧表示用：`id`、`title`、`status`だけ
- 新規作成用：`id`を除外
- 更新用：新規作成用の全項目を省略可能にする。ただし空オブジェクトを許可するかは自分で判断する
- 詳細表示用：元のスキーマへ`createdAt`を追加

### 完了条件

- 同じフィールド定義をコピー＆ペーストしていない。
- `pick`、`omit`、`partial`、`safeExtend`またはshapeのスプレッドを用途に応じて利用している。
- 更新時の空オブジェクトを許可するか、その理由をコメントに残している。

### 公式ドキュメント

- [Defining schemas: pick / omit](https://zod.dev/api#pick)
- [Defining schemas: partial](https://zod.dev/api#partial)
- [Defining schemas: safeExtend](https://zod.dev/api#safeextend)

コミット例：`feat(exercise): solve 10 schema composition`

---

## 問11：エラーを利用者向けの形式へ整形する

`src/exercises/11-error-formatting.ts`を作成してください。

登録フォームのスキーマを用意し、複数フィールドが同時に不正な入力を検証します。Zodのエラーを、次の形の配列へ変換する関数を作成してください。

```ts
type FieldError = {
  field: string;
  message: string;
};
```

ネストしたパスは`profile.name`のようにドットで連結してください。また、少なくとも1つのエラーメッセージをスキーマ側でカスタマイズしてください。

### 完了条件

- 複数のissueを失わずに変換できる。
- `path`が空の場合の扱いを決めている。
- 入力値そのものを不用意にエラーログへ含めていない。

### 公式ドキュメント

- [Customizing errors](https://zod.dev/error-customization)
- [Formatting errors](https://zod.dev/error-formatting)

コミット例：`feat(exercise): solve 11 error formatting`

---

## 問12：非同期の検証を扱う

`src/exercises/12-async-validation.ts`を作成してください。

既存ユーザー名の集合を`Set<string>`で用意し、入力されたユーザー名が未使用かを非同期に判定するスキーマを作成してください。外部サービスへの接続は不要です。`Promise.resolve()`などで非同期処理を模擬してください。

### 完了条件

- 非同期refinementを使用している。
- `parseAsync()`または`safeParseAsync()`で検証している。
- 同期版の`parse()`を使えない理由を説明できる。

### 公式ドキュメント

- [Defining schemas: Async refinements](https://zod.dev/api#refinements)
- [Basic usage: Parsing data](https://zod.dev/basics#parsing-data)

コミット例：`feat(exercise): solve 12 async validation`

---

## 問13：JSONファイルを信頼境界で検証する

`src/exercises/13-json-boundary.ts`と`fixtures/app-config.json`を作成してください。

Node.jsでJSON設定ファイルを読み込み、`JSON.parse()`の結果を`unknown`として扱ってからZodで検証してください。設定には次の値を含めます。

- `environment`: `development`、`test`、`production`のいずれか
- `port`: 1以上65535以下の整数
- `database.url`: URL文字列
- `features`: 機能名をキー、booleanを値に持つrecord

不正なfixtureでも試し、アプリケーション本体で利用する前に検証が終了する構造にしてください。

### 完了条件

- `JSON.parse()`の結果を型アサーションだけで信用していない。
- 不正な設定の場合は、処理を継続せず分かりやすいエラーを出す。
- 「Zodをどこで呼ぶべきか」を信頼境界という言葉で説明できる。

### 公式ドキュメント

- [Basic usage](https://zod.dev/basics)
- [Defining schemas: Records](https://zod.dev/api#records)
- [Defining schemas: URLs](https://zod.dev/api#urls)

コミット例：`feat(exercise): solve 13 json trust boundary`

---

## 問14：スキーマをJSON Schemaとして公開する

`src/exercises/14-json-schema.ts`を作成してください。

問13と同等の設定スキーマをこのファイル内に定義し、`z.toJSONSchema()`でJSON Schemaへ変換して出力してください。各主要フィールドには`.meta()`で説明を付け、生成結果にも説明が含まれることを確認します。

最後に、ZodスキーマからJSON Schemaへ表現できない型や変換がある理由を調べ、具体例を1つコメントへ残してください。

### 完了条件

- JSON Schemaを生成して内容を確認できる。
- 必須項目と追加プロパティの扱いを生成結果から読み取れる。
- JSON Schema変換が常に完全な往復変換ではないことを説明できる。

### 公式ドキュメント

- [JSON Schema](https://zod.dev/json-schema)
- [Metadata and registries](https://zod.dev/metadata)

コミット例：`feat(exercise): solve 14 json schema`

---

## 全問終了後の振り返り

最後の演習とは別に、必要であればREADMEへ次の内容をまとめてください。

- Zodが解決する問題
- TypeScriptの型検査だけでは不足する場面
- `parse`と`safeParse`の判断基準
- input型とoutput型が異なるケース
- 自分のプロジェクトでZodを置くべき信頼境界

履歴を確認する例：

```bash
git log --oneline --reverse
```
