/**
 * Skill Matcher
 * スキルとペインパターンのマッチングを行う
 */

import {
  Skill,
  PainPattern,
  RecommendationContext,
  MatcherInterface,
  MatchingResult
} from '../models/types';

export class SkillMatcher implements MatcherInterface {
  /**
   * スキルと複数のペインパターンのマッチング
   */
  async match(
    skill: Skill,
    painPatterns: PainPattern[],
    context: RecommendationContext
  ): Promise<PainPattern[]> {
    const matchedPains: PainPattern[] = [];
    
    for (const painPattern of painPatterns) {
      const matchScore = this.calculateMatchScore(skill, painPattern);
      
      // コンテキストに基づく調整
      const contextScore = this.calculateContextRelevance(skill, painPattern, context);
      const adjustedScore = matchScore * contextScore;
      
      // 閾値以上の場合はマッチングと判定
      if (adjustedScore >= 0.5) {
        matchedPains.push(painPattern);
      }
    }
    
    return matchedPains;
  }

  /**
   * スキルとペインパターンのマッチスコア計算
   */
  calculateMatchScore(skill: Skill, painPattern: PainPattern): number {
    let score = 0;
    let weightSum = 0;
    
    // 1. トリガーワードマッチング (weight: 0.4)
    const triggerScore = this.calculateTriggerMatch(skill, painPattern);
    score += triggerScore * 0.4;
    weightSum += 0.4;
    
    // 2. カテゴリーマッチング (weight: 0.2)
    const categoryScore = this.calculateCategoryMatch(skill, painPattern);
    score += categoryScore * 0.2;
    weightSum += 0.2;
    
    // 3. キーワードマッチング (weight: 0.3)
    const keywordScore = this.calculateKeywordMatch(skill, painPattern);
    score += keywordScore * 0.3;
    weightSum += 0.3;
    
    // 4. ペインパターン直接マッチング (weight: 0.1)
    if (skill.painPatterns && skill.painPatterns.length > 0) {
      const directMatchScore = this.calculateDirectPainMatch(skill, painPattern);
      score += directMatchScore * 0.1;
      weightSum += 0.1;
    }
    
    return weightSum > 0 ? score / weightSum : 0;
  }

  /**
   * トリガーワードのマッチング計算
   */
  private calculateTriggerMatch(skill: Skill, painPattern: PainPattern): number {
    if (!skill.triggers || skill.triggers.length === 0) {
      return 0;
    }
    
    const painText = `${painPattern.name} ${painPattern.description}`.toLowerCase();
    let matchCount = 0;
    
    for (const trigger of skill.triggers) {
      const triggerLower = trigger.toLowerCase();
      
      // 完全一致
      if (painText.includes(triggerLower)) {
        matchCount += 1.0;
      }
      // 部分一致（トリガーワードの各単語）
      else {
        const triggerWords = triggerLower.split(/\s+/);
        const matchedWords = triggerWords.filter(word => 
          word.length > 2 && painText.includes(word)
        );
        matchCount += matchedWords.length / triggerWords.length * 0.5;
      }
    }
    
    return Math.min(matchCount / skill.triggers.length, 1.0);
  }

  /**
   * カテゴリーのマッチング計算
   */
  private calculateCategoryMatch(skill: Skill, painPattern: PainPattern): number {
    if (!skill.category || !painPattern.category) {
      return 0.5; // カテゴリー情報がない場合は中立的なスコア
    }
    
    const skillCategory = skill.category.toLowerCase();
    const painCategory = painPattern.category.toLowerCase();
    
    // 完全一致
    if (skillCategory === painCategory) {
      return 1.0;
    }
    
    // カテゴリーマッピング（関連性の高いカテゴリー）
    const categoryRelations: { [key: string]: string[] } = {
      'automation': ['efficiency', 'productivity', 'process', 'workflow'],
      'communication': ['collaboration', 'information', 'reporting', 'meeting'],
      'analysis': ['data', 'insight', 'reporting', 'monitoring'],
      'quality': ['error', 'testing', 'validation', 'review'],
      'security': ['compliance', 'risk', 'protection', 'access'],
      'development': ['coding', 'deployment', 'integration', 'testing']
    };
    
    // 関連カテゴリーチェック
    for (const [mainCategory, relatedCategories] of Object.entries(categoryRelations)) {
      if (
        (skillCategory.includes(mainCategory) && relatedCategories.some(rc => painCategory.includes(rc))) ||
        (painCategory.includes(mainCategory) && relatedCategories.some(rc => skillCategory.includes(rc)))
      ) {
        return 0.7;
      }
    }
    
    // 部分一致
    if (skillCategory.includes(painCategory) || painCategory.includes(skillCategory)) {
      return 0.5;
    }
    
    return 0.2;
  }

