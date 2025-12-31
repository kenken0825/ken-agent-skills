/**
 * Skill Recommender Agent
 * 既存スキルプールから候補を抽出し、スコアリングによるランキングを行う
 */

import { 
  Skill, 
  SkillRecommendation, 
  ScoringMetrics, 
  PainPattern,
  RecommendationContext 
} from './models/types';
import { SkillMatcher } from './matchers/skill-matcher';
import { SkillScorer } from './scorers/skill-scorer';
import { SkillRepository } from './repository/skill-repository';

export interface SkillRecommenderConfig {
  maxRecommendations?: number;
  minScore?: number;
  includeReasons?: boolean;
  debug?: boolean;
}

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

export class SkillRecommenderAgent {
  private skillMatcher: SkillMatcher;
  private skillScorer: SkillScorer;
  private skillRepository: SkillRepository;

  constructor(private config: SkillRecommenderConfig = {}) {
    this.skillMatcher = new SkillMatcher();
    this.skillScorer = new SkillScorer();
    this.skillRepository = new SkillRepository();
    
    // デフォルト設定
    this.config.maxRecommendations = config.maxRecommendations || 10;
    this.config.minScore = config.minScore || 0.3;
    this.config.includeReasons = config.includeReasons !== false;
  }

  /**
   * スキル推薦の実行
   */
  async execute(input: SkillRecommenderInput): Promise<SkillRecommenderOutput> {
    const startTime = Date.now();
    
    // スキルプールから候補を取得
    const candidateSkills = await this.skillRepository.findCandidates(
      input.painPatterns,
      input.filters
    );
    
    // ペインパターンとのマッチング
    const matchedSkills = await this.matchSkillsToPains(
      candidateSkills,
      input.painPatterns,
      input.context
    );
    
    // スコアリング
    const scoredSkills = this.scoreSkills(matchedSkills, input.context);
    
    // ランキング生成
    const recommendations = this.generateRanking(scoredSkills);
    
    // カバレッジ分析
    const coverageAnalysis = this.analyzeCoverage(
      input.painPatterns,
      recommendations
    );
    
    return {
      recommendations: recommendations.slice(0, this.config.maxRecommendations),
      coverageAnalysis,
      metrics: {
        totalSkillsAnalyzed: candidateSkills.length,
        processingTime: Date.now() - startTime
      }
    };
  }

  /**
   * スキルとペインパターンのマッチング
   */
  private async matchSkillsToPains(
    skills: Skill[],
    painPatterns: PainPattern[],
    context: RecommendationContext
  ): Promise<Map<Skill, PainPattern[]>> {
    const matchResults = new Map<Skill, PainPattern[]>();
    
    for (const skill of skills) {
      const matchedPains = await this.skillMatcher.match(skill, painPatterns, context);
      if (matchedPains.length > 0) {
        matchResults.set(skill, matchedPains);
      }
    }
    
    return matchResults;
  }

  /**
   * スキルのスコアリング
   */
  private scoreSkills(
    matchedSkills: Map<Skill, PainPattern[]>,
    context: RecommendationContext
  ): SkillRecommendation[] {
    const recommendations: SkillRecommendation[] = [];
    
    for (const [skill, matchedPains] of matchedSkills.entries()) {
      const metrics = this.skillScorer.calculateMetrics(
        skill,
        matchedPains,
        context
      );
      
      const totalScore = this.calculateTotalScore(metrics);
      
      if (totalScore >= this.config.minScore!) {
        recommendations.push({
          skill,
          score: totalScore,
          metrics,
          matchedPains: matchedPains.map(p => p.name),
          reasons: this.config.includeReasons ? 
            this.generateReasons(skill, metrics, matchedPains) : undefined
        });
      }
    }
    
    return recommendations;
  }

  /**
   * 総合スコアの計算
   */
  private calculateTotalScore(metrics: ScoringMetrics): number {
    const weights = {
      fitIndustryRole: 0.25,
      painImpact: 0.35,
      adoptionCost: 0.20,
      reproducibility: 0.20
    };
    
    return (
      metrics.fitIndustryRole * weights.fitIndustryRole +
      metrics.painImpact * weights.painImpact +
      (1 - metrics.adoptionCost) * weights.adoptionCost + // コストは逆転
      metrics.reproducibility * weights.reproducibility
    );
  }

  /**
   * ランキングの生成
   */
  private generateRanking(recommendations: SkillRecommendation[]): SkillRecommendation[] {
    return recommendations
      .sort((a, b) => b.score - a.score)
      .map((rec, index) => ({
        ...rec,
        rank: index + 1
      }));
  }

  /**
   * カバレッジ分析
   */
  private analyzeCoverage(
    painPatterns: PainPattern[],
    recommendations: SkillRecommendation[]
  ): any {
    const allPainNames = painPatterns.map(p => p.name);
    const coveredPains = new Set<string>();
    
    recommendations.forEach(rec => {
      rec.matchedPains.forEach(pain => coveredPains.add(pain));
    });
    
    const coveredPainsArray = Array.from(coveredPains);
    const uncoveredPains = allPainNames.filter(p => !coveredPains.has(p));
    
    return {
      coveredPains: coveredPainsArray,
      uncoveredPains,
      coverageRate: coveredPainsArray.length / allPainNames.length
    };
  }

  /**
   * 推薦理由の生成
   */
  private generateReasons(
    skill: Skill,
    metrics: ScoringMetrics,
    matchedPains: PainPattern[]
  ): string[] {
    const reasons: string[] = [];
    
    // 業界適合度が高い場合
    if (metrics.fitIndustryRole > 0.8) {
      reasons.push(`${skill.targetIndustry}業界での実績多数`);
    }
    
    // ペイン解決インパクトが高い場合
    if (metrics.painImpact > 0.8) {
      const highImpactPains = matchedPains
        .filter(p => (p.impact || 0) > 80)
        .map(p => p.name);
      if (highImpactPains.length > 0) {
        reasons.push(`特に「${highImpactPains[0]}」の解決に効果的`);
      }
    }
    
    // 導入コストが低い場合
    if (metrics.adoptionCost < 0.3) {
      reasons.push('導入が容易で即効性あり');
    }
    
    // 再現性が高い場合
    if (metrics.reproducibility > 0.8) {
      reasons.push(`${skill.evolutionLevel}件以上の導入実績`);
    }
    
    return reasons;
  }
}