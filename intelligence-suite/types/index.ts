/**
 * Skilldex Intelligence Suite - 型定義
 *
 * スキル価値最大化 + インテリジェンスダッシュボードの統合型定義
 */

import {
  Skill,
  PainPattern,
  IndustryCategory,
  RoleCategory,
  SkillRecommendation,
  CompanyInfo
} from '../../shared/types';

// ========================================
// Demand Tracker 型
// ========================================

/**
 * ペイントレンド情報
 */
export interface PainTrend {
  painId: string;
  painName: string;
  category: string;
  currentCount: number;
  previousCount: number;
  changePercent: number;
  trend: 'rising' | 'stable' | 'declining';
  industries: string[];
  firstSeen: Date;
  lastSeen: Date;
}

/**
 * 需要トラッカー出力
 */
export interface DemandTrackerOutput {
  topTrends: PainTrend[];
  emergingPains: PainTrend[];
  decliningPains: PainTrend[];
  industryBreakdown: Record<string, PainTrend[]>;
  timestamp: Date;
}

// ========================================
// Health Monitor 型
// ========================================

/**
 * スキル健康度スコア
 */
export interface SkillHealthScore {
  skillId: string;
  skillName: string;
  overallScore: number; // 0-100
  metrics: {
    usageFrequency: number;      // 使用頻度スコア
    successRate: number;          // 成功率
    feedbackScore: number;        // フィードバックスコア
    maintenanceStatus: number;    // メンテナンス状態
    relevanceScore: number;       // 関連性スコア
  };
  status: 'healthy' | 'warning' | 'critical' | 'retired';
  alerts: HealthAlert[];
  recommendations: string[];
  lastUsed: Date;
  lastUpdated: Date;
}

/**
 * 健康度アラート
 */
export interface HealthAlert {
  type: 'usage_drop' | 'low_success' | 'outdated' | 'negative_feedback' | 'deprecated_dependency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  triggeredAt: Date;
  suggestedAction?: string;
}

/**
 * Health Monitor 出力
 */
export interface HealthMonitorOutput {
  healthySkills: SkillHealthScore[];
  warningSkills: SkillHealthScore[];
  criticalSkills: SkillHealthScore[];
  retireCandidate: SkillHealthScore[];
  overallHealthScore: number;
  timestamp: Date;
}

// ========================================
// Competitive Analyzer 型
// ========================================

/**
 * 競合スキル比較結果
 */
export interface SkillComparison {
  skillId: string;
  skillName: string;
  competitorId: string;
  competitorName: string;
  comparison: {
    fitScore: { ours: number; theirs: number; winner: 'ours' | 'theirs' | 'tie' };
    costScore: { ours: number; theirs: number; winner: 'ours' | 'theirs' | 'tie' };
    easeOfUse: { ours: number; theirs: number; winner: 'ours' | 'theirs' | 'tie' };
    support: { ours: number; theirs: number; winner: 'ours' | 'theirs' | 'tie' };
  };
  ourStrengths: string[];
  ourWeaknesses: string[];
  differentiators: string[];
  overallVerdict: 'win' | 'lose' | 'competitive';
}

/**
 * Competitive Analyzer 出力
 */
export interface CompetitiveAnalyzerOutput {
  comparisons: SkillComparison[];
  marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
  competitiveAdvantages: string[];
  areasForImprovement: string[];
  timestamp: Date;
}

// ========================================
// Combo Optimizer 型
// ========================================

/**
 * スキルコンボ
 */
export interface SkillCombo {
  id: string;
  name: string;
  skills: Skill[];
  synergyScore: number; // 0-100
  synergyFactors: {
    workflowIntegration: number;   // ワークフロー統合度
    dataSharing: number;            // データ共有効率
    skillComplement: number;        // スキル補完性
    learningCurve: number;          // 習得曲線の緩さ
  };
  applicableIndustries: string[];
  applicableRoles: string[];
  estimatedROI: number;
  implementationOrder: string[]; // スキルIDの順序
  prerequisites: string[];
  benefits: string[];
  caseStudies?: ComboSuccessCase[];
}

