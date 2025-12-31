/**
 * Test Helper Functions and Mock Data for E2E Tests
 */

import { CompanyInfo, WinIndicator, PainPattern, Skill } from '../../shared/types';

/**
 * Mock Company Data
 */
export const mockCompanies = {
  manufacturing: {
    name: 'サンプル製造業株式会社',
    industry: '製造業',
    description: '精密部品の製造・販売を行う中堅メーカー',
    size: 'medium',
    values: ['品質第一', '納期厳守', '技術革新'],
    services: ['精密部品製造', '品質検査', 'OEM生産']
  },
  retail: {
    name: '小売チェーン株式会社',
    industry: '小売業',
    description: '全国展開する小売チェーン',
    size: 'large',
    values: ['顧客満足', '地域貢献', 'サステナビリティ'],
    services: ['商品販売', 'オンラインストア', '宅配サービス']
  },
  it: {
    name: 'ITソリューション株式会社',
    industry: 'IT',
    description: 'クラウドサービスとAIソリューションの提供',
    size: 'medium',
    values: ['イノベーション', 'アジャイル', 'セキュリティ'],
    services: ['システム開発', 'クラウド移行', 'AI導入支援']
  }
};

/**
 * Mock Win Indicators
 */
export const mockWinIndicators = {
  manufacturing: [
    {
      type: 'efficiency',
      description: '製造ライン効率化で生産性30%向上',
      impact: 'high',
      evidence: '月次レポートでの実績'
    },
    {
      type: 'quality',
      description: '不良品率を1%未満に削減',
      impact: 'high',
      evidence: '品質管理システム導入'
    }
  ],
  retail: [
    {
      type: 'sales',
      description: 'オンライン売上が前年比150%',
      impact: 'high',
      evidence: 'ECサイトリニューアル'
    },
    {
      type: 'inventory',
      description: '在庫回転率が20%改善',
      impact: 'medium',
      evidence: '在庫管理システム最適化'
    }
  ]
};

/**
 * Mock Pain Patterns
 */
export const mockPainPatterns = {
  manufacturing: [
    {
      id: 'manual-inventory',
      category: 'operation',
      description: '在庫管理が手動でミスが多い',
      impact: 'high',
      frequency: 'daily',
      affectedRoles: ['inventory-manager', 'warehouse-staff']
    },
    {
      id: 'report-generation',
      category: 'reporting',
      description: '月次レポート作成に時間がかかる',
      impact: 'medium',
      frequency: 'monthly',
      affectedRoles: ['manager', 'analyst']
    },
    {
      id: 'quality-data',
      category: 'quality',
      description: '品質検査データの集計が大変',
      impact: 'medium',
      frequency: 'daily',
      affectedRoles: ['quality-inspector', 'qa-manager']
    }
  ],
  retail: [
    {
      id: 'customer-analytics',
      category: 'analytics',
      description: '顧客分析に時間がかかる',
      impact: 'high',
      frequency: 'weekly',
      affectedRoles: ['marketing', 'store-manager']
    },
    {
      id: 'price-optimization',
      category: 'pricing',
      description: '価格設定の最適化が難しい',
      impact: 'high',
      frequency: 'weekly',
      affectedRoles: ['pricing-analyst', 'category-manager']
    }
  ]
};

/**
 * Mock Skills
 */
