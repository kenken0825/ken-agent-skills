/**
 * Skill Evolution Judge Agent
 * スキルの進化段階（Lv1-4）を判定し、次の進化条件を明文化する
 */

import { 
  Skill, 
  EvolutionLevel, 
  EvolutionCriteria,
  EvolutionHistory,
  EvolutionAssessment 
} from './models/types';
import { EvolutionEvaluator } from './evaluators/evolution-evaluator';
import { EvolutionTracker } from './trackers/evolution-tracker';

export interface SkillEvolutionJudgeConfig {
  strictMode?: boolean;
  trackHistory?: boolean;
  debug?: boolean;
}

export interface SkillEvolutionJudgeInput {
  skill: Skill;
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

export class SkillEvolutionJudgeAgent {
  private evaluator: EvolutionEvaluator;
  private tracker: EvolutionTracker;

  constructor(private config: SkillEvolutionJudgeConfig = {}) {
    this.evaluator = new EvolutionEvaluator(config);
    this.tracker = new EvolutionTracker();
  }

  /**
   * スキル進化レベルの判定
   */
  async execute(input: SkillEvolutionJudgeInput): Promise<SkillEvolutionJudgeOutput> {
    // 現在のレベルを評価
    const currentLevel = await this.evaluator.evaluate(input.skill, input.evidence);
    
    // レベルの詳細情報を取得
    const levelDetails = this.getLevelDetails(currentLevel);
    
    // 進化の評価
    const assessment = this.assessEvolution(input.skill, input.evidence, currentLevel);
    
    // 次レベルの進化条件を取得
    const nextLevelCriteria = this.getNextLevelCriteria(currentLevel);
    
    // 進化パスの生成
    const evolutionPath = this.generateEvolutionPath(input.skill, currentLevel);
    
    // 推奨事項の生成
    const recommendations = this.generateRecommendations(
      input.skill,
      currentLevel,
      assessment
    );
    
    // 履歴の記録
    if (this.config.trackHistory) {
      await this.tracker.record({
        skillId: input.skill.id!,
        timestamp: new Date(),
        level: currentLevel.level,
        evidence: input.evidence
      });
    }
    
    return {
      currentLevel,
      levelDetails,
      assessment,
      nextLevelCriteria,
      evolutionPath,
      recommendations
    };
  }

  /**
   * レベルの詳細情報を取得
   */
  private getLevelDetails(level: EvolutionLevel): any {
    const progressBar = this.generateProgressBar(level.level);
    
    return {
      level: level.level,
      name: level.name,
      description: level.description,
      progressBar
    };
  }

  /**
   * 進化の評価
   */
  private assessEvolution(
    skill: Skill,
    evidence: any,
    currentLevel: EvolutionLevel
  ): EvolutionAssessment {
    const readinessScore = this.calculateReadinessScore(evidence, currentLevel);
    
    return {
      readyForNextLevel: readinessScore >= 0.8,
      readinessScore,
      strengths: this.identifyStrengths(evidence),
      gaps: this.identifyGaps(evidence, currentLevel),
      progressMetrics: {
        implementationCount: evidence.implementations,
        industryDiversity: evidence.industries.length,
        roleDiversity: evidence.roles.length,
        successRate: evidence.successRate || 0
      }
    };
  }

  /**
   * 進化準備度スコアの計算
   */
  private calculateReadinessScore(evidence: any, currentLevel: EvolutionLevel): number {
    let score = 0;
    
    // レベル別の基準に基づいてスコア計算
    switch (currentLevel.level) {
      case 1: // 個別最適
        if (evidence.implementations >= 2) score += 0.3;
        if (evidence.successRate >= 0.8) score += 0.3;
        if (evidence.industries.length >= 1) score += 0.4;
        break;
      case 2: // 再現性確認
        if (evidence.implementations >= 5) score += 0.25;
        if (evidence.industries.length >= 2) score += 0.25;
        if (evidence.successRate >= 0.85) score += 0.25;
        if (evidence.roles.length >= 2) score += 0.25;
        break;
      case 3: // 構造抽出
        if (evidence.implementations >= 10) score += 0.2;
        if (evidence.industries.length >= 3) score += 0.2;
        if (evidence.roles.length >= 3) score += 0.2;
        if (evidence.successRate >= 0.9) score += 0.2;
        // 異業種での成功が必要
        if (this.hasCreossIndustrySuccess(evidence)) score += 0.2;
        break;
      case 4: // 汎用スキル
        // レベル4は最高レベルなので、準備度は常に0
        score = 0;
        break;
    }
    
    return Math.min(1.0, score);
  }

