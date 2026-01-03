/**
 * Competitive Analyzer Agent
 *
 * 類似スキル間の比較分析を行い、差別化ポイントを明確化するエージェント
 * 市場ポジショニングと競争優位性を評価
 */

import { EventEmitter } from 'events';
import {
  SkillComparison,
  CompetitiveAnalyzerOutput,
  IntelligenceAgentConfig
} from '../../types';
import { Skill } from '../../../shared/types';
import { UnifiedDataStore } from '../../store/unified-data-store';

/**
 * Competitive Analyzer 入力
 */
export interface CompetitiveAnalyzerInput {
  targetSkill: Skill;
  competitorSkills?: Skill[];
  marketContext?: {
    industry: string;
    targetRole?: string;
    priceRange?: 'low' | 'medium' | 'high';
  };
}

/**
 * Competitive Analyzer Agent クラス
 */
export class CompetitiveAnalyzerAgent extends EventEmitter {
  private config: IntelligenceAgentConfig['competitiveAnalyzer'];
  private dataStore: UnifiedDataStore;

  constructor(config?: IntelligenceAgentConfig['competitiveAnalyzer'], dataStore?: UnifiedDataStore) {
    super();
    this.config = {
      competitorSources: config?.competitorSources ?? [],
      updateFrequency: config?.updateFrequency ?? 604800000 // 7 days
    };
    this.dataStore = dataStore || new UnifiedDataStore();
  }

  /**
   * 競合分析を実行
   */
  async execute(input: CompetitiveAnalyzerInput): Promise<CompetitiveAnalyzerOutput> {
    this.emit('analysis:start', { targetSkill: input.targetSkill.name });

    // 競合スキルを取得（提供されていなければ、データストアから類似スキルを検索）
    const competitors = input.competitorSkills || await this.findCompetitors(input.targetSkill);

    // 各競合との比較を実行
    const comparisons: SkillComparison[] = [];
    for (const competitor of competitors) {
      const comparison = this.compareSkills(input.targetSkill, competitor);
      comparisons.push(comparison);
    }

    // 市場ポジションを判定
    const marketPosition = this.evaluateMarketPosition(comparisons);

    // 競争優位性を抽出
    const competitiveAdvantages = this.extractAdvantages(comparisons);

    // 改善領域を特定
    const areasForImprovement = this.identifyImprovements(comparisons);

    const output: CompetitiveAnalyzerOutput = {
      comparisons,
      marketPosition,
      competitiveAdvantages,
      areasForImprovement,
      timestamp: new Date()
    };

    this.emit('analysis:complete', output);
    return output;
  }

