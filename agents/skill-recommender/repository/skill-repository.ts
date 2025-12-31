/**
 * Skill Repository Wrapper for Skill Recommender Agent
 * 既存のSkillRepositoryをラップし、Skill Recommenderで必要なインターフェースを提供
 */

import { SkillRepository as BaseRepository } from '../../../repository/skill-repository';
import {
  Skill,
  SkillRepositoryInterface,
  SkillFilter,
  PainPattern
} from '../models/types';

export class SkillRepository implements SkillRepositoryInterface {
  private baseRepository: BaseRepository;

  constructor() {
    this.baseRepository = new BaseRepository();
  }

  /**
   * 全てのスキルを取得
   */
  async findAll(): Promise<Skill[]> {
    const skills = await this.baseRepository.getAllSkills();
    return skills.map(skill => this.mapToSkill(skill));
  }

  /**
   * IDでスキルを検索
   */
  async findById(id: string): Promise<Skill | null> {
    const skill = await this.baseRepository.getSkillById(id);
    return skill ? this.mapToSkill(skill) : null;
  }

  /**
   * フィルターによるスキル検索
   */
  async findByFilter(filter: SkillFilter): Promise<Skill[]> {
    const searchCriteria = {
      industry: filter.industries?.[0], // 最初の業界を使用
      category: filter.categories?.[0], // 最初のカテゴリーを使用
      evolutionLevel: filter.minEvolutionLevel,
    };

    const skills = await this.baseRepository.searchSkills(searchCriteria);
    
    // 追加のフィルタリング
    let filtered = skills;

    // 進化レベルの範囲フィルター
    if (filter.maxEvolutionLevel !== undefined) {
      filtered = filtered.filter(skill => 
        skill.evolutionLevel !== undefined && 
        skill.evolutionLevel <= filter.maxEvolutionLevel!
      );
    }

    // アセットの有無フィルター
    if (filter.hasAssets !== undefined) {
      filtered = filtered.filter(skill => {
        const hasAssets = skill.implementation && (
          skill.implementation.technologies.length > 0 ||
          skill.implementation.integration_points.length > 0
        );
        return filter.hasAssets === hasAssets;
      });
    }

    // 複数業界フィルター
    if (filter.industries && filter.industries.length > 1) {
      filtered = filtered.filter(skill =>
        filter.industries!.includes(skill.industry)
      );
    }

    // 複数カテゴリーフィルター
    if (filter.categories && filter.categories.length > 1) {
      filtered = filtered.filter(skill =>
        filter.categories!.includes(skill.category)
      );
    }

    // 役割フィルター（タグやキーワードから推定）
    if (filter.roles && filter.roles.length > 0) {
      filtered = filtered.filter(skill => {
        const skillText = `${skill.name} ${skill.description} ${(skill.tags || []).join(' ')}`.toLowerCase();
        return filter.roles!.some(role => skillText.includes(role.toLowerCase()));
      });
    }

    return filtered.map(skill => this.mapToSkill(skill));
  }

  /**
   * キーワード検索
   */
  async search(query: string): Promise<Skill[]> {
    const skills = await this.baseRepository.searchSkills({ query });
    return skills.map(skill => this.mapToSkill(skill));
  }

  /**
   * スキルの保存（この実装では未対応）
   */
  async save(skill: Skill): Promise<Skill> {
    // Mock実装なので保存は行わず、そのまま返す
    console.warn('Save operation is not supported in mock repository');
    return skill;
  }

