/**
 * Role Classifier
 * テキストから役職・職種カテゴリを分類
 */

import { ClassificationResult, ROLE_CATEGORIES } from '../models/types';

export class RoleClassifier {
  /**
   * 役職・職種カテゴリごとのキーワード辞書
   */
  private readonly roleKeywords: Record<typeof ROLE_CATEGORIES[number], string[]> = {
    executive: [
      '社長', 'CEO', '代表取締役', '代表', '経営者', '取締役', '役員',
      'COO', 'CFO', 'CTO', '副社長', '専務', '常務', '執行役員',
      '経営層', 'トップ', '経営陣', 'ボード', 'オーナー', '創業者'
    ],
    management: [
      '部長', 'マネージャー', 'マネジャー', '課長', '係長', 'リーダー',
      'ディレクター', 'GM', 'ゼネラルマネージャー', '管理職', '主任',
      'チーフ', 'ヘッド', 'スーパーバイザー', 'SV', '室長', '所長'
    ],
    sales: [
      '営業', 'セールス', 'sales', '販売', '営業部', '営業課', '営業職',
      'アカウントマネージャー', '営業担当', 'セールスマン', '外商',
      'ルートセールス', '新規開拓', 'インサイドセールス', 'フィールドセールス'
    ],
    marketing: [
      'マーケティング', 'マーケ', 'marketing', '広報', 'PR', 'プロモーション',
      '宣伝', '広告', 'ブランディング', 'デジタルマーケティング', 'CMO',
      'マーケター', 'プランナー', 'ブランドマネージャー', 'プロダクトマネージャー'
    ],
    hr: [
      '人事', 'HR', '採用', 'リクルーター', '人材', '労務', '人事部',
      '人事課', '総務人事', '人材開発', '教育研修', 'タレントマネジメント',
      'CHRO', '人事担当', '採用担当', '労務管理', '組織開発'
    ],
    accounting: [
      '経理', '財務', '会計', '経理部', '財務部', 'ファイナンス', '主計',
      'コントローラー', '簿記', '決算', '税務', '監査', '内部統制',
      '財務担当', '経理担当', 'CFO直下', '予算管理', '資金調達'
    ],
    legal: [
      '法務', '法律', 'リーガル', '法務部', 'コンプライアンス', '契約',
      '法的', '弁護士', '法務担当', '知的財産', '特許', 'IP', '商標',
      'ガバナンス', 'リスクマネジメント', 'コーポレートガバナンス'
    ],
    engineer: [
      'エンジニア', 'engineer', '技術', '開発', 'プログラマー', 'SE',
      'システムエンジニア', '開発者', 'デベロッパー', 'developer', 'tech',
      'IT', '情報システム', 'インフラ', 'ネットワーク', 'セキュリティ',
      'データサイエンティスト', 'AI', '機械学習', 'DevOps', 'SRE'
    ],
    operations: [
      'オペレーション', '運営', '運用', '現場', '業務', '製造', '生産',
      'ロジスティクス', '物流', '品質管理', 'QC', 'サプライチェーン',
      'オペレーター', '作業員', '工場', '倉庫', '配送', 'SCM'
    ]
  };

  /**
   * 役職レベルを示すキーワード
   */
  private readonly levelIndicators = {
    executive: ['役員', '経営', 'C-level', 'Chief', '代表', 'ボード'],
    senior: ['シニア', 'senior', '上級', 'principal', 'lead', '主席'],
    manager: ['マネージャー', 'manager', '管理', 'ディレクター', 'director'],
    staff: ['スタッフ', 'staff', 'メンバー', '担当', 'アソシエイト']
  };

  /**
   * テキストから役職・職種を分類
   */
  classify(text: string): ClassificationResult {
    if (!text || text.trim().length === 0) {
      return {
        primary: 'unknown',
        confidence: 0,
        evidence: []
      };
    }

    // 小文字に正規化
    const normalizedText = text.toLowerCase();

    // 各カテゴリのスコアを計算
    const scores = this.calculateCategoryScores(normalizedText);

    // 最も高いスコアのカテゴリを特定
    const sortedScores = Object.entries(scores)
      .sort(([, a], [, b]) => b.score - a.score)
      .filter(([, data]) => data.score > 0);

    if (sortedScores.length === 0) {
      return {
        primary: 'unknown',
        confidence: 0,
        evidence: []
      };
    }

    const [primary, primaryData] = sortedScores[0];
    const result: ClassificationResult = {
      primary,
      confidence: this.calculateConfidence(primaryData.score, normalizedText),
      evidence: primaryData.matches
    };

    // 2番目に高いスコアがある場合は、セカンダリとして設定
    if (sortedScores.length > 1) {
      const [secondary, secondaryData] = sortedScores[1];
      // プライマリとの差が小さい場合のみセカンダリを設定
      if (secondaryData.score >= primaryData.score * 0.7) {
        result.secondary = secondary;
      }
    }

    return result;
  }

