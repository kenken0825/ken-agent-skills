/**
 * Finding Synthesizer - 指摘統合・優先度付けモジュール
 *
 * 複数のペルソナからの指摘を統合し、
 * 重複を排除して優先度順に整理する
 */

import {
  Finding,
  PersonaAnalysis,
  DebateOutcome,
  ClauseSummary,
  PrioritizedAction,
  Contract,
  Clause,
  Severity,
  SEVERITY_WEIGHTS,
  CLAUSE_TYPE_LABELS,
} from '../models/types';
import {
  sortFindingsBySeverity,
  deduplicateFindings,
} from '../personas/base-persona';

// =============================================================================
// 型定義
// =============================================================================

export interface SynthesisInput {
  contract: Contract;
  personaAnalyses: PersonaAnalysis[];
  debateOutcomes: DebateOutcome[];
}

export interface SynthesisOutput {
  allFindings: Finding[];
  clauseSummaries: ClauseSummary[];
  prioritizedActions: PrioritizedAction[];
  statistics: SynthesisStatistics;
}

export interface SynthesisStatistics {
  totalFindings: number;
  uniqueFindings: number;
  findingsBySeverity: Record<Severity, number>;
  findingsByCategory: Record<string, number>;
  findingsByClause: Record<string, number>;
  findingsByPersona: Record<string, number>;
  averageSeverity: number;
}

// =============================================================================
// Finding Synthesizer クラス
// =============================================================================

export class FindingSynthesizer {
  /**
   * 指摘を統合・整理する
   */
  public synthesize(input: SynthesisInput): SynthesisOutput {
    const { contract, personaAnalyses, debateOutcomes } = input;

    // 1. 全指摘を収集
    const rawFindings = this.collectAllFindings(personaAnalyses, debateOutcomes);

    // 2. 重複を排除
    const uniqueFindings = deduplicateFindings(rawFindings);

    // 3. 議論結果を反映（重要度調整）
    const adjustedFindings = this.applyDebateAdjustments(uniqueFindings, debateOutcomes);

    // 4. 重要度でソート
    const sortedFindings = sortFindingsBySeverity(adjustedFindings);

    // 5. 条項別サマリーを生成
    const clauseSummaries = this.generateClauseSummaries(
      sortedFindings,
      contract.clauses
    );

    // 6. 優先アクションを抽出
    const prioritizedActions = this.extractPrioritizedActions(
      sortedFindings,
      debateOutcomes
    );

    // 7. 統計を計算
    const statistics = this.calculateStatistics(rawFindings, sortedFindings);

    return {
      allFindings: sortedFindings,
      clauseSummaries,
      prioritizedActions,
      statistics,
    };
  }

  /**
   * 全指摘を収集
   */
  private collectAllFindings(
    personaAnalyses: PersonaAnalysis[],
    debateOutcomes: DebateOutcome[]
  ): Finding[] {
    const findings: Finding[] = [];

    // ペルソナ分析からの指摘
    for (const analysis of personaAnalyses) {
      findings.push(...analysis.findings);
    }

    // 議論で生成された追加指摘（あれば）
    for (const outcome of debateOutcomes) {
      // 既存の指摘と重複しない場合のみ追加
      if (!findings.some((f) => f.id === outcome.finding.id)) {
        findings.push(outcome.finding);
      }
    }

    return findings;
  }

  /**
   * 議論結果を反映して重要度を調整
   */
  private applyDebateAdjustments(
    findings: Finding[],
    debateOutcomes: DebateOutcome[]
  ): Finding[] {
    const outcomeMap = new Map(
      debateOutcomes.map((o) => [o.findingId, o])
    );

    return findings.map((finding) => {
      const outcome = outcomeMap.get(finding.id);
      if (outcome && outcome.verdict.adjustedSeverity !== finding.severity) {
        return {
          ...finding,
          severity: outcome.verdict.adjustedSeverity,
        };
      }
      return finding;
    });
  }

  /**
   * 条項別サマリーを生成
   */
  private generateClauseSummaries(
    findings: Finding[],
    clauses: Clause[]
  ): ClauseSummary[] {
    // 条項別にグループ化
    const findingsByClause = new Map<string, Finding[]>();

    for (const finding of findings) {
      const clauseFindings = findingsByClause.get(finding.clauseRef) || [];
      clauseFindings.push(finding);
      findingsByClause.set(finding.clauseRef, clauseFindings);
    }

    // サマリーを生成
    const summaries: ClauseSummary[] = [];

    for (const [clauseRef, clauseFindings] of findingsByClause) {
      const clause = clauses.find((c) => c.id === clauseRef);

      // 最も深刻な重要度を取得
      const overallRisk = this.getHighestSeverity(clauseFindings);

      // 推奨事項を統合
      const recommendation = this.synthesizeRecommendations(clauseFindings);

      summaries.push({
        clauseId: clauseRef,
        clauseNumber: clause?.number || clauseRef,
        clauseType: clause?.type || 'general',
        findings: clauseFindings,
        overallRisk,
        recommendation,
      });
    }

    // リスクの高い順にソート
    return summaries.sort(
      (a, b) => SEVERITY_WEIGHTS[b.overallRisk] - SEVERITY_WEIGHTS[a.overallRisk]
    );
  }