  /**
   * キーワードマッチング計算
   */
  private calculateKeywordMatch(skill: Skill, painPattern: PainPattern): number {
    const skillText = `${skill.name} ${skill.description}`.toLowerCase();
    const painText = `${painPattern.name} ${painPattern.description}`.toLowerCase();
    
    // 重要キーワードの抽出
    const skillKeywords = this.extractKeywords(skillText);
    const painKeywords = this.extractKeywords(painText);
    
    if (skillKeywords.length === 0 || painKeywords.length === 0) {
      return 0;
    }
    
    // 共通キーワードの計算
    const commonKeywords = skillKeywords.filter(keyword => 
      painKeywords.includes(keyword)
    );
    
    // Jaccard係数の計算
    const union = new Set([...skillKeywords, ...painKeywords]);
    const intersection = commonKeywords.length;
    
    return intersection / union.size;
  }

  /**
   * ペインパターンの直接マッチング
   */
  private calculateDirectPainMatch(skill: Skill, painPattern: PainPattern): number {
    if (!skill.painPatterns || skill.painPatterns.length === 0) {
      return 0;
    }
    
    const painNameLower = painPattern.name.toLowerCase();
    
    for (const skillPainPattern of skill.painPatterns) {
      const skillPainLower = skillPainPattern.toLowerCase();
      
      // 完全一致
      if (skillPainLower === painNameLower) {
        return 1.0;
      }
      
      // 部分一致
      if (skillPainLower.includes(painNameLower) || painNameLower.includes(skillPainLower)) {
        return 0.7;
      }
      
      // 単語レベルの類似性
      const skillWords = skillPainLower.split(/\s+/);
      const painWords = painNameLower.split(/\s+/);
      const commonWords = skillWords.filter(word => painWords.includes(word));
      
      if (commonWords.length > 0) {
        return 0.5 * (commonWords.length / Math.max(skillWords.length, painWords.length));
      }
    }
    
    return 0;
  }

  /**
   * コンテキストに基づく関連性の計算
   */
  private calculateContextRelevance(
    skill: Skill,
    painPattern: PainPattern,
    context: RecommendationContext
  ): number {
    let relevance = 1.0;
    
    // 業界の一致度チェック
    if (skill.targetIndustry && context.industry) {
      if (skill.targetIndustry.toLowerCase() === context.industry.toLowerCase()) {
        relevance *= 1.2; // ボーナス
      } else if (this.areIndustriesRelated(skill.targetIndustry, context.industry)) {
        relevance *= 1.1; // 小さなボーナス
      } else {
        relevance *= 0.8; // ペナルティ
      }
    }
    
    // 役割の一致度チェック
    if (skill.targetRole && context.roles && context.roles.length > 0) {
      const roleMatch = context.roles.some(role => 
        skill.targetRole!.toLowerCase().includes(role.toLowerCase()) ||
        role.toLowerCase().includes(skill.targetRole!.toLowerCase())
      );
      
      if (roleMatch) {
        relevance *= 1.15;
      } else {
        relevance *= 0.85;
      }
    }
    
    // 会社規模による調整
    if (context.companySize) {
      relevance *= this.getCompanySizeMultiplier(skill, context.companySize);
    }
    
    // 緊急度による調整
    if (context.urgency === 'high' && skill.adoptionCost < 0.3) {
      relevance *= 1.1; // 低コストスキルを優先
    }
    
    return Math.min(relevance, 1.5); // 最大1.5倍まで
  }

