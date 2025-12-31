/**
 * Skill Scorer
 * スキル推薦のスコアリング指標を計算する
 */

import {
  Skill,
  PainPattern,
  RecommendationContext,
  ScorerInterface,
  ScoringMetrics
} from '../models/types';

export class SkillScorer implements ScorerInterface {
  /**
   * 全てのスコアリング指標を計算
   */
  calculateMetrics(
    skill: Skill,
    matchedPains: PainPattern[],
    context: RecommendationContext
  ): ScoringMetrics {
    return {
      fitIndustryRole: this.calculateFitScore(skill, context),
      painImpact: this.calculateImpactScore(matchedPains),
      adoptionCost: this.calculateCostScore(skill),
      reproducibility: this.calculateReproducibilityScore(skill)
    };
  }

  /**
   * 業種職種適合度の計算 (0-1)
   */
  calculateFitScore(skill: Skill, context: RecommendationContext): number {
    let fitScore = 0.5; // ベースライン

    // 1. 業界適合度 (weight: 0.5)
    const industryFit = this.calculateIndustryFit(skill, context);
    fitScore = fitScore * 0.5 + industryFit * 0.5;

    // 2. 職種適合度 (weight: 0.3)
    const roleFit = this.calculateRoleFit(skill, context);
    fitScore = fitScore * 0.7 + roleFit * 0.3;

    // 3. 会社規模適合度 (weight: 0.2)
    const sizeFit = this.calculateCompanySizeFit(skill, context);
    fitScore = fitScore * 0.8 + sizeFit * 0.2;

    return Math.min(Math.max(fitScore, 0), 1);
  }

  /**
   * ペイン解消インパクトの計算 (0-1)
   */
  calculateImpactScore(matchedPains: PainPattern[]): number {
    if (matchedPains.length === 0) {
      return 0;
    }

    let totalImpact = 0;
    let weightSum = 0;

    for (const pain of matchedPains) {
      // ペインのインパクト度（設定されていない場合は0.5）
      const painImpact = pain.impact || 0.5;
      
      // 発生頻度による重み（頻度が高いほど重要）
      const occurrenceWeight = this.calculateOccurrenceWeight(pain.occurrenceCount || 1);
      
      totalImpact += painImpact * occurrenceWeight;
      weightSum += occurrenceWeight;
    }

    // 複数のペインを解決できる場合はボーナス
    const coverageBonus = Math.min(matchedPains.length / 5, 1) * 0.2;
    
    const baseScore = weightSum > 0 ? totalImpact / weightSum : 0;
    return Math.min(baseScore + coverageBonus, 1);
  }

  /**
   * 導入コストの計算 (0-1, 低いほど良い)
   */
  calculateCostScore(skill: Skill): number {
    let costScore = 0.5; // ベースライン

    // 1. アセットの有無によるコスト評価
    if (skill.assets) {
      const assetCount = 
        (skill.assets.scripts?.length || 0) +
        (skill.assets.templates?.length || 0) +
        (skill.assets.documents?.length || 0);
      
      // アセットが多いほど導入が容易（コストが低い）
      if (assetCount > 10) costScore = 0.2;
      else if (assetCount > 5) costScore = 0.3;
      else if (assetCount > 0) costScore = 0.4;
    }

    // 2. スキルの複雑さによる調整
    const complexity = this.estimateComplexity(skill);
    costScore = costScore * 0.6 + complexity * 0.4;

    // 3. 実装実績による調整
    if (skill.implementations && skill.implementations > 0) {
      const implementationFactor = Math.min(skill.implementations / 10, 1);
      costScore = costScore * (1 - implementationFactor * 0.3); // 実績が多いほどコスト減
    }

    // 4. 成功率による調整
    if (skill.successRate && skill.successRate > 0) {
      const successFactor = skill.successRate / 100;
      costScore = costScore * (1 - successFactor * 0.2); // 成功率が高いほどリスクが低い
    }

    return Math.min(Math.max(costScore, 0), 1);
  }

  /**
   * 再現性・横展開性の計算 (0-1)
   */
  calculateReproducibilityScore(skill: Skill): number {
    let reproducibilityScore = 0.5; // ベースライン

    // 1. テンプレートやスクリプトの存在
    if (skill.assets) {
      const hasTemplates = (skill.assets.templates?.length || 0) > 0;
      const hasScripts = (skill.assets.scripts?.length || 0) > 0;
      const hasDocuments = (skill.assets.documents?.length || 0) > 0;

      if (hasTemplates) reproducibilityScore += 0.2;
      if (hasScripts) reproducibilityScore += 0.15;
      if (hasDocuments) reproducibilityScore += 0.1;
    }

    // 2. 実装実績による評価
    if (skill.implementations && skill.implementations > 0) {
      const implementationScore = Math.min(skill.implementations / 20, 1) * 0.2;
      reproducibilityScore += implementationScore;
    }

    // 3. 成功率による評価
    if (skill.successRate && skill.successRate > 70) {
      reproducibilityScore += 0.15;
    }

    // 4. 汎用性の評価（業界・職種特化でない方が横展開しやすい）
    const genericityScore = this.calculateGenericity(skill);
    reproducibilityScore = reproducibilityScore * 0.7 + genericityScore * 0.3;

    // 5. 進化レベルによる評価
    if (skill.evolutionLevel) {
      const evolutionBonus = Math.min(skill.evolutionLevel / 5, 1) * 0.1;
      reproducibilityScore += evolutionBonus;
    }

    return Math.min(Math.max(reproducibilityScore, 0), 1);
  }

