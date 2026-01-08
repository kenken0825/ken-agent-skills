# Contract Review Agent - 契約書レビューエージェント

Multi-Persona Adversarial Review System による契約書の多角的分析

## 概要

Contract Review Agent は、複数の専門家ペルソナが契約書を分析し、
**悪魔の代理人**と**天使の代理人**の議論を経て、
バランスの取れた評価を提供する契約書レビューシステムです。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                    Contract Review Orchestrator                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │  法務専門家 │ │  CFO      │ │  CISO     │ │  現場責任者 │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              Debate Arena (議論アリーナ)                │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │     │
│  │  │ 悪魔の代理人 │  │ 天使の代理人 │  │   裁判官    │    │     │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 特徴

### 4つの専門家ペルソナ

| ペルソナ | 役割 | 重点チェック領域 |
|---------|------|-----------------|
| **法務専門家** | 法的リスクの番人 | 契約法違反、無効条項、紛争時不利条項 |
| **CFO** | 財務インパクト評価 | 支払条件、違約金、隠れコスト |
| **CISO** | セキュリティ・コンプライアンス | データ保護、情報漏洩責任、規制遵守 |
| **現場責任者** | 実行可能性判定 | SLA達成可能性、オペレーション負荷 |

### 敵対的議論システム

1. **悪魔の代理人** - リスクを最大化して解釈し、契約締結に反対
2. **天使の代理人** - メリットを擁護し、緩和策を提示
3. **裁判官** - 両者の主張を評価し、中立的な判定を下す

## インストール

```bash
# 依存関係のインストール
npm install
```

## 使用方法

### 基本的な使用

```typescript
import { reviewContract } from './agents/contract-reviewer';

const result = await reviewContract(contractText, {
  contractType: 'service_agreement',
  ourPartyName: '甲',
  enableDebate: true,
});

if (result.success) {
  console.log(result.report.executiveSummary);
}
```

### 詳細な設定

```typescript
import { createContractReviewer } from './agents/contract-reviewer';

const reviewer = createContractReviewer({
  enableDebate: true,
  debateRounds: 2,
  findingsPerDebateRound: 5,
  parallelAnalysis: true,
  reportFormat: 'full',
  language: 'ja',
});

// イベントリスナーを登録
reviewer.onEvent((event) => {
  console.log(`${event.type}: `, event);
});

const result = await reviewer.review({
  contractText: contractText,
  contractType: 'nda',
  ourPartyName: '当社',
  context: {
    industry: 'IT',
    dealSize: '1000万円',
    urgency: 'high',
  },
});

// レポートをテキスト形式で出力
const reportText = reviewer.formatReport(result.report);
console.log(reportText);
```

### 個別のペルソナを使用

```typescript
import {
  createLegalExpert,
  createCFOExpert,
  parseContract,
} from './agents/contract-reviewer';

// 契約書をパース
const parseResult = parseContract(contractText);
const contract = parseResult.contract;

// 法務専門家による分析
const legalExpert = createLegalExpert();
const analysis = await legalExpert.analyze({
  contract,
  ourPartyName: '甲',
});

console.log(analysis.findings);
```

## 出力例

### エグゼクティブサマリー

```
【契約書レビュー サマリー】

契約書: 業務委託契約書
レビュー日時: 2024-01-15T10:30:00.000Z

総合評価: ⚠️ 条件付き承認
リスクレベル: 重大

指摘件数:
  致命的: 0件
  重大: 3件

主な指摘事項:
  • [重大] 無制限の責任: 損害賠償責任に上限が設定されていません
  • [重大] 一方的解除権: 相手方に一方的な契約解除権が付与されています
  • [重大] 自動更新条項: 契約が自動更新される条項があります

推奨アクション:
  1. 責任上限条項の追加を交渉してください
  2. 解除予告期間の設定を交渉してください
  3. 更新停止の通知期限を確認してください
```

## ディレクトリ構造

```
agents/contract-reviewer/
├── index.ts                      # メインエントリーポイント
├── models/
│   └── types.ts                  # 型定義
├── parsers/
│   └── contract-parser.ts        # 契約書パーサー
├── personas/
│   ├── base-persona.ts           # ペルソナ基底クラス
│   ├── legal-expert.ts           # 法務専門家
│   ├── cfo-expert.ts             # CFO
│   ├── ciso-expert.ts            # CISO
│   ├── operations-expert.ts      # 現場責任者
│   ├── devils-advocate.ts        # 悪魔の代理人
│   ├── angels-advocate.ts        # 天使の代理人
│   └── judge.ts                  # 裁判官
├── arena/
│   └── debate-arena.ts           # 議論アリーナ
├── synthesizers/
│   └── finding-synthesizer.ts    # 指摘統合
├── generators/
│   └── report-generator.ts       # レポート生成
├── tests/
│   └── contract-reviewer.test.ts # テスト
└── README.md
```

## 設定オプション

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `enableDebate` | boolean | true | 議論フェーズを有効化 |
| `debateRounds` | number | 2 | 議論ラウンド数 |
| `findingsPerDebateRound` | number | 5 | 1ラウンドで議論する指摘数 |
| `parallelAnalysis` | boolean | true | ペルソナ分析を並列実行 |
| `reportFormat` | string | 'full' | レポート形式 (full/summary/json) |
| `language` | string | 'ja' | 出力言語 (ja/en) |

## 対応する契約タイプ

- `nda` - 秘密保持契約
- `service_agreement` - 業務委託契約
- `license` - ライセンス契約
- `employment` - 雇用契約
- `lease` - 賃貸借契約
- `sales` - 売買契約
- `partnership` - 提携契約

## 検出するリスクカテゴリ

- **法的リスク** - 契約法違反、無効条項、紛争リスク
- **財務リスク** - 支払い条件、隠れコスト、違約金
- **セキュリティリスク** - データ保護、情報漏洩
- **コンプライアンスリスク** - 規制違反、業界基準
- **運用リスク** - SLA、リソース要件、実行可能性
- **レピュテーションリスク** - 信用失墜、ブランド毀損

## テスト

```bash
# テスト実行
npm test -- agents/contract-reviewer

# カバレッジレポート
npm test -- --coverage agents/contract-reviewer
```

## ライセンス

MIT License

## 作者

Ken Agent Skills Project
