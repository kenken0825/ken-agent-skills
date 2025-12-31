# スキル図鑑OS（skilldex-orchestrator）の実装

## 概要
実務ヒアリング→Agent Skill化→GitHubプール→抽象化→推薦ランキングまでを一気通貫で回す「スキル図鑑OS」を実装する。

## 背景
- 現場の実務知識を体系的にAgent Skill化する仕組みが必要
- ポケモンゲット型で、現場で効いた勝ち筋（Win）を捕獲→育成→進化→配布する
- スキルは「代謝する知識」として、継続的に進化させる

## 要件
[仕様書参照](/Docs/skilldex-orchestrator-spec.md)

### 5つのエージェント実装
1. **Win Point Hunter**: 実務の勝ちポイントを嗅ぎ分ける
2. **Pain Abstractor**: ペインパターンを抽象化
3. **Skill Recommender**: スキル候補の推薦
4. **Skill Evolution Judge**: 進化段階の判定
5. **GitHub Packager**: GitHubへの投入準備

### スキル進化レベルシステム
- Level 1: 個別最適（個人特化）[■□□□]
- Level 2: 再現性確認（業種特化）[■■□□]
- Level 3: 構造抽出（職種共通）[■■■□]
- Level 4: 汎用スキル（OS級）[■■■■]

### Progressive Disclosure
- Discovery: メタ情報のみで探索
- Loading: 必要分だけ詳細読み込み
- Execution: 実行時のみ全体参照

## タスク
- [ ] エージェント基盤の設計
- [ ] 5つのエージェントクラス実装
- [ ] スキル進化判定ロジック
- [ ] GitHub連携機能
- [ ] CLIインターフェース
- [ ] テストケース作成

## 技術スタック
- TypeScript
- Node.js
- GitHub API
- Miyabi Agent SDK

## 成果物
- `/agents/skilldex/` - エージェント実装
- `/scripts/skilldex-cli.ts` - CLIツール
- `/skills/` - 生成されたスキル格納
- テストとドキュメント

## ラベル
- feature
- agent
- 🤖agent-execute