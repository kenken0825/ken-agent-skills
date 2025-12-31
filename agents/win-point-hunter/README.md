# Win Point Hunter Agent

実務の勝ちポイントを嗅ぎ分け、Win指標へ結晶化するエージェント

## 概要

Win Point Hunter Agentは、クライアントのURL情報やヒアリングメモから、実務で実際に効果があった「勝ちポイント」を発見し、再利用可能なWin指標として結晶化します。

## 主な機能

- **URL解析**: 企業のWebサイトから価値提案・サービス内容を抽出
- **ヒアリング解析**: ヒアリングメモから勝ちポイントを自然言語処理で抽出
- **Win指標結晶化**: 抽出した情報を再利用可能な形式に整理
- **証拠保存**: 情報源と信頼度を記録

## 使用方法

```typescript
import { WinPointHunterAgent } from './agents/win-point-hunter';

const agent = new WinPointHunterAgent({
  debug: true,
  maxUrlDepth: 2
});

const result = await agent.execute({
  clientUrls: ['https://example.com'],
  hearingNotes: '月次の請求書作成が3時間から30分に短縮...',
  hybridMode: true
});

console.log(result.winIndicators);
```

## Win指標カテゴリ

- **efficiency**: 業務効率化
- **quality**: 品質向上
- **cost**: コスト削減
- **growth**: 成長・拡大
- **satisfaction**: 満足度向上

## 出力例

```json
{
  "companyInfo": {
    "name": "株式会社Example",
    "industry": "製造業",
    "description": "...",
    "values": ["品質第一", "顧客満足"],
    "services": ["製品A", "サービスB"]
  },
  "winIndicators": [
    {
      "name": "請求書作成時間短縮",
      "category": "efficiency",
      "description": "月次請求書作成を3時間から30分に短縮",
      "impact": 85,
      "evidence": "ヒアリングメモより",
      "crystallized": true,
      "context": "製造業"
    }
  ],
  "evidence": {
    "sources": ["https://example.com", "hearing_notes"],
    "confidence": 0.85
  }
}
```

## 今後の拡張予定

- [ ] 高度なWeb スクレイピング機能
- [ ] 機械学習によるWin指標の自動分類
- [ ] 業界別Win指標テンプレート
- [ ] 多言語対応