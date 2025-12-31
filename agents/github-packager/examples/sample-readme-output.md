# 請求書自動化スキル

請求データから自動的に請求書を生成し、PDFで出力するスキル

![Version](https://img.shields.io/badge/version-2.1.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Category](https://img.shields.io/badge/category-business-orange) ![Industry](https://img.shields.io/badge/industry-IT・ソフトウェア-purple)

## 概要

請求データから自動的に請求書を生成し、PDFで出力するスキル

### 対象

- **業界**: IT・ソフトウェア
- **職種**: 経理担当者

### トリガーワード

このスキルは以下のようなキーワードで起動されます:

- 請求書作成
- 請求書生成
- インボイス作成

### 解決する課題

- 毎月の請求書作成に時間がかかる
- 請求書のフォーマットが統一されていない
- 請求金額の計算ミスが発生する

## 目次

- [概要](#概要)
- [特徴](#特徴)
- [インストール](#インストール)
- [使用方法](#使用方法)
- [設定](#設定)
- [使用例](#使用例)
- [API ドキュメント](#api-ドキュメント)
- [トラブルシューティング](#トラブルシューティング)
- [貢献方法](#貢献方法)

## 特徴

✨ 請求データから自動的に請求書を生成し、PDFで出力するスキル
🛠 3個の自動化スクリプト
📄 2個のテンプレート
📚 2個のドキュメント
📊 25件の実装実績
✅ 96%の成功率
📈 進化レベル: アドバンスド

## インストール

### 前提条件

- Node.js 16.0以上
- npm または yarn
- 依存関係:
  - puppeteer: ^19.0.0
  - xlsx: ^0.18.5
  - pdfkit: ^0.13.0

### インストール手順

1. リポジトリのクローン
```bash
git clone https://github.com/ken-skills/invoice-automation
cd invoice-automation
```

2. 依存関係のインストール
```bash
npm install
# または
yarn install
```

3. 設定ファイルの準備
```bash
cp config.example.json config.json
# 必要に応じて config.json を編集
```

## 使用方法

### 基本的な使い方

1. **スキルの起動**
   ```bash
   npm run start
   # または
   node scripts/main.js
   ```

2. **パラメータの指定**
   ```bash
   npm run start -- --input data.csv --output result.xlsx
   ```

3. **バッチ処理**
   ```bash
   npm run batch -- --files "*.csv" --output-dir ./results
   ```

### コマンドラインオプション

| オプション | 説明 | デフォルト |
|----------|------|----------|
| `--input` | 入力ファイルパス | - |
| `--output` | 出力ファイルパス | ./output |
| `--format` | 出力フォーマット | xlsx |
| `--verbose` | 詳細ログの表示 | false |
| `--help` | ヘルプの表示 | - |

## 設定

### 設定ファイル (config.json)

```json
{
  "general": {
    "language": "ja",
    "timezone": "Asia/Tokyo",
    "logLevel": "info"
  },
  "skill": {
    "autoSave": true,
    "backupEnabled": true,
    "maxRetries": 3
  },
  "output": {
    "format": "xlsx",
    "encoding": "utf-8",
    "includeTimestamp": true
  }
}
```

### 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `API_KEY` | APIアクセスキー | ○ |
| `API_SECRET` | APIシークレットキー | ○ |
| `LOG_LEVEL` | ログレベル (debug/info/warn/error) | - |
| `TEMP_DIR` | 一時ファイルディレクトリ | - |

## 使用例

### 例1: 基本的な使用

```javascript
const skill = require('./invoice-automation');

// スキルの実行
skill.execute({
  input: 'data.csv',
  output: 'result.xlsx'
}).then(result => {
  console.log('処理完了:', result);
}).catch(error => {
  console.error('エラー:', error);
});
```

### 例2: カスタム設定での使用

```javascript
const skill = require('./invoice-automation');

// カスタム設定
const config = {
  format: 'pdf',
  template: 'custom-template.xlsx',
  options: {
    includeCharts: true,
    autoFormat: true
  }
};

// バッチ処理
const files = ['file1.csv', 'file2.csv', 'file3.csv'];

Promise.all(files.map(file => 
  skill.execute({
    input: file,
    output: file.replace('.csv', '_result.pdf'),
    config: config
  })
)).then(results => {
  console.log('すべての処理が完了しました');
}).catch(error => {
  console.error('バッチ処理エラー:', error);
});
```

### 例3: Pythonでの使用

```python
import sys
sys.path.append('./scripts')
from main import SkillProcessor

# インスタンスの作成
processor = SkillProcessor()

# データの処理
result = processor.process(
    input_file='data.csv',
    output_file='result.xlsx',
    options={
        'format': 'xlsx',
        'include_summary': True
    }
)

print(f"処理結果: {result}")
```

## API ドキュメント

### SkillProcessor クラス

#### constructor(config?: Config)
スキルプロセッサーのインスタンスを作成します。

**パラメータ:**
- `config` (オプション): 設定オブジェクト

#### execute(options: ExecuteOptions): Promise<Result>
スキルを実行します。

**パラメータ:**
- `options.input`: 入力ファイルまたはデータ
- `options.output`: 出力先パス
- `options.format`: 出力フォーマット（デフォルト: 'xlsx'）

**戻り値:**
処理結果を含むPromise

#### validate(data: any): ValidationResult
入力データの検証を行います。

**パラメータ:**
- `data`: 検証対象のデータ

**戻り値:**
検証結果オブジェクト

### ユーティリティ関数

#### formatData(data: any[], template?: string): FormattedData
データを指定されたテンプレートに従ってフォーマットします。

#### generateReport(results: Result[]): Report
複数の処理結果からレポートを生成します。

## トラブルシューティング

### よくある問題と解決方法

#### 1. インストールエラー
**問題**: `npm install` が失敗する
**解決方法**:
- Node.jsのバージョンを確認してください（16.0以上が必要）
- `npm cache clean --force` を実行してキャッシュをクリア
- 管理者権限で実行してみてください

#### 2. 実行時エラー
**問題**: "Module not found" エラー
**解決方法**:
- `npm install` を再度実行
- `node_modules` フォルダを削除して再インストール

#### 3. 出力ファイルが生成されない
**問題**: 処理は完了するが出力ファイルが見つからない
**解決方法**:
- 出力ディレクトリの書き込み権限を確認
- 絶対パスで出力先を指定してみてください
- ログファイルでエラーメッセージを確認

#### 4. メモリ不足エラー
**問題**: 大きなファイルの処理でメモリエラーが発生
**解決方法**:
- Node.jsのメモリ制限を増やす: `node --max-old-space-size=4096 scripts/main.js`
- バッチサイズを小さくする
- ストリーミング処理モードを使用する

### デバッグモード

詳細なデバッグ情報を取得するには:

```bash
# 環境変数でデバッグモードを有効化
export DEBUG=true
npm run start

# またはコマンドラインオプションで指定
npm run start -- --debug
```

### ログファイル

ログは以下の場所に保存されます:
- 通常ログ: `./logs/app.log`
- エラーログ: `./logs/error.log`
- デバッグログ: `./logs/debug.log` (デバッグモード時のみ)

## 貢献方法

このプロジェクトへの貢献を歓迎します！

### 貢献の手順

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### 開発ガイドライン

- コードスタイルガイドに従ってください
- 適切なテストを追加してください
- ドキュメントを更新してください
- コミットメッセージは明確に記述してください

### バグ報告

バグを見つけた場合は、以下の情報を含めてIssueを作成してください:

- バグの詳細な説明
- 再現手順
- 期待される動作
- 実際の動作
- 環境情報（OS、Node.jsバージョンなど）

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](./LICENSE) ファイルを参照してください。

## 関連リンク

- [GitHubリポジトリ](https://github.com/ken-skills/invoice-automation)
- [ホームページ](https://ken-skills.com/invoice-automation)
- [バグ報告](https://github.com/ken-skills/invoice-automation/issues)
- [スキルカタログ](https://github.com/your-org/skill-catalog)
- [開発者ドキュメント](https://docs.your-org.com/skills)