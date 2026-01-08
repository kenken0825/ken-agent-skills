/**
 * Base Persona - ペルソナ基盤クラス
 *
 * すべてのペルソナ（専門家・議論役）の共通インターフェースと基底実装
 */

import {
  PersonaType,
  PersonaConfig,
  Contract,
  Clause,
  Finding,
  PersonaAnalysis,
  Severity,
  ClauseType,
  FindingCategory,
  Argument,
  DebateOutcome,
  SEVERITY_WEIGHTS,
} from '../models/types';

// =============================================================================
// インターフェース
// =============================================================================

/**
 * ペルソナの分析コンテキスト
 */
export interface AnalysisContext {
  contract: Contract;
  ourPartyName?: string;
  industry?: string;
  dealSize?: string;
  previousFindings?: Finding[];
  notes?: string;
}

/**
 * 議論コンテキスト
 */
export interface DebateContext {
  contract: Contract;
  finding: Finding;
  opponentArgument?: Argument;
  round: number;
}

/**
 * ペルソナインターフェース
 */
export interface IPersona {
  readonly config: PersonaConfig;
  analyze(context: AnalysisContext): Promise<PersonaAnalysis>;
}

/**
 * 議論参加者インターフェース
 */
export interface IDebater {
  readonly config: PersonaConfig;
  argue(context: DebateContext): Promise<Argument>;
}

/**
 * 裁判官インターフェース
 */
export interface IJudge {
  readonly config: PersonaConfig;
  deliberate(
    finding: Finding,
    devilsArgument: Argument,
    angelsArgument: Argument
  ): Promise<DebateOutcome>;
}

// =============================================================================
// 基底クラス
// =============================================================================

/**
 * ペルソナ基底クラス
 *
 * すべてのペルソナに共通する機能を提供
 */
export abstract class BasePersona implements IPersona {
  public abstract readonly config: PersonaConfig;

  /**
   * 契約書を分析し、指摘事項を抽出する
   */
  public async analyze(context: AnalysisContext): Promise<PersonaAnalysis> {
    const startTime = Date.now();
    const findings: Finding[] = [];

    // フォーカス対象の条項を抽出
    const targetClauses = this.filterTargetClauses(context.contract.clauses);

    // 各条項を分析
    for (const clause of targetClauses) {
      const clauseFindings = await this.analyzeClause(clause, context);
      findings.push(...clauseFindings);
    }

    // 条項横断的な分析
    const crossCuttingFindings = await this.analyzeCrossCutting(context);
    findings.push(...crossCuttingFindings);

    // 全体リスクを算出
    const overallRisk = this.calculateOverallRisk(findings);

    // サマリー生成
    const summary = await this.generateSummary(findings, context);

    return {
      persona: this.config.type,
      analyzedAt: new Date().toISOString(),
      findings,
      summary,
      overallRisk,
      confidence: this.calculateConfidence(findings, context),
    };
  }

  /**
   * フォーカス対象の条項をフィルタリング
   */
  protected filterTargetClauses(clauses: Clause[]): Clause[] {
    const result: Clause[] = [];

    for (const clause of clauses) {
      if (this.config.focusAreas.includes(clause.type)) {
        result.push(clause);
      }
      // サブ条項も再帰的にチェック
      if (clause.subClauses) {
        result.push(...this.filterTargetClauses(clause.subClauses));
      }
    }

    return result;
  }

  /**
   * 単一条項の分析（サブクラスで実装）
   */
  protected abstract analyzeClause(
    clause: Clause,
    context: AnalysisContext
  ): Promise<Finding[]>;

  /**
   * 条項横断的な分析（デフォルトは空実装）
   */
  protected async analyzeCrossCutting(
    _context: AnalysisContext
  ): Promise<Finding[]> {
    return [];
  }

  /**
   * サマリー生成（サブクラスでオーバーライド可能）
   */
  protected async generateSummary(
    findings: Finding[],
    _context: AnalysisContext
  ): Promise<string> {
    const critical = findings.filter((f) => f.severity === 'critical').length;
    const high = findings.filter((f) => f.severity === 'high').length;
    const medium = findings.filter((f) => f.severity === 'medium').length;
    const low = findings.filter((f) => f.severity === 'low').length;

    return `${this.config.name}による分析結果: ` +
      `致命的: ${critical}件, 重大: ${high}件, 中程度: ${medium}件, 軽微: ${low}件`;
  }

  /**
   * 全体リスクレベルを算出
   */
  protected calculateOverallRisk(findings: Finding[]): Severity {
    if (findings.length === 0) return 'low';

    // 最も深刻なリスクを返す
    if (findings.some((f) => f.severity === 'critical')) return 'critical';
    if (findings.some((f) => f.severity === 'high')) return 'high';
    if (findings.some((f) => f.severity === 'medium')) return 'medium';
    return 'low';
  }