  /**
   * 業界適合度の計算
   */
  private calculateIndustryFit(skill: Skill, context: RecommendationContext): number {
    if (!context.industry) {
      return 0.7; // 業界指定なしの場合は中程度のスコア
    }

    if (!skill.targetIndustry) {
      return 0.6; // スキルに業界指定がない場合は汎用的と判断
    }

    const skillIndustry = skill.targetIndustry.toLowerCase();
    const contextIndustry = context.industry.toLowerCase();

    // 完全一致
    if (skillIndustry === contextIndustry) {
      return 1.0;
    }

    // 部分一致または関連業界
    if (this.areIndustriesRelated(skillIndustry, contextIndustry)) {
      return 0.8;
    }

    // キーワードマッチ
    if (
      skillIndustry.includes(contextIndustry) ||
      contextIndustry.includes(skillIndustry)
    ) {
      return 0.6;
    }

    return 0.3; // 不一致
  }

  /**
   * 職種適合度の計算
   */
  private calculateRoleFit(skill: Skill, context: RecommendationContext): number {
    if (!context.roles || context.roles.length === 0) {
      return 0.7; // 職種指定なしの場合
    }

    if (!skill.targetRole) {
      return 0.6; // スキルに職種指定がない場合は汎用的と判断
    }

    const skillRole = skill.targetRole.toLowerCase();
    let maxFit = 0;

    for (const contextRole of context.roles) {
      const contextRoleLower = contextRole.toLowerCase();
      
      // 完全一致
      if (skillRole === contextRoleLower) {
        maxFit = Math.max(maxFit, 1.0);
      }
      // 部分一致
      else if (
        skillRole.includes(contextRoleLower) ||
        contextRoleLower.includes(skillRole)
      ) {
        maxFit = Math.max(maxFit, 0.7);
      }
      // 関連職種
      else if (this.areRolesRelated(skillRole, contextRoleLower)) {
        maxFit = Math.max(maxFit, 0.5);
      }
    }

    return maxFit || 0.3; // 一致なし
  }

  /**
   * 会社規模適合度の計算
   */
  private calculateCompanySizeFit(skill: Skill, context: RecommendationContext): number {
    if (!context.companySize) {
      return 0.8; // 規模指定なしの場合は高めのスコア
    }

    const description = skill.description.toLowerCase();
    
    // キーワードに基づく規模の推定
    const isEnterpriseOriented = /enterprise|large scale|corporate|global/.test(description);
    const isSmallBusinessOriented = /small business|startup|simple|lightweight/.test(description);
    const isMediumOriented = /medium|scalable|growing/.test(description);

    switch (context.companySize) {
      case 'small':
        if (isSmallBusinessOriented) return 1.0;
        if (isMediumOriented) return 0.7;
        if (isEnterpriseOriented) return 0.3;
        return 0.6;
        
      case 'medium':
        if (isMediumOriented) return 1.0;
        if (isSmallBusinessOriented) return 0.7;
        if (isEnterpriseOriented) return 0.7;
        return 0.8;
        
      case 'large':
        if (isEnterpriseOriented) return 1.0;
        if (isMediumOriented) return 0.7;
        if (isSmallBusinessOriented) return 0.4;
        return 0.6;
        
      default:
        return 0.7;
    }
  }

  /**
   * 発生頻度による重み計算
   */
  private calculateOccurrenceWeight(occurrenceCount: number): number {
    // 対数スケールで重みを計算（頻度が高いほど重要度が上がるが、上限あり）
    return Math.min(1 + Math.log10(occurrenceCount) * 0.3, 2);
  }

