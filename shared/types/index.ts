/**
 * Shared Type Definitions - 共通型定義
 * 
 * このファイルは、すべてのエージェントとオーケストレーター間で
 * 共有される共通の型定義を含みます。
 */

// ========================================
// 基本的なエンティティ型
// ========================================

/**
 * 会社情報
 */
export interface CompanyInfo {
  name: string;
  industry: string;
  description: string;
  values: string[];
  services: string[];
  url?: string;
  size?: CompanySize;
  foundedYear?: number;
}

/**
 * 会社規模
 */
export type CompanySize = 'small' | 'medium' | 'large' | 'enterprise';

/**
 * スキル - アプリケーションの中核となるエンティティ
 */
export interface Skill {
  id?: string;
  name: string;
  description: string;
  category: string;
  targetIndustry?: string;
  targetRole?: string;
  triggers: string[];
  painPatterns?: string[];
  implementations?: number;
  successRate?: number;
  evolutionLevel?: number;
  assets?: SkillAssets;
  metadata?: Record<string, any>;
}

/**
 * スキルアセット
 */
export interface SkillAssets {
  scripts?: string[];
  templates?: string[];
  documents?: string[];
}

/**
 * ペインパターン
 */
export interface PainPattern {
  id?: string;
  name: string;
  category: PainCategory;
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
 * Win指標
 */
export interface WinIndicator {
  id?: string;
  name: string;
  category: WinCategory;
  description: string;
  impact: number; // 0-100
  evidence?: string;
  crystallized?: boolean;
  context?: string; // 業界・職種コンテキスト
}

// ========================================
// 分類・カテゴリ型
// ========================================

/**
 * ペインカテゴリ
 */
export type PainCategory = 'process' | 'communication' | 'technology' | 'resource' | 'compliance' | 'other';

/**
 * Winカテゴリ
 */
export type WinCategory = 'efficiency' | 'quality' | 'cost' | 'growth' | 'satisfaction';

/**
 * 抽象化レベル
 */
export type AbstractionLevel = 'individual' | 'department' | 'organization' | 'industry';

/**
 * パッケージタイプ
 */
export type PackageType = 'basic' | 'advanced' | 'enterprise';

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

export type IndustryCategory = typeof INDUSTRY_CATEGORIES[number];

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

export type RoleCategory = typeof ROLE_CATEGORIES[number];

// ========================================
// ワークフロー・実行関連型
// ========================================

/**
 * ワークフローステータス
 */
export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/**
 * ワークフロー状態
 */
export interface WorkflowState {
  currentStage: string;
  progress: number;
  startTime?: Date;
  endTime?: Date;
  data: {
    input?: any;
    companyProfile?: CompanyInfo;
    winIndicators?: WinIndicator[];
    industryRole?: IndustryRole;
    painPatterns?: PainPattern[];
    recommendations?: SkillRecommendation[];
    evolutionResults?: EvolutionAssessment[];
    packages?: PackageStructure[];
  };
  errors?: Error[];
}

/**
 * パイプラインステージ
 */
export interface PipelineStage {
  id: string;
  name: string;
  status: WorkflowStatus;
  startTime?: Date;
  endTime?: Date;
  error?: Error;
  result?: any;
}

/**
 * 実行結果
 */
export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: Error;
  duration?: number;
}

// ========================================
// エージェント間通信型
// ========================================

/**
 * エージェントタイプ
 */
export type AgentType = 
  | 'win-point-hunter'
  | 'pain-abstractor'
  | 'skill-recommender'
  | 'skill-evolution-judge'
  | 'github-packager';

/**
 * エージェント間メッセージ
 */
export interface AgentMessage {
  from: AgentType | 'orchestrator';
  to: AgentType | 'orchestrator';
  type: MessageType;
  payload: any;
  timestamp: Date;
}

/**
 * メッセージタイプ
 */
export type MessageType = 'request' | 'response' | 'error' | 'info';

/**
 * パイプラインイベント
 */
export interface PipelineEvent {
  type: EventType;
  stage?: string;
  data?: any;
  error?: Error;
  timestamp: Date;
}

/**
 * イベントタイプ
 */
export type EventType = 'start' | 'complete' | 'error' | 'stage_start' | 'stage_complete' | 'stage_error';

// ========================================
// 評価・推薦関連型
// ========================================

/**
 * スキル推薦
 */
export interface SkillRecommendation {
  skill: Skill;
  score: number;
  rank?: number;
  metrics: ScoringMetrics;
  matchedPains: string[];
  reasons?: string[];
}

/**
 * スコアリング指標
 */
