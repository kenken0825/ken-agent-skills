/**
 * Judge Persona - 裁判官ペルソナ
 *
 * 悪魔と天使の議論を踏まえ、中立的な立場で最終判定を下す
 */

import {
  PersonaConfig,
  Finding,
  Argument,
  DebateOutcome,
  JudgeVerdict,
  Severity,
  SEVERITY_WEIGHTS,
} from '../models/types';
import { DebateContext, IJudge } from './base-persona';

// =============================================================================
// 裁判官の設定
// =============================================================================

const JUDGE_CONFIG: PersonaConfig = {
  type: 'judge',
  name: '裁判官',
  description: '悪魔と天使の議論を聴取し、中立的かつ公正な判定を下す',
  focusAreas: [],
  riskCategories: [],
  systemPrompt: `あなたは経験豊富な契約審査の裁判官です。
悪魔の代理人と天使の代理人の両方の主張を公平に聴取し、
客観的な証拠に基づいて最終的な判定を下します。

【役割】
- 両者の主張を公平に評価する
- 証拠と論理に基づいて判断する
- リスクの重要度を適切に調整する
- 実行可能なアクションを提示する

【姿勢】
- 中立かつ公正
- 感情に流されない
- 実務的で現実的
- 明確な根拠に基づいて判断する`,
};

// =============================================================================
// 判定基準
// =============================================================================

interface JudgingCriteria {
  evidenceWeight: number;      // 証拠の重み
  logicWeight: number;         // 論理の整合性
  practicalityWeight: number;  // 実務的妥当性
  industryNormWeight: number;  // 業界慣行との整合性
}

const DEFAULT_JUDGING_CRITERIA: JudgingCriteria = {
  evidenceWeight: 0.35,
  logicWeight: 0.25,
  practicalityWeight: 0.25,
  industryNormWeight: 0.15,
};

// =============================================================================
// 裁判官クラス
// =============================================================================

export class Judge implements IJudge {
  public readonly config = JUDGE_CONFIG;
  private criteria: JudgingCriteria;

  constructor(criteria?: Partial<JudgingCriteria>) {
    this.criteria = { ...DEFAULT_JUDGING_CRITERIA, ...criteria };
  }

  /**
   * 議論を踏まえて最終判定を下す
   */
  public async deliberate(
    finding: Finding,
    devilsArgument: Argument,
    angelsArgument: Argument
  ): Promise<DebateOutcome> {
    // 両者の主張を評価
    const devilScore = this.evaluateArgument(devilsArgument, finding);
    const angelScore = this.evaluateArgument(angelsArgument, finding);

    // 重要度を調整
    const adjustedSeverity = this.adjustSeverity(
      finding.severity,
      devilScore,
      angelScore
    );

    // 判定理由を構築
    const rationale = this.buildRationale(
      finding,
      devilsArgument,
      angelsArgument,
      devilScore,
      angelScore,
      adjustedSeverity
    );

    // アクション要否を判定
    const actionRequired = this.determineActionRequired(adjustedSeverity);

    // 優先度を決定
    const priority = this.determinePriority(adjustedSeverity, finding);

    // 交渉アドバイスを生成
    const negotiationAdvice = this.generateNegotiationAdvice(
      finding,
      adjustedSeverity,
      devilsArgument,
      angelsArgument
    );

    const verdict: JudgeVerdict = {
      adjustedSeverity,
      rationale,
      actionRequired,
      priority,
      negotiationAdvice,
    };

    return {
      findingId: finding.id,
      finding,
      devilsPosition: devilsArgument,
      angelsPosition: angelsArgument,
      verdict,
      debatedAt: new Date().toISOString(),
    };
  }