  /**
   * 類似する競合スキルを検索
   */
  private async findCompetitors(targetSkill: Skill): Promise<Skill[]> {
    const allSkills = this.dataStore.getSkills();

    // カテゴリと業界が一致するスキルを検索
    const candidates = allSkills.filter(skill => {
      if (skill.id === targetSkill.id) return false;
      if (skill.name === targetSkill.name) return false;

      // カテゴリ一致
      const categoryMatch = skill.category === targetSkill.category;

      // 業界一致または汎用
      const industryMatch =
        skill.targetIndustry === targetSkill.targetIndustry ||
        !skill.targetIndustry ||
        !targetSkill.targetIndustry;

      // トリガーの重複
      const triggerOverlap = this.calculateTriggerOverlap(skill.triggers, targetSkill.triggers);

      return categoryMatch || (industryMatch && triggerOverlap > 0.3);
    });

    // 類似度でソートして上位5件を返す
    return candidates
      .map(skill => ({
        skill,
        similarity: this.calculateSimilarity(targetSkill, skill)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(item => item.skill);
  }

  /**
   * 2つのスキルを比較
   */
  private compareSkills(ours: Skill, theirs: Skill): SkillComparison {
    // 適合度スコア
    const fitScore = this.compareFitScore(ours, theirs);

    // コストスコア
    const costScore = this.compareCostScore(ours, theirs);

    // 使いやすさスコア
    const easeOfUse = this.compareEaseOfUse(ours, theirs);

    // サポートスコア
    const support = this.compareSupportScore(ours, theirs);

    // 強みと弱みを抽出
    const { strengths, weaknesses } = this.analyzeStrengthsWeaknesses(ours, theirs);

    // 差別化ポイント
    const differentiators = this.identifyDifferentiators(ours, theirs);

    // 総合判定
    const overallVerdict = this.determineVerdict(fitScore, costScore, easeOfUse, support);

    return {
      skillId: ours.id || ours.name,
      skillName: ours.name,
      competitorId: theirs.id || theirs.name,
      competitorName: theirs.name,
      comparison: {
        fitScore,
        costScore,
        easeOfUse,
        support
      },
      ourStrengths: strengths,
      ourWeaknesses: weaknesses,
      differentiators,
      overallVerdict
    };
  }

  /**
   * 適合度スコアを比較
   */
  private compareFitScore(ours: Skill, theirs: Skill): {
    ours: number;
    theirs: number;
    winner: 'ours' | 'theirs' | 'tie';
  } {
    // 進化レベル、トリガー数、業界カバレッジで評価
    const oursScore = this.calculateFitScoreForSkill(ours);
    const theirsScore = this.calculateFitScoreForSkill(theirs);

    return {
      ours: oursScore,
      theirs: theirsScore,
      winner: this.determineWinner(oursScore, theirsScore)
    };
  }

  /**
   * スキルの適合度スコアを計算
   */
  private calculateFitScoreForSkill(skill: Skill): number {
    let score = 60;

    // 進化レベル
    if (skill.evolutionLevel) {
      score += skill.evolutionLevel * 8;
    }

    // トリガー数
    score += Math.min(skill.triggers.length * 3, 15);

    // 説明の充実度
    if (skill.description && skill.description.length > 100) {
      score += 5;
    }

    return Math.min(100, score);
  }

  /**
   * コストスコアを比較
   */
  private compareCostScore(ours: Skill, theirs: Skill): {
    ours: number;
    theirs: number;
    winner: 'ours' | 'theirs' | 'tie';
  } {
    // メタデータから複雑さを取得（低いほうがコスト低＝スコア高）
    const oursComplexity = (ours.metadata as any)?.complexity || 'medium';
    const theirsComplexity = (theirs.metadata as any)?.complexity || 'medium';

    const complexityScore: Record<string, number> = {
      low: 90,
      medium: 70,
      high: 50
    };

    const oursScore = complexityScore[oursComplexity] || 70;
    const theirsScore = complexityScore[theirsComplexity] || 70;

    return {
      ours: oursScore,
      theirs: theirsScore,
      winner: this.determineWinner(oursScore, theirsScore)
    };
  }

  /**
   * 使いやすさスコアを比較
   */
  private compareEaseOfUse(ours: Skill, theirs: Skill): {
    ours: number;
    theirs: number;
    winner: 'ours' | 'theirs' | 'tie';
  } {
    const oursScore = this.calculateEaseOfUseScore(ours);
    const theirsScore = this.calculateEaseOfUseScore(theirs);

    return {
      ours: oursScore,
      theirs: theirsScore,
      winner: this.determineWinner(oursScore, theirsScore)
    };
  }

  /**
   * 使いやすさスコアを計算
   */
  private calculateEaseOfUseScore(skill: Skill): number {
    let score = 70;

    // ドキュメントの充実度
    if (skill.description && skill.description.length > 200) {
      score += 10;
    }

    // アセットの有無
    if (skill.assets) {
      if (skill.assets.templates?.length) score += 5;
      if (skill.assets.scripts?.length) score += 5;
      if (skill.assets.documents?.length) score += 5;
    }

    return Math.min(100, score);
  }

  /**
   * サポートスコアを比較
   */
  private compareSupportScore(ours: Skill, theirs: Skill): {
    ours: number;
    theirs: number;
    winner: 'ours' | 'theirs' | 'tie';
  } {
    // 実装数と成功率でサポート体制を推測
    const oursScore = this.calculateSupportScore(ours);
    const theirsScore = this.calculateSupportScore(theirs);

    return {
      ours: oursScore,
      theirs: theirsScore,
      winner: this.determineWinner(oursScore, theirsScore)
    };
  }

  /**
   * サポートスコアを計算
   */
  private calculateSupportScore(skill: Skill): number {
    let score = 65;

    // 実装数
    if (skill.implementations) {
      score += Math.min(skill.implementations * 2, 20);
    }

    // 成功率
    if (skill.successRate) {
      score += Math.round(skill.successRate * 10);
    }

    return Math.min(100, score);
  }

  /**
   * 強みと弱みを分析
   */
  private analyzeStrengthsWeaknesses(ours: Skill, theirs: Skill): {
    strengths: string[];
    weaknesses: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // 進化レベル比較
    const ourLevel = ours.evolutionLevel || 1;
    const theirLevel = theirs.evolutionLevel || 1;
    if (ourLevel > theirLevel) {
      strengths.push(`より高い進化レベル（Lv${ourLevel} vs Lv${theirLevel}）`);
    } else if (ourLevel < theirLevel) {
      weaknesses.push(`進化レベルが低い（Lv${ourLevel} vs Lv${theirLevel}）`);
    }

    // トリガー数比較
    if (ours.triggers.length > theirs.triggers.length) {
      strengths.push(`より多くのトリガー対応（${ours.triggers.length}個）`);
    } else if (ours.triggers.length < theirs.triggers.length) {
      weaknesses.push(`トリガー対応が少ない`);
    }

    // 実装実績
    const ourImpl = ours.implementations || 0;
    const theirImpl = theirs.implementations || 0;
    if (ourImpl > theirImpl) {
      strengths.push(`より多くの実装実績（${ourImpl}件）`);
    } else if (ourImpl < theirImpl) {
      weaknesses.push(`実装実績が少ない`);
    }

    // 成功率
    const ourSuccess = ours.successRate || 0;
    const theirSuccess = theirs.successRate || 0;
    if (ourSuccess > theirSuccess) {
      strengths.push(`高い成功率（${Math.round(ourSuccess * 100)}%）`);
    } else if (ourSuccess < theirSuccess) {
      weaknesses.push(`成功率の改善余地あり`);
    }

    return { strengths, weaknesses };
  }

  /**
   * 差別化ポイントを特定
   */
  private identifyDifferentiators(ours: Skill, theirs: Skill): string[] {
    const differentiators: string[] = [];

    // ユニークなトリガー
    const uniqueTriggers = ours.triggers.filter(t => !theirs.triggers.includes(t));
    if (uniqueTriggers.length > 0) {
      differentiators.push(`独自のトリガー対応: ${uniqueTriggers.slice(0, 3).join(', ')}`);
    }

    // 業界特化
    if (ours.targetIndustry && ours.targetIndustry !== theirs.targetIndustry) {
      differentiators.push(`${ours.targetIndustry}業界に特化`);
    }

    // カテゴリ差異
    if (ours.category !== theirs.category) {
      differentiators.push(`異なるアプローチ（${ours.category}カテゴリ）`);
    }

    return differentiators;
  }

  /**
   * 勝者を判定
   */
  private determineWinner(ours: number, theirs: number): 'ours' | 'theirs' | 'tie' {
    const diff = ours - theirs;
    if (diff > 5) return 'ours';
    if (diff < -5) return 'theirs';
    return 'tie';
  }

  /**
   * 総合判定
   */
  private determineVerdict(
    fitScore: { winner: string },
    costScore: { winner: string },
    easeOfUse: { winner: string },
    support: { winner: string }
  ): 'win' | 'lose' | 'competitive' {
    const scores = [fitScore.winner, costScore.winner, easeOfUse.winner, support.winner];
    const wins = scores.filter(s => s === 'ours').length;
    const losses = scores.filter(s => s === 'theirs').length;

    if (wins > losses + 1) return 'win';
    if (losses > wins + 1) return 'lose';
    return 'competitive';
  }

  /**
   * 市場ポジションを評価
   */
  private evaluateMarketPosition(comparisons: SkillComparison[]): 'leader' | 'challenger' | 'follower' | 'niche' {
    if (comparisons.length === 0) return 'niche';

    const winCount = comparisons.filter(c => c.overallVerdict === 'win').length;
    const loseCount = comparisons.filter(c => c.overallVerdict === 'lose').length;
    const winRate = winCount / comparisons.length;

    if (winRate >= 0.7) return 'leader';
    if (winRate >= 0.5) return 'challenger';
    if (winRate >= 0.3) return 'follower';
    return 'niche';
  }

  /**
   * 競争優位性を抽出
   */
  private extractAdvantages(comparisons: SkillComparison[]): string[] {
    const advantages = new Set<string>();

    for (const comparison of comparisons) {
      comparison.ourStrengths.forEach(s => advantages.add(s));
      comparison.differentiators.forEach(d => advantages.add(d));
    }

    return Array.from(advantages);
  }

  /**
   * 改善領域を特定
   */
  private identifyImprovements(comparisons: SkillComparison[]): string[] {
    const improvements = new Set<string>();

    for (const comparison of comparisons) {
      comparison.ourWeaknesses.forEach(w => improvements.add(w));
    }

    return Array.from(improvements);
  }

  /**
   * トリガーの重複率を計算
   */
  private calculateTriggerOverlap(triggers1: string[], triggers2: string[]): number {
    if (triggers1.length === 0 || triggers2.length === 0) return 0;

    const set1 = new Set(triggers1.map(t => t.toLowerCase()));
    const set2 = new Set(triggers2.map(t => t.toLowerCase()));

    let overlap = 0;
    for (const t of set1) {
      if (set2.has(t)) overlap++;
    }

    return overlap / Math.max(set1.size, set2.size);
  }

  /**
   * 類似度を計算
   */
  private calculateSimilarity(skill1: Skill, skill2: Skill): number {
    let score = 0;

    // カテゴリ一致
    if (skill1.category === skill2.category) score += 40;

    // 業界一致
    if (skill1.targetIndustry === skill2.targetIndustry) score += 20;

    // トリガー重複
    score += this.calculateTriggerOverlap(skill1.triggers, skill2.triggers) * 40;

    return score;
  }
}

export default CompetitiveAnalyzerAgent;