  /**
   * 分析の確信度を算出（0-1）
   */
  protected calculateConfidence(
    findings: Finding[],
    context: AnalysisContext
  ): number {
    // 基本確信度
    let confidence = 0.7;

    // 条項数に基づく調整
    const clauseCount = context.contract.clauses.length;
    if (clauseCount > 10) confidence += 0.1;
    if (clauseCount > 20) confidence += 0.05;

    // 指摘の根拠の充実度
    const avgEvidence =
      findings.length > 0
        ? findings.reduce((sum, f) => sum + f.evidence.length, 0) / findings.length
        : 0;
    if (avgEvidence >= 2) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Finding IDを生成
   */
  protected generateFindingId(): string {
    return `${this.config.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Findingを作成するヘルパー
   */
  protected createFinding(
    clause: Clause,
    params: {
      severity: Severity;
      category: FindingCategory;
      title: string;
      issue: string;
      impact: string;
      recommendation: string;
      evidence?: string[];
    }
  ): Finding {
    return {
      id: this.generateFindingId(),
      persona: this.config.type,
      clauseRef: clause.id,
      clauseNumber: clause.number,
      severity: params.severity,
      category: params.category,
      title: params.title,
      issue: params.issue,
      impact: params.impact,
      recommendation: params.recommendation,
      evidence: params.evidence || [clause.content.substring(0, 200)],
    };
  }
}

// =============================================================================
// 議論者基底クラス
// =============================================================================

/**
 * 議論参加者の基底クラス
 */
export abstract class BaseDebater implements IDebater {
  public abstract readonly config: PersonaConfig;

  /**
   * 議論における主張を生成
   */
  public abstract argue(context: DebateContext): Promise<Argument>;

  /**
   * 主張の強度を計算（重要度スコアリング用）
   */
  protected calculateArgumentStrength(
    finding: Finding,
    evidenceCount: number
  ): number {
    const severityWeight = SEVERITY_WEIGHTS[finding.severity];
    const evidenceWeight = Math.min(evidenceCount * 0.2, 1);
    return (severityWeight / 4) * 0.6 + evidenceWeight * 0.4;
  }

  /**
   * 反論を構築するヘルパー
   */
  protected buildCounterpoints(
    opponentArgument: Argument | undefined
  ): string[] {
    if (!opponentArgument) return [];

    // 相手の主張に対する反論ポイントを抽出
    // サブクラスでより具体的な実装を行う
    return [];
  }
}

// =============================================================================
// ユーティリティ関数
// =============================================================================

/**
 * 複数のペルソナ分析結果を統合
 */
export function mergePersonaAnalyses(
  analyses: PersonaAnalysis[]
): {
  allFindings: Finding[];
  findingsByClause: Map<string, Finding[]>;
  findingsBySeverity: Map<Severity, Finding[]>;
} {
  const allFindings: Finding[] = [];
  const findingsByClause = new Map<string, Finding[]>();
  const findingsBySeverity = new Map<Severity, Finding[]>();

  for (const analysis of analyses) {
    for (const finding of analysis.findings) {
      allFindings.push(finding);

      // 条項別にグループ化
      const clauseFindings = findingsByClause.get(finding.clauseRef) || [];
      clauseFindings.push(finding);
      findingsByClause.set(finding.clauseRef, clauseFindings);

      // 重要度別にグループ化
      const severityFindings = findingsBySeverity.get(finding.severity) || [];
      severityFindings.push(finding);
      findingsBySeverity.set(finding.severity, severityFindings);
    }
  }

  return { allFindings, findingsByClause, findingsBySeverity };
}

/**
 * Findingsを重要度でソート
 */
export function sortFindingsBySeverity(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    return SEVERITY_WEIGHTS[b.severity] - SEVERITY_WEIGHTS[a.severity];
  });
}

/**
 * 重複する指摘をマージ
 */
export function deduplicateFindings(findings: Finding[]): Finding[] {
  const seen = new Map<string, Finding>();

  for (const finding of findings) {
    // 同じ条項・同じ問題カテゴリの指摘をキーとする
    const key = `${finding.clauseRef}-${finding.category}-${finding.title}`;

    if (!seen.has(key)) {
      seen.set(key, finding);
    } else {
      // 既存の指摘とマージ（より深刻な方を採用）
      const existing = seen.get(key)!;
      if (SEVERITY_WEIGHTS[finding.severity] > SEVERITY_WEIGHTS[existing.severity]) {
        // 新しい指摘の方が深刻な場合、置き換え
        const merged: Finding = {
          ...finding,
          evidence: [...new Set([...existing.evidence, ...finding.evidence])],
          relatedFindings: [
            ...(existing.relatedFindings || []),
            existing.id,
          ],
        };
        seen.set(key, merged);
      } else {
        // 既存の指摘に追加情報をマージ
        existing.evidence = [...new Set([...existing.evidence, ...finding.evidence])];
        existing.relatedFindings = [
          ...(existing.relatedFindings || []),
          finding.id,
        ];
      }
    }
  }

  return Array.from(seen.values());
}