  /**
   * カテゴリごとのスコアを計算
   */
  private calculateCategoryScores(text: string): Record<string, { score: number; matches: string[] }> {
    const scores: Record<string, { score: number; matches: string[] }> = {};

    for (const [category, keywords] of Object.entries(this.roleKeywords)) {
      const matches: string[] = [];
      let score = 0;

      for (const keyword of keywords) {
        const lowerKeyword = keyword.toLowerCase();
        if (text.includes(lowerKeyword)) {
          matches.push(keyword);
          // キーワードの重要度に応じてスコアを加算
          score += this.getKeywordWeight(keyword, category as typeof ROLE_CATEGORIES[number]);
        }
      }

      // 文脈による追加スコア
      score += this.getContextBonus(text, category as typeof ROLE_CATEGORIES[number]);

      scores[category] = { score, matches };
    }

    return scores;
  }

  /**
   * キーワードの重要度を取得
   */
  private getKeywordWeight(keyword: string, category: typeof ROLE_CATEGORIES[number]): number {
    // 役職名の直接的な言及は高スコア
    const directTitles = ['社長', 'CEO', '部長', 'マネージャー', 'エンジニア'];
    if (directTitles.some(title => keyword.includes(title))) {
      return 3;
    }

    // カテゴリ名と一致する場合は中スコア
    if (keyword.toLowerCase().includes(category)) {
      return 2;
    }

    // その他は通常スコア
    return 1;
  }

  /**
   * 文脈によるボーナススコアを計算
   */
  private getContextBonus(text: string, category: typeof ROLE_CATEGORIES[number]): number {
    let bonus = 0;

    // 責任範囲を示す表現
    const responsibilityPatterns: Record<string, string[]> = {
      executive: ['会社全体', '経営戦略', '事業計画', '株主', '取締役会'],
      management: ['部門', 'チーム', '部下', 'マネジメント', '目標管理'],
      sales: ['売上', '顧客', '商談', '契約', '提案'],
      marketing: ['ブランド', 'キャンペーン', '市場', 'プロモーション', '顧客獲得'],
      hr: ['採用', '評価', '研修', '労務', '組織'],
      accounting: ['決算', '予算', '資金', '税務', '監査'],
      legal: ['契約', '法律', 'コンプライアンス', 'リスク', '規制'],
      engineer: ['開発', 'システム', 'プログラム', '技術', 'アーキテクチャ'],
      operations: ['業務', '改善', 'プロセス', '効率', '品質']
    };

    const patterns = responsibilityPatterns[category] || [];
    for (const pattern of patterns) {
      if (text.includes(pattern.toLowerCase())) {
        bonus += 0.5;
      }
    }

    return bonus;
  }

  /**
   * 信頼度を計算
   */
  private calculateConfidence(score: number, text: string): number {
    // 基本信頼度（スコアに基づく）
    let confidence = Math.min(score * 20, 100);

    // テキストの長さによる調整
    if (text.length < 20) {
      confidence *= 0.7; // 短いテキストは信頼度を下げる
    }

    // 複数のレベル指標が混在する場合は信頼度を下げる
    const levelCount = Object.values(this.levelIndicators)
      .filter(indicators => indicators.some(ind => text.includes(ind.toLowerCase())))
      .length;
    
    if (levelCount > 1) {
      confidence *= 0.8;
    }

    return Math.round(confidence);
  }

  /**
   * 複数の役職を持つ可能性を検出
   */
  detectMultipleRoles(text: string): string[] {
    const detectedRoles: string[] = [];
    const normalizedText = text.toLowerCase();

    for (const [category, keywords] of Object.entries(this.roleKeywords)) {
      const hasMatch = keywords.some(keyword => 
        normalizedText.includes(keyword.toLowerCase())
      );
      
      if (hasMatch) {
        detectedRoles.push(category);
      }
    }

    return detectedRoles;
  }

  /**
   * 役職レベルを判定
   */
  detectRoleLevel(text: string): 'executive' | 'senior' | 'manager' | 'staff' | 'unknown' {
    const normalizedText = text.toLowerCase();
    
    for (const [level, indicators] of Object.entries(this.levelIndicators)) {
      if (indicators.some(indicator => normalizedText.includes(indicator.toLowerCase()))) {
        return level as 'executive' | 'senior' | 'manager' | 'staff';
      }
    }
    
    return 'unknown';
  }
}