/**
 * Pain Abstractor Agent - データモデル定義
 */

/**
 * ペインパターン
 */
export interface PainPattern {
  id?: string;
  name: string;
  category: 'process' | 'communication' | 'technology' | 'resource' | 'compliance' | 'other';
  description: string;
  symptoms: string[];
  rootCause?: string;
  impact?: number; // 0-100
  occurrenceCount?: number;
  abstractionLevel?: AbstractionLevel;
  applicableIndustries?: string[];
  applicableRoles?: string[];
  variations?: string[];
  solutions?: string[];
}

/**
 * 抽象化レベル
 */
export type AbstractionLevel = 'individual' | 'department' | 'organization' | 'industry';

/**
 * 相談データ
 */
export interface ConsultationData {
  id: string;
  content: string;
  timestamp: Date;
  clientInfo?: {
    industry?: string;
    role?: string;
    department?: string;
    companySize?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * 業界・職種マッピング
 */
export interface IndustryRole {
  industry: string;
  role: string;
  department?: string;
  confidence: number;
}

/**
 * 分類結果
 */
export interface ClassificationResult {
  primary: string;
  secondary?: string;
  confidence: number;
  evidence: string[];
}

/**
 * パターンマッチング結果
 */
export interface PatternMatch {
  pattern: PainPattern;
  matchScore: number;
  matchedKeywords: string[];
  context: string;
}

/**
 * 業界カテゴリ
 */
export const INDUSTRY_CATEGORIES = [
  'manufacturing',     // 製造業
  'retail',           // 小売業
  'finance',          // 金融業
  'healthcare',       // 医療・ヘルスケア
  'technology',       // IT・テクノロジー
  'construction',     // 建設業
  'education',        // 教育
  'hospitality',      // サービス業
  'logistics',        // 物流
  'consulting',       // コンサルティング
  'government',       // 公共・行政
  'nonprofit',        // 非営利組織
] as const;

/**
 * 職種カテゴリ
 */
export const ROLE_CATEGORIES = [
  'executive',        // 経営層
  'management',       // 管理職
  'sales',           // 営業
  'marketing',       // マーケティング
  'hr',              // 人事
  'finance',         // 経理・財務
  'legal',           // 法務
  'engineering',     // エンジニアリング
  'operations',      // オペレーション
  'support',         // サポート・カスタマーサービス
  'admin',           // 事務・総務
  'specialist',      // 専門職
] as const;

/**
 * ペインカテゴリ別の典型的な症状
 */
export const PAIN_SYMPTOMS: Record<string, string[]> = {
  process: [
    '業務フローが複雑',
    '手作業が多い',
    'ミスが頻発',
    '処理時間が長い',
    '標準化されていない'
  ],
  communication: [
    '情報共有が遅い',
    '連携不足',
    'コミュニケーションミス',
    '報告体系が不明確',
    '部門間の壁'
  ],
  technology: [
    'システムが古い',
    'ツールが使いにくい',
    '自動化されていない',
    'データが分散',
    'セキュリティ不安'
  ],
  resource: [
    '人手不足',
    'スキル不足',
    '予算不足',
    '時間不足',
    'ノウハウ不足'
  ],
  compliance: [
    '法規制対応',
    '監査対応',
    'ルール遵守',
    'リスク管理',
    '品質管理'
  ]
};