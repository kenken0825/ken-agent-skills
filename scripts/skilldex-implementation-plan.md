# Skilldex Orchestrator 実装計画

## 🚀 実装開始方法

### 1. GitHub認証
```bash
gh auth login
```

### 2. イシュー作成
```bash
npx tsx scripts/create-skilldex-issues.ts
```

### 3. 自動実装の開始
各イシューに`🤖agent-execute`ラベルが付与されているため、GitHub Actionsが自動的に実装を開始します。

## 📋 実装順序

### Phase 1: コアエージェント（並列実行可能）
1. Win Point Hunter Agent
2. Pain Abstractor Agent  
3. Skill Recommender Agent
4. Skill Evolution Judge Agent
5. GitHub Packager Agent

### Phase 2: オーケストレーター
6. Orchestrator Core System

## 🏗️ ローカル実装手順

認証なしでローカル実装を進める場合：

```bash
# 1. Win Point Hunter Agentの実装
mkdir -p agents/win-point-hunter/{parsers,models,tests}
touch agents/win-point-hunter/index.ts

# 2. Pain Abstractor Agentの実装  
mkdir -p agents/pain-abstractor/{classifiers,patterns,tests}
touch agents/pain-abstractor/index.ts

# 3. Skill Recommender Agentの実装
mkdir -p agents/skill-recommender/{matchers,scorers,tests}  
touch agents/skill-recommender/index.ts

# 4. Skill Evolution Judge Agentの実装
mkdir -p agents/skill-evolution-judge/{evaluators,trackers,tests}
touch agents/skill-evolution-judge/index.ts

# 5. GitHub Packager Agentの実装
mkdir -p agents/github-packager/{generators,templates,tests}
touch agents/github-packager/index.ts

# 6. Orchestrator Coreの実装
mkdir -p orchestrator/{pipeline,commands,tests}
touch orchestrator/index.ts
touch scripts/skilldex-cli.ts
```

## 🔧 基本実装テンプレート

各エージェントの基本構造：

```typescript
// agents/[agent-name]/index.ts
export class [AgentName]Agent {
  constructor(private config: AgentConfig) {}
  
  async execute(input: AgentInput): Promise<AgentOutput> {
    // エージェントのメインロジック
  }
}
```

## 📊 進捗確認

実装状況は以下で確認：
- GitHub Issues: https://github.com/kenken0825/ken_AgentSkills/issues
- GitHub Actions: https://github.com/kenken0825/ken_AgentSkills/actions

## 🎯 成功指標

- [ ] 全6エージェント/システムの実装完了
- [ ] エンドツーエンドテストの成功
- [ ] 実際のスキル生成の成功例
- [ ] ドキュメント完備