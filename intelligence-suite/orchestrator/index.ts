/**
 * Intelligence Suite Orchestrator
 *
 * 6つの Intelligence エージェントを統合し、価値循環ループを実現するオーケストレーター
 * 需要分析 → 最適化 → 予測 → ストーリー生成の一連のフローを管理
 */

import { EventEmitter } from 'events';
import {
  IntelligenceSuiteInput,
  IntelligenceSuiteOutput,
  DashboardView,
  IntelligenceAgentConfig,
  IntelligenceEvent,
  PainTrend,
  SkillHealthScore,
  HealthAlert
} from '../types';
import { Skill, PainPattern, CompanyInfo } from '../../shared/types';

// エージェントのインポート
import { DemandTrackerAgent } from '../agents/demand-tracker';
import { HealthMonitorAgent, SkillUsageData, SkillFeedback } from '../agents/health-monitor';
import { CompetitiveAnalyzerAgent } from '../agents/competitive-analyzer';
import { ComboOptimizerAgent } from '../agents/combo-optimizer';
import { ROIPredictorAgent } from '../agents/roi-predictor';
import { StoryGeneratorAgent } from '../agents/story-generator';
import { UnifiedDataStore } from '../store/unified-data-store';

/**
 * Intelligence Orchestrator クラス
 */
export class IntelligenceOrchestrator extends EventEmitter {
  private agents: {
    demandTracker: DemandTrackerAgent;
    healthMonitor: HealthMonitorAgent;
    competitiveAnalyzer: CompetitiveAnalyzerAgent;
    comboOptimizer: ComboOptimizerAgent;
    roiPredictor: ROIPredictorAgent;
    storyGenerator: StoryGeneratorAgent;
  };

  private dataStore: UnifiedDataStore;
  private config: IntelligenceAgentConfig;

  constructor(config: IntelligenceAgentConfig = {}) {
    super();
    this.config = config;
    this.dataStore = new UnifiedDataStore();

    // エージェントの初期化
    this.agents = {
      demandTracker: new DemandTrackerAgent(config.demandTracker, this.dataStore),
      healthMonitor: new HealthMonitorAgent(config.healthMonitor, this.dataStore),
      competitiveAnalyzer: new CompetitiveAnalyzerAgent(config.competitiveAnalyzer, this.dataStore),
      comboOptimizer: new ComboOptimizerAgent(config.comboOptimizer, this.dataStore),
      roiPredictor: new ROIPredictorAgent(config.roiPredictor, this.dataStore),
      storyGenerator: new StoryGeneratorAgent(config.storyGenerator, this.dataStore)
    };

    // エージェントイベントの購読
    this.setupEventListeners();
  }

  /**
   * データストアを初期化
   */
  async initialize(): Promise<void> {
    await this.dataStore.initialize();
    this.emitEvent('dashboard:refresh', { initialized: true });
  }

  /**
   * イベントリスナーの設定
   */
  private setupEventListeners(): void {
    // 各エージェントの完了イベントを監視
    this.agents.demandTracker.on('analysis:complete', (data) => {
      this.emitEvent('demand:trend_detected', data);
    });

    this.agents.healthMonitor.on('check:complete', (data) => {
      if (data.criticalSkills?.length > 0) {
        this.emitEvent('health:alert_triggered', data.criticalSkills);
      }
    });

    this.agents.comboOptimizer.on('optimization:complete', (data) => {
      if (data.topCombo) {
        this.emitEvent('combo:new_discovered', data.topCombo);
      }
    });
  }

  /**
   * イベントを発行
   */
  private emitEvent(type: string, payload: any): void {
    const event: IntelligenceEvent = {
      type: type as any,
      payload,
      timestamp: new Date(),
      source: 'orchestrator'
    };
    this.emit(type, event);
    this.emit('intelligence:event', event);
  }

