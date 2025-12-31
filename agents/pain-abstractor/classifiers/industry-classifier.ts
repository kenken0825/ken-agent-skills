/**
 * Industry Classifier
 * テキストから業界を分類するクラシファイア
 * キーワード辞書とパターンマッチングを使用
 */

import { ConsultationData, ClassificationResult } from '../models/types';

export class IndustryClassifier {
  // 業界ごとのキーワード辞書
  private readonly industryKeywords: Record<string, string[]> = {
    manufacturing: [
      '製造業', '工場', '生産', '製造', '品質管理', '品質保証', 'QC', 'QA',
      '組立', '組み立て', '加工', '部品', '原材料', '資材', '在庫管理',
      '生産管理', '生産計画', '製造ライン', 'ライン', '設備', '機械',
      'メーカー', '製品', '不良品', '歩留まり', '工程', '製造工程',
      '品質検査', '検査', '納期', '調達', 'サプライチェーン', 'SCM',
      'トヨタ生産方式', 'カンバン', 'リーン', '改善', 'カイゼン',
      '5S', 'ISO9001', '製造原価', '生産性', '生産効率', '稼働率'
    ],
    retail: [
      '小売', '小売業', '販売', '店舗', '店', 'ショップ', 'ストア',
      '商品', '在庫', '仕入', '仕入れ', '売上', '売場', '売り場',
      '顧客', 'お客様', '来店', '接客', '販売員', 'スタッフ',
      'POS', 'レジ', '棚卸', '陳列', 'ディスプレイ', 'VMD',
      'EC', 'オンライン', '通販', 'ネットショップ', 'モール',
      '客単価', '客数', '回転率', 'ABC分析', 'RFM分析', 'CRM',
      '販促', 'プロモーション', 'セール', 'キャンペーン', '特売'
    ],
    finance: [
      '金融', '銀行', '保険', '証券', '投資', '融資', 'ローン',
      '預金', '口座', '資産', '運用', 'ポートフォリオ', 'リスク管理',
      '与信', '審査', 'コンプライアンス', '規制', '金融庁', '日銀',
      '利率', '金利', '為替', '株式', '債券', 'デリバティブ',
      'フィンテック', 'FinTech', 'ブロックチェーン', '仮想通貨',
      'AML', 'マネーロンダリング', 'KYC', '本人確認', 'バーゼル',
      '資金調達', 'IPO', 'M&A', '財務', '決算', '監査'
    ],
    healthcare: [
      '医療', 'ヘルスケア', '病院', 'クリニック', '診療所', '医院',
      '患者', '診察', '診療', '治療', '手術', '検査', '診断',
      '医師', '医者', '看護師', 'ナース', '薬剤師', '医療従事者',
      '薬', '薬品', '医薬品', '処方', '処方箋', 'カルテ', '電子カルテ',
      '入院', '外来', '救急', 'ICU', '病棟', '医療機器', '医療器具',
      'レセプト', '保険', '医療保険', '診療報酬', 'DPC', 'インフォームドコンセント',
      '感染対策', '衛生管理', '医療安全', 'ヒヤリハット', 'インシデント'
    ],
    it: [
      'IT', 'テクノロジー', 'システム', 'ソフトウェア', 'ハードウェア',
      '開発', 'プログラミング', 'コーディング', 'エンジニア', 'プログラマ',
      'アプリ', 'アプリケーション', 'Web', 'ウェブ', 'モバイル',
      'データベース', 'DB', 'サーバー', 'クラウド', 'AWS', 'Azure', 'GCP',
      'AI', '人工知能', '機械学習', 'ディープラーニング', 'IoT',
      'セキュリティ', 'サイバー', 'ネットワーク', 'インフラ',
      'アジャイル', 'スクラム', 'DevOps', 'CI/CD', 'API', 'SaaS',
      'デジタルトランスフォーメーション', 'DX', 'UI', 'UX'
    ],
    construction: [
      '建設', '建築', '土木', '工事', '施工', '建物', 'ビル',
      '現場', '工事現場', '建設現場', '設計', '図面', '設計図',
      '施工管理', '工程管理', '安全管理', '品質管理', '原価管理',
      '建材', '資材', '重機', '建設機械', 'クレーン', 'ユンボ',
      '基礎', '躯体', '内装', '外装', '設備', '電気', '配管',
      '職人', '大工', '左官', '鳶', '電工', '配管工', '現場監督',
      '建築確認', '検査', '竣工', '引渡し', '瑕疵', 'アフターサービス'
    ],
    education: [
      '教育', '学校', '大学', '高校', '中学', '小学校', '専門学校',
      '生徒', '学生', '児童', '先生', '教師', '教員', '講師',
      '授業', '講義', '教室', 'クラス', '学級', '学年', '学期',
      'カリキュラム', 'シラバス', '教材', '教科書', 'テスト', '試験',
      '成績', '評価', '通知表', '進路', '受験', '入試', '合格',
      'PTA', '保護者', '学習塾', '予備校', 'eラーニング', 'オンライン授業',
      '教育委員会', '文科省', '学習指導要領', '部活', 'クラブ活動'
    ],
    service: [
      'サービス', 'サービス業', 'ホスピタリティ', '接客', '接遇',
      'ホテル', '旅館', '宿泊', 'レストラン', '飲食', '外食',
      'お客様', 'ゲスト', '顧客満足', 'CS', 'カスタマーサービス',
      'フロント', 'コンシェルジュ', 'ウェイター', 'ウェイトレス',
      '予約', 'ブッキング', 'チェックイン', 'チェックアウト',
      'メニュー', '料理', '配膳', 'ルームサービス', '清掃',
      'リピーター', '常連', '口コミ', 'レビュー', '評価',
      'イベント', '宴会', 'ケータリング', 'ブライダル', '結婚式'
    ]
  };

