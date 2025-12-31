#!/usr/bin/env node

/**
 * Skilldex Orchestrator MVP達成のためのイシュー作成スクリプト
 */

import { execSync } from 'child_process';

interface Issue {
  title: string;
  body: string;
  labels: string;
  milestone?: string;
}

// MVP Phase 1: 基盤整備 (優先度: Critical)
const phase1Issues: Issue[] = [
  {
    title: "[MVP-1] 型定義ファイルの作成 - Orchestrator & Agents",
    body: `## 概要
Skilldex Orchestratorシステム全体の型定義を作成し、TypeScriptコンパイルエラーを解消

## 背景
現在、多くの型定義が欠落しており、TypeScriptのコンパイルが通らない状態

## タスク
- [ ] \`/orchestrator/models/types.ts\` の作成
- [ ] \`/agents/skill-recommender/models/types.ts\` の作成
- [ ] \`/agents/skill-evolution-judge/models/types.ts\` の作成
- [ ] \`/agents/github-packager/models/types.ts\` の作成
- [ ] 共通型定義 \`/shared/types/index.ts\` の作成
- [ ] 各エージェント間のインターフェース整合性確認

## 成果物
- 各モデルディレクトリの型定義ファイル
- TypeScriptコンパイル成功

## 優先度
🔴 Critical - 他のすべての実装の前提条件`,
    labels: "📊 priority:P0-Critical,🎯 phase:development,✨ type:feature"
  },
  {
    title: "[MVP-2] package.json依存関係の追加と環境構築",
    body: `## 概要
MVP動作に必要なすべての依存関係を追加し、開発環境を整備

## 背景
現在package.jsonには"miyabi"のみで、実装に必要なライブラリが不足

## タスク
- [ ] TypeScript & 型定義の追加
- [ ] パーサー系ライブラリ追加 (cheerio, gray-matter, js-yaml)
- [ ] HTTP通信ライブラリ追加 (axios, node-fetch)
- [ ] ファイル操作ユーティリティ追加 (fs-extra)
- [ ] テストフレームワーク追加 (jest, @types/jest)
- [ ] ESLint & Prettier設定
- [ ] tsconfig.json の作成
- [ ] npm scripts の整備

## 必要な依存関係
\`\`\`json
{
  "dependencies": {
    "axios": "^1.6.0",
    "cheerio": "^1.0.0-rc.12",
    "gray-matter": "^4.0.3",
    "js-yaml": "^4.1.0",
    "fs-extra": "^11.2.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0"
  }
}
\`\`\`

## 優先度
🔴 Critical - 開発の基盤`,
    labels: "📊 priority:P0-Critical,🎯 phase:development,✨ type:feature"
  },
  {
    title: "[MVP-3] モックスキルプールとサンプルデータの作成",
    body: `## 概要
システムテスト用のモックスキルプールと、実際の動作確認用サンプルデータを作成

## 背景
Skill Recommender Agentが推薦するスキルデータが存在しない

## タスク
- [ ] \`/data/mock-skills/\` ディレクトリ構造の作成
- [ ] 10個以上のサンプルスキルデータ作成
- [ ] 各進化レベル(Lv1-4)のスキル例を含める
- [ ] 業界別(製造業、IT、小売)のスキルを含める
- [ ] スキルリポジトリクラスの実装 (\`/repository/skill-repository.ts\`)
- [ ] サンプル企業データの作成 (3社分)
- [ ] サンプルヒアリングノートの作成

## サンプルスキル例
- 請求書自動化スキル (Lv3, 製造業/経理)
- 在庫管理最適化スキル (Lv2, 小売/オペレーション)
- 月次レポート生成スキル (Lv4, 汎用)

## 成果物
- \`/data/mock-skills/*.yaml\` (10ファイル以上)
- \`/data/sample-companies/*.json\` (3ファイル)
- \`/data/sample-consultations/*.md\` (3ファイル)

## 優先度
🔴 Critical - 動作確認の前提条件`,
    labels: "📊 priority:P0-Critical,🎯 phase:development,✨ type:feature"
  }
];

