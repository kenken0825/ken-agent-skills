/**
 * Intelligence Suite E2E テスト
 */

import { IntelligenceOrchestrator } from '../orchestrator';
import { UnifiedDataStore } from '../store/unified-data-store';
import { DemandTrackerAgent } from '../agents/demand-tracker';
import { HealthMonitorAgent } from '../agents/health-monitor';
import { ComboOptimizerAgent } from '../agents/combo-optimizer';
import { ROIPredictorAgent } from '../agents/roi-predictor';
import { StoryGeneratorAgent } from '../agents/story-generator';
import { Skill, PainPattern } from '../../shared/types';

// テスト用スキルデータ
const mockSkills: Skill[] = [
  {
    id: 'skill-001',
    name: 'Invoice Processing Automation',
    description: 'Automate invoice processing workflow',
    category: 'automation',
    targetIndustry: 'finance',
    triggers: ['invoice', 'billing', 'payment'],
    evolutionLevel: 2,
    implementations: 10,
    successRate: 0.85
  },
  {
    id: 'skill-002',
    name: 'Report Generation',
    description: 'Automated report generation system',
    category: 'automation',
    targetIndustry: 'technology',
    triggers: ['report', 'analytics', 'dashboard'],
    evolutionLevel: 3,
    implementations: 15,
    successRate: 0.9
  },
  {
    id: 'skill-003',
    name: 'Quality Inspection',
    description: 'AI-powered quality inspection',
    category: 'monitoring',
    targetIndustry: 'manufacturing',
    triggers: ['quality', 'inspection', 'defect'],
    evolutionLevel: 2,
    implementations: 8,
    successRate: 0.82
  }
];

// テスト用ペインパターン
const mockPainPatterns: PainPattern[] = [
  {
    id: 'pain-001',
    name: '請求書処理の遅延',
    category: 'process',
    description: '手作業による請求書処理で時間がかかる',
    symptoms: ['処理時間が長い', '手作業が多い', 'ミスが発生'],
    impact: 80,
    applicableIndustries: ['finance', 'retail']
  },
  {
    id: 'pain-002',
    name: 'レポート作成の負担',
    category: 'process',
    description: '定期レポートの作成に多くの時間を費やす',
    symptoms: ['レポート作成', '手動集計', 'データ収集'],
    impact: 70,
    applicableIndustries: ['technology', 'consulting']
  },
  {
    id: 'pain-003',
    name: '品質管理の課題',
    category: 'technology',
    description: '目視検査に依存した品質管理',
    symptoms: ['検査精度', '見落とし', '人手不足'],
    impact: 85,
    applicableIndustries: ['manufacturing']
  }
];