export interface ScoringMetrics {
  fitIndustryRole: number;     // 業種職種適合度 (0-1)
  painImpact: number;           // ペイン解消インパクト (0-1)
  adoptionCost: number;         // 導入コスト (0-1, 低いほど良い)
  reproducibility: number;      // 再現性・横展開性 (0-1)
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
 * 進化レベル
 */
export interface EvolutionLevel {
  level: 1 | 2 | 3 | 4;
  name: string;
  description: string;
}

/**
 * 進化評価結果
 */
export interface EvolutionAssessment {
  readyForNextLevel: boolean;
  readinessScore: number;
  strengths: string[];
  gaps: string[];
  progressMetrics: {
    implementationCount: number;
    industryDiversity: number;
    roleDiversity: number;
    successRate: number;
  };
}

// ========================================
// パッケージ関連型
// ========================================

/**
 * パッケージ構成
 */
export interface PackageStructure {
  type: PackageType;
  files: PackageFile[];
  directories: string[];
  metadata: PackageMetadata;
}

/**
 * パッケージファイル
 */
export interface PackageFile {
  path: string;
  content: string;
  type: FileType;
  encoding?: string;
}

/**
 * ファイルタイプ
 */
export type FileType = 'markdown' | 'yaml' | 'json' | 'script' | 'template';

/**
 * パッケージメタデータ
 */
export interface PackageMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  tags?: string[];
  created?: Date;
  updated?: Date;
}

// ========================================
// 設定型
// ========================================

/**
 * 基本的なエージェント設定
 */
export interface BaseAgentConfig {
  debug?: boolean;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * 言語設定
 */
export type LanguageCode = 'ja' | 'en';

/**
 * 優先度
 */
export type Priority = 'low' | 'medium' | 'high';

/**
 * 予算レベル
 */
export type BudgetLevel = 'low' | 'medium' | 'high';

// ========================================
// ユーティリティ型
// ========================================

/**
 * IDを持つ基本エンティティ
 */
export interface BaseEntity {
  id: string;
  created?: Date;
  updated?: Date;
}

/**
 * ページネーション情報
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * ソート情報
 */
export interface SortInfo<T = string> {
  field: T;
  direction: 'asc' | 'desc';
}

/**
 * フィルター条件
 */
export interface FilterCondition<T = any> {
  field: keyof T;
  operator: FilterOperator;
  value: any;
}

/**
 * フィルター演算子
 */
export type FilterOperator = 'equals' | 'notEquals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn';

/**
 * APIレスポンス
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    timestamp: Date;
    duration?: number;
    [key: string]: any;
  };
}

/**
 * APIエラー
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

/**
 * 検証結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationError[];
}

/**
 * 検証エラー
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// ========================================
// ヘルパー関数
// ========================================

/**
 * 型ガード: CompanyInfo
 */
export function isCompanyInfo(obj: any): obj is CompanyInfo {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.name === 'string' &&
    typeof obj.industry === 'string' &&
    typeof obj.description === 'string' &&
    Array.isArray(obj.values) &&
    Array.isArray(obj.services)
  );
}

/**
 * 型ガード: Skill
 */
export function isSkill(obj: any): obj is Skill {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.category === 'string' &&
    Array.isArray(obj.triggers)
  );
}

/**
 * 型ガード: PainPattern
 */
export function isPainPattern(obj: any): obj is PainPattern {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.name === 'string' &&
    typeof obj.category === 'string' &&
    typeof obj.description === 'string' &&
    Array.isArray(obj.symptoms)
  );
}

/**
 * 型ガード: WinIndicator
 */
export function isWinIndicator(obj: any): obj is WinIndicator {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.name === 'string' &&
    typeof obj.category === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.impact === 'number' &&
    obj.impact >= 0 &&
    obj.impact <= 100
  );
}

// ========================================
// 定数定義
// ========================================

/**
 * デフォルトのタイムアウト値（ミリ秒）
 */
export const DEFAULT_TIMEOUT = 30000;

/**
 * デフォルトのリトライ回数
 */
export const DEFAULT_RETRY_ATTEMPTS = 3;

/**
 * 最大ページサイズ
 */
export const MAX_PAGE_SIZE = 100;

/**
 * 進化レベル定義
 */
export const EVOLUTION_LEVELS: Record<number, EvolutionLevel> = {
  1: {
    level: 1,
    name: '個別最適（個人特化）',
    description: '1人の現場で「助かった」が発生'
  },
  2: {
    level: 2,
    name: '再現性確認（業種特化）',
    description: '同業種で再現し「業界あるある」へ'
  },
  3: {
    level: 3,
    name: '構造抽出（職種共通）',
    description: '異業種でも同職種で成立'
  },
  4: {
    level: 4,
    name: '汎用スキル（OS級）',
    description: '文脈フリーで使える"道具"へ'
  }
};

/**
 * ペインカテゴリ別の典型的な症状
 */
export const PAIN_SYMPTOMS: Record<PainCategory, string[]> = {
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
  ],
  other: []
};