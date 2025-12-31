/**
 * Skill Evolution Judge Agent - 型定義
 */

/**
 * スキル（Skill Recommenderとの共通型）
 */
export { Skill } from '../../skill-recommender/models/types';

/**
 * 進化レベル
 */
export interface EvolutionLevel {
  level: 1 | 2 | 3 | 4;
  name: string;
  description: string;
}

/**
 * 進化レベル定義
 */
export const EVOLUTION_LEVELS: Record<number, EvolutionLevel> = {
  1: {
    level: 1,
    name: '個別最適（個人特化）',
    description: '1人の現場で「助かった」が発生'
  },
  2: {
    level: 2,
    name: '再現性確認（業種特化）',
    description: '同業種で再現し「業界あるある」へ'
  },
  3: {
    level: 3,
    name: '構造抽出（職種共通）',
    description: '異業種でも同職種で成立'
  },
  4: {
    level: 4,
    name: '汎用スキル（OS級）',
    description: '文脈フリーで使える"道具"へ'
  }
};

/**
 * 進化条件
 */
export interface EvolutionCriteria {
  level: number;
  name: string;
  requirements: string[];
  metrics: {
    minImplementations: number;
    minIndustries: number;
    minRoles: number;
    minSuccessRate: number;
  };
}

/**
 * 進化履歴
 */
export interface EvolutionHistory {
  skillId: string;
  timestamp: Date;
  previousLevel: number;
  newLevel: number;
  evidence: EvolutionEvidence;
  trigger?: string;
}

/**
 * 進化の証拠
 */
export interface EvolutionEvidence {
  implementations: number;
  industries: string[];
  roles: string[];
  successRate?: number;
  feedbacks?: string[];
  crossIndustrySuccess?: boolean;
}

/**
 * 進化評価結果
 */
export interface EvolutionAssessment {
  readyForNextLevel: boolean;
  readinessScore: number;
  strengths: string[];
  gaps: string[];
  progressMetrics: {
    implementationCount: number;
    industryDiversity: number;
    roleDiversity: number;
    successRate: number;
  };
}

/**
 * 進化トラッキング
 */
export interface EvolutionTracking {
  skillId: string;
  currentLevel: number;
  history: EvolutionHistory[];
  nextLevelProgress: {
    requirements: string[];
    completed: string[];
    percentage: number;
  };
}

/**
 * 進化評価器インターフェース
 */
export interface EvolutionEvaluatorInterface {
  evaluate(skill: any, evidence: EvolutionEvidence): Promise<EvolutionLevel>;
  calculateReadiness(evidence: EvolutionEvidence, currentLevel: EvolutionLevel): number;
  identifyGaps(evidence: EvolutionEvidence, targetLevel: number): string[];
}

/**
 * 進化トラッカーインターフェース
 */
export interface EvolutionTrackerInterface {
  record(history: Omit<EvolutionHistory, 'previousLevel' | 'newLevel'>): Promise<void>;
  getHistory(skillId: string): Promise<EvolutionHistory[]>;
  getCurrentLevel(skillId: string): Promise<number>;
}

// Config型のエクスポート
export interface SkillEvolutionJudgeConfig {
  strictMode?: boolean;
  trackHistory?: boolean;
  debug?: boolean;
}

// Input/Output型のエクスポート
export interface SkillEvolutionJudgeInput {
  skill: any; // Skillインポートで循環参照を避けるためany
  evidence: {
    implementations: number;
    industries: string[];
    roles: string[];
    successRate?: number;
    feedbacks?: string[];
  };
}

export interface SkillEvolutionJudgeOutput {
  currentLevel: EvolutionLevel;
  levelDetails: {
    level: number;
    name: string;
    description: string;
    progressBar: string;
  };
  assessment: EvolutionAssessment;
  nextLevelCriteria: EvolutionCriteria;
  evolutionPath: string[];
  recommendations: string[];
}