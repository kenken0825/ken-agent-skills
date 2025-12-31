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
import { evolutionEvaluator } from './evaluators/evolution-evaluator';
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
  private tracker: EvolutionTracker;

  constructor(private config: SkillEvolutionJudgeConfig = {}) {
    this.tracker = new EvolutionTracker();
  }

  /**
   * スキル進化レベルの判定
   */
  async execute(input: SkillEvolutionJudgeInput): Promise<SkillEvolutionJudgeOutput> {
    // 現在のレベルを評価
    const currentLevel = await evolutionEvaluator.evaluate(input.skill, input.evidence);
    
    // レベルの詳細情報を取得
    const levelDetails = this.getLevelDetails(currentLevel);
    
    // 進化の評価
    const assessment = await evolutionEvaluator.assessEvolution(input.skill, input.evidence);
    
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
        evidence: input.evidence,
        trigger: 'Manual evaluation'
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