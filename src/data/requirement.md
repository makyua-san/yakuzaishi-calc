# 薬剤登録要件

`src/data/drugs.ts` に新しい薬剤を追加する際に必要な情報をまとめます。

## 1. 基本情報（`drugs` 配列）

| 項目 | 必須 | 内容 | 例 |
| --- | --- | --- | --- |
| `id` | 必須 | 英小文字スラッグ（ユニーク） | `amoxicillin` |
| `name` | 必須 | 和名 | `アモキシシリン` |
| `nameKana` | 必須 | カナ表記 | `アモキシシリン` |
| `genericName` | 必須 | 一般名（英語） | `Amoxicillin` |
| `category` | 必須 | 薬効分類 | `抗菌薬` |
| `formulation` | 必須 | 剤形 | `細粒・カプセル` |
| `defaultConcentration` | 必須 | 基本濃度（数値 or `null`） | `100` |
| `concentrationUnit` | 必須 | 濃度の単位 | `mg/g`, `mg/枚` |
| `file` | 必須 | CSV データファイル名 | `amoxicillin.csv` |

## 2. 用量計算ルール（`drugRules`）

薬剤ごとのキー（`id` と同名）で配列を持ち、複数ルールを列挙します。各ルールは `DoseRule` 型に従います。

| 項目 | 必須 | 内容 / 例 |
| --- | --- | --- |
| `rule_id` | 必須 | ルール識別子（例: `AMOX-001`） |
| `age_min_months`, `age_max_months` | 必須 | 対象年齢範囲（月） |
| `wt_min_kg`, `wt_max_kg` | 必須 | 対象体重範囲（kg） |
| `calc_type` | 必須 | 計算種別（下記 `CALC_TYPES` から選択） |
| `base_value` | 必須 | 基準用量の値 |
| `base_unit` | 必須 | 基準用量の単位（例: `mg/kg/day`, `mg/kg/dose`, `mg/日`） |
| `max_daily_mg` | 任意 | 1 日最大量（mg） |
| `max_single_mg` | 任意 | 1 回最大量（mg） |
| `rounding` | 必須 | 丸め指定（下記 `ROUNDING` から選択） |
| `note` | 任意 | 備考（分割回数、投与間隔、用量幅など） |
| `source_title` | 任意 | 出典タイトル |
| `source_version` | 任意 | 出典版数・改訂日 |
| `source_ref` | 任意 | 章・版などの参照 |
| `range_min`, `range_max` | 任意 | 明示的な用量幅がある場合の下限・上限 |

### `CALC_TYPES` 選択肢
- `MG_PER_KG_PER_DAY`：kg あたり 1 日量
- `MG_PER_KG_PER_DOSE`：kg あたり 1 回量
- `FIXED_DAILY_MG`：定量 1 日量
- `FIXED_DOSE_MG`：定量 1 回量

### `ROUNDING` 選択肢
- `ROUND_1`：小数 1 桁四捨五入
- `ROUND_2`：小数 2 桁四捨五入
- `FLOOR_1`：小数 1 桁切り捨て
- `CEIL_1`：小数 1 桁切り上げ
- `NONE`：丸めなし

## 3. ファイル配置
- 基本情報・ルール: `src/data/drugs.ts`
- CSV ファイル: `public` など適切な場所に配置し、`file` フィールドと一致させる

## 4. 登録フロー（簡易）
1. `drugs` 配列に薬剤の基本情報を追加する。
2. `drugRules` オブジェクトに同じ `id` のキーでルール配列を追加する。
3. CSV ファイルを用意し、`file` 名と一致させる。
4. 計算タイプ・丸め・最大量・用量幅が仕様に沿うことを確認する。