  /**
   * 業界の関連性チェック
   */
  private areIndustriesRelated(industry1: string, industry2: string): boolean {
    const industryGroups = [
      ['tech', 'it', 'software', 'saas', 'technology'],
      ['finance', 'banking', 'insurance', 'fintech'],
      ['retail', 'ecommerce', 'commerce', 'shopping'],
      ['healthcare', 'medical', 'pharma', 'health'],
      ['manufacturing', 'production', 'factory', 'industry']
    ];
    
    const ind1Lower = industry1.toLowerCase();
    const ind2Lower = industry2.toLowerCase();
    
    for (const group of industryGroups) {
      if (
        group.some(ind => ind1Lower.includes(ind)) &&
        group.some(ind => ind2Lower.includes(ind))
      ) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 会社規模に基づく係数の取得
   */
  private getCompanySizeMultiplier(skill: Skill, companySize: string): number {
    // スキルの複雑さや規模感を推定
    const isEnterpriseSkill = skill.description.toLowerCase().match(
      /enterprise|scale|large|complex|distributed/
    );
    const isSimpleSkill = skill.description.toLowerCase().match(
      /simple|basic|starter|small|lightweight/
    );
    
    switch (companySize) {
      case 'small':
        if (isSimpleSkill) return 1.2;
        if (isEnterpriseSkill) return 0.7;
        return 1.0;
        
      case 'medium':
        return 1.0;
        
      case 'large':
        if (isEnterpriseSkill) return 1.2;
        if (isSimpleSkill) return 0.8;
        return 1.0;
        
      default:
        return 1.0;
    }
  }

  /**
   * キーワード抽出
   */
  private extractKeywords(text: string): string[] {
    // ストップワードの定義
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are',
      'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do',
      'does', 'did', 'will', 'would', 'could', 'should', 'may',
      'might', 'must', 'shall', 'can', 'need', 'to', 'of', 'in',
      'for', 'with', 'by', 'from', 'about', 'into', 'through',
      'during', 'before', 'after', 'above', 'below', 'up', 'down',
      'out', 'off', 'over', 'under', 'again', 'further', 'then',
      'once', 'that', 'this', 'these', 'those', 'what', 'which',
      'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
      'all', 'both', 'each', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
      'so', 'than', 'too', 'very', 'just', 'and', 'or', 'but'
    ]);
    
    // テキストをクリーニングして単語に分割
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
    
    // 重要なキーワードのみを返す（重複を除く）
    return [...new Set(words)];
  }

  /**
   * マッチング結果の詳細を生成（デバッグ用）
   */
  async getDetailedMatchingResults(
    skill: Skill,
    painPatterns: PainPattern[],
    context: RecommendationContext
  ): Promise<MatchingResult[]> {
    const results: MatchingResult[] = [];
    
    for (const painPattern of painPatterns) {
      const matchScore = this.calculateMatchScore(skill, painPattern);
      const contextScore = this.calculateContextRelevance(skill, painPattern, context);
      const adjustedScore = matchScore * contextScore;
      
      let matchType: 'exact' | 'partial' | 'related';
      if (adjustedScore >= 0.8) {
        matchType = 'exact';
      } else if (adjustedScore >= 0.5) {
        matchType = 'partial';
      } else {
        matchType = 'related';
      }
      
      const evidence: string[] = [];
      
      // トリガーマッチの証拠
      const triggerScore = this.calculateTriggerMatch(skill, painPattern);
      if (triggerScore > 0) {
        evidence.push(`トリガーマッチ: ${(triggerScore * 100).toFixed(0)}%`);
      }
      
      // カテゴリーマッチの証拠
      const categoryScore = this.calculateCategoryMatch(skill, painPattern);
      if (categoryScore > 0.5) {
        evidence.push(`カテゴリー一致: ${skill.category} ↔ ${painPattern.category}`);
      }
      
      // キーワードマッチの証拠
      const keywordScore = this.calculateKeywordMatch(skill, painPattern);
      if (keywordScore > 0.3) {
        evidence.push(`キーワード類似度: ${(keywordScore * 100).toFixed(0)}%`);
      }
      
      results.push({
        skill,
        painPattern,
        matchScore: adjustedScore,
        matchType,
        evidence
      });
    }
    
    return results;
  }
}