/**
 * コンボ成功事例
 */
export interface ComboSuccessCase {
  companyName: string;
  industry: string;
  implementationDate: Date;
  results: {
    metric: string;
    before: string;
    after: string;
    improvement: string;
  }[];
  testimonial?: string;
}

/**
 * Combo Optimizer 出力
 */
export interface ComboOptimizerOutput {
  recommendedCombos: SkillCombo[];
  topCombo: SkillCombo;
  alternativeCombos: SkillCombo[];
  customComboSuggestions: string[];
  timestamp: Date;
}

// ========================================
// ROI Predictor 型
// ========================================

/**
 * ROI予測入力
 */
export interface ROIPredictorInput {
  skill: Skill;
  companyInfo: {
    industry: string;
    size: 'small' | 'medium' | 'large' | 'enterprise';
    employeeCount?: number;
    currentProcessCost?: number;
    painSeverity?: number; // 1-10
  };
  implementationContext?: {
    complexity: 'low' | 'medium' | 'high';
    timeframe: number; // months
    budget?: number;
  };
}

/**
 * ROI予測結果
 */
export interface ROIPrediction {
  skillId: string;
  skillName: string;
  initialInvestment: {
    implementation: number;
    training: number;
    infrastructure: number;
    total: number;
  };
  annualSavings: {
    laborCost: number;
    errorReduction: number;
    efficiencyGain: number;
    total: number;
  };
  roi: {
    percentage: number;
    paybackMonths: number;
    threeYearValue: number;
    fiveYearValue: number;
  };
  confidenceLevel: 'low' | 'medium' | 'high';
  assumptions: string[];
  riskFactors: string[];
  sensitivityAnalysis: {
    bestCase: { roi: number; paybackMonths: number };
    worstCase: { roi: number; paybackMonths: number };
  };
}

/**
 * ROI Predictor 出力
 */
export interface ROIPredictorOutput {
  prediction: ROIPrediction;
  benchmarks: {
    industryAverage: number;
    topPerformers: number;
    similarImplementations: number;
  };
  recommendations: string[];
  timestamp: Date;
}

// ========================================
// Story Generator 型
// ========================================

/**
 * 成功ストーリー入力
 */
export interface StoryGeneratorInput {
  skill: Skill;
  implementation: {
    companyName: string;
    industry: string;
    role: string;
    startDate: Date;
    duration: number; // months
    teamSize: number;
  };
  results: {
    metric: string;
    before: string;
    after: string;
    percentChange?: number;
  }[];
  challenges?: string[];
  testimonials?: string[];
}

/**
 * 生成されたストーリー
 */
export interface GeneratedStory {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  sections: {
    challenge: string;
    solution: string;
    implementation: string;
    results: string;
    testimonial?: string;
    nextSteps?: string;
  };
  metadata: {
    industry: string;
    role: string;
    skillName: string;
    companyName: string;
    generatedAt: Date;
  };
  formats: {
    markdown: string;
    html: string;
    plainText: string;
    socialMedia: {
      twitter: string;
      linkedin: string;
    };
  };
  keyMetrics: {
    label: string;
    value: string;
    icon?: string;
  }[];
}

/**
 * Story Generator 出力
 */
export interface StoryGeneratorOutput {
  story: GeneratedStory;
  variations: GeneratedStory[];
  suggestedChannels: string[];
  timestamp: Date;
}

// ========================================
// Unified Data Store 型
// ========================================

/**
 * 統合データエントリ
 */
export interface DataEntry {
  id: string;
  type: 'skill' | 'pain' | 'trend' | 'case' | 'combo' | 'health' | 'roi';
  data: any;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    source: string;
    version: number;
  };
  relations: {
    type: string;
    targetId: string;
    strength?: number;
  }[];
}