// MVP Phase 2: コアパーサー実装 (優先度: High)
const phase2Issues: Issue[] = [
  {
    title: "[MVP-4] URLパーサーとヒアリングパーサーの実装",
    body: `## 概要
Win Point Hunter Agentの中核となるパーサーを実装

## 背景
現在、URLとヒアリングメモを解析する実装が存在しない

## タスク
- [ ] \`/agents/win-point-hunter/parsers/url-parser.ts\` の実装
- [ ] \`/agents/win-point-hunter/parsers/hearing-parser.ts\` の実装
- [ ] URL取得機能の実装 (axios使用)
- [ ] HTML解析ロジック (cheerio使用)
- [ ] 自然言語の基本的なキーワード抽出
- [ ] パーサーのユニットテスト作成

## 実装要件
- URLパーサー: 会社名、業界、サービス内容を抽出
- ヒアリングパーサー: 課題、要望、現状のキーワード抽出
- エラーハンドリング (接続失敗、パース失敗)

## 成果物
- 動作するパーサー実装
- テストケース (カバレッジ80%以上)

## 優先度
⚠️ High - コア機能の実装`,
    labels: "⚠️ priority:P1-High,🎯 phase:development,✨ type:feature,🤖 agent:codegen"
  },
  {
    title: "[MVP-5] 業界・職種分類器の実装",
    body: `## 概要
Pain Abstractor Agentで使用する分類器を実装

## 背景
ペインパターンを業界・職種別に分類する機能が未実装

## タスク
- [ ] \`/agents/pain-abstractor/classifiers/industry-classifier.ts\` の実装
- [ ] \`/agents/pain-abstractor/classifiers/role-classifier.ts\` の実装
- [ ] 業界キーワード辞書の作成
- [ ] 職種キーワード辞書の作成
- [ ] 分類アルゴリズムの実装 (キーワードマッチング)
- [ ] 分類精度のテスト

## 業界カテゴリ
- 製造業、小売業、金融業、医療、IT、建設業、教育、サービス業

## 職種カテゴリ  
- 経営層、管理職、営業、マーケティング、人事、経理、法務、エンジニア、オペレーション

## 成果物
- 動作する分類器
- キーワード辞書ファイル
- 分類精度90%以上のテスト結果

## 優先度
⚠️ High - ペインパターン抽象化の基盤`,
    labels: "⚠️ priority:P1-High,🎯 phase:development,✨ type:feature,🤖 agent:codegen"
  },
  {
    title: "[MVP-6] スキルマッチャーとスコアラーの実装",
    body: `## 概要
Skill Recommender Agentの中核となるマッチングとスコアリング機能を実装

## 背景
ペインパターンとスキルのマッチング、4指標でのスコアリングが未実装

## タスク
- [ ] \`/agents/skill-recommender/matchers/skill-matcher.ts\` の実装
- [ ] \`/agents/skill-recommender/scorers/skill-scorer.ts\` の実装
- [ ] ペイン-スキルマッチングアルゴリズム
- [ ] 4指標スコアリング計算式の実装
  - fit_industry_role: 業種職種適合度
  - pain_impact: ペイン解消インパクト  
  - adoption_cost: 導入コスト
  - reproducibility: 再現性
- [ ] スコアリング重み付けの調整機能
- [ ] マッチング精度のテスト

## 成果物
- 動作するマッチャーとスコアラー
- スコアリングロジックのドキュメント
- テストケース

## 優先度
⚠️ High - スキル推薦の中核機能`,
    labels: "⚠️ priority:P1-High,🎯 phase:development,✨ type:feature,🤖 agent:codegen"
  }
];

// MVP Phase 3: ジェネレーター実装 (優先度: Medium)
const phase3Issues: Issue[] = [
  {
    title: "[MVP-7] SKILL.mdとYAMLジェネレーターの実装",
    body: `## 概要
GitHub Packager Agentで使用するファイルジェネレーターを実装

## 背景
スキルをGitHub形式でパッケージ化する機能が未実装

## タスク
- [ ] \`/agents/github-packager/generators/skill-md-generator.ts\` の実装
- [ ] \`/agents/github-packager/generators/skill-yaml-generator.ts\` の実装
- [ ] \`/agents/github-packager/generators/readme-generator.ts\` の実装
- [ ] \`/agents/github-packager/generators/changelog-generator.ts\` の実装
- [ ] Markdownテンプレートの作成
- [ ] YAMLフォーマッターの実装
- [ ] ファイル生成のテスト

## テンプレート要件
- SKILL.md: フロントマター + 詳細説明
- skill.yaml: 構造化されたメタデータ
- README.md: 使用方法とサンプル
- CHANGELOG.md: バージョン履歴

## 成果物
- 動作するジェネレーター群
- テンプレートファイル
- 生成されたサンプルファイル

## 優先度
📊 Medium - MVP動作には必須だが、モックでも代替可能`,
    labels: "📊 priority:P2-Medium,🎯 phase:development,✨ type:feature,🤖 agent:codegen"
  },
  {
    title: "[MVP-8] 進化レベル評価器の実装",
    body: `## 概要
Skill Evolution Judge Agentの評価ロジックを実装

## 背景
スキルの進化レベル(Lv1-4)を判定する機能が未実装

## タスク
- [ ] \`/agents/skill-evolution-judge/evaluators/evolution-evaluator.ts\` の実装
- [ ] \`/agents/skill-evolution-judge/trackers/evolution-tracker.ts\` の実装
- [ ] レベル判定ロジックの実装
- [ ] 進化条件の定義
- [ ] 進化バー表示機能
- [ ] 評価精度のテスト

## 進化レベル定義
- Level 1: 個別最適 (1実装、1業種)
- Level 2: 再現性確認 (3実装、同業種)
- Level 3: 構造抽出 (5実装、3業種)
- Level 4: 汎用スキル (25実装、5業種)

## 成果物
- 動作する評価器
- 進化判定のドキュメント
- テストケース

## 優先度
📊 Medium - スキル進化の可視化に必要`,
    labels: "📊 priority:P2-Medium,🎯 phase:development,✨ type:feature,🤖 agent:codegen"
  }
];

