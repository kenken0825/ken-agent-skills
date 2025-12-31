/**
 * Evolution Evaluator
 * 
 * スキルの進化レベルを評価するコンポーネント
 * 実装数、業種多様性、職種カバレッジ、成功率から進化レベル（1-4）を判定
 */

import {
  EvolutionLevel,
  EvolutionEvidence,
  EvolutionAssessment,
  EvolutionCriteria,
  EVOLUTION_LEVELS,
  EvolutionEvaluatorInterface,
  Skill
} from '../models/types';

/**
 * 進化条件定義
 */
const EVOLUTION_CRITERIA: EvolutionCriteria[] = [
  {
    level: 1,
    name: '個別最適（個人特化）',
    requirements: [
      '最低1件の実装実績',
      '特定の現場での成功事例',
      '具体的な成果の記録'
    ],
    metrics: {
      minImplementations: 1,
      minIndustries: 1,
      minRoles: 1,
      minSuccessRate: 0.6
    }
  },
  {
    level: 2,
    name: '再現性確認（業種特化）',
    requirements: [
      '同業種での複数実装',
      '業界特有のパターン化',
      '再現性のある成功事例'
    ],
    metrics: {
      minImplementations: 3,
      minIndustries: 1,
      minRoles: 2,
      minSuccessRate: 0.7
    }
  },
  {
    level: 3,
    name: '構造抽出（職種共通）',
    requirements: [
      '異業種での実装実績',
      '職種共通の構造抽出',
      '横展開の成功事例'
    ],
    metrics: {
      minImplementations: 5,
      minIndustries: 2,
      minRoles: 3,
      minSuccessRate: 0.75
    }
  },
  {
    level: 4,
    name: '汎用スキル（OS級）',
    requirements: [
      '業種・職種を問わない実装',
      '文脈フリーでの活用',
      '標準化されたメソッド'
    ],
    metrics: {
      minImplementations: 10,
      minIndustries: 4,
      minRoles: 5,
      minSuccessRate: 0.8
    }
  }
];

export class EvolutionEvaluator implements EvolutionEvaluatorInterface {
  /**
   * スキルの進化レベルを評価
   */
  async evaluate(skill: Skill, evidence: EvolutionEvidence): Promise<EvolutionLevel> {
    // 現在のレベルを判定
    let currentLevel = 1;
    
    for (const criteria of EVOLUTION_CRITERIA.slice().reverse()) {
      if (this.meetsCriteria(evidence, criteria)) {
        currentLevel = criteria.level;
        break;
      }
    }

    return EVOLUTION_LEVELS[currentLevel];
  }

  /**
   * 次のレベルへの準備度を計算（0-1）
   */
  calculateReadiness(evidence: EvolutionEvidence, currentLevel: EvolutionLevel): number {
    const nextLevel = currentLevel.level + 1;
    if (nextLevel > 4) return 1.0; // 最高レベルに到達

    const nextCriteria = EVOLUTION_CRITERIA.find(c => c.level === nextLevel);
    if (!nextCriteria) return 0;

    const metrics = this.calculateProgressMetrics(evidence, nextCriteria);
    
    // 各指標の進捗を重み付けして総合評価
    const weights = {
      implementations: 0.3,
      industries: 0.25,
      roles: 0.25,
      successRate: 0.2
    };

    const readiness = 
      metrics.implementationProgress * weights.implementations +
      metrics.industryProgress * weights.industries +
      metrics.roleProgress * weights.roles +
      metrics.successRateProgress * weights.successRate;

    return Math.min(readiness, 1.0);
  }

  /**
   * 目標レベルとのギャップを特定
   */
  identifyGaps(evidence: EvolutionEvidence, targetLevel: number): string[] {
    const gaps: string[] = [];
    const targetCriteria = EVOLUTION_CRITERIA.find(c => c.level === targetLevel);
    
    if (!targetCriteria) return gaps;

    const metrics = targetCriteria.metrics;

    // 実装数のギャップ
    if (evidence.implementations < metrics.minImplementations) {
      gaps.push(
        `実装数が不足しています（現在: ${evidence.implementations}件、必要: ${metrics.minImplementations}件）`
      );
    }

    // 業種多様性のギャップ
    const uniqueIndustries = new Set(evidence.industries).size;
    if (uniqueIndustries < metrics.minIndustries) {
      gaps.push(
        `業種の多様性が不足しています（現在: ${uniqueIndustries}業種、必要: ${metrics.minIndustries}業種）`
      );
    }

    // 職種カバレッジのギャップ
    const uniqueRoles = new Set(evidence.roles).size;
    if (uniqueRoles < metrics.minRoles) {
      gaps.push(
        `職種のカバレッジが不足しています（現在: ${uniqueRoles}職種、必要: ${metrics.minRoles}職種）`
      );
    }

    // 成功率のギャップ
    const successRate = evidence.successRate || 0;
    if (successRate < metrics.minSuccessRate) {
      gaps.push(
        `成功率が基準に達していません（現在: ${(successRate * 100).toFixed(0)}%、必要: ${(metrics.minSuccessRate * 100).toFixed(0)}%）`
      );
    }

    return gaps;
  }

