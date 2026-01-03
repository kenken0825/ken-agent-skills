# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-01-03

### 🚀 Intelligence Suite Release

#### Added
- **Intelligence Suite**: 6つの新しいエージェントによる価値最大化システム
  - **Demand Tracker Agent** - ペインパターンのトレンド追跡・急上昇検知
  - **Health Monitor Agent** - スキル健康度監視・劣化検知
  - **Competitive Analyzer Agent** - 競合スキル比較・差別化分析
  - **Combo Optimizer Agent** - スキル組み合わせ最適化・相乗効果計算
  - **ROI Predictor Agent** - ROI予測・投資回収期間算出
  - **Story Generator Agent** - 成功事例自動生成（Markdown/HTML/SNS形式）

- **Unified Data Store**: 統合データストア
  - スキル・トレンド・事例・メトリクスの一元管理
  - 複数インデックス戦略による高速検索
  - 関連データの自動リンク
  - JSON永続化機能

- **Intelligence Orchestrator**: 統合オーケストレーター
  - 4つの実行モード（analyze, optimize, predict, full）
  - 価値循環ループの自動実行
  - イベント駆動アーキテクチャ
  - クイックコマンド対応

- **Dashboard CLI**: ダッシュボードCLI
  - リアルタイムダッシュボード表示
  - トレンド分析コマンド
  - 健康度チェックコマンド
  - コンボ最適化コマンド
  - ROI予測コマンド
  - ストーリー生成コマンド

- **型定義**: Intelligence Suite用の包括的な型システム
  - PainTrend, SkillHealthScore, SkillCombo
  - ROIPrediction, GeneratedStory
  - DashboardView, IntelligenceEvent

- **テストスイート**: Intelligence Suite用のE2Eテスト

#### Changed
- 既存のSkilldex Orchestratorとの統合
- SkillRepositoryとの連携強化

#### Architecture
- 価値循環ループ: 需要分析 → 最適化 → ROI予測 → ストーリー生成 → フィードバック
- エージェント間のイベント駆動連携
- Unified Data Storeによるデータ共有

---

## [1.0.0] - 2024-01-01

### 🎉 Initial MVP Release

#### Added
- **Skilldex Orchestrator**: Complete implementation of 5 autonomous agents
  - Win Point Hunter Agent - Company information extraction
  - Pain Abstractor Agent - Pain pattern classification
  - Skill Recommender Agent - Skill matching and scoring
  - Skill Evolution Judge Agent - Evolution level assessment
  - GitHub Packager Agent - Package generation
- **CLI Tool**: Command-line interface for all operations
  - `analyze` - URL analysis mode
  - `consult` - Consultation note analysis
  - `hybrid` - Combined analysis mode
  - Quick commands (intake, discover, rank, evolve, package)
- **Type System**: Complete TypeScript type definitions
- **Mock Data**: 12 sample skills across 3 industries
- **Test Suite**: E2E integration tests
- **Documentation**: Usage guide and API reference

#### Infrastructure
- TypeScript configuration
- Jest test framework setup
- 40+ npm dependencies
- GitHub Actions workflows

### [Previous Versions]

#### [0.2.0] - 2024-12-31
- Added GitHub Actions integration
- Implemented Miyabi framework support
- Created autonomous agent workflows

#### [0.1.0] - 2024-12-30
- Initial project structure
- Basic skill categorization
- Professional skills framework

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>