export const mockSkills: Record<string, Skill> = {
  'manufacturing-inventory': {
    id: 'manufacturing-inventory-management',
    name: '製造業向け在庫管理自動化',
    description: '在庫の入出庫を自動記録し、リアルタイムで在庫状況を可視化',
    category: 'operation',
    level: 2,
    scope: 'industry-specific',
    triggers: ['在庫管理', 'inventory', '入出庫'],
    painPatterns: ['manual-inventory', 'stock-shortage'],
    workflow: {
      steps: [
        'バーコード/QRコードスキャン',
        '自動データ入力',
        '在庫数リアルタイム更新',
        'アラート通知'
      ]
    },
    implementations: 5,
    successRate: 0.85
  },
  'it-monthly-report-generation': {
    id: 'it-monthly-report-generation',
    name: 'IT部門月次レポート自動生成',
    description: '各種システムからデータを収集し、月次レポートを自動生成',
    category: 'reporting',
    level: 3,
    scope: 'role-specific',
    triggers: ['月次レポート', 'monthly report', '報告書'],
    painPatterns: ['report-generation', 'data-aggregation'],
    workflow: {
      steps: [
        'データソース接続',
        '自動データ収集',
        'レポートテンプレート適用',
        'PDF/Excel出力'
      ]
    },
    implementations: 10,
    successRate: 0.90
  },
  'manufacturing-quality-inspection': {
    id: 'manufacturing-quality-inspection',
    name: '製造業品質検査データ自動集計',
    description: '品質検査結果を自動集計し、トレンド分析レポートを生成',
    category: 'quality',
    level: 2,
    scope: 'industry-specific',
    triggers: ['品質検査', 'quality', 'QC'],
    painPatterns: ['quality-data', 'inspection-tracking'],
    workflow: {
      steps: [
        '検査データ入力',
        '自動集計処理',
        '異常値検出',
        'レポート生成'
      ]
    },
    implementations: 8,
    successRate: 0.88
  },
  'retail-customer-analytics': {
    id: 'retail-customer-analytics',
    name: '小売業顧客分析ダッシュボード',
    description: '購買データから顧客セグメント分析を自動化',
    category: 'analytics',
    level: 3,
    scope: 'industry-specific',
    triggers: ['顧客分析', 'customer analytics', 'セグメント'],
    painPatterns: ['customer-analytics', 'segment-analysis'],
    workflow: {
      steps: [
        'POSデータ連携',
        'RFM分析実行',
        'セグメント自動生成',
        'ダッシュボード更新'
      ]
    },
    implementations: 15,
    successRate: 0.92
  }
};

/**
 * Create test URLs with mock responses
 */
export function createMockURLResponses(): Map<string, string> {
  const responses = new Map<string, string>();
  
  responses.set('https://example-company.com', `
    <html>
      <head><title>Example Company - Leading Innovation</title></head>
      <body>
        <h1>Example Company</h1>
        <div class="about">
          We are a leading technology company specializing in AI and automation.
          Our mission is to help businesses transform through digital innovation.
        </div>
        <div class="services">
          <h2>Our Services</h2>
          <ul>
            <li>AI Consulting</li>
            <li>Process Automation</li>
            <li>Digital Transformation</li>
          </ul>
        </div>
      </body>
    </html>
  `);

  responses.set('https://manufacturing-example.com', `
    <html>
      <head><title>製造業サンプル株式会社</title></head>
      <body>
        <h1>製造業サンプル株式会社</h1>
        <div class="about">
          創業50年の精密部品メーカーです。
          最新の製造技術で高品質な製品を提供しています。
        </div>
        <div class="challenges">
          <h2>取り組み課題</h2>
          <ul>
            <li>スマートファクトリー化</li>
            <li>品質管理の自動化</li>
            <li>在庫最適化</li>
          </ul>
        </div>
      </body>
    </html>
  `);

  return responses;
}

/**
 * Create test hearing notes
 */