  /**
   * 主張を評価してスコアを算出
   */
  private evaluateArgument(argument: Argument, finding: Finding): number {
    let score = 0;

    // 証拠の評価
    const evidenceScore = this.evaluateEvidence(argument.evidence);
    score += evidenceScore * this.criteria.evidenceWeight;

    // 論理の整合性評価
    const logicScore = this.evaluateLogic(argument.reasoning);
    score += logicScore * this.criteria.logicWeight;

    // 実務的妥当性評価
    const practicalScore = this.evaluatePracticality(argument, finding);
    score += practicalScore * this.criteria.practicalityWeight;

    // 業界慣行との整合性評価
    const industryScore = this.evaluateIndustryNorm(argument);
    score += industryScore * this.criteria.industryNormWeight;

    return score;
  }

  /**
   * 証拠を評価
   */
  private evaluateEvidence(evidence: string[]): number {
    if (evidence.length === 0) return 0.2;

    // 証拠の数と質を評価
    const quantityScore = Math.min(evidence.length / 3, 1) * 0.5;

    // 具体的な数値やデータへの言及
    const hasQuantitative = evidence.some((e) =>
      /\d+[%％]|\d+[万億円]|\d+件|\d+年/.test(e)
    );
    const qualityScore = hasQuantitative ? 0.5 : 0.3;

    return quantityScore + qualityScore;
  }

  /**
   * 論理の整合性を評価
   */
  private evaluateLogic(reasoning: string): number {
    let score = 0.5; // 基本スコア

    // 構造化された論理展開
    const hasStructure = /【.*】|1\.|・|→/.test(reasoning);
    if (hasStructure) score += 0.2;

    // 因果関係の明示
    const hasCausality = /ため|から|により|結果|したがって|because|therefore/.test(reasoning);
    if (hasCausality) score += 0.15;

    // 反論への対応
    const addressesCounterargument = /一方|ただし|しかし|although|however/.test(reasoning);
    if (addressesCounterargument) score += 0.15;

    return Math.min(score, 1);
  }

  /**
   * 実務的妥当性を評価
   */
  private evaluatePracticality(argument: Argument, finding: Finding): number {
    let score = 0.5;

    // 具体的な対策・緩和策の提示
    const hasActionable = /対応可能|緩和策|対策|交渉|修正/.test(
      argument.position + argument.reasoning
    );
    if (hasActionable) score += 0.25;

    // 実現可能性への言及
    const discussesFeasibility = /実行可能|達成可能|管理可能|feasible|achievable/.test(
      argument.position + argument.reasoning
    );
    if (discussesFeasibility) score += 0.25;

    return Math.min(score, 1);
  }

  /**
   * 業界慣行との整合性を評価
   */
  private evaluateIndustryNorm(argument: Argument): number {
    let score = 0.4;

    // 業界標準への言及
    const mentionsStandard = /業界標準|業界慣行|一般的|通常|standard|common|typical/.test(
      argument.position + argument.reasoning
    );
    if (mentionsStandard) score += 0.3;

    // 他社事例への言及
    const mentionsPractice = /他社|競合|同業|事例|case|example/.test(
      argument.position + argument.reasoning
    );
    if (mentionsPractice) score += 0.3;

    return Math.min(score, 1);
  }

  /**
   * 重要度を調整
   */
  private adjustSeverity(
    originalSeverity: Severity,
    devilScore: number,
    angelScore: number
  ): Severity {
    const severityLevels: Severity[] = ['low', 'medium', 'high', 'critical'];
    const currentIndex = severityLevels.indexOf(originalSeverity);

    // スコア差に基づいて調整
    const scoreDiff = devilScore - angelScore;

    let adjustment = 0;
    if (scoreDiff > 0.3) {
      // 悪魔の主張が優勢 → 重要度を上げる
      adjustment = 1;
    } else if (scoreDiff < -0.3) {
      // 天使の主張が優勢 → 重要度を下げる
      adjustment = -1;
    }
    // 差が小さい場合は現状維持

    const newIndex = Math.max(0, Math.min(3, currentIndex + adjustment));
    return severityLevels[newIndex];
  }

