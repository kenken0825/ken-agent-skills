# 手動イシュー作成ガイド

GitHub認証の問題を回避して、以下の手順でイシューを手動作成してください。

## 手順

1. GitHubリポジトリにアクセス: https://github.com/kenken0825/ken_AgentSkills/issues

2. 「New Issue」をクリック

3. 以下の6つのイシューを順番に作成：

### Issue 1: Win Point Hunter Agent
- **Title**: Win Point Hunter Agent - 実務勝ちポイント発見エージェントの実装
- **Labels**: feature, agent, 🤖agent-execute, priority:high, phase:1
- **Body**: `/scripts/create-skilldex-issues.ts`のissues[0].bodyをコピー

### Issue 2: Pain Abstractor Agent
- **Title**: Pain Abstractor Agent - ペインパターン抽象化エージェントの実装
- **Labels**: feature, agent, 🤖agent-execute, priority:high, phase:1
- **Body**: `/scripts/create-skilldex-issues.ts`のissues[1].bodyをコピー

### Issue 3: Skill Recommender Agent
- **Title**: Skill Recommender Agent - スキル推薦エージェントの実装
- **Labels**: feature, agent, 🤖agent-execute, priority:high, phase:1
- **Body**: `/scripts/create-skilldex-issues.ts`のissues[2].bodyをコピー

### Issue 4: Skill Evolution Judge Agent
- **Title**: Skill Evolution Judge Agent - スキル進化判定エージェントの実装
- **Labels**: feature, agent, 🤖agent-execute, priority:high, phase:1
- **Body**: `/scripts/create-skilldex-issues.ts`のissues[3].bodyをコピー

### Issue 5: GitHub Packager Agent
- **Title**: GitHub Packager Agent - GitHubパッケージ化エージェントの実装
- **Labels**: feature, agent, 🤖agent-execute, priority:high, phase:1
- **Body**: `/scripts/create-skilldex-issues.ts`のissues[4].bodyをコピー

### Issue 6: Orchestrator Core
- **Title**: Orchestrator Core - Skilldex Orchestratorコアシステムの実装
- **Labels**: feature, orchestrator, 🤖agent-execute, priority:high, phase:2
- **Body**: `/scripts/create-skilldex-issues.ts`のissues[5].bodyをコピー

## 自動実行の開始

`🤖agent-execute`ラベルが付与されることで、GitHub Actionsが自動的に実装を開始します。

## ローカル開発の継続

イシューの作成を待たずに、ローカルで実装を続けることも可能です：

```bash
# 残りのエージェントを実装
cd agents/pain-abstractor
touch index.ts

cd ../skill-recommender  
touch index.ts

# など
```

## 進捗確認

- GitHub Actions: https://github.com/kenken0825/ken_AgentSkills/actions
- イシュー一覧: https://github.com/kenken0825/ken_AgentSkills/issues