/**
 * Combo Optimizer Agent
 *
 * スキルの最適な組み合わせ（コンボ）を発見・推薦するエージェント
 * 相乗効果を最大化するスキルセットを提案
 */

import { EventEmitter } from 'events';
import {
  SkillCombo,
  ComboOptimizerOutput,
  ComboSuccessCase,
  IntelligenceAgentConfig
} from '../../types';
import { Skill, PainPattern } from '../../../shared/types';
import { UnifiedDataStore } from '../../store/unified-data-store';

/**
 * Combo Optimizer 入力
 */
export interface ComboOptimizerInput {
  availableSkills: Skill[];
  painPatterns: PainPattern[];
  context: {
    industry: string;
    role?: string;
    budget?: 'low' | 'medium' | 'high';
    timeframe?: number; // months
  };
  maxComboSize?: number;
}

/**
 * Combo Optimizer Agent クラス
 */
export class ComboOptimizerAgent extends EventEmitter {
  private config: IntelligenceAgentConfig['comboOptimizer'];
  private dataStore: UnifiedDataStore;

  constructor(config?: IntelligenceAgentConfig['comboOptimizer'], dataStore?: UnifiedDataStore) {
    super();
    this.config = {
      maxComboSize: config?.maxComboSize ?? 4,
      minSynergyScore: config?.minSynergyScore ?? 60
    };
    this.dataStore = dataStore || new UnifiedDataStore();
  }

  /**
   * コンボ最適化を実行
   */
  async execute(input: ComboOptimizerInput): Promise<ComboOptimizerOutput> {
    this.emit('optimization:start', { skillCount: input.availableSkills.length });

    const maxSize = input.maxComboSize || this.config!.maxComboSize!;

    // スキルをペインパターンにマッチング
    const matchedSkills = this.matchSkillsToPains(input.availableSkills, input.painPatterns);

    // コンボ候補を生成
    const comboCandidates = this.generateComboCandidates(matchedSkills, maxSize);

    // 各コンボのシナジースコアを計算
    const scoredCombos = comboCandidates.map(skills =>
      this.createCombo(skills, input.context, input.painPatterns)
    );

    // シナジースコアでフィルタリング・ソート
    const validCombos = scoredCombos
      .filter(combo => combo.synergyScore >= this.config!.minSynergyScore!)
      .sort((a, b) => b.synergyScore - a.synergyScore);

    // トップコンボ
    const topCombo = validCombos[0];
    const recommendedCombos = validCombos.slice(0, 5);
    const alternativeCombos = validCombos.slice(5, 10);

    // カスタムコンボ提案
    const customComboSuggestions = this.generateCustomSuggestions(
      input.availableSkills,
      input.painPatterns,
      topCombo
    );

    // データストアに保存
    for (const combo of recommendedCombos) {
      await this.dataStore.addCombo(combo);
    }

    const output: ComboOptimizerOutput = {
      recommendedCombos,
      topCombo,
      alternativeCombos,
      customComboSuggestions,
      timestamp: new Date()
    };

    this.emit('optimization:complete', output);
    return output;
  }

  /**
   * スキルをペインパターンにマッチング
   */
  private matchSkillsToPains(skills: Skill[], pains: PainPattern[]): Skill[] {
    const painKeywords = pains.flatMap(p => [
      ...p.symptoms,
      p.name.toLowerCase(),
      p.category
    ]);

    return skills.filter(skill => {
      const skillKeywords = [
        ...skill.triggers,
        skill.name.toLowerCase(),
        skill.category,
        ...(skill.painPatterns || [])
      ];

      // キーワードマッチング
      const matchCount = skillKeywords.filter(kw =>
        painKeywords.some(pk => pk.toLowerCase().includes(kw.toLowerCase()) ||
                               kw.toLowerCase().includes(pk.toLowerCase()))
      ).length;

      return matchCount > 0;
    });
  }

  /**
   * コンボ候補を生成
   */
  private generateComboCandidates(skills: Skill[], maxSize: number): Skill[][] {
    const candidates: Skill[][] = [];

    // 2〜maxSize のサイズでコンボを生成
    for (let size = 2; size <= Math.min(maxSize, skills.length); size++) {
      const combos = this.getCombinations(skills, size);
      candidates.push(...combos);
    }

    return candidates;
  }

  /**
   * 組み合わせを生成（nCr）
   */
  private getCombinations<T>(arr: T[], size: number): T[][] {
    if (size === 1) return arr.map(item => [item]);
    if (size === arr.length) return [arr];

    const results: T[][] = [];

    for (let i = 0; i <= arr.length - size; i++) {
      const head = arr[i];
      const tailCombinations = this.getCombinations(arr.slice(i + 1), size - 1);

      for (const tail of tailCombinations) {
        results.push([head, ...tail]);
      }
    }

    return results;
  }

