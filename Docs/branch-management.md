# Branch Management Guide

## 現在のブランチ構成

### メインブランチ
- `main` - 本番環境用ブランチ（MVP実装完了）

### エージェント作業ブランチ
イシュードリブン開発により、各Issueに対して自動的にブランチが作成されています：

| ブランチ名 | Issue | 状態 | 説明 |
|-----------|-------|------|------|
| `agent/issue-3-1767182519` | #3 | マージ済み | 初期エージェント実装 |
| `agent/issue-6` | #6 | 作業中 | Win Point Hunter Agent実装 |
| `agent/issue-7` | #7 | 作業中 | Pain Abstractor Agent実装 |
| `agent/issue-8` | #8 | 作業中 | Skill Recommender Agent実装 |
| `agent/issue-9` | #9 | 作業中 | Skill Evolution Judge Agent実装 |
| `agent/issue-10` | #10 | 作業中 | GitHub Packager Agent実装 |
| `agent/issue-11` | #11 | 作業中 | Orchestrator実装 |

## ブランチ戦略

### 1. 自動ブランチ作成
- GitHub Actionsにより、`agent:`ラベルが付いたIssueに対して自動的にブランチが作成されます
- ブランチ名: `agent/issue-{issue_number}`

### 2. マージ戦略
- エージェントが実装を完了すると自動的にPRが作成されます
- レビュー後、手動でマージを実行
- マージ後はブランチを削除

### 3. 最新化戦略
各エージェントブランチはmainブランチから分岐していますが、MVP実装により大幅な変更が入っています。
今後のエージェント実行時は以下の対応が必要：

```bash
# エージェントブランチを最新化
git checkout agent/issue-X
git merge main
git push origin agent/issue-X
```

## 推奨アクション

1. **Issue #6-11のPR確認**
   - 各エージェントブランチのPRを確認
   - MVP実装と競合する場合は、MVP実装を優先
   - 不要な場合はPRをクローズ

2. **今後のイシュードリブン開発**
   - MVP実装をベースに新規Issueを作成
   - 既存のエージェントブランチは参考程度に留める

3. **ブランチクリーンアップ**
   ```bash
   # 不要なブランチの削除（例）
   git push origin --delete agent/issue-X
   ```