/**
 * Pain Abstractor Agent
 * 個別相談からペインパターンを抽出・抽象化し、横展開可能な形にする
 */

import { PainPattern, ConsultationData, IndustryRole, AbstractionLevel } from './models/types';
import { IndustryClassifier } from './classifiers/industry-classifier';
import { RoleClassifier } from './classifiers/role-classifier';
import { PatternExtractor } from './patterns/pattern-extractor';

export interface PainAbstractorConfig {
  minPatternOccurrence?: number;
  abstractionDepth?: number;
  debug?: boolean;
}

export interface PainAbstractorInput {
  consultationNotes: string | string[];
  contextInfo?: {
    industry?: string;
    role?: string;
    companySize?: string;
  };
}

export interface PainAbstractorOutput {
  painPatterns: PainPattern[];
  industryRoleMapping: IndustryRole;
  crossApplicability: {
    industries: string[];
    roles: string[];
    confidence: number;
  };
  recommendations: string[];
}

export class PainAbstractorAgent {
  private industryClassifier: IndustryClassifier;
  private roleClassifier: RoleClassifier;
  private patternExtractor: PatternExtractor;

  constructor(private config: PainAbstractorConfig = {}) {
    this.industryClassifier = new IndustryClassifier();
    this.roleClassifier = new RoleClassifier();
    this.patternExtractor = new PatternExtractor(config);
  }

  /**
   * ペインパターンの抽出と抽象化
   */
  async execute(input: PainAbstractorInput): Promise<PainAbstractorOutput> {
    // 相談内容の正規化
    const consultations = this.normalizeConsultations(input.consultationNotes);
    
    // 業界・職種の分類
    const industryRole = await this.classifyIndustryRole(consultations, input.contextInfo);
    
    // ペインパターンの抽出
    const rawPatterns = await this.patternExtractor.extract(consultations);
    
    // パターンの抽象化
    const abstractedPatterns = this.abstractPatterns(rawPatterns, industryRole);
    
    // 横展開可能性の評価
    const crossApplicability = this.evaluateCrossApplicability(abstractedPatterns);
    
    // 推奨事項の生成
    const recommendations = this.generateRecommendations(abstractedPatterns);

    return {
      painPatterns: abstractedPatterns,
      industryRoleMapping: industryRole,
      crossApplicability,
      recommendations
    };
  }

  /**
   * 相談内容の正規化
   */
  private normalizeConsultations(notes: string | string[]): ConsultationData[] {
    const notesArray = Array.isArray(notes) ? notes : [notes];
    return notesArray.map((note, index) => ({
      id: `consultation_${index}`,
      content: note,
      timestamp: new Date(),
      metadata: {}
    }));
  }

  /**
   * 業界・職種の分類
   */
  private async classifyIndustryRole(
    consultations: ConsultationData[],
    contextInfo?: any
  ): Promise<IndustryRole> {
    const industry = contextInfo?.industry || 
      await this.industryClassifier.classify(consultations);
    const role = contextInfo?.role || 
      await this.roleClassifier.classify(consultations);

    return {
      industry,
      role,
      confidence: 0.85 // TODO: 実際の信頼度計算
    };
  }

  /**
   * パターンの抽象化
   */
  private abstractPatterns(
    rawPatterns: PainPattern[],
    industryRole: IndustryRole
  ): PainPattern[] {
    return rawPatterns.map(pattern => ({
      ...pattern,
      abstractionLevel: this.determineAbstractionLevel(pattern),
      applicableIndustries: [industryRole.industry],
      applicableRoles: [industryRole.role],
      variations: this.generateVariations(pattern)
    }));
  }

  /**
   * 抽象化レベルの決定
   */
  private determineAbstractionLevel(pattern: PainPattern): AbstractionLevel {
    const keywords = pattern.description.toLowerCase();
    
    if (keywords.includes('全社') || keywords.includes('組織')) {
      return 'organization';
    } else if (keywords.includes('部門') || keywords.includes('チーム')) {
      return 'department';
    } else if (keywords.includes('業界') || keywords.includes('市場')) {
      return 'industry';
    } else {
      return 'individual';
    }
  }

  /**
   * バリエーションの生成
   */
  private generateVariations(pattern: PainPattern): string[] {
    // パターンの言い換えや類似表現を生成
    const variations: string[] = [];
    
    // TODO: より高度な言い換え生成
    if (pattern.name.includes('時間')) {
      variations.push(pattern.name.replace('時間', '工数'));
      variations.push(pattern.name.replace('時間', '期間'));
    }
    
    return variations;
  }

  /**
   * 横展開可能性の評価
   */
  private evaluateCrossApplicability(patterns: PainPattern[]): any {
    const allIndustries = new Set<string>();
    const allRoles = new Set<string>();
    
    patterns.forEach(pattern => {
      pattern.applicableIndustries?.forEach(ind => allIndustries.add(ind));
      pattern.applicableRoles?.forEach(role => allRoles.add(role));
    });

    return {
      industries: Array.from(allIndustries),
      roles: Array.from(allRoles),
      confidence: this.calculateCrossApplicabilityConfidence(patterns)
    };
  }

  /**
   * 横展開信頼度の計算
   */
  private calculateCrossApplicabilityConfidence(patterns: PainPattern[]): number {
    const avgOccurrence = patterns.reduce((sum, p) => sum + (p.occurrenceCount || 1), 0) / patterns.length;
    const abstractionScore = patterns.filter(p => 
      p.abstractionLevel === 'industry' || p.abstractionLevel === 'organization'
    ).length / patterns.length;
    
    return Math.min(0.95, avgOccurrence * 0.1 + abstractionScore * 0.5);
  }

  /**
   * 推奨事項の生成
   */
  private generateRecommendations(patterns: PainPattern[]): string[] {
    const recommendations: string[] = [];
    
    // 優先度の高いパターンから推奨事項を生成
    const highPriorityPatterns = patterns
      .filter(p => (p.impact || 0) >= 70)
      .sort((a, b) => (b.impact || 0) - (a.impact || 0));
    
    highPriorityPatterns.forEach(pattern => {
      recommendations.push(
        `「${pattern.name}」の解決に向けて、${pattern.category}系のスキル開発を推奨`
      );
    });
    
    return recommendations;
  }
}