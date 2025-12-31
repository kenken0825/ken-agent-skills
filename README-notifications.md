# GitHub Actions 通知システム

## 概要
Miyabiによる自動実装の開始・終了を音声と通知でお知らせします。

## 使い方

### 1. Issue監視モード（推奨）
特定のIssueに関連するワークフローを自動監視：
```bash
npx ts-node scripts/watch-issue.ts 5
```
これでIssue #5に関連するワークフローが開始・終了したら自動で通知されます。

### 2. 特定のワークフロー監視
ワークフローのrunIDが分かっている場合：
```bash
npx ts-node scripts/workflow-notifier.ts 20620331417 5
```

### 3. 手動実行（テスト用）
```bash
# 開始通知テスト
./hooks/workflow-start.sh

# 成功通知テスト
./hooks/workflow-end.sh success

# 失敗通知テスト
./hooks/workflow-end.sh failure
```

## 通知の種類

### macOS
- **音声通知**: 日本語で状態をお知らせ
- **サウンド**: 
  - 開始: Glass（チャイム音）
  - 成功: Hero（ファンファーレ）
  - 失敗: Basso（エラー音）
- **デスクトップ通知**: 通知センターに表示

### Slack連携（オプション）
環境変数 `SLACK_WEBHOOK` を設定すると、Slackにも通知されます：
```bash
export SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

## 今すぐ試す
現在実行中のIssue #5を監視：
```bash
npx ts-node scripts/watch-issue.ts 5
```

## カスタマイズ
- 音声の変更: `say`コマンドのテキストを編集
- サウンドの変更: `/System/Library/Sounds/`内の他の.aiffファイルを指定
- 通知間隔の変更: スクリプト内の`checkInterval`を調整