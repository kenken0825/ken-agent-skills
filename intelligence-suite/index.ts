/**
 * Skilldex Intelligence Suite
 *
 * スキル価値最大化 + インテリジェンスダッシュボードの統合パッケージ
 * 需要分析 → 最適化 → ROI予測 → ストーリー生成の価値循環ループを実現
 */

// 型定義
export * from './types';

// データストア
export { UnifiedDataStore, dataStore } from './store/unified-data-store';

// エージェント
export { DemandTrackerAgent } from './agents/demand-tracker';
export { HealthMonitorAgent } from './agents/health-monitor';
export { CompetitiveAnalyzerAgent } from './agents/competitive-analyzer';
export { ComboOptimizerAgent } from './agents/combo-optimizer';
export { ROIPredictorAgent } from './agents/roi-predictor';
export { StoryGeneratorAgent } from './agents/story-generator';

// オーケストレーター
export { IntelligenceOrchestrator } from './orchestrator';

// CLI
export { DashboardDisplay } from './cli/dashboard-cli';

/**
 * Intelligence Suite のクイックスタート
 *
 * @example
 * ```typescript
 * import { createIntelligenceSuite } from './intelligence-suite';
 *
 * const suite = createIntelligenceSuite();
 *
 * const result = await suite.execute({
 *   mode: 'full',
 *   data: { skills, painPatterns, companyInfo }
 * });
 *
 * console.log(result.dashboard);
 * console.log(result.insights);
 * ```
 */
export function createIntelligenceSuite(config?: any) {
  const { IntelligenceOrchestrator } = require('./orchestrator');
  return new IntelligenceOrchestrator(config);
}

/**
 * Intelligence Suite バージョン
 */
export const VERSION = '1.0.0';

/**
 * 利用可能なエージェント一覧
 */
export const AVAILABLE_AGENTS = [
  'demand-tracker',
  'health-monitor',
  'competitive-analyzer',
  'combo-optimizer',
  'roi-predictor',
  'story-generator'
] as const;

/**
 * 利用可能なモード一覧
 */
export const AVAILABLE_MODES = [
  'analyze',
  'optimize',
  'predict',
  'full'
] as const;