export function createTestHearingNotes(industry: 'manufacturing' | 'retail' | 'it'): string {
  const notes = {
    manufacturing: `
ヒアリング日時: 2024-01-15
会社名: サンプル製造業株式会社
業界: 製造業（精密部品）
従業員数: 300名

【現状の課題】
1. 在庫管理
   - Excelでの手動管理
   - 月末の棚卸しに3日かかる
   - 在庫切れによる機会損失が月2-3回発生

2. 品質管理
   - 検査データが紙ベース
   - 月次品質レポート作成に丸2日
   - トレーサビリティの確保が困難

3. 生産計画
   - 需要予測が属人的
   - リードタイムの最適化ができていない

【導入希望】
- リアルタイム在庫管理システム
- 品質データの自動集計
- AI需要予測
`,
    retail: `
ヒアリング日時: 2024-01-20
会社名: 小売チェーン株式会社
業界: 小売業（総合スーパー）
店舗数: 50店舗

【現状の課題】
1. 顧客分析
   - POSデータはあるが活用できていない
   - 顧客セグメンテーションが手動
   - マーケティング施策の効果測定が困難

2. 在庫管理
   - 店舗間の在庫移動が非効率
   - 廃棄ロスが売上の2%
   - 季節商品の発注精度が低い

3. 価格戦略
   - 競合価格調査が手動
   - ダイナミックプライシングができない

【導入希望】
- 顧客分析ダッシュボード
- 需要予測システム
- 価格最適化ツール
`,
    it: `
ヒアリング日時: 2024-01-25
会社名: ITソリューション株式会社
業界: IT（SIer）
従業員数: 500名

【現状の課題】
1. プロジェクト管理
   - 複数プロジェクトの進捗管理が煩雑
   - リソース配分の最適化ができていない
   - 工数見積もりの精度が低い

2. ドキュメント管理
   - 仕様書のバージョン管理が手動
   - ナレッジの共有が不十分
   - 検索性が悪い

3. セキュリティ
   - 脆弱性管理が後手に回る
   - インシデント対応が属人的

【導入希望】
- 統合プロジェクト管理ツール
- AI文書管理システム
- セキュリティ自動化ツール
`
  };

  return notes[industry];
}

/**
 * Wait for a specific event to be emitted
 */
export function waitForEvent(
  emitter: any,
  eventName: string,
  timeout: number = 5000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeout);

    emitter.once(eventName, (data: any) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

/**
 * Create a test orchestrator with mock agents
 */
export function createTestOrchestrator(options: any = {}): any {
  // This would be used to create an orchestrator with mocked agent behaviors
  // for more controlled testing scenarios
  return null; // Placeholder
}

/**
 * Assertion helpers
 */
export const assertHelpers = {
  assertValidCompanyProfile(profile: any): void {
    expect(profile).toBeDefined();
    expect(profile.name).toBeDefined();
    expect(profile.industry).toBeDefined();
    expect(profile.description).toBeDefined();
    expect(profile.size).toMatch(/small|medium|large/);
  },

  assertValidPainPattern(pattern: any): void {
    expect(pattern).toBeDefined();
    expect(pattern.id).toBeDefined();
    expect(pattern.category).toBeDefined();
    expect(pattern.description).toBeDefined();
    expect(pattern.impact).toMatch(/low|medium|high/);
    expect(pattern.frequency).toBeDefined();
    expect(pattern.affectedRoles).toBeInstanceOf(Array);
  },

  assertValidSkillRecommendation(recommendation: any): void {
    expect(recommendation).toBeDefined();
    expect(recommendation.skill).toBeDefined();
    expect(recommendation.score).toBeGreaterThan(0);
    expect(recommendation.score).toBeLessThanOrEqual(1);
    expect(recommendation.reasons).toBeInstanceOf(Array);
    expect(recommendation.reasons.length).toBeGreaterThan(0);
  },

  assertValidGitHubPackage(pkg: any): void {
    expect(pkg).toBeDefined();
    expect(pkg.files).toBeDefined();
    expect(pkg.files['SKILL.md']).toBeDefined();
    expect(pkg.files['skill.yaml']).toBeDefined();
    expect(pkg.files['README.md']).toBeDefined();
    expect(pkg.files['CHANGELOG.md']).toBeDefined();
    expect(pkg.metadata).toBeDefined();
    expect(pkg.metadata.version).toMatch(/^\d+\.\d+\.\d+$/);
  }
};

/**
 * Performance measurement helper
 */
export class PerformanceTracker {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, Date.now());
  }

  measure(startMark: string, endMark: string): number {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);
    
    if (!start || !end) {
      throw new Error('Missing performance marks');
    }
    
    return end - start;
  }

  getAllMeasurements(): Map<string, number> {
    const measurements = new Map<string, number>();
    const markArray = Array.from(this.marks.entries());
    
    for (let i = 1; i < markArray.length; i++) {
      const [prevName, prevTime] = markArray[i - 1];
      const [currName, currTime] = markArray[i];
      measurements.set(`${prevName} -> ${currName}`, currTime - prevTime);
    }
    
    return measurements;
  }
}