  /**
   * 次レベルの進化条件を取得
   */
  private getNextLevelCriteria(currentLevel: EvolutionLevel): EvolutionCriteria {
    const criteriaMap: Record<number, EvolutionCriteria> = {
      1: {
        level: 2,
        name: '再現性確認（業種特化）',
        requirements: [
          '同業種で2〜3回以上の再現',
          'トリガーワードの明確化',
          '成功率80%以上の維持'
        ],
        metrics: {
          minImplementations: 3,
          minIndustries: 1,
          minRoles: 2,
          minSuccessRate: 0.8
        }
      },
      2: {
        level: 3,
        name: '構造抽出（職種共通）',
        requirements: [
          '異なる業種×同職種での成立',
          'ワークフローの汎用化',
          '5件以上の導入実績'
        ],
        metrics: {
          minImplementations: 5,
          minIndustries: 3,
          minRoles: 3,
          minSuccessRate: 0.85
        }
      },
      3: {
        level: 4,
        name: '汎用スキル（OS級）',
        requirements: [
          '5業種×5職種以上での成立',
          '抽象化されたペインパターン化',
          '文脈フリーでの使用可能性'
        ],
        metrics: {
          minImplementations: 25,
          minIndustries: 5,
          minRoles: 5,
          minSuccessRate: 0.9
        }
      },
      4: {
        level: 4,
        name: '最高レベル達成',
        requirements: ['既に最高レベルに到達'],
        metrics: {
          minImplementations: 999,
          minIndustries: 999,
          minRoles: 999,
          minSuccessRate: 1.0
        }
      }
    };
    
    return criteriaMap[currentLevel.level];
  }

  /**
   * 進化パスの生成
   */
  private generateEvolutionPath(skill: Skill, currentLevel: EvolutionLevel): string[] {
    const path: string[] = [];
    
    path.push(`現在: ${currentLevel.name} (Level ${currentLevel.level})`);
    
    if (currentLevel.level < 4) {
      const nextCriteria = this.getNextLevelCriteria(currentLevel);
      path.push(`次: ${nextCriteria.name}`);
      
      // 具体的なステップを追加
      nextCriteria.requirements.forEach((req, index) => {
        path.push(`  ${index + 1}. ${req}`);
      });
    }
    
    return path;
  }

  /**
   * 進化バーの生成
   */
  private generateProgressBar(level: number): string {
    const filled = '■';
    const empty = '□';
    const bars = 4;
    
    return filled.repeat(level) + empty.repeat(bars - level);
  }

  /**
   * 強みの特定
   */
  private identifyStrengths(evidence: any): string[] {
    const strengths: string[] = [];
    
    if (evidence.successRate >= 0.9) {
      strengths.push('高い成功率（90%以上）');
    }
    if (evidence.implementations >= 5) {
      strengths.push('豊富な実装実績');
    }
    if (evidence.industries.length >= 3) {
      strengths.push('複数業界での実績');
    }
    
    return strengths;
  }

  /**
   * ギャップの特定
   */
  private identifyGaps(evidence: any, currentLevel: EvolutionLevel): string[] {
    const nextCriteria = this.getNextLevelCriteria(currentLevel);
    const gaps: string[] = [];
    
    if (evidence.implementations < nextCriteria.metrics.minImplementations) {
      gaps.push(`実装数が不足（現在: ${evidence.implementations}、必要: ${nextCriteria.metrics.minImplementations}）`);
    }
    if (evidence.industries.length < nextCriteria.metrics.minIndustries) {
      gaps.push(`業界展開が不足（現在: ${evidence.industries.length}、必要: ${nextCriteria.metrics.minIndustries}）`);
    }
    
    return gaps;
  }

  /**
   * 異業種での成功判定
   */
  private hasCreossIndustrySuccess(evidence: any): boolean {
    // 簡易的な判定（実際はより詳細な分析が必要）
    return evidence.industries.length >= 3 && evidence.successRate >= 0.8;
  }

  /**
   * 推奨事項の生成
   */
  private generateRecommendations(
    skill: Skill,
    currentLevel: EvolutionLevel,
    assessment: EvolutionAssessment
  ): string[] {
    const recommendations: string[] = [];
    
    if (assessment.readyForNextLevel) {
      recommendations.push('次のレベルへの進化準備が整っています');
      recommendations.push('新しい業界・職種での展開を検討してください');
    } else {
      assessment.gaps.forEach(gap => {
        recommendations.push(`改善推奨: ${gap}`);
      });
    }
    
    // レベル別の具体的な推奨
    if (currentLevel.level === 1) {
      recommendations.push('同業種での追加実装を推奨');
    } else if (currentLevel.level === 2) {
      recommendations.push('異業種への展開を検討');
    }
    
    return recommendations;
  }
}