// MVP Phase 4: 統合とテスト (優先度: Medium)
const phase4Issues: Issue[] = [
  {
    title: "[MVP-9] エンドツーエンド統合テストの実装",
    body: `## 概要
Orchestratorを通じた全体フローの統合テストを実装

## 背景
個別コンポーネントの実装後、全体の動作確認が必要

## タスク
- [ ] \`/tests/e2e/orchestrator.test.ts\` の作成
- [ ] サンプルデータを使用したフルフローテスト
- [ ] 各エージェント間のデータ受け渡しテスト
- [ ] エラーケースのテスト
- [ ] パフォーマンステスト (処理時間測定)
- [ ] テスト結果レポートの生成

## テストシナリオ
1. URL入力 → スキル推薦 → パッケージ生成
2. ヒアリングメモ → ペイン抽出 → スキルマッチング
3. ハイブリッドモードでの動作確認

## 成果物
- E2Eテストスイート
- テスト実行レポート
- パフォーマンスベンチマーク

## 優先度
📊 Medium - MVP品質保証`,
    labels: "📊 priority:P2-Medium,🎯 phase:development,🧪 type:test"
  },
  {
    title: "[MVP-10] CLIツールとドキュメントの作成",
    body: `## 概要
Skilldex Orchestratorを簡単に使用できるCLIツールとドキュメントを作成

## 背景
現在、システムを実行する手段がなく、使用方法も不明

## タスク
- [ ] \`/scripts/skilldex-cli.ts\` の実装
- [ ] CLIコマンドの設計と実装
- [ ] 対話型モードの実装
- [ ] 使用方法ドキュメント (\`/docs/usage.md\`)
- [ ] APIリファレンス (\`/docs/api-reference.md\`)
- [ ] サンプルコード集の作成

## CLIコマンド例
\`\`\`bash
# URL分析モード
npx skilldex analyze --url https://example.com

# ヒアリングモード
npx skilldex consult --file consultation.md

# 対話型モード
npx skilldex interactive
\`\`\`

## 成果物
- 動作するCLIツール
- 包括的なドキュメント
- サンプルコード

## 優先度
📊 Medium - ユーザビリティ向上`,
    labels: "📊 priority:P2-Medium,🎯 phase:development,📚 type:docs"
  }
];

// すべてのイシューを統合
const allIssues = [
  ...phase1Issues,
  ...phase2Issues,
  ...phase3Issues,
  ...phase4Issues
];

// イシューを作成する関数
function createIssue(issue: Issue) {
  console.log(`\n📝 Creating issue: ${issue.title}`);
  
  try {
    const escapedBody = issue.body
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');
    
    const command = `gh issue create \
      --title "${issue.title}" \
      --body "${escapedBody}" \
      --label "${issue.labels}" \
      --repo kenken0825/ken-agent-skills`;
    
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Issue created successfully`);
    
    // API制限対策
    execSync('sleep 2');
  } catch (error) {
    console.error(`❌ Failed to create issue: ${error}`);
  }
}

// メイン処理
async function main() {
  console.log('🚀 Starting MVP issues creation for Skilldex Orchestrator...\n');
  console.log(`📊 Total issues to create: ${allIssues.length}`);
  console.log('- Phase 1 (Critical): 3 issues');
  console.log('- Phase 2 (High): 3 issues');
  console.log('- Phase 3 (Medium): 2 issues');
  console.log('- Phase 4 (Medium): 2 issues\n');
  
  // 各イシューを順番に作成
  for (let i = 0; i < allIssues.length; i++) {
    console.log(`\n[${i + 1}/${allIssues.length}] Processing...`);
    createIssue(allIssues[i]);
  }
  
  console.log('\n\n✨ All MVP issues created!');
  console.log('📊 Next steps:');
  console.log('1. Check issues at: https://github.com/kenken0825/ken-agent-skills/issues');
  console.log('2. Start with Phase 1 (Critical) issues');
  console.log('3. Assign team members or agents to each issue');
  console.log('\n🎯 Estimated timeline: 32-45 days to MVP');
}

// 実行
main().catch(console.error);