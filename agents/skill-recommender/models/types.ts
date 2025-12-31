/**
 * Skill Recommender Agent - 型定義
 */

/**
 * スキル
 */
export interface Skill {
  id?: string;
  name: string;
  description: string;
  category: string;
  targetIndustry?: string;
  targetRole?: string;
  triggers: string[];
  painPatterns?: string[];
  implementations?: number;
  successRate?: number;
  evolutionLevel?: number;
  assets?: {
    scripts?: string[];
    templates?: string[];
    documents?: string[];
  };
  metadata?: Record<string, any>;
}

/**
 * スキル推薦
 */
export interface SkillRecommendation {
  skill: Skill;
  score: number;
  rank?: number;
  metrics: ScoringMetrics;
  matchedPains: string[];
  reasons?: string[];
}

/**
 * スコアリング指標
 */
export interface ScoringMetrics {
  fitIndustryRole: number;     // 業種職種適合度 (0-1)
  painImpact: number;           // ペイン解消インパクト (0-1)
  adoptionCost: number;         // 導入コスト (0-1, 低いほど良い)
  reproducibility: number;      // 再現性・横展開性 (0-1)
}

/**
 * ペインパターン（他エージェントとの連携用）
 */
export interface PainPattern {
  id?: string;
  name: string;
  category: string;
  description: string;
  impact?: number;
  occurrenceCount?: number;
}

/**
 * 推薦コンテキスト
 */
export interface RecommendationContext {
  industry: string;
  roles: string[];
  companySize?: string;
  currentTools?: string[];
  budget?: 'low' | 'medium' | 'high';
  urgency?: 'low' | 'medium' | 'high';
}

/**
 * スキルフィルター
 */
export interface SkillFilter {
  categories?: string[];
  industries?: string[];
  roles?: string[];
  minEvolutionLevel?: number;
  maxEvolutionLevel?: number;
  hasAssets?: boolean;
}

/**
 * マッチング結果
 */
export interface MatchingResult {
  skill: Skill;
  painPattern: PainPattern;
  matchScore: number;
  matchType: 'exact' | 'partial' | 'related';
  evidence: string[];
}

/**
 * カバレッジ分析結果
 */
export interface CoverageAnalysis {
  coveredPains: string[];
  uncoveredPains: string[];
  coverageRate: number;
  recommendations?: string[];
}

/**
 * スキルリポジトリインターフェース
 */
export interface SkillRepositoryInterface {
  findAll(): Promise<Skill[]>;
  findById(id: string): Promise<Skill | null>;
  findByFilter(filter: SkillFilter): Promise<Skill[]>;
  search(query: string): Promise<Skill[]>;
  save(skill: Skill): Promise<Skill>;
}

/**
 * マッチャーインターフェース
 */
export interface MatcherInterface {
  match(skill: Skill, painPatterns: PainPattern[], context: RecommendationContext): Promise<PainPattern[]>;
  calculateMatchScore(skill: Skill, painPattern: PainPattern): number;
}

/**
 * スコアラーインターフェース
 */
export interface ScorerInterface {
  calculateMetrics(skill: Skill, matchedPains: PainPattern[], context: RecommendationContext): ScoringMetrics;
  calculateFitScore(skill: Skill, context: RecommendationContext): number;
  calculateImpactScore(matchedPains: PainPattern[]): number;
  calculateCostScore(skill: Skill): number;
  calculateReproducibilityScore(skill: Skill): number;
}

// Config型のエクスポート
export interface SkillRecommenderConfig {
  maxRecommendations?: number;
  minScore?: number;
  includeReasons?: boolean;
  debug?: boolean;
}

// Input/Output型のエクスポート
export interface SkillRecommenderInput {
  painPatterns: PainPattern[];
  context: RecommendationContext;
  filters?: {
    categories?: string[];
    levels?: number[];
    industries?: string[];
  };
}

export interface SkillRecommenderOutput {
  recommendations: SkillRecommendation[];
  coverageAnalysis: {
    coveredPains: string[];
    uncoveredPains: string[];
    coverageRate: number;
  };
  metrics: {
    totalSkillsAnalyzed: number;
    processingTime: number;
  };
}