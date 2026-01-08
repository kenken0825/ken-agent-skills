/**
 * Contract Review Agent - Type Definitions
 *
 * Multi-Persona Adversarial Review System の型定義
 */

// =============================================================================
// 基本型
// =============================================================================

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type ClauseType =
  | 'payment'              // 支払い条件
  | 'liability'            // 責任・賠償
  | 'indemnification'      // 補償・免責
  | 'termination'          // 契約終了
  | 'confidentiality'      // 秘密保持
  | 'ip_rights'            // 知的財産権
  | 'dispute_resolution'   // 紛争解決
  | 'force_majeure'        // 不可抗力
  | 'warranty'             // 保証
  | 'non_compete'          // 競業避止
  | 'assignment'           // 譲渡
  | 'governing_law'        // 準拠法
  | 'general';             // その他一般条項

export type FindingCategory =
  | 'legal_risk'           // 法的リスク
  | 'financial_risk'       // 財務リスク
  | 'security_risk'        // セキュリティリスク
  | 'operational_risk'     // 運用リスク
  | 'compliance_risk'      // コンプライアンスリスク
  | 'reputational_risk';   // レピュテーションリスク

export type PersonaType =
  // ドメイン専門家
  | 'legal_expert'         // 法務官僚
  | 'cfo_expert'           // CFO
  | 'ciso_expert'          // CISO
  | 'operations_expert'    // 現場責任者
  // 議論ペルソナ
  | 'devils_advocate'      // 悪魔の代理人
  | 'angels_advocate'      // 天使の代理人
  | 'judge';               // 裁判官

// =============================================================================
// 契約書構造
// =============================================================================

/**
 * 契約当事者
 */
export interface Party {
  id: string;
  name: string;
  role: 'client' | 'vendor' | 'partner' | 'other';
  isOurSide: boolean;  // 自社側かどうか
}

/**
 * 義務・責務
 */
export interface Obligation {
  id: string;
  party: string;           // 義務を負う当事者のID
  type: 'must' | 'must_not' | 'may' | 'should';
  description: string;
  deadline?: string;
  penalty?: string;
}

/**
 * 契約条項
 */
export interface Clause {
  id: string;
  number: string;          // 条項番号（例: "第3条", "3.1"）
  type: ClauseType;
  title: string;
  content: string;
  obligations: Obligation[];
  subClauses?: Clause[];
}

/**
 * 添付資料
 */
export interface Attachment {
  id: string;
  name: string;
  type: 'schedule' | 'exhibit' | 'appendix';
  description: string;
}

/**
 * 契約書
 */
export interface Contract {
  id: string;
  title: string;
  type: ContractType;
  parties: Party[];
  effectiveDate?: string;
  terminationDate?: string;
  autoRenewal?: boolean;
  renewalTerms?: string;
  clauses: Clause[];
  attachments: Attachment[];
  rawText: string;
  metadata: ContractMetadata;
}

export type ContractType =
  | 'nda'                  // 秘密保持契約
  | 'service_agreement'    // 業務委託契約
  | 'license'              // ライセンス契約
  | 'employment'           // 雇用契約
  | 'lease'                // 賃貸借契約
  | 'sales'                // 売買契約
  | 'partnership'          // 提携契約
  | 'other';

export interface ContractMetadata {
  language: 'ja' | 'en' | 'other';
  pageCount?: number;
  wordCount?: number;
  parsedAt: string;
  version?: string;
}

// =============================================================================
// ペルソナ・分析結果
// =============================================================================

/**
 * ペルソナの設定
 */
export interface PersonaConfig {
  type: PersonaType;
  name: string;
  description: string;
  focusAreas: ClauseType[];
  riskCategories: FindingCategory[];
  systemPrompt: string;
}

/**
 * 指摘事項
 */
export interface Finding {
  id: string;
  persona: PersonaType;
  clauseRef: string;           // 参照条項ID
  clauseNumber: string;        // 条項番号（表示用）
  severity: Severity;
  category: FindingCategory;
  title: string;
  issue: string;               // 問題点の説明
  impact: string;              // 影響・リスク
  recommendation: string;      // 推奨対応
  evidence: string[];          // 根拠となる条文引用
  relatedFindings?: string[];  // 関連する指摘ID
}

/**
 * ペルソナ別分析結果
 */
export interface PersonaAnalysis {
  persona: PersonaType;
  analyzedAt: string;
  findings: Finding[];
  summary: string;
  overallRisk: Severity;
  confidence: number;          // 分析の確信度 0-1
}

// =============================================================================
// 議論アリーナ
// =============================================================================

/**
 * 議論における立場表明
 */
export interface Argument {
  position: string;            // 主張内容
  reasoning: string;           // 根拠
  evidence: string[];          // 証拠
  counterpoints?: string[];    // 想定される反論への対応
}

/**
 * 裁判官の判定
 */
export interface JudgeVerdict {
  adjustedSeverity: Severity;
  rationale: string;
  actionRequired: boolean;
  priority: number;            // 優先度（1が最高）
  negotiationAdvice?: string;  // 交渉時のアドバイス
}

/**
 * 議論の結果
 */
export interface DebateOutcome {
  findingId: string;
  finding: Finding;
  devilsPosition: Argument;
  angelsPosition: Argument;
  verdict: JudgeVerdict;
  debatedAt: string;
}

/**
 * 議論ラウンド
 */