  /**
   * メイン実行
   */
  async execute(input: IntelligenceSuiteInput): Promise<IntelligenceSuiteOutput> {
    const startTime = Date.now();
    const errors: string[] = [];
    const results: IntelligenceSuiteOutput['results'] = {};
    const insights: string[] = [];

    this.emit('suite:start', { mode: input.mode });

    try {
      // データストア初期化
      await this.initialize();

      // スキルとペインパターンをデータストアに登録
      if (input.data.skills) {
        for (const skill of input.data.skills) {
          await this.dataStore.addSkill(skill);
        }
      }
      if (input.data.painPatterns) {
        for (const pain of input.data.painPatterns) {
          await this.dataStore.addPainPattern(pain);
        }
      }

      // モードに応じて実行
      switch (input.mode) {
        case 'analyze':
          await this.executeAnalyzeMode(input, results, insights);
          break;
        case 'optimize':
          await this.executeOptimizeMode(input, results, insights);
          break;
        case 'predict':
          await this.executePredictMode(input, results, insights);
          break;
        case 'full':
          await this.executeFullMode(input, results, insights);
          break;
      }

      // オプションに基づいて追加処理
      await this.executeOptionalProcesses(input, results, insights);

      // ダッシュボードビューを生成
      const dashboard = await this.generateDashboardView(results);

      this.emit('suite:complete', { results, dashboard });

      return {
        status: 'success',
        results,
        dashboard,
        insights,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      this.emit('suite:error', { error });

      return {
        status: 'failed',
        results,
        dashboard: this.generateEmptyDashboard(),
        insights,
        errors,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * 分析モードの実行
   */
  private async executeAnalyzeMode(
    input: IntelligenceSuiteInput,
    results: IntelligenceSuiteOutput['results'],
    insights: string[]
  ): Promise<void> {
    // 需要トラッキング
    if (input.data.painPatterns) {
      results.demandAnalysis = await this.agents.demandTracker.execute({
        painPatterns: input.data.painPatterns
      });

      if (results.demandAnalysis.emergingPains.length > 0) {
        insights.push(`🔥 ${results.demandAnalysis.emergingPains.length}件の急上昇ペインを検出`);
      }
    }

    // ヘルスモニタリング
    if (input.data.skills) {
      results.healthReport = await this.agents.healthMonitor.execute({
        skills: input.data.skills
      });

      if (results.healthReport.criticalSkills.length > 0) {
        insights.push(`⚠️ ${results.healthReport.criticalSkills.length}件のスキルが要注意状態`);
      }
    }

    // 競合分析（最初のスキルに対して）
    if (input.data.skills && input.data.skills.length > 0) {
      results.competitiveAnalysis = await this.agents.competitiveAnalyzer.execute({
        targetSkill: input.data.skills[0],
        competitorSkills: input.data.skills.slice(1)
      });

      insights.push(`📊 市場ポジション: ${results.competitiveAnalysis.marketPosition}`);
    }
  }

  /**
   * 最適化モードの実行
   */
  private async executeOptimizeMode(
    input: IntelligenceSuiteInput,
    results: IntelligenceSuiteOutput['results'],
    insights: string[]
  ): Promise<void> {
    if (!input.data.skills || !input.data.painPatterns) {
      throw new Error('Optimize mode requires both skills and painPatterns');
    }

    // コンボ最適化
    results.comboRecommendations = await this.agents.comboOptimizer.execute({
      availableSkills: input.data.skills,
      painPatterns: input.data.painPatterns,
      context: {
        industry: input.data.companyInfo?.industry || 'general'
      }
    });

    if (results.comboRecommendations.topCombo) {
      const combo = results.comboRecommendations.topCombo;
      insights.push(`💡 最適コンボ: "${combo.name}" (シナジースコア: ${combo.synergyScore})`);
      insights.push(`📈 推定ROI: ${combo.estimatedROI}%`);
    }
  }

  /**
   * 予測モードの実行
   */
  private async executePredictMode(
    input: IntelligenceSuiteInput,
    results: IntelligenceSuiteOutput['results'],
    insights: string[]
  ): Promise<void> {
    if (!input.data.skills || !input.data.companyInfo) {
      throw new Error('Predict mode requires both skills and companyInfo');
    }

    results.roiPredictions = [];

    for (const skill of input.data.skills.slice(0, 5)) {
      const prediction = await this.agents.roiPredictor.execute({
        skill,
        companyInfo: {
          industry: input.data.companyInfo.industry,
          size: input.data.companyInfo.size || 'medium'
        }
      });
      results.roiPredictions.push(prediction);
    }

    // 最高ROIのスキルをインサイトに追加
    const bestROI = results.roiPredictions.reduce((best, current) =>
      current.prediction.roi.percentage > best.prediction.roi.percentage ? current : best
    );
    insights.push(`💰 最高ROI: "${bestROI.prediction.skillName}" (${bestROI.prediction.roi.percentage}%)`);
  }

  /**
   * フルモードの実行
   */
  private async executeFullMode(
    input: IntelligenceSuiteInput,
    results: IntelligenceSuiteOutput['results'],
    insights: string[]
  ): Promise<void> {
    // 1. 分析
    await this.executeAnalyzeMode(input, results, insights);

    // 2. 最適化
    if (input.data.skills && input.data.painPatterns) {
      await this.executeOptimizeMode(input, results, insights);
    }

    // 3. 予測
    if (input.data.skills && input.data.companyInfo) {
      await this.executePredictMode(input, results, insights);
    }

    // 4. 循環インサイトを生成
    this.generateCyclicalInsights(results, insights);
  }

  /**
   * オプションプロセスの実行
   */
  private async executeOptionalProcesses(
    input: IntelligenceSuiteInput,
    results: IntelligenceSuiteOutput['results'],
    insights: string[]
  ): Promise<void> {
    const options = input.options || {};

    // ストーリー生成
    if (options.generateStories && results.roiPredictions?.length) {
      results.generatedStories = [];

      for (const roiResult of results.roiPredictions.slice(0, 2)) {
        const skill = input.data.skills?.find(s =>
          s.id === roiResult.prediction.skillId || s.name === roiResult.prediction.skillName
        );

        if (skill && input.data.companyInfo) {
          const story = await this.agents.storyGenerator.execute({
            skill,
            implementation: {
              companyName: input.data.companyInfo.name || 'Sample Company',
              industry: input.data.companyInfo.industry,
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
              },
              {
                metric: 'コスト',
                before: `${roiResult.prediction.initialInvestment.total}万円`,
                after: `${roiResult.prediction.annualSavings.total}万円削減/年`,
                percentChange: roiResult.prediction.roi.percentage
              }
            ]
          });

          results.generatedStories.push(story);
        }
      }

      if (results.generatedStories.length > 0) {
        insights.push(`📝 ${results.generatedStories.length}件の成功事例を生成`);
      }
    }
  }

  /**
   * 循環インサイトを生成
   */
  private generateCyclicalInsights(
    results: IntelligenceSuiteOutput['results'],
    insights: string[]
  ): void {
    // トレンドとコンボの連携
    if (results.demandAnalysis?.topTrends && results.comboRecommendations?.topCombo) {
      const topTrend = results.demandAnalysis.topTrends[0];
      const topCombo = results.comboRecommendations.topCombo;

      insights.push(`🔄 循環分析: "${topTrend?.painName}"トレンドに対して"${topCombo.name}"コンボが有効`);
    }

    // ヘルスとROIの連携
    if (results.healthReport?.healthySkills && results.roiPredictions) {
      const healthyCount = results.healthReport.healthySkills.length;
      const avgROI = results.roiPredictions.reduce((sum, r) =>
        sum + r.prediction.roi.percentage, 0) / results.roiPredictions.length;

      insights.push(`📊 健全スキル${healthyCount}件の平均ROI: ${Math.round(avgROI)}%`);
    }
  }

  /**
   * ダッシュボードビューを生成
   */
  private async generateDashboardView(
    results: IntelligenceSuiteOutput['results']
  ): Promise<DashboardView> {
    // 需要サマリー
    const demandSummary = {
      topTrends: results.demandAnalysis?.topTrends || [],
      emergingCount: results.demandAnalysis?.emergingPains.length || 0,
      decliningCount: results.demandAnalysis?.decliningPains.length || 0
    };

    // ヘルスサマリー
    const healthSummary = {
      overallScore: results.healthReport?.overallHealthScore || 100,
      healthyCount: results.healthReport?.healthySkills.length || 0,
      warningCount: results.healthReport?.warningSkills.length || 0,
      criticalCount: results.healthReport?.criticalSkills.length || 0
    };

    // ROIサマリー
    const roiPredictions = results.roiPredictions || [];
    const roiSummary = {
      averageROI: roiPredictions.length > 0
        ? Math.round(roiPredictions.reduce((sum, r) => sum + r.prediction.roi.percentage, 0) / roiPredictions.length)
        : 0,
      totalSavings: roiPredictions.reduce((sum, r) => sum + r.prediction.annualSavings.total, 0),
      successRate: 85 // デフォルト値
    };

    // 最近のストーリー
    const recentStories = results.generatedStories?.map(s => s.story) || [];

    // トップコンボ
    const topCombos = results.comboRecommendations?.recommendedCombos || [];

    // アラート収集
    const alerts: HealthAlert[] = [];
    results.healthReport?.criticalSkills.forEach(s => alerts.push(...s.alerts));
    results.healthReport?.warningSkills.forEach(s => alerts.push(...s.alerts));

    return {
      demandSummary,
      healthSummary,
      roiSummary,
      recentStories,
      topCombos,
      alerts: alerts.slice(0, 10),
      lastRefresh: new Date()
    };
  }

  /**
   * 空のダッシュボードを生成
   */
  private generateEmptyDashboard(): DashboardView {
    return {
      demandSummary: { topTrends: [], emergingCount: 0, decliningCount: 0 },
      healthSummary: { overallScore: 0, healthyCount: 0, warningCount: 0, criticalCount: 0 },
      roiSummary: { averageROI: 0, totalSavings: 0, successRate: 0 },
      recentStories: [],
      topCombos: [],
      alerts: [],
      lastRefresh: new Date()
    };
  }

  /**
   * クイックコマンドの実行
   */
  async executeCommand(command: string, data?: any): Promise<any> {
    switch (command.toUpperCase()) {
      case 'DEMAND':
        return this.commandDemand(data);
      case 'HEALTH':
        return this.commandHealth(data);
      case 'COMBO':
        return this.commandCombo(data);
      case 'ROI':
        return this.commandROI(data);
      case 'STORY':
        return this.commandStory(data);
      case 'DASHBOARD':
        return this.commandDashboard();
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  /**
   * DEMANDコマンド
   */
  private async commandDemand(data: { painPatterns: PainPattern[] }): Promise<any> {
    return this.agents.demandTracker.execute(data);
  }

  /**
   * HEALTHコマンド
   */
  private async commandHealth(data: { skills: Skill[] }): Promise<any> {
    return this.agents.healthMonitor.execute(data);
  }

  /**
   * COMBOコマンド
   */
  private async commandCombo(data: {
    skills: Skill[];
    painPatterns: PainPattern[];
    industry?: string;
  }): Promise<any> {
    return this.agents.comboOptimizer.execute({
      availableSkills: data.skills,
      painPatterns: data.painPatterns,
      context: { industry: data.industry || 'general' }
    });
  }

  /**
   * ROIコマンド
   */
  private async commandROI(data: { skill: Skill; companyInfo: any }): Promise<any> {
    return this.agents.roiPredictor.execute(data);
  }

  /**
   * STORYコマンド
   */
  private async commandStory(data: any): Promise<any> {
    return this.agents.storyGenerator.execute(data);
  }

  /**
   * DASHBOARDコマンド
   */
  private async commandDashboard(): Promise<DashboardView> {
    const skills = this.dataStore.getSkills();
    const pains = this.dataStore.getPainPatterns();

    const result = await this.execute({
      mode: 'full',
      data: { skills, painPatterns: pains }
    });

    return result.dashboard;
  }

  /**
   * データストアを取得
   */
  getDataStore(): UnifiedDataStore {
    return this.dataStore;
  }
}

export default IntelligenceOrchestrator;