  // 業界特有のパターン
  private readonly industryPatterns: Record<string, RegExp[]> = {
    manufacturing: [
      /生産.*(効率|性|計画|管理)/,
      /品質.*(管理|保証|向上|問題)/,
      /製造.*(ライン|工程|現場)/,
      /在庫.*(管理|削減|最適化)/,
      /(部品|資材|原材料).*調達/,
      /工場.*(改善|効率化|自動化)/
    ],
    retail: [
      /売上.*(向上|改善|分析)/,
      /在庫.*(回転|管理|最適化)/,
      /顧客.*(満足|分析|管理)/,
      /店舗.*(運営|管理|展開)/,
      /(EC|オンライン).*(販売|ショップ)/,
      /商品.*(仕入|陳列|管理)/
    ],
    finance: [
      /リスク.*(管理|評価|分析)/,
      /コンプライアンス.*(対応|強化|体制)/,
      /融資.*(審査|管理|実行)/,
      /資産.*(運用|管理|配分)/,
      /金融.*(商品|サービス|規制)/,
      /(AML|KYC).*(対応|強化|システム)/
    ],
    healthcare: [
      /患者.*(満足|安全|情報)/,
      /医療.*(安全|事故|ミス)/,
      /診療.*(効率|記録|報酬)/,
      /電子カルテ.*(導入|運用|連携)/,
      /感染.*(対策|管理|予防)/,
      /医薬品.*(管理|在庫|安全)/
    ],
    it: [
      /システム.*(開発|運用|保守)/,
      /アプリ.*(開発|改修|運用)/,
      /データ.*(分析|管理|活用)/,
      /セキュリティ.*(対策|強化|脆弱性)/,
      /クラウド.*(移行|運用|最適化)/,
      /(AI|機械学習).*(導入|活用|開発)/
    ],
    construction: [
      /工事.*(管理|進捗|安全)/,
      /施工.*(管理|品質|効率)/,
      /現場.*(管理|安全|効率化)/,
      /建設.*(プロジェクト|工程|コスト)/,
      /設計.*(変更|ミス|確認)/,
      /安全.*(管理|対策|教育)/
    ],
    education: [
      /授業.*(改善|効率|オンライン)/,
      /生徒.*(指導|管理|評価)/,
      /学習.*(支援|効果|管理)/,
      /教材.*(作成|管理|デジタル)/,
      /保護者.*(対応|連携|コミュニケーション)/,
      /成績.*(管理|評価|分析)/
    ],
    service: [
      /接客.*(品質|向上|マニュアル)/,
      /顧客.*(満足|対応|クレーム)/,
      /サービス.*(品質|向上|標準化)/,
      /予約.*(管理|システム|効率化)/,
      /スタッフ.*(教育|管理|シフト)/,
      /ホスピタリティ.*(向上|教育|実践)/
    ]
  };

  /**
   * 業界を分類
   */
  async classify(consultations: ConsultationData[]): Promise<string> {
    const results = consultations.map(consultation => 
      this.classifyText(consultation.content)
    );

    // 最も信頼度の高い業界を選択
    const bestResult = results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    return bestResult.primary;
  }

  /**
   * テキストから業界を分類
   */
  classifyText(text: string): ClassificationResult {
    const scores: Record<string, { score: number; evidence: string[] }> = {};
    
    // 各業界に対してスコアリング
    for (const [industry, keywords] of Object.entries(this.industryKeywords)) {
      scores[industry] = this.scoreIndustry(text, industry, keywords);
    }

    // スコアでソート
    const sortedIndustries = Object.entries(scores)
      .sort(([, a], [, b]) => b.score - a.score);

    const [primary, primaryScore] = sortedIndustries[0];
    const [secondary, secondaryScore] = sortedIndustries[1] || [undefined, { score: 0 }];

    // 信頼度の計算
    const confidence = this.calculateConfidence(
      primaryScore.score,
      secondaryScore?.score || 0
    );

    return {
      primary,
      secondary: secondaryScore.score > 0.3 ? secondary : undefined,
      confidence,
      evidence: primaryScore.evidence
    };
  }

  /**
   * 業界ごとのスコアリング
   */
  private scoreIndustry(
    text: string,
    industry: string,
    keywords: string[]
  ): { score: number; evidence: string[] } {
    let score = 0;
    const evidence: string[] = [];
    const normalizedText = text.toLowerCase();

    // キーワードマッチング
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        score += 1;
        evidence.push(`キーワード「${keyword}」を検出`);
      }
    }

    // パターンマッチング
    const patterns = this.industryPatterns[industry] || [];
    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        score += 2; // パターンマッチは重み付けを高く
        evidence.push(`パターン「${match[0]}」がマッチ`);
      }
    }

    // 正規化（0-1の範囲に）
    const maxPossibleScore = keywords.length + patterns.length * 2;
    return {
      score: score / maxPossibleScore,
      evidence: evidence.slice(0, 5) // 上位5つのエビデンスのみ保持
    };
  }

  /**
   * 信頼度の計算
   */
  private calculateConfidence(primaryScore: number, secondaryScore: number): number {
    // プライマリスコアが高く、セカンダリとの差が大きいほど信頼度が高い
    const scoreDifference = primaryScore - secondaryScore;
    const confidence = primaryScore * (1 + scoreDifference);
    
    // 0.0〜1.0の範囲に正規化
    return Math.min(1.0, Math.max(0.0, confidence));
  }

  /**
   * 業界リストの取得
   */
  getIndustries(): string[] {
    return Object.keys(this.industryKeywords);
  }

  /**
   * 業界のキーワード取得
   */
  getIndustryKeywords(industry: string): string[] {
    return this.industryKeywords[industry] || [];
  }
}