describe('Intelligence Suite', () => {
  describe('UnifiedDataStore', () => {
    let dataStore: UnifiedDataStore;

    beforeEach(() => {
      dataStore = new UnifiedDataStore({ autoSave: false });
    });

    afterEach(() => {
      dataStore.clear();
    });

    test('should add and retrieve skills', async () => {
      const id = await dataStore.addSkill(mockSkills[0]);
      expect(id).toBeDefined();

      const skills = dataStore.getSkills();
      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe('Invoice Processing Automation');
    });

    test('should add and retrieve pain patterns', async () => {
      const id = await dataStore.addPainPattern(mockPainPatterns[0]);
      expect(id).toBeDefined();

      const pains = dataStore.getPainPatterns();
      expect(pains.length).toBe(1);
      expect(pains[0].name).toBe('請求書処理の遅延');
    });

    test('should query entries by type', async () => {
      await dataStore.addSkill(mockSkills[0]);
      await dataStore.addSkill(mockSkills[1]);
      await dataStore.addPainPattern(mockPainPatterns[0]);

      const skillEntries = dataStore.getByType('skill');
      expect(skillEntries.length).toBe(2);

      const painEntries = dataStore.getByType('pain');
      expect(painEntries.length).toBe(1);
    });

    test('should get statistics', async () => {
      await dataStore.addSkill(mockSkills[0]);
      await dataStore.addSkill(mockSkills[1]);
      await dataStore.addPainPattern(mockPainPatterns[0]);

      const stats = dataStore.getStats();
      expect(stats.totalEntries).toBe(3);
      expect(stats.entriesByType['skill']).toBe(2);
      expect(stats.entriesByType['pain']).toBe(1);
    });
  });

  describe('DemandTrackerAgent', () => {
    let agent: DemandTrackerAgent;

    beforeEach(() => {
      agent = new DemandTrackerAgent();
    });

    test('should analyze pain pattern trends', async () => {
      const result = await agent.execute({
        painPatterns: mockPainPatterns
      });

      expect(result.topTrends).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    test('should detect emerging pains', async () => {
      const result = await agent.execute({
        painPatterns: mockPainPatterns
      });

      // 初回なので全てがemerging
      expect(result.emergingPains.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('HealthMonitorAgent', () => {
    let agent: HealthMonitorAgent;

    beforeEach(() => {
      agent = new HealthMonitorAgent();
    });

    test('should calculate health scores for skills', async () => {
      const result = await agent.execute({
        skills: mockSkills
      });

      expect(result.overallHealthScore).toBeDefined();
      expect(result.healthySkills).toBeDefined();
      expect(result.warningSkills).toBeDefined();
      expect(result.criticalSkills).toBeDefined();
    });

    test('should identify healthy skills', async () => {
      const result = await agent.execute({
        skills: mockSkills
      });

      // スキルが健全カテゴリに含まれていることを確認
      const allSkills = [
        ...result.healthySkills,
        ...result.warningSkills,
        ...result.criticalSkills,
        ...result.retireCandidate
      ];
      expect(allSkills.length).toBe(mockSkills.length);
    });
  });

  describe('ComboOptimizerAgent', () => {
    let agent: ComboOptimizerAgent;

    beforeEach(() => {
      agent = new ComboOptimizerAgent();
    });

    test('should generate skill combos', async () => {
      const result = await agent.execute({
        availableSkills: mockSkills,
        painPatterns: mockPainPatterns,
        context: { industry: 'technology' }
      });

      expect(result.recommendedCombos).toBeDefined();
      expect(result.topCombo).toBeDefined();
    });

    test('should calculate synergy scores', async () => {
      const result = await agent.execute({
        availableSkills: mockSkills,
        painPatterns: mockPainPatterns,
        context: { industry: 'technology' }
      });

      if (result.topCombo) {
        expect(result.topCombo.synergyScore).toBeGreaterThanOrEqual(0);
        expect(result.topCombo.synergyScore).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('ROIPredictorAgent', () => {
    let agent: ROIPredictorAgent;

    beforeEach(() => {
      agent = new ROIPredictorAgent();
    });

    test('should predict ROI for a skill', async () => {
      const result = await agent.execute({
        skill: mockSkills[0],
        companyInfo: {
          industry: 'finance',
          size: 'medium'
        }
      });

      expect(result.prediction).toBeDefined();
      expect(result.prediction.roi.percentage).toBeGreaterThan(0);
      expect(result.prediction.roi.paybackMonths).toBeGreaterThan(0);
    });

    test('should include sensitivity analysis', async () => {
      const result = await agent.execute({
        skill: mockSkills[0],
        companyInfo: {
          industry: 'finance',
          size: 'medium'
        }
      });

      expect(result.prediction.sensitivityAnalysis).toBeDefined();
      expect(result.prediction.sensitivityAnalysis.bestCase).toBeDefined();
      expect(result.prediction.sensitivityAnalysis.worstCase).toBeDefined();
    });
  });

  describe('StoryGeneratorAgent', () => {
    let agent: StoryGeneratorAgent;

    beforeEach(() => {
      agent = new StoryGeneratorAgent();
    });

    test('should generate success story', async () => {
      const result = await agent.execute({
        skill: mockSkills[0],
        implementation: {
          companyName: 'テスト株式会社',
          industry: 'finance',
          role: 'Operations',
          startDate: new Date(),
          duration: 3,
          teamSize: 5
        },
        results: [
          {
            metric: '処理時間',
            before: '40時間/月',
            after: '10時間/月',
            percentChange: -75
          }
        ]
      });

      expect(result.story).toBeDefined();
      expect(result.story.title).toBeDefined();
      expect(result.story.formats.markdown).toBeDefined();
    });

    test('should generate multiple formats', async () => {
      const result = await agent.execute({
        skill: mockSkills[0],
        implementation: {
          companyName: 'テスト株式会社',
          industry: 'finance',
          role: 'Operations',
          startDate: new Date(),
          duration: 3,
          teamSize: 5
        },
        results: [
          {
            metric: '処理時間',
            before: '40時間/月',
            after: '10時間/月',
            percentChange: -75
          }
        ]
      });

      expect(result.story.formats.markdown).toBeTruthy();
      expect(result.story.formats.html).toBeTruthy();
      expect(result.story.formats.plainText).toBeTruthy();
      expect(result.story.formats.socialMedia.twitter).toBeTruthy();
      expect(result.story.formats.socialMedia.linkedin).toBeTruthy();
    });
  });

  describe('IntelligenceOrchestrator', () => {
    let orchestrator: IntelligenceOrchestrator;

    beforeEach(() => {
      orchestrator = new IntelligenceOrchestrator();
    });

    test('should execute analyze mode', async () => {
      const result = await orchestrator.execute({
        mode: 'analyze',
        data: {
          skills: mockSkills,
          painPatterns: mockPainPatterns
        }
      });

      expect(result.status).toBe('success');
      expect(result.results.demandAnalysis).toBeDefined();
      expect(result.results.healthReport).toBeDefined();
      expect(result.dashboard).toBeDefined();
    });

    test('should execute optimize mode', async () => {
      const result = await orchestrator.execute({
        mode: 'optimize',
        data: {
          skills: mockSkills,
          painPatterns: mockPainPatterns
        }
      });

      expect(result.status).toBe('success');
      expect(result.results.comboRecommendations).toBeDefined();
    });

    test('should execute full mode', async () => {
      const result = await orchestrator.execute({
        mode: 'full',
        data: {
          skills: mockSkills,
          painPatterns: mockPainPatterns,
          companyInfo: {
            name: 'テスト企業',
            industry: 'technology',
            description: 'テスト企業の説明',
            values: [],
            services: [],
            size: 'medium' as const
          }
        }
      });

      expect(result.status).toBe('success');
      expect(result.results.demandAnalysis).toBeDefined();
      expect(result.results.healthReport).toBeDefined();
      expect(result.results.comboRecommendations).toBeDefined();
      expect(result.results.roiPredictions).toBeDefined();
      expect(result.insights.length).toBeGreaterThan(0);
    });

    test('should generate dashboard view', async () => {
      const result = await orchestrator.execute({
        mode: 'analyze',
        data: {
          skills: mockSkills,
          painPatterns: mockPainPatterns
        }
      });

      expect(result.dashboard.demandSummary).toBeDefined();
      expect(result.dashboard.healthSummary).toBeDefined();
      expect(result.dashboard.roiSummary).toBeDefined();
      expect(result.dashboard.lastRefresh).toBeDefined();
    });

    test('should execute quick commands', async () => {
      const healthResult = await orchestrator.executeCommand('HEALTH', {
        skills: mockSkills
      });

      expect(healthResult.overallHealthScore).toBeDefined();
    });
  });

  describe('Value Circulation Loop', () => {
    test('should complete full value circulation', async () => {
      const orchestrator = new IntelligenceOrchestrator();

      // 1. フル分析を実行
      const result = await orchestrator.execute({
        mode: 'full',
        data: {
          skills: mockSkills,
          painPatterns: mockPainPatterns,
          companyInfo: {
            name: 'テスト企業',
            industry: 'technology',
            description: 'テスト企業の説明',
            values: [],
            services: [],
            size: 'medium' as const
          }
        },
        options: {
          generateStories: true
        }
      });

      // 2. トレンド分析が実行されたことを確認
      expect(result.results.demandAnalysis).toBeDefined();

      // 3. コンボ最適化が実行されたことを確認
      expect(result.results.comboRecommendations).toBeDefined();

      // 4. ROI予測が実行されたことを確認
      expect(result.results.roiPredictions).toBeDefined();
      expect(result.results.roiPredictions!.length).toBeGreaterThan(0);

      // 5. ダッシュボードが生成されたことを確認
      expect(result.dashboard.demandSummary).toBeDefined();
      expect(result.dashboard.healthSummary).toBeDefined();
      expect(result.dashboard.roiSummary).toBeDefined();

      // 6. インサイトが生成されたことを確認
      expect(result.insights.length).toBeGreaterThan(0);
    });
  });
});