  /**
   * 包括的な進化評価を実行
   */
  async assessEvolution(skill: Skill, evidence: EvolutionEvidence): Promise<EvolutionAssessment> {
    const currentLevel = await this.evaluate(skill, evidence);
    const nextLevel = Math.min(currentLevel.level + 1, 4);
    const nextCriteria = EVOLUTION_CRITERIA.find(c => c.level === nextLevel);

    const progressMetrics = {
      implementationCount: evidence.implementations,
      industryDiversity: new Set(evidence.industries).size,
      roleDiversity: new Set(evidence.roles).size,
      successRate: evidence.successRate || 0
    };

    const readinessScore = this.calculateReadiness(evidence, currentLevel);
    const gaps = this.identifyGaps(evidence, nextLevel);
    const strengths = this.identifyStrengths(evidence, currentLevel);

    return {
      readyForNextLevel: readinessScore >= 0.8,
      readinessScore,
      strengths,
      gaps,
      progressMetrics
    };
  }

  /**
   * 現在の強みを特定
   */
  private identifyStrengths(evidence: EvolutionEvidence, currentLevel: EvolutionLevel): string[] {
    const strengths: string[] = [];
    const criteria = EVOLUTION_CRITERIA.find(c => c.level === currentLevel.level);

    if (!criteria) return strengths;

    // 実装数の強み
    if (evidence.implementations >= criteria.metrics.minImplementations * 1.5) {
      strengths.push(`豊富な実装実績（${evidence.implementations}件）`);
    }

    // 業種多様性の強み
    const uniqueIndustries = new Set(evidence.industries).size;
    if (uniqueIndustries >= criteria.metrics.minIndustries * 1.5) {
      strengths.push(`高い業種多様性（${uniqueIndustries}業種）`);
    }

    // 成功率の強み
    const successRate = evidence.successRate || 0;
    if (successRate >= 0.9) {
      strengths.push(`非常に高い成功率（${(successRate * 100).toFixed(0)}%）`);
    }

    // クロスインダストリーの強み
    if (evidence.crossIndustrySuccess) {
      strengths.push('業種を超えた成功実績');
    }

    return strengths;
  }

  /**
   * 進化条件を満たしているかチェック
   */
  private meetsCriteria(evidence: EvolutionEvidence, criteria: EvolutionCriteria): boolean {
    const metrics = criteria.metrics;
    const uniqueIndustries = new Set(evidence.industries).size;
    const uniqueRoles = new Set(evidence.roles).size;
    const successRate = evidence.successRate || 0;

    return (
      evidence.implementations >= metrics.minImplementations &&
      uniqueIndustries >= metrics.minIndustries &&
      uniqueRoles >= metrics.minRoles &&
      successRate >= metrics.minSuccessRate
    );
  }

  /**
   * 各指標の進捗を計算
   */
  private calculateProgressMetrics(evidence: EvolutionEvidence, criteria: EvolutionCriteria) {
    const metrics = criteria.metrics;
    const uniqueIndustries = new Set(evidence.industries).size;
    const uniqueRoles = new Set(evidence.roles).size;
    const successRate = evidence.successRate || 0;

    return {
      implementationProgress: Math.min(evidence.implementations / metrics.minImplementations, 1.0),
      industryProgress: Math.min(uniqueIndustries / metrics.minIndustries, 1.0),
      roleProgress: Math.min(uniqueRoles / metrics.minRoles, 1.0),
      successRateProgress: Math.min(successRate / metrics.minSuccessRate, 1.0)
    };
  }

  /**
   * 進化レベルの詳細な説明を生成
   */
  generateLevelDescription(level: EvolutionLevel, evidence: EvolutionEvidence): string {
    const descriptions: Record<number, (evidence: EvolutionEvidence) => string> = {
      1: (e) => `このスキルは${e.implementations}件の実装で個人レベルの価値を証明しました。特定の現場で「助かった」という成果を生み出しています。`,
      2: (e) => `${new Set(e.industries).size}つの同業種で再現性が確認されました。業界特有の課題に対する有効なソリューションとして認識されています。`,
      3: (e) => `${new Set(e.industries).size}業種、${new Set(e.roles).size}職種で活用され、職種共通の構造として抽出されました。異なる業界でも同じ職種で有効性が実証されています。`,
      4: (e) => `${e.implementations}件以上の実装を通じて、業種・職種を問わない汎用的なスキルとして確立されました。文脈に依存しない"道具"として活用可能です。`
    };

    return descriptions[level.level]?.(evidence) || level.description;
  }
}

// シングルトンインスタンスをエクスポート
export const evolutionEvaluator = new EvolutionEvaluator();