  /**
   * ペインパターンに基づく候補スキルの検索
   * Skill Recommender特有のメソッド
   */
  async findCandidates(
    painPatterns: PainPattern[],
    filters?: {
      categories?: string[];
      levels?: number[];
      industries?: string[];
    }
  ): Promise<Skill[]> {
    // まず基本的なフィルタリングを適用
    let candidates = await this.findAll();

    // フィルターの適用
    if (filters) {
      if (filters.categories && filters.categories.length > 0) {
        candidates = candidates.filter(skill =>
          filters.categories!.includes(skill.category)
        );
      }

      if (filters.levels && filters.levels.length > 0) {
        candidates = candidates.filter(skill =>
          skill.evolutionLevel !== undefined &&
          filters.levels!.includes(skill.evolutionLevel)
        );
      }

      if (filters.industries && filters.industries.length > 0) {
        candidates = candidates.filter(skill =>
          skill.targetIndustry &&
          filters.industries!.some(ind => 
            skill.targetIndustry!.toLowerCase().includes(ind.toLowerCase())
          )
        );
      }
    }

    // ペインパターンに関連するキーワードを抽出
    const painKeywords = this.extractPainKeywords(painPatterns);
    
    // キーワードに基づくスコアリング
    const scoredCandidates = candidates.map(skill => {
      const score = this.calculateRelevanceScore(skill, painKeywords);
      return { skill, score };
    });

    // スコアが0より大きいものを関連度順に返す
    return scoredCandidates
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.skill);
  }

  /**
   * BaseRepositoryのスキルをこのエージェント用のSkill型にマッピング
   */
  private mapToSkill(repoSkill: any): Skill {
    return {
      id: repoSkill.id,
      name: repoSkill.name,
      description: repoSkill.description,
      category: repoSkill.category,
      targetIndustry: repoSkill.industry,
      targetRole: this.extractTargetRole(repoSkill),
      triggers: repoSkill.triggers || [],
      painPatterns: this.extractPainPatterns(repoSkill),
      implementations: this.estimateImplementations(repoSkill),
      successRate: this.estimateSuccessRate(repoSkill),
      evolutionLevel: repoSkill.evolutionLevel,
      assets: this.mapAssets(repoSkill),
      metadata: {
        complexity: repoSkill.complexity,
        status: repoSkill.status,
        tags: repoSkill.tags,
        benefits: repoSkill.benefits,
        metrics: repoSkill.metrics
      }
    };
  }

  /**
   * ターゲット役割の抽出（タグや説明から推定）
   */
  private extractTargetRole(skill: any): string | undefined {
    // タグから役割を推定
    const roleKeywords = [
      'manager', 'engineer', 'developer', 'analyst', 
      'executive', 'operator', 'specialist', 'coordinator'
    ];
    
    if (skill.tags) {
      for (const tag of skill.tags) {
        for (const keyword of roleKeywords) {
          if (tag.toLowerCase().includes(keyword)) {
            return tag;
          }
        }
      }
    }

    // 説明文から役割を推定
    const description = skill.description.toLowerCase();
    for (const keyword of roleKeywords) {
      if (description.includes(keyword)) {
        return keyword;
      }
    }

    return undefined;
  }

  /**
   * ペインパターンの抽出
   */
  private extractPainPatterns(skill: any): string[] {
    const patterns: string[] = [];

    // benefitsからペインパターンを推定
    if (skill.benefits) {
      patterns.push(...skill.benefits.map((benefit: string) => 
        this.benefitToPainPattern(benefit)
      ));
    }

    // メトリクスからも推定
    if (skill.metrics) {
      patterns.push(...skill.metrics.map((metric: string) =>
        this.metricToPainPattern(metric)
      ));
    }

    return patterns;
  }

  /**
   * ベネフィットをペインパターンに変換
   */
  private benefitToPainPattern(benefit: string): string {
    // ベネフィットの逆をペインとして表現
    if (benefit.includes('時間削減')) return '作業時間の長さ';
    if (benefit.includes('エラー減少')) return 'ミスの多発';
    if (benefit.includes('効率化')) return '非効率な作業';
    if (benefit.includes('自動化')) return '手作業の繰り返し';
    if (benefit.includes('可視化')) return '状況の不透明さ';
    return '業務上の課題';
  }

  /**
   * メトリクスをペインパターンに変換
   */
  private metricToPainPattern(metric: string): string {
    if (metric.includes('時間')) return '時間的制約';
    if (metric.includes('コスト')) return 'コスト圧迫';
    if (metric.includes('品質')) return '品質のばらつき';
    if (metric.includes('満足度')) return '満足度の低下';
    return '測定可能な課題';
  }

  /**
   * 実装数の推定
   */
  private estimateImplementations(skill: any): number {
    // 複雑さとステータスから推定
    let base = 5;
    
    if (skill.complexity === 'low') base = 10;
    else if (skill.complexity === 'medium') base = 5;
    else if (skill.complexity === 'high') base = 2;

    if (skill.status === 'active') base *= 2;
    else if (skill.status === 'deprecated') base *= 0.5;

    return Math.round(base);
  }

  /**
   * 成功率の推定
   */
  private estimateSuccessRate(skill: any): number {
    let rate = 75; // ベースライン

    // 複雑さによる調整
    if (skill.complexity === 'low') rate += 15;
    else if (skill.complexity === 'high') rate -= 15;

    // ステータスによる調整
    if (skill.status === 'active') rate += 10;
    else if (skill.status === 'deprecated') rate -= 20;

    // 実装要件による調整
    if (skill.implementation) {
      const techCount = skill.implementation.technologies.length;
      if (techCount <= 2) rate += 5;
      else if (techCount >= 5) rate -= 10;
    }

    return Math.max(50, Math.min(95, rate));
  }

  /**
   * アセットのマッピング
   */
  private mapAssets(skill: any): any {
    const assets: any = {};

    // 実装情報からアセットを推定
    if (skill.implementation) {
      if (skill.implementation.technologies.length > 0) {
        assets.scripts = skill.implementation.technologies.map((tech: string) => 
          `script_${tech.toLowerCase().replace(/\s+/g, '_')}.js`
        );
      }
    }

    // タグからテンプレートを推定
    if (skill.tags && skill.tags.includes('template')) {
      assets.templates = ['template.docx', 'template.xlsx'];
    }

    // カテゴリーに応じたドキュメント
    assets.documents = [`guide_${skill.category}.md`, 'README.md'];

    return assets;
  }

  /**
   * ペインパターンからキーワードを抽出
   */
  private extractPainKeywords(painPatterns: PainPattern[]): string[] {
    const keywords = new Set<string>();

    painPatterns.forEach(pain => {
      // ペイン名と説明からキーワードを抽出
      const text = `${pain.name} ${pain.description}`.toLowerCase();
      const words = text.split(/\s+/)
        .filter(word => word.length > 3) // 3文字以上の単語
        .filter(word => !this.isStopWord(word));
      
      words.forEach(word => keywords.add(word));

      // カテゴリーも追加
      if (pain.category) {
        keywords.add(pain.category.toLowerCase());
      }
    });

    return Array.from(keywords);
  }

  /**
   * ストップワードチェック
   */
  private isStopWord(word: string): boolean {
    const stopWords = [
      'する', 'なる', 'ある', 'いる', 'れる', 'られる',
      'です', 'ます', 'した', 'して', 'こと', 'もの',
      'など', 'から', 'まで', 'より', 'ため', 'よう'
    ];
    return stopWords.includes(word);
  }

  /**
   * スキルの関連度スコア計算
   */
  private calculateRelevanceScore(skill: Skill, keywords: string[]): number {
    let score = 0;
    const skillText = `${skill.name} ${skill.description} ${skill.triggers.join(' ')}`.toLowerCase();

    // キーワードマッチング
    keywords.forEach(keyword => {
      if (skillText.includes(keyword)) {
        score += 1;
      }
    });

    // トリガーの完全一致はボーナス
    skill.triggers.forEach(trigger => {
      if (keywords.includes(trigger.toLowerCase())) {
        score += 2;
      }
    });

    // カテゴリーマッチング
    if (keywords.includes(skill.category.toLowerCase())) {
      score += 1.5;
    }

    return score;
  }
}