  /**
   * 判定理由を構築
   */
  private buildRationale(
    finding: Finding,
    devilsArgument: Argument,
    angelsArgument: Argument,
    devilScore: number,
    angelScore: number,
    adjustedSeverity: Severity
  ): string {
    const winner = devilScore > angelScore ? '悪魔の代理人' : '天使の代理人';
    const scoreDiff = Math.abs(devilScore - angelScore);
    const margin = scoreDiff > 0.3 ? '明確に' : scoreDiff > 0.1 ? 'やや' : 'わずかに';

    let rationale = `【判定結果】\n`;
    rationale += `${winner}の主張が${margin}優勢と判断しました。\n\n`;

    rationale += `【評価スコア】\n`;
    rationale += `悪魔の代理人: ${(devilScore * 100).toFixed(1)}点\n`;
    rationale += `天使の代理人: ${(angelScore * 100).toFixed(1)}点\n\n`;

    // 重要度変更の説明
    if (adjustedSeverity !== finding.severity) {
      rationale += `【重要度の調整】\n`;
      rationale += `${finding.severity} → ${adjustedSeverity}\n`;
      rationale += `議論の結果を踏まえ、重要度を調整しました。\n\n`;
    }

    rationale += `【判断の根拠】\n`;

    if (devilScore > angelScore) {
      rationale += `• 悪魔の代理人が指摘するリスクは現実的であり、無視できません\n`;
      rationale += `• 天使の代理人の緩和策は有効ですが、リスクを完全には解消しません\n`;
      rationale += `• このリスクへの対応は契約締結の条件とすべきです\n`;
    } else {
      rationale += `• 天使の代理人が示す緩和策は実行可能であり、有効です\n`;
      rationale += `• 悪魔の代理人の懸念は最悪のケースであり、発生確率は低いと判断します\n`;
      rationale += `• 適切な管理を前提に、契約締結を進めることができます\n`;
    }

    return rationale;
  }

  /**
   * アクション要否を判定
   */
  private determineActionRequired(severity: Severity): boolean {
    // medium以上は要アクション
    return severity === 'critical' || severity === 'high' || severity === 'medium';
  }

  /**
   * 優先度を決定
   */
  private determinePriority(severity: Severity, finding: Finding): number {
    const basePriority = SEVERITY_WEIGHTS[severity];

    // カテゴリによる調整
    const categoryPriorityBoost: Record<string, number> = {
      legal_risk: 1,
      compliance_risk: 1,
      security_risk: 0.5,
      financial_risk: 0.5,
      operational_risk: 0,
      reputational_risk: 0,
    };

    const boost = categoryPriorityBoost[finding.category] || 0;

    // 優先度は1が最高
    // SEVERITY_WEIGHTS: critical=4, high=3, medium=2, low=1
    // priority: 1〜10の範囲（1が最優先）
    return Math.max(1, 11 - (basePriority + boost) * 2);
  }

  /**
   * 交渉アドバイスを生成
   */
  private generateNegotiationAdvice(
    finding: Finding,
    severity: Severity,
    devilsArgument: Argument,
    angelsArgument: Argument
  ): string {
    let advice = '';

    switch (severity) {
      case 'critical':
        advice = `【必須交渉事項】\n`;
        advice += `この条項の修正なくして契約締結は推奨できません。\n`;
        advice += `交渉ポイント: ${finding.recommendation}\n`;
        advice += `交渉が不調に終わった場合は、契約見送りも検討してください。`;
        break;

      case 'high':
        advice = `【強く推奨する交渉事項】\n`;
        advice += `この条項については修正を強く求めるべきです。\n`;
        advice += `交渉ポイント: ${finding.recommendation}\n`;
        advice += `相手方が修正に応じない場合は、リスク受容の経営判断が必要です。`;
        break;

      case 'medium':
        advice = `【交渉推奨事項】\n`;
        advice += `可能であれば修正を求めることを推奨します。\n`;
        advice += `交渉ポイント: ${finding.recommendation}\n`;
        advice += `修正が困難な場合は、社内の緩和策で対応可能です。`;
        break;

      case 'low':
        advice = `【改善提案事項】\n`;
        advice += `余裕があれば改善を提案してください。\n`;
        advice += `改善ポイント: ${finding.recommendation}\n`;
        advice += `この事項のみで契約を保留する必要はありません。`;
        break;
    }

    // 天使の代理人の緩和策を追加
    if (angelsArgument.counterpoints && angelsArgument.counterpoints.length > 0) {
      advice += `\n\n【代替策】\n`;
      advice += `修正が困難な場合: ${angelsArgument.counterpoints[0]}`;
    }

    return advice;
  }