  /**
   * スキルの複雑さを推定
   */
  private estimateComplexity(skill: Skill): number {
    let complexity = 0.5;

    const description = skill.description.toLowerCase();
    
    // 複雑さを示すキーワード
    const complexKeywords = [
      'complex', 'advanced', 'enterprise', 'integration', 'multi-',
      'distributed', 'scalable', 'comprehensive', 'sophisticated'
    ];
    
    // シンプルさを示すキーワード
    const simpleKeywords = [
      'simple', 'basic', 'easy', 'quick', 'starter', 'lightweight',
      'straightforward', 'minimal', 'single'
    ];

    // キーワードマッチング
    const complexMatches = complexKeywords.filter(kw => description.includes(kw)).length;
    const simpleMatches = simpleKeywords.filter(kw => description.includes(kw)).length;

    complexity += complexMatches * 0.1;
    complexity -= simpleMatches * 0.1;

    // トリガーの数による調整（多いほど複雑）
    if (skill.triggers && skill.triggers.length > 10) {
      complexity += 0.1;
    }

    return Math.min(Math.max(complexity, 0), 1);
  }

  /**
   * スキルの汎用性を計算
   */
  private calculateGenericity(skill: Skill): number {
    let genericity = 0.5;

    // 特定の業界や職種に限定されていない場合は汎用性が高い
    if (!skill.targetIndustry) genericity += 0.25;
    if (!skill.targetRole) genericity += 0.25;

    // カテゴリーによる調整
    const genericCategories = ['automation', 'productivity', 'communication', 'workflow'];
    const specificCategories = ['compliance', 'industry-specific', 'specialized'];

    if (genericCategories.some(cat => skill.category.toLowerCase().includes(cat))) {
      genericity += 0.2;
    }
    if (specificCategories.some(cat => skill.category.toLowerCase().includes(cat))) {
      genericity -= 0.2;
    }

    return Math.min(Math.max(genericity, 0), 1);
  }

  /**
   * 業界の関連性をチェック
   */
  private areIndustriesRelated(industry1: string, industry2: string): boolean {
    const industryGroups = [
      ['tech', 'it', 'software', 'saas', 'technology', 'digital'],
      ['finance', 'banking', 'insurance', 'fintech', 'financial'],
      ['retail', 'ecommerce', 'commerce', 'shopping', 'consumer'],
      ['healthcare', 'medical', 'pharma', 'health', 'biotech'],
      ['manufacturing', 'production', 'factory', 'industrial', 'automotive'],
      ['education', 'academic', 'training', 'edtech', 'learning'],
      ['logistics', 'shipping', 'supply chain', 'transportation', 'delivery']
    ];

    for (const group of industryGroups) {
      if (
        group.some(term => industry1.includes(term)) &&
        group.some(term => industry2.includes(term))
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * 職種の関連性をチェック
   */
  private areRolesRelated(role1: string, role2: string): boolean {
    const roleGroups = [
      ['engineer', 'developer', 'programmer', 'coding', 'tech'],
      ['manager', 'lead', 'director', 'executive', 'chief'],
      ['analyst', 'data', 'research', 'intelligence', 'insights'],
      ['sales', 'marketing', 'business development', 'account', 'customer success'],
      ['hr', 'human resources', 'people', 'talent', 'recruiting'],
      ['finance', 'accounting', 'controller', 'treasurer', 'cfo'],
      ['operations', 'ops', 'process', 'efficiency', 'optimization']
    ];

    for (const group of roleGroups) {
      if (
        group.some(term => role1.includes(term)) &&
        group.some(term => role2.includes(term))
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * スコアリング詳細を生成（デバッグ用）
   */
  getDetailedScoringBreakdown(
    skill: Skill,
    matchedPains: PainPattern[],
    context: RecommendationContext
  ): {
    metrics: ScoringMetrics;
    details: {
      fitIndustryRole: {
        industryFit: number;
        roleFit: number;
        sizeFit: number;
      };
      painImpact: {
        averageImpact: number;
        coverageBonus: number;
        painCount: number;
      };
      adoptionCost: {
        assetScore: number;
        complexityScore: number;
        implementationScore: number;
      };
      reproducibility: {
        assetScore: number;
        genericityScore: number;
        successScore: number;
      };
    };
  } {
    const metrics = this.calculateMetrics(skill, matchedPains, context);
    
    return {
      metrics,
      details: {
        fitIndustryRole: {
          industryFit: this.calculateIndustryFit(skill, context),
          roleFit: this.calculateRoleFit(skill, context),
          sizeFit: this.calculateCompanySizeFit(skill, context)
        },
        painImpact: {
          averageImpact: matchedPains.reduce((sum, p) => sum + (p.impact || 0.5), 0) / Math.max(matchedPains.length, 1),
          coverageBonus: Math.min(matchedPains.length / 5, 1) * 0.2,
          painCount: matchedPains.length
        },
        adoptionCost: {
          assetScore: skill.assets ? 0.4 : 0.5,
          complexityScore: this.estimateComplexity(skill),
          implementationScore: skill.implementations ? Math.min(skill.implementations / 10, 1) : 0
        },
        reproducibility: {
          assetScore: skill.assets ? 0.7 : 0.5,
          genericityScore: this.calculateGenericity(skill),
          successScore: skill.successRate ? skill.successRate / 100 : 0.5
        }
      }
    };
  }
}