/**
 * データストア統計
 */
export interface DataStoreStats {
  totalEntries: number;
  entriesByType: Record<string, number>;
  lastUpdated: Date;
  storageSize: number;
}

/**
 * データストアクエリ
 */
export interface DataStoreQuery {
  type?: string;
  filters?: Record<string, any>;
  sort?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
}

// ========================================
// Intelligence Dashboard 型
// ========================================

/**
 * ダッシュボードビュー
 */
export interface DashboardView {
  demandSummary: {
    topTrends: PainTrend[];
    emergingCount: number;
    decliningCount: number;
  };
  healthSummary: {
    overallScore: number;
    healthyCount: number;
    warningCount: number;
    criticalCount: number;
  };
  roiSummary: {
    averageROI: number;
    totalSavings: number;
    successRate: number;
  };
  recentStories: GeneratedStory[];
  topCombos: SkillCombo[];
  alerts: HealthAlert[];
  lastRefresh: Date;
}

/**
 * ダッシュボード設定
 */
export interface DashboardConfig {
  refreshInterval: number; // seconds
  displayLimit: number;
  alertThresholds: {
    healthWarning: number;
    healthCritical: number;
    usageDropPercent: number;
  };
  enabledWidgets: string[];
}

// ========================================
// Intelligence Orchestrator 型
// ========================================

/**
 * Intelligence Suite 入力
 */
export interface IntelligenceSuiteInput {
  mode: 'analyze' | 'optimize' | 'predict' | 'full';
  data: {
    skills?: Skill[];
    painPatterns?: PainPattern[];
    companyInfo?: CompanyInfo;
    historicalData?: any[];
  };
  options?: {
    includeROI?: boolean;
    generateStories?: boolean;
    findCombos?: boolean;
    analyzeCompetition?: boolean;
    checkHealth?: boolean;
    trackDemand?: boolean;
  };
}

/**
 * Intelligence Suite 出力
 */
export interface IntelligenceSuiteOutput {
  status: 'success' | 'partial' | 'failed';
  results: {
    demandAnalysis?: DemandTrackerOutput;
    healthReport?: HealthMonitorOutput;
    competitiveAnalysis?: CompetitiveAnalyzerOutput;
    comboRecommendations?: ComboOptimizerOutput;
    roiPredictions?: ROIPredictorOutput[];
    generatedStories?: StoryGeneratorOutput[];
  };
  dashboard: DashboardView;
  insights: string[];
  errors?: string[];
  executionTime: number;
}

// ========================================
// エージェント設定型
// ========================================

/**
 * Intelligence Agent 設定
 */
export interface IntelligenceAgentConfig {
  demandTracker?: {
    lookbackDays: number;
    minTrendThreshold: number;
  };
  healthMonitor?: {
    checkInterval: number;
    alertThresholds: Record<string, number>;
  };
  comboOptimizer?: {
    maxComboSize: number;
    minSynergyScore: number;
  };
  roiPredictor?: {
    confidenceThreshold: number;
    industryBenchmarks: Record<string, number>;
  };
  storyGenerator?: {
    defaultFormat: 'markdown' | 'html' | 'plainText';
    includeTestimonials: boolean;
  };
  competitiveAnalyzer?: {
    competitorSources: string[];
    updateFrequency: number;
  };
}

// ========================================
// イベント型
// ========================================

/**
 * Intelligence イベント
 */
export type IntelligenceEventType =
  | 'demand:trend_detected'
  | 'health:alert_triggered'
  | 'health:skill_retired'
  | 'combo:new_discovered'
  | 'roi:prediction_complete'
  | 'story:generated'
  | 'competitive:position_changed'
  | 'dashboard:refresh';

export interface IntelligenceEvent {
  type: IntelligenceEventType;
  payload: any;
  timestamp: Date;
  source: string;
}
