/**
 * Win Point Hunter Agent - データモデル定義
 */

/**
 * Win指標
 */
export interface WinIndicator {
  id?: string;
  name: string;
  category: 'efficiency' | 'quality' | 'cost' | 'growth' | 'satisfaction';
  description: string;
  impact: number; // 0-100
  evidence?: string;
  crystallized?: boolean;
  context?: string; // 業界・職種コンテキスト
}

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
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  foundedYear?: number;
}

/**
 * ヒアリングメモ
 */
export interface HearingNote {
  content: string;
  date?: Date;
  interviewer?: string;
  interviewee?: {
    name?: string;
    role?: string;
    department?: string;
  };
}

/**
 * ヒアリング解析結果
 */
export interface HearingParseResult {
  winPoints: WinIndicator[];
  painPoints: string[];
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

/**
 * URL解析結果
 */
export interface URLParseResult {
  url: string;
  title: string;
  description: string;
  companyInfo: Partial<CompanyInfo>;
  extractedValues: string[];
  confidence: number;
}