  /**
   * 最も深刻な重要度を取得
   */
  private getHighestSeverity(findings: Finding[]): Severity {
    if (findings.length === 0) return 'low';

    if (findings.some((f) => f.severity === 'critical')) return 'critical';
    if (findings.some((f) => f.severity === 'high')) return 'high';
    if (findings.some((f) => f.severity === 'medium')) return 'medium';
    return 'low';
  }

  /**
   * 推奨事項を統合
   */
  private synthesizeRecommendations(findings: Finding[]): string {
    // 重要度の高い順に推奨事項を連結
    const sorted = sortFindingsBySeverity(findings);
    const recommendations = sorted
      .map((f) => f.recommendation)
      .filter((r, i, arr) => arr.indexOf(r) === i); // 重複排除

    if (recommendations.length === 0) {
      return '特に推奨事項はありません。';
    }

    if (recommendations.length === 1) {
      return recommendations[0];
    }

    return recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n');
  }

  /**
   * 優先アクションを抽出
   */
  private extractPrioritizedActions(
    findings: Finding[],
    debateOutcomes: DebateOutcome[]
  ): PrioritizedAction[] {
    const actions: PrioritizedAction[] = [];
    const outcomeMap = new Map(
      debateOutcomes.map((o) => [o.findingId, o])
    );

    // 重要度の高い指摘からアクションを抽出
    const criticalAndHigh = findings.filter(
      (f) => f.severity === 'critical' || f.severity === 'high'
    );

    for (let i = 0; i < criticalAndHigh.length; i++) {
      const finding = criticalAndHigh[i];
      const outcome = outcomeMap.get(finding.id);

      actions.push({
        priority: i + 1,
        action: finding.recommendation,
        relatedFindings: [finding.id],
        deadline: this.estimateDeadline(finding, outcome),
      });
    }

    // 中程度のリスクもアクションとして追加（優先度は低い）
    const mediumFindings = findings.filter((f) => f.severity === 'medium');
    for (let i = 0; i < Math.min(mediumFindings.length, 5); i++) {
      const finding = mediumFindings[i];
      actions.push({
        priority: criticalAndHigh.length + i + 1,
        action: finding.recommendation,
        relatedFindings: [finding.id],
      });
    }

    return actions;
  }

  /**
   * 期限を推定
   */
  private estimateDeadline(
    finding: Finding,
    outcome?: DebateOutcome
  ): string | undefined {
    if (finding.severity === 'critical') {
      return '契約締結前に必ず対応';
    }
    if (finding.severity === 'high') {
      return '契約締結前に対応推奨';
    }
    if (outcome?.verdict.actionRequired) {
      return '契約締結までに対応検討';
    }
    return undefined;
  }

  /**
   * 統計を計算
   */
  private calculateStatistics(
    rawFindings: Finding[],
    uniqueFindings: Finding[]
  ): SynthesisStatistics {
    const findingsBySeverity: Record<Severity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const findingsByCategory: Record<string, number> = {};
    const findingsByClause: Record<string, number> = {};
    const findingsByPersona: Record<string, number> = {};

    let totalSeverityWeight = 0;

    for (const finding of uniqueFindings) {
      // 重要度別
      findingsBySeverity[finding.severity]++;
      totalSeverityWeight += SEVERITY_WEIGHTS[finding.severity];

      // カテゴリ別
      findingsByCategory[finding.category] =
        (findingsByCategory[finding.category] || 0) + 1;

      // 条項別
      findingsByClause[finding.clauseRef] =
        (findingsByClause[finding.clauseRef] || 0) + 1;

      // ペルソナ別
      findingsByPersona[finding.persona] =
        (findingsByPersona[finding.persona] || 0) + 1;
    }

    return {
      totalFindings: rawFindings.length,
      uniqueFindings: uniqueFindings.length,
      findingsBySeverity,
      findingsByCategory,
      findingsByClause,
      findingsByPersona,
      averageSeverity:
        uniqueFindings.length > 0
          ? totalSeverityWeight / uniqueFindings.length
          : 0,
    };
  }
}

// =============================================================================
// ファクトリ関数
// =============================================================================

export function createFindingSynthesizer(): FindingSynthesizer {
  return new FindingSynthesizer();
}