export interface DebateRound {
  round: number;
  topic: string;
  findings: Finding[];
  outcomes: DebateOutcome[];
  completedAt: string;
}

// =============================================================================
// レポート
// =============================================================================

/**
 * エグゼクティブサマリー
 */
export interface ExecutiveSummary {
  overallAssessment: 'approve' | 'approve_with_conditions' | 'reject' | 'needs_review';
  riskLevel: Severity;
  criticalIssuesCount: number;
  highIssuesCount: number;
  keyFindings: string[];
  recommendedActions: string[];
}

/**
 * 条項別サマリー
 */
export interface ClauseSummary {
  clauseId: string;
  clauseNumber: string;
  clauseType: ClauseType;
  findings: Finding[];
  overallRisk: Severity;
  recommendation: string;
}

/**
 * 最終レビューレポート
 */
export interface ContractReviewReport {
  id: string;
  contractId: string;
  contractTitle: string;
  reviewedAt: string;
  executiveSummary: ExecutiveSummary;
  personaAnalyses: PersonaAnalysis[];
  debateOutcomes: DebateOutcome[];
  clauseSummaries: ClauseSummary[];
  allFindings: Finding[];
  prioritizedActions: PrioritizedAction[];
  metadata: ReportMetadata;
}

export interface PrioritizedAction {
  priority: number;
  action: string;
  relatedFindings: string[];
  deadline?: string;
  assignee?: string;
}

export interface ReportMetadata {
  generatedAt: string;
  generatedBy: string;
  version: string;
  processingTime: number;      // ミリ秒
}

// =============================================================================
// 入出力
// =============================================================================

/**
 * Contract Reviewer 入力
 */
export interface ContractReviewerInput {
  contractText: string;
  contractType?: ContractType;
  ourPartyName?: string;       // 自社の当事者名
  context?: ReviewContext;
  options?: ReviewOptions;
}

export interface ReviewContext {
  industry?: string;
  dealSize?: string;
  urgency?: 'low' | 'medium' | 'high';
  previousVersionId?: string;  // 前バージョンとの比較用
  notes?: string;              // レビュー時の注意事項
}

export interface ReviewOptions {
  enableDebate?: boolean;      // 議論フェーズを有効化（デフォルト: true）
  debateRounds?: number;       // 議論ラウンド数（デフォルト: 2）
  focusAreas?: ClauseType[];   // 重点チェック領域
  skipPersonas?: PersonaType[]; // スキップするペルソナ
  outputFormat?: 'full' | 'summary' | 'json';
}

/**
 * Contract Reviewer 出力
 */
export interface ContractReviewerOutput {
  success: boolean;
  report?: ContractReviewReport;
  error?: ContractReviewError;
}

export interface ContractReviewError {
  code: string;
  message: string;
  details?: unknown;
}

// =============================================================================
// イベント
// =============================================================================

export type ContractReviewEvent =
  | { type: 'parsing:start' }
  | { type: 'parsing:complete'; contract: Contract }
  | { type: 'analysis:start'; persona: PersonaType }
  | { type: 'analysis:complete'; persona: PersonaType; findings: Finding[] }
  | { type: 'debate:start'; round: number }
  | { type: 'debate:complete'; round: number; outcomes: DebateOutcome[] }
  | { type: 'synthesis:start' }
  | { type: 'synthesis:complete' }
  | { type: 'report:start' }
  | { type: 'report:complete'; report: ContractReviewReport }
  | { type: 'error'; error: ContractReviewError };

// =============================================================================
// 型ガード
// =============================================================================

export function isContract(obj: unknown): obj is Contract {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'clauses' in obj &&
    Array.isArray((obj as Contract).clauses)
  );
}

export function isFinding(obj: unknown): obj is Finding {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'persona' in obj &&
    'severity' in obj &&
    'issue' in obj
  );
}

export function isDebateOutcome(obj: unknown): obj is DebateOutcome {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'findingId' in obj &&
    'devilsPosition' in obj &&
    'angelsPosition' in obj &&
    'verdict' in obj
  );
}

// =============================================================================
// 定数
// =============================================================================

export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: '致命的',
  high: '重大',
  medium: '中程度',
  low: '軽微',
};

export const CLAUSE_TYPE_LABELS: Record<ClauseType, string> = {
  payment: '支払い条件',
  liability: '責任・賠償',
  indemnification: '補償・免責',
  termination: '契約終了',
  confidentiality: '秘密保持',
  ip_rights: '知的財産権',
  dispute_resolution: '紛争解決',
  force_majeure: '不可抗力',
  warranty: '保証',
  non_compete: '競業避止',
  assignment: '譲渡',
  governing_law: '準拠法',
  general: '一般条項',
};

export const PERSONA_LABELS: Record<PersonaType, string> = {
  legal_expert: '法務専門家',
  cfo_expert: 'CFO',
  ciso_expert: 'CISO',
  operations_expert: '現場責任者',
  devils_advocate: '悪魔の代理人',
  angels_advocate: '天使の代理人',
  judge: '裁判官',
};

export const FINDING_CATEGORY_LABELS: Record<FindingCategory, string> = {
  legal_risk: '法的リスク',
  financial_risk: '財務リスク',
  security_risk: 'セキュリティリスク',
  operational_risk: '運用リスク',
  compliance_risk: 'コンプライアンスリスク',
  reputational_risk: 'レピュテーションリスク',
};
