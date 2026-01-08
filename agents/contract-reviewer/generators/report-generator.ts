/**
 * Report Generator - レポート生成モジュール
 *
 * 契約レビュー結果を各種フォーマットで出力
 */

import {
  ContractReviewReport,
  ExecutiveSummary,
  Contract,
  PersonaAnalysis,
  DebateOutcome,
  ClauseSummary,
  PrioritizedAction,
  Finding,
  Severity,
  SEVERITY_LABELS,
  CLAUSE_TYPE_LABELS,
  PERSONA_LABELS,
  FINDING_CATEGORY_LABELS,
  SEVERITY_WEIGHTS,
} from '../models/types';
import { SynthesisOutput, SynthesisStatistics } from '../synthesizers/finding-synthesizer';

// =============================================================================
// 型定義
// =============================================================================

export interface ReportGeneratorConfig {
  format: 'full' | 'summary' | 'json';
  language: 'ja' | 'en';
  includeDebateDetails: boolean;
  includeStatistics: boolean;
  maxFindingsInSummary: number;
}

export interface ReportInput {
  contract: Contract;
  personaAnalyses: PersonaAnalysis[];
  debateOutcomes: DebateOutcome[];
  synthesis: SynthesisOutput;
  processingTime: number;
}

// =============================================================================
// Report Generator クラス
// =============================================================================

export class ReportGenerator {
  private config: ReportGeneratorConfig;

  constructor(config?: Partial<ReportGeneratorConfig>) {
    this.config = {
      format: config?.format ?? 'full',
      language: config?.language ?? 'ja',
      includeDebateDetails: config?.includeDebateDetails ?? true,
      includeStatistics: config?.includeStatistics ?? true,
      maxFindingsInSummary: config?.maxFindingsInSummary ?? 5,
    };
  }

  /**
   * レポートを生成
   */
  public generate(input: ReportInput): ContractReviewReport {
    const {
      contract,
      personaAnalyses,
      debateOutcomes,
      synthesis,
      processingTime,
    } = input;

    // エグゼクティブサマリーを生成
    const executiveSummary = this.generateExecutiveSummary(
      synthesis,
      debateOutcomes
    );

    const report: ContractReviewReport = {
      id: this.generateReportId(),
      contractId: contract.id,
      contractTitle: contract.title,
      reviewedAt: new Date().toISOString(),
      executiveSummary,
      personaAnalyses,
      debateOutcomes,
      clauseSummaries: synthesis.clauseSummaries,
      allFindings: synthesis.allFindings,
      prioritizedActions: synthesis.prioritizedActions,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Contract Review Agent v1.0',
        version: '1.0.0',
        processingTime,
      },
    };