  /**
   * 複数の議論結果から総合判定を生成
   */
  public synthesizeVerdicts(outcomes: DebateOutcome[]): {
    overallRisk: Severity;
    approvalRecommendation: 'approve' | 'approve_with_conditions' | 'reject' | 'needs_review';
    keyActions: string[];
    summary: string;
  } {
    // 最終的な重要度を集計
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const keyActions: string[] = [];

    for (const outcome of outcomes) {
      severityCounts[outcome.verdict.adjustedSeverity]++;
      if (outcome.verdict.actionRequired && outcome.verdict.negotiationAdvice) {
        keyActions.push(outcome.verdict.negotiationAdvice.split('\n')[1] || '');
      }
    }

    // 全体リスクを決定
    let overallRisk: Severity = 'low';
    if (severityCounts.critical > 0) overallRisk = 'critical';
    else if (severityCounts.high > 0) overallRisk = 'high';
    else if (severityCounts.medium > 0) overallRisk = 'medium';

    // 承認推奨を決定
    let approvalRecommendation: 'approve' | 'approve_with_conditions' | 'reject' | 'needs_review';
    if (severityCounts.critical > 0) {
      approvalRecommendation = 'reject';
    } else if (severityCounts.high > 0) {
      approvalRecommendation = 'approve_with_conditions';
    } else if (severityCounts.medium > 0) {
      approvalRecommendation = 'approve_with_conditions';
    } else {
      approvalRecommendation = 'approve';
    }

    // サマリーを生成
    const summary = this.generateSynthesisSummary(
      outcomes,
      severityCounts,
      approvalRecommendation
    );

    return {
      overallRisk,
      approvalRecommendation,
      keyActions: keyActions.slice(0, 5), // 上位5件
      summary,
    };
  }

  /**
   * 総合サマリーを生成
   */
  private generateSynthesisSummary(
    outcomes: DebateOutcome[],
    severityCounts: Record<Severity, number>,
    recommendation: string
  ): string {
    let summary = `【裁判官による総合判定】\n\n`;

    summary += `議論された指摘事項: ${outcomes.length}件\n`;
    summary += `・致命的リスク: ${severityCounts.critical}件\n`;
    summary += `・重大リスク: ${severityCounts.high}件\n`;
    summary += `・中程度リスク: ${severityCounts.medium}件\n`;
    summary += `・軽微リスク: ${severityCounts.low}件\n\n`;

    const recommendationLabels = {
      approve: '✅ 承認を推奨',
      approve_with_conditions: '⚠️ 条件付き承認を推奨',
      reject: '❌ 契約見送りを推奨',
      needs_review: '🔍 追加レビューが必要',
    };

    summary += `【総合判定】\n`;
    summary += recommendationLabels[recommendation as keyof typeof recommendationLabels] + '\n\n';

    if (recommendation === 'reject') {
      summary += `致命的なリスクが存在するため、このままでの契約締結は推奨できません。\n`;
      summary += `相手方との抜本的な条件交渉が必要です。\n`;
    } else if (recommendation === 'approve_with_conditions') {
      summary += `いくつかのリスクへの対応を条件として、契約締結を進めることができます。\n`;
      summary += `交渉事項を解決した上で最終承認を得てください。\n`;
    } else {
      summary += `重大なリスクは検出されませんでした。契約締結を進めて問題ありません。\n`;
    }

    return summary;
  }
}

// =============================================================================
// エクスポート
// =============================================================================

export function createJudge(criteria?: Partial<JudgingCriteria>): Judge {
  return new Judge(criteria);
}