  /**
   * コンボを作成
   */
  private createCombo(
    skills: Skill[],
    context: ComboOptimizerInput['context'],
    pains: PainPattern[]
  ): SkillCombo {
    const id = `combo_${skills.map(s => s.id || s.name).join('_').substring(0, 50)}`;
    const name = this.generateComboName(skills);

    // シナジー要素を計算
    const synergyFactors = this.calculateSynergyFactors(skills);

    // 総合シナジースコア
    const synergyScore = Math.round(
      synergyFactors.workflowIntegration * 0.3 +
      synergyFactors.dataSharing * 0.25 +
      synergyFactors.skillComplement * 0.25 +
      synergyFactors.learningCurve * 0.2
    );

    // 適用可能な業界・役職
    const applicableIndustries = this.extractApplicableIndustries(skills, context.industry);
    const applicableRoles = this.extractApplicableRoles(skills, context.role);

    // 推定ROI
    const estimatedROI = this.estimateComboROI(skills, pains);

    // 実装順序
    const implementationOrder = this.determineImplementationOrder(skills);

    // 前提条件
    const prerequisites = this.extractPrerequisites(skills);

    // ベネフィット
    const benefits = this.generateBenefits(skills, pains);

    return {
      id,
      name,
      skills,
      synergyScore,
      synergyFactors,
      applicableIndustries,
      applicableRoles,
      estimatedROI,
      implementationOrder,
      prerequisites,
      benefits
    };
  }

  /**
   * コンボ名を生成
   */
  private generateComboName(skills: Skill[]): string {
    if (skills.length === 2) {
      return `${skills[0].name} + ${skills[1].name}`;
    }

    // 共通カテゴリを探す
    const categories = skills.map(s => s.category);
    const commonCategory = categories.find((c, i) =>
      categories.slice(i + 1).some(other => other === c)
    );

    if (commonCategory) {
      return `${commonCategory} 統合パック（${skills.length}スキル）`;
    }

    return `マルチスキルコンボ（${skills.length}スキル）`;
  }

  /**
   * シナジー要素を計算
   */
  private calculateSynergyFactors(skills: Skill[]): SkillCombo['synergyFactors'] {
    // ワークフロー統合度: カテゴリの関連性
    const workflowIntegration = this.calculateWorkflowIntegration(skills);

    // データ共有効率: 業界・トリガーの重複
    const dataSharing = this.calculateDataSharing(skills);

    // スキル補完性: カバーするペイン領域の広さ
    const skillComplement = this.calculateSkillComplement(skills);

    // 習得曲線: 複雑さの平均
    const learningCurve = this.calculateLearningCurve(skills);

    return {
      workflowIntegration,
      dataSharing,
      skillComplement,
      learningCurve
    };
  }

  /**
   * ワークフロー統合度を計算
   */
  private calculateWorkflowIntegration(skills: Skill[]): number {
    // カテゴリの関連マッピング
    const relatedCategories: Record<string, string[]> = {
      'automation': ['monitoring', 'processing', 'analytics'],
      'monitoring': ['automation', 'analytics', 'compliance'],
      'processing': ['automation', 'analytics'],
      'analytics': ['monitoring', 'processing', 'optimization'],
      'optimization': ['analytics', 'automation'],
      'compliance': ['monitoring', 'processing']
    };

    let score = 60; // ベーススコア
    const categories = skills.map(s => s.category.toLowerCase());

    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const related = relatedCategories[categories[i]] || [];
        if (related.includes(categories[j])) {
          score += 10;
        }
        if (categories[i] === categories[j]) {
          score += 5; // 同じカテゴリ
        }
      }
    }

    return Math.min(100, score);
  }

  /**
   * データ共有効率を計算
   */
  private calculateDataSharing(skills: Skill[]): number {
    let score = 50;

    // 業界の一致
    const industries = skills.map(s => s.targetIndustry).filter(Boolean);
    const uniqueIndustries = new Set(industries);
    if (uniqueIndustries.size === 1 && industries.length > 1) {
      score += 20; // 同じ業界
    }

    // トリガーの重複
    const allTriggers = skills.flatMap(s => s.triggers.map(t => t.toLowerCase()));
    const uniqueTriggers = new Set(allTriggers);
    const overlapRatio = 1 - (uniqueTriggers.size / allTriggers.length);
    score += Math.round(overlapRatio * 30);

    return Math.min(100, score);
  }

  /**
   * スキル補完性を計算
   */
  private calculateSkillComplement(skills: Skill[]): number {
    // カテゴリの多様性
    const categories = new Set(skills.map(s => s.category));
    const diversityScore = Math.min(categories.size * 20, 60);

    // ペインカバレッジ
    const painPatterns = skills.flatMap(s => s.painPatterns || []);
    const uniquePains = new Set(painPatterns);
    const painScore = Math.min(uniquePains.size * 10, 40);

    return diversityScore + painScore;
  }

  /**
   * 習得曲線を計算（高いほど習得しやすい）
   */
  private calculateLearningCurve(skills: Skill[]): number {
    const complexityScores: Record<string, number> = {
      low: 90,
      medium: 70,
      high: 50
    };

    const scores = skills.map(s => {
      const complexity = (s.metadata as any)?.complexity || 'medium';
      return complexityScores[complexity] || 70;
    });

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  /**
   * 適用可能な業界を抽出
   */
  private extractApplicableIndustries(skills: Skill[], contextIndustry: string): string[] {
    const industries = new Set<string>();
    industries.add(contextIndustry);

    for (const skill of skills) {
      if (skill.targetIndustry) {
        industries.add(skill.targetIndustry);
      }
    }

    return Array.from(industries);
  }

  /**
   * 適用可能な役職を抽出
   */
  private extractApplicableRoles(skills: Skill[], contextRole?: string): string[] {
    const roles = new Set<string>();
    if (contextRole) roles.add(contextRole);

    for (const skill of skills) {
      if (skill.targetRole) {
        roles.add(skill.targetRole);
      }
    }

    return Array.from(roles);
  }

  /**
   * コンボのROIを推定
   */
  private estimateComboROI(skills: Skill[], pains: PainPattern[]): number {
    // 基本ROI
    let baseROI = 100;

    // スキル数に応じたボーナス
    baseROI += skills.length * 30;

    // ペインの深刻度
    const avgImpact = pains.reduce((sum, p) => sum + (p.impact || 50), 0) / (pains.length || 1);
    baseROI += avgImpact * 1.5;

    // 進化レベルボーナス
    const avgLevel = skills.reduce((sum, s) => sum + (s.evolutionLevel || 1), 0) / skills.length;
    baseROI += avgLevel * 20;

    return Math.round(baseROI);
  }

  /**
   * 実装順序を決定
   */
  private determineImplementationOrder(skills: Skill[]): string[] {
    // 複雑さと依存関係でソート
    const sorted = [...skills].sort((a, b) => {
      const aComplexity = (a.metadata as any)?.complexity || 'medium';
      const bComplexity = (b.metadata as any)?.complexity || 'medium';

      const complexityOrder: Record<string, number> = { low: 0, medium: 1, high: 2 };
      return complexityOrder[aComplexity] - complexityOrder[bComplexity];
    });

    return sorted.map(s => s.id || s.name);
  }

  /**
   * 前提条件を抽出
   */
  private extractPrerequisites(skills: Skill[]): string[] {
    const prerequisites = new Set<string>();

    for (const skill of skills) {
      const prereqs = (skill.metadata as any)?.prerequisites;
      if (Array.isArray(prereqs)) {
        prereqs.forEach(p => prerequisites.add(p));
      }
    }

    return Array.from(prerequisites);
  }

  /**
   * ベネフィットを生成
   */
  private generateBenefits(skills: Skill[], pains: PainPattern[]): string[] {
    const benefits: string[] = [];

    // スキルからベネフィットを抽出
    for (const skill of skills) {
      const skillBenefits = (skill.metadata as any)?.benefits;
      if (Array.isArray(skillBenefits)) {
        benefits.push(...skillBenefits.slice(0, 2));
      }
    }

    // ペイン解消ベネフィット
    for (const pain of pains.slice(0, 3)) {
      benefits.push(`${pain.name}の解消`);
    }

    // コンボ固有ベネフィット
    if (skills.length >= 3) {
      benefits.push('複数プロセスの一括自動化');
      benefits.push('データ連携による効率化');
    }

    return [...new Set(benefits)].slice(0, 6);
  }

  /**
   * カスタムコンボ提案を生成
   */
  private generateCustomSuggestions(
    allSkills: Skill[],
    pains: PainPattern[],
    topCombo?: SkillCombo
  ): string[] {
    const suggestions: string[] = [];

    if (!topCombo) {
      suggestions.push('より多くのスキルを追加して最適なコンボを発見しましょう');
      return suggestions;
    }

    // トップコンボに含まれないスキルを提案
    const topSkillIds = new Set(topCombo.skills.map(s => s.id || s.name));
    const additionalSkills = allSkills.filter(s => !topSkillIds.has(s.id || s.name));

    if (additionalSkills.length > 0) {
      const skill = additionalSkills[0];
      suggestions.push(`「${skill.name}」を追加してコンボを強化`);
    }

    // ペインカバレッジの提案
    const uncoveredPains = pains.filter(pain => {
      const painKeywords = [...pain.symptoms, pain.name.toLowerCase()];
      return !topCombo.skills.some(skill =>
        skill.triggers.some(t => painKeywords.some(k => k.includes(t.toLowerCase())))
      );
    });

    if (uncoveredPains.length > 0) {
      suggestions.push(`「${uncoveredPains[0].name}」に対応するスキルの追加を検討`);
    }

    return suggestions;
  }

  /**
   * コンボ比較レポートを生成
   */
  generateComparisonReport(combos: SkillCombo[]): string {
    let report = '📊 スキルコンボ比較レポート\n';
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    for (let i = 0; i < Math.min(combos.length, 3); i++) {
      const combo = combos[i];
      report += `${i + 1}. ${combo.name}\n`;
      report += `   シナジースコア: ${combo.synergyScore}/100\n`;
      report += `   推定ROI: ${combo.estimatedROI}%\n`;
      report += `   スキル: ${combo.skills.map(s => s.name).join(' + ')}\n`;
      report += `   主なベネフィット:\n`;
      combo.benefits.slice(0, 3).forEach(b => {
        report += `     • ${b}\n`;
      });
      report += '\n';
    }

    return report;
  }
}

export default ComboOptimizerAgent;