    return report;
  }

  /**
   * エグゼクティブサマリーを生成
   */
  private generateExecutiveSummary(
    synthesis: SynthesisOutput,
    debateOutcomes: DebateOutcome[]
  ): ExecutiveSummary {
    const { allFindings, statistics } = synthesis;

    // 総合評価を決定
    const overallAssessment = this.determineOverallAssessment(statistics);

    // リスクレベルを決定
    const riskLevel = this.determineRiskLevel(statistics);

    // キーとなる指摘を抽出
    const keyFindings = this.extractKeyFindings(
      allFindings,
      this.config.maxFindingsInSummary
    );

    // 推奨アクションを抽出
    const recommendedActions = this.extractRecommendedActions(
      synthesis.prioritizedActions,
      debateOutcomes
    );

    return {
      overallAssessment,
      riskLevel,
      criticalIssuesCount: statistics.findingsBySeverity.critical,
      highIssuesCount: statistics.findingsBySeverity.high,
      keyFindings,
      recommendedActions,
    };
  }

  /**
   * 総合評価を決定
   */
  private determineOverallAssessment(
    statistics: SynthesisStatistics
  ): ExecutiveSummary['overallAssessment'] {
    const { findingsBySeverity } = statistics;

    if (findingsBySeverity.critical > 0) {
      return 'reject';
    }
    if (findingsBySeverity.high > 2) {
      return 'needs_review';
    }
    if (findingsBySeverity.high > 0 || findingsBySeverity.medium > 3) {
      return 'approve_with_conditions';
    }
    return 'approve';
  }

  /**
   * リスクレベルを決定
   */
  private determineRiskLevel(statistics: SynthesisStatistics): Severity {
    const { findingsBySeverity } = statistics;

    if (findingsBySeverity.critical > 0) return 'critical';
    if (findingsBySeverity.high > 0) return 'high';
    if (findingsBySeverity.medium > 0) return 'medium';
    return 'low';
  }

  /**
   * キーとなる指摘を抽出
   */
  private extractKeyFindings(findings: Finding[], maxCount: number): string[] {
    const topFindings = findings
      .filter((f) => f.severity === 'critical' || f.severity === 'high')
      .slice(0, maxCount);

    return topFindings.map((f) => `[${SEVERITY_LABELS[f.severity]}] ${f.title}: ${f.issue}`);
  }

  /**
   * 推奨アクションを抽出
   */
  private extractRecommendedActions(
    actions: PrioritizedAction[],
    _debateOutcomes: DebateOutcome[]
  ): string[] {
    return actions.slice(0, 5).map((a, i) => `${i + 1}. ${a.action}`);
  }

  /**
   * レポートをテキスト形式で出力
   */
  public formatAsText(report: ContractReviewReport): string {
    switch (this.config.format) {
      case 'summary':
        return this.formatSummary(report);
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'full':
      default:
        return this.formatFull(report);
    }
  }

  /**
   * フルレポートを生成
   */
  private formatFull(report: ContractReviewReport): string {
    const lines: string[] = [];

    // ヘッダー
    lines.push('═'.repeat(80));
    lines.push('契約書レビューレポート');
    lines.push('═'.repeat(80));
    lines.push('');

    // 基本情報
    lines.push(`【契約書情報】`);
    lines.push(`タイトル: ${report.contractTitle}`);
    lines.push(`レビュー日時: ${report.reviewedAt}`);
    lines.push(`処理時間: ${report.metadata.processingTime}ms`);
    lines.push('');

    // エグゼクティブサマリー
    lines.push('─'.repeat(80));
    lines.push('エグゼクティブサマリー');
    lines.push('─'.repeat(80));
    lines.push('');
    lines.push(this.formatExecutiveSummary(report.executiveSummary));
    lines.push('');

    // 優先アクション
    lines.push('─'.repeat(80));
    lines.push('優先アクション');
    lines.push('─'.repeat(80));
    lines.push('');
    lines.push(this.formatPrioritizedActions(report.prioritizedActions));
    lines.push('');

    // 条項別サマリー
    lines.push('─'.repeat(80));
    lines.push('条項別リスク分析');
    lines.push('─'.repeat(80));
    lines.push('');
    lines.push(this.formatClauseSummaries(report.clauseSummaries));
    lines.push('');

    // ペルソナ別分析
    lines.push('─'.repeat(80));
    lines.push('専門家別分析結果');
    lines.push('─'.repeat(80));
    lines.push('');
    lines.push(this.formatPersonaAnalyses(report.personaAnalyses));
    lines.push('');

    // 議論結果
    if (this.config.includeDebateDetails && report.debateOutcomes.length > 0) {
      lines.push('─'.repeat(80));
      lines.push('議論結果（悪魔 vs 天使）');
      lines.push('─'.repeat(80));
      lines.push('');
      lines.push(this.formatDebateOutcomes(report.debateOutcomes));
      lines.push('');
    }

    // 全指摘一覧
    lines.push('─'.repeat(80));
    lines.push('全指摘事項一覧');
    lines.push('─'.repeat(80));
    lines.push('');
    lines.push(this.formatAllFindings(report.allFindings));
    lines.push('');

    // フッター
    lines.push('═'.repeat(80));
    lines.push(`Generated by: ${report.metadata.generatedBy}`);
    lines.push(`Version: ${report.metadata.version}`);
    lines.push('═'.repeat(80));

    return lines.join('\n');
  }

  /**
   * サマリーレポートを生成
   */
  private formatSummary(report: ContractReviewReport): string {
    const lines: string[] = [];

    lines.push('【契約書レビュー サマリー】');
    lines.push('');
    lines.push(`契約書: ${report.contractTitle}`);
    lines.push(`レビュー日時: ${report.reviewedAt}`);
    lines.push('');
    lines.push(this.formatExecutiveSummary(report.executiveSummary));
    lines.push('');
    lines.push('【優先アクション（上位3件）】');
    lines.push(this.formatPrioritizedActions(report.prioritizedActions.slice(0, 3)));

    return lines.join('\n');
  }

  /**
   * エグゼクティブサマリーをフォーマット
   */
  private formatExecutiveSummary(summary: ExecutiveSummary): string {
    const lines: string[] = [];

    // 総合評価
    const assessmentLabels = {
      approve: '✅ 承認推奨',
      approve_with_conditions: '⚠️ 条件付き承認',
      reject: '❌ 契約見送り推奨',
      needs_review: '🔍 追加レビュー必要',
    };
    lines.push(`総合評価: ${assessmentLabels[summary.overallAssessment]}`);
    lines.push(`リスクレベル: ${SEVERITY_LABELS[summary.riskLevel]}`);
    lines.push('');

    // 指摘件数
    lines.push(`指摘件数:`);
    lines.push(`  致命的: ${summary.criticalIssuesCount}件`);
    lines.push(`  重大: ${summary.highIssuesCount}件`);
    lines.push('');

    // キー指摘
    if (summary.keyFindings.length > 0) {
      lines.push(`主な指摘事項:`);
      summary.keyFindings.forEach((f) => {
        lines.push(`  • ${f}`);
      });
      lines.push('');
    }

    // 推奨アクション
    if (summary.recommendedActions.length > 0) {
      lines.push(`推奨アクション:`);
      summary.recommendedActions.forEach((a) => {
        lines.push(`  ${a}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * 優先アクションをフォーマット
   */
  private formatPrioritizedActions(actions: PrioritizedAction[]): string {
    if (actions.length === 0) {
      return '特に対応が必要なアクションはありません。';
    }

    const lines: string[] = [];
    for (const action of actions) {
      lines.push(`[優先度${action.priority}] ${action.action}`);
      if (action.deadline) {
        lines.push(`  期限: ${action.deadline}`);
      }
    }
    return lines.join('\n');
  }

  /**
   * 条項別サマリーをフォーマット
   */
  private formatClauseSummaries(summaries: ClauseSummary[]): string {
    if (summaries.length === 0) {
      return '条項別の指摘はありません。';
    }

    const lines: string[] = [];
    for (const summary of summaries) {
      const clauseLabel = CLAUSE_TYPE_LABELS[summary.clauseType] || summary.clauseType;
      lines.push(`【${summary.clauseNumber}】${clauseLabel}`);
      lines.push(`  リスク: ${SEVERITY_LABELS[summary.overallRisk]}`);
      lines.push(`  指摘件数: ${summary.findings.length}件`);
      lines.push(`  推奨: ${summary.recommendation.split('\n')[0]}`);
      lines.push('');
    }
    return lines.join('\n');
  }

  /**
   * ペルソナ別分析をフォーマット
   */
  private formatPersonaAnalyses(analyses: PersonaAnalysis[]): string {
    const lines: string[] = [];

    for (const analysis of analyses) {
      const personaLabel = PERSONA_LABELS[analysis.persona] || analysis.persona;
      lines.push(`【${personaLabel}】`);
      lines.push(`  全体リスク: ${SEVERITY_LABELS[analysis.overallRisk]}`);
      lines.push(`  検出件数: ${analysis.findings.length}件`);
      lines.push(`  確信度: ${(analysis.confidence * 100).toFixed(0)}%`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 議論結果をフォーマット
   */
  private formatDebateOutcomes(outcomes: DebateOutcome[]): string {
    const lines: string[] = [];

    for (const outcome of outcomes) {
      lines.push(`【${outcome.finding.title}】`);
      lines.push(`  元の重要度: ${SEVERITY_LABELS[outcome.finding.severity]}`);
      lines.push(`  調整後: ${SEVERITY_LABELS[outcome.verdict.adjustedSeverity]}`);
      lines.push('');
      lines.push(`  悪魔の主張: ${outcome.devilsPosition.position.split('\n')[0]}`);
      lines.push(`  天使の主張: ${outcome.angelsPosition.position.split('\n')[0]}`);
      lines.push('');
      lines.push(`  裁判官判定: ${outcome.verdict.rationale.split('\n')[0]}`);
      lines.push(`  アクション要否: ${outcome.verdict.actionRequired ? '必要' : '不要'}`);
      lines.push('');
      lines.push('─'.repeat(40));
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 全指摘をフォーマット
   */
  private formatAllFindings(findings: Finding[]): string {
    const lines: string[] = [];

    for (const finding of findings) {
      const severityLabel = SEVERITY_LABELS[finding.severity];
      const categoryLabel = FINDING_CATEGORY_LABELS[finding.category] || finding.category;
      const personaLabel = PERSONA_LABELS[finding.persona] || finding.persona;

      lines.push(`[${severityLabel}] ${finding.title}`);
      lines.push(`  条項: ${finding.clauseNumber}`);
      lines.push(`  カテゴリ: ${categoryLabel}`);
      lines.push(`  検出者: ${personaLabel}`);
      lines.push(`  問題: ${finding.issue}`);
      lines.push(`  影響: ${finding.impact}`);
      lines.push(`  推奨: ${finding.recommendation}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * レポートIDを生成
   */
  private generateReportId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// =============================================================================
// ファクトリ関数
// =============================================================================

export function createReportGenerator(
  config?: Partial<ReportGeneratorConfig>
): ReportGenerator {
  return new ReportGenerator(config);
}
