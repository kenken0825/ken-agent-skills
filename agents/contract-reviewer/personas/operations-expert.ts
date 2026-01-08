/**
 * Operations Expert Persona - 現場責任者ペルソナ
 *
 * 実行可能性、運用負荷、SLA達成可能性の分析に特化
 */

import {
  PersonaConfig,
  Clause,
  Finding,
} from '../models/types';
import { BasePersona, AnalysisContext } from './base-persona';

// =============================================================================
// 現場責任者の設定
// =============================================================================

const OPERATIONS_EXPERT_CONFIG: PersonaConfig = {
  type: 'operations_expert',
  name: '現場責任者',
  description: '実務の視点から契約の実行可能性と運用上の課題を評価する',
  focusAreas: [
    'warranty',
    'payment',
    'termination',
    'general',
    'liability',
  ],
  riskCategories: ['operational_risk', 'reputational_risk'],
  systemPrompt: `あなたはIT部門の現場責任者（部長クラス）です。
実務の専門家として、契約が現場にもたらす影響を徹底的に分析します。

【分析の視点】
- SLA・KPIの達成可能性
- 現場の運用負荷
- リソース要件と確保可能性
- 実行可能なスケジュールか
- 既存業務・システムとの整合性

【姿勢】
- 現場目線で実現可能性を重視
- 机上の空論を許さない
- チームへの影響を最優先に考える`,
};

// =============================================================================
// 運用リスクパターン定義
// =============================================================================

interface OperationalRiskPattern {
  id: string;
  name: string;
  pattern: RegExp;
  severity: Finding['severity'];
  issue: string;
  impact: string;
  recommendation: string;
}

const OPERATIONAL_RISK_PATTERNS: OperationalRiskPattern[] = [
  // SLA関連
  {
    id: 'high-availability-sla',
    name: '高可用性SLA',
    pattern: /(?:稼働率|可用性|アップタイム).{0,10}(?:99\.9|99\.99|100)|(?:99\.9|99\.99|100).{0,5}%/i,
    severity: 'high',
    category: 'operational_risk',
    issue: '非常に高い可用性（99.9%以上）が要求されています',
    impact: '達成困難なSLA、ペナルティ発生リスク、24時間体制の必要性',
    recommendation: '現行システムの実績を確認し、達成可能なSLAレベルに交渉してください',
  },
  {
    id: 'response-time-sla',
    name: '応答時間SLA',
    pattern: /(?:応答時間|レスポンス|response.{0,3}time).{0,10}(?:\d+秒|\d+ms|\d+ミリ秒)/i,
    severity: 'medium',
    category: 'operational_risk',
    issue: '応答時間のSLAが設定されています',
    impact: 'システム性能への厳格な要求、チューニングコストの発生',
    recommendation: '現行システムの応答時間実績を確認し、達成可能な値か検証してください',
  },
  {
    id: 'support-hours',
    name: 'サポート時間',
    pattern: /(?:24時間|365日|年中無休|24\/7|around.{0,5}clock)/i,
    severity: 'high',
    category: 'operational_risk',
    issue: '24時間365日のサポート体制が要求されています',
    impact: '人員配置の大幅増加、シフト勤務の導入、コスト増大',
    recommendation: '営業時間内サポート+緊急時対応の形態に変更を交渉してください',
  },
  {
    id: 'incident-response',
    name: '障害対応時間',
    pattern: /(?:障害|インシデント|故障).{0,10}(?:対応|復旧).{0,10}(?:\d+時間|\d+分|以内)/i,
    severity: 'high',
    category: 'operational_risk',
    issue: '障害時の対応・復旧時間が規定されています',
    impact: '短時間での対応が求められ、体制構築が必要',
    recommendation: '障害の重要度別に対応時間を分け、現実的な時間設定を交渉してください',
  },

  // 納期・スケジュール関連
  {
    id: 'tight-deadline',
    name: 'タイトな納期',
    pattern: /(?:納期|期限|デッドライン|deadline).{0,10}(?:厳守|必達|絶対|変更不可)/i,
    severity: 'high',
    category: 'operational_risk',
    issue: '厳格な納期設定があります',
    impact: '品質低下リスク、チームの過負荷、バーンアウト',
    recommendation: 'バッファを含めた現実的な納期設定を交渉してください',
  },
  {
    id: 'change-request',
    name: '変更要求対応',
    pattern: /(?:変更|追加|修正).{0,10}(?:要求|リクエスト|依頼).{0,10}(?:対応|応じ)/i,
    severity: 'medium',
    category: 'operational_risk',
    issue: '変更要求への対応義務があります',
    impact: 'スコープクリープ、追加工数の発生、納期遅延リスク',
    recommendation: '変更管理プロセス（影響評価、承認、追加費用）を明確に規定してください',
  },

  // リソース・体制関連
  {
    id: 'dedicated-resources',
    name: '専任者要求',
    pattern: /(?:専任|常駐|専属).{0,10}(?:者|担当|エンジニア|要員)|dedicated.{0,10}(?:resource|personnel|staff)/i,
    severity: 'medium',
    category: 'operational_risk',
    issue: '専任者または常駐者の配置が要求されています',
    impact: '人員確保の必要性、他プロジェクトへの影響',
    recommendation: '必要な人員数と期間を確認し、確保可能性を検証してください',
  },
  {
    id: 'skill-requirements',
    name: 'スキル要件',
    pattern: /(?:資格|認定|certification).{0,10}(?:保有|必須|required)|(?:経験|experience).{0,10}(?:\d+年|年以上)/i,
    severity: 'medium',
    category: 'operational_risk',
    issue: '特定のスキルや資格を持つ人材が要求されています',
    impact: '該当人材の確保困難、外注コストの増加',
    recommendation: '該当スキルを持つ人材の社内在籍を確認し、不足時の対策を検討してください',
  },

  // 報告・ドキュメント関連
  {
    id: 'reporting-requirements',
    name: '報告義務',
    pattern: /(?:報告|レポート).{0,10}(?:義務|提出|定期|月次|週次|daily|weekly|monthly)/i,
    severity: 'low',
    category: 'operational_risk',
    issue: '定期的な報告義務があります',
    impact: '報告書作成の工数発生、管理業務の増加',
    recommendation: '報告の頻度、フォーマット、内容を確認し、効率的な報告方法を交渉してください',
  },
  {
    id: 'documentation',
    name: 'ドキュメント要件',
    pattern: /(?:ドキュメント|文書|マニュアル|手順書).{0,10}(?:作成|提出|整備|提供)/i,
    severity: 'medium',
    category: 'operational_risk',
    issue: 'ドキュメント作成・提供義務があります',
    impact: 'ドキュメント作成の工数、品質要件への対応',
    recommendation: '必要なドキュメントの種類、詳細度、フォーマットを明確化してください',
  },

  // 品質・検収関連
  {
    id: 'acceptance-criteria',
    name: '検収条件',
    pattern: /(?:検収|受入|acceptance).{0,10}(?:条件|基準|criteria)/i,
    severity: 'medium',
    category: 'operational_risk',
    issue: '検収条件が規定されています',
    impact: '曖昧な検収条件による紛争リスク',
    recommendation: '検収条件を具体的かつ客観的に定義し、合格基準を明確化してください',
  },
  {
    id: 'warranty-period',
    name: '保証期間',
    pattern: /(?:保証|warranty|瑕疵担保).{0,10}(?:期間|\d+(?:年|ヶ月|日))/i,
    severity: 'medium',
    category: 'operational_risk',
    issue: '成果物の保証期間が設定されています',
    impact: '保証期間中の無償対応義務、リソース確保の必要性',
    recommendation: '保証の範囲と期間を確認し、過度に長い保証期間は短縮を交渉してください',
  },

  // 移行・引継ぎ関連
  {
    id: 'transition',
    name: '移行・引継ぎ義務',
    pattern: /(?:移行|引継ぎ|引き継ぎ|トランジション|transition).{0,10}(?:義務|支援|協力)/i,
    severity: 'medium',
    category: 'operational_risk',
    issue: '契約終了時の移行・引継ぎ義務があります',
    impact: '契約終了後も一定期間のサポート義務が発生',
    recommendation: '移行支援の範囲、期間、費用負担を明確化してください',
  },
];

// =============================================================================
// 現場責任者クラス
// =============================================================================

export class OperationsExpert extends BasePersona {
  public readonly config = OPERATIONS_EXPERT_CONFIG;

  /**
   * 条項を分析
   */
  protected async analyzeClause(
    clause: Clause,
    context: AnalysisContext
  ): Promise<Finding[]> {
    const findings: Finding[] = [];

    // パターンベースのリスク検出
    for (const pattern of OPERATIONAL_RISK_PATTERNS) {
      if (pattern.pattern.test(clause.content)) {
        findings.push(this.createFinding(clause, {
          severity: pattern.severity,
          category: 'operational_risk',
          title: pattern.name,
          issue: pattern.issue,
          impact: pattern.impact,
          recommendation: pattern.recommendation,
          evidence: this.extractEvidence(clause.content, pattern.pattern),
        }));
      }
    }

    // 条項タイプ固有の分析
    const typeSpecificFindings = await this.analyzeByClauseType(clause, context);
    findings.push(...typeSpecificFindings);

    return findings;
  }

  /**
   * 条項タイプ固有の分析
   */
  private async analyzeByClauseType(
    clause: Clause,
    context: AnalysisContext
  ): Promise<Finding[]> {
    const findings: Finding[] = [];

    switch (clause.type) {
      case 'warranty':
        findings.push(...this.analyzeWarrantyClause(clause, context));
        break;
      case 'general':
        findings.push(...this.analyzeGeneralClause(clause, context));
        break;
    }

    return findings;
  }

  /**
   * 保証条項の詳細分析
   */
  private analyzeWarrantyClause(clause: Clause, _context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];

    // 無制限の保証チェック
    const hasUnlimitedWarranty = /(?:いかなる|すべての|あらゆる|一切の).{0,10}(?:瑕疵|バグ|不具合)|free.{0,10}from.{0,10}(?:all|any).{0,10}(?:defect|bug)/i.test(clause.content);
    if (hasUnlimitedWarranty) {
      findings.push(this.createFinding(clause, {
        severity: 'high',
        category: 'operational_risk',
        title: '過度な保証範囲',
        issue: 'すべての瑕疵・バグがないことを保証する条項があります',
        impact: '現実的に達成不可能な保証、永続的な対応義務',
        recommendation: '保証対象を「重大な瑕疵」に限定し、対応範囲を明確化してください',
      }));
    }

    // 保証対応の詳細チェック
    const hasResponseObligation = /(?:直ちに|速やかに|immediately|promptly).{0,10}(?:修正|対応|修補)/i.test(clause.content);
    if (hasResponseObligation) {
      findings.push(this.createFinding(clause, {
        severity: 'medium',
        category: 'operational_risk',
        title: '即時対応義務',
        issue: '瑕疵に対する即時対応義務があります',
        impact: 'リソースの常時確保が必要、他業務への影響',
        recommendation: '重要度に応じた対応時間の設定（例：重大は24時間、軽微は5営業日）を交渉してください',
      }));
    }

    return findings;
  }

  /**
   * 一般条項の分析（運用に関わる内容を抽出）
   */
  private analyzeGeneralClause(clause: Clause, _context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];

    // 協力義務の範囲チェック
    const hasBroadCooperation = /(?:全面的|最大限|可能な限り).{0,10}(?:協力|支援|サポート)|best.{0,5}efforts|reasonable.{0,5}efforts/i.test(clause.content);
    if (hasBroadCooperation) {
      findings.push(this.createFinding(clause, {
        severity: 'low',
        category: 'operational_risk',
        title: '広範な協力義務',
        issue: '広範な協力義務が課されています',
        impact: '協力の範囲が曖昧で、際限なく対応を求められるリスク',
        recommendation: '協力の具体的な内容と範囲を明記してください',
      }));
    }

    // 通知期間のチェック
    const shortNoticeMatch = clause.content.match(/(?:通知|連絡|報告).{0,10}(\d+)(?:時間|日)以内/);
    if (shortNoticeMatch) {
      const period = parseInt(shortNoticeMatch[1]);
      const unit = shortNoticeMatch[0].includes('時間') ? 'hours' : 'days';
      if ((unit === 'hours' && period < 24) || (unit === 'days' && period < 3)) {
        findings.push(this.createFinding(clause, {
          severity: 'medium',
          category: 'operational_risk',
          title: '短い通知期間',
          issue: `${shortNoticeMatch[1]}${unit === 'hours' ? '時間' : '日'}以内の通知が求められています`,
          impact: '短期間での対応が必要、見落としリスク',
          recommendation: '現実的な通知期間（例：5営業日）への変更を交渉してください',
        }));
      }
    }

    return findings;
  }

  /**
   * 条項横断的な分析
   */
  protected async analyzeCrossCutting(context: AnalysisContext): Promise<Finding[]> {
    const findings: Finding[] = [];
    const contract = context.contract;

    // SLA条項の存在と詳細度チェック
    const hasSLAContent = /SLA|サービスレベル|service.{0,3}level/i.test(contract.rawText);
    const hasSLADetails = /(?:稼働率|可用性|応答時間|復旧時間).{0,10}(?:\d+|%|秒|分|時間)/i.test(contract.rawText);

    if (hasSLAContent && !hasSLADetails) {
      findings.push({
        id: this.generateFindingId(),
        persona: this.config.type,
        clauseRef: 'cross-cutting',
        clauseNumber: '全体',
        severity: 'medium',
        category: 'operational_risk',
        title: 'SLA詳細の不足',
        issue: 'SLAへの言及はありますが、具体的な数値が不明確です',
        impact: 'SLA達成の基準が曖昧で、後から厳しい要求をされるリスク',
        recommendation: '別紙SLAまたは契約本文にて、具体的な指標と数値を定義してください',
        evidence: ['SLAに関する言及はありますが、具体的な数値定義がありません'],
      });
    }

    // 複数の義務間の整合性チェック
    const obligations = contract.clauses.flatMap((c) => c.obligations || []);
    const mustObligations = obligations.filter((o) => o.type === 'must');

    if (mustObligations.length > 10) {
      findings.push({
        id: this.generateFindingId(),
        persona: this.config.type,
        clauseRef: 'cross-cutting',
        clauseNumber: '全体',
        severity: 'medium',
        category: 'operational_risk',
        title: '多数の義務条項',
        issue: `${mustObligations.length}件の義務（〜しなければならない）が検出されました`,
        impact: '多数の義務を漏れなく履行するための管理負荷',
        recommendation: '義務の一覧を作成し、履行管理体制を構築してください',
        evidence: [`検出された義務条項: ${mustObligations.length}件`],
      });
    }

    // 不明確な用語のチェック
    const ambiguousTerms = ['適宜', '必要に応じて', '合理的な範囲で', '相当な', 'as appropriate', 'as necessary', 'reasonable'];
    const foundAmbiguous = ambiguousTerms.filter((term) => contract.rawText.includes(term));

    if (foundAmbiguous.length >= 3) {
      findings.push({
        id: this.generateFindingId(),
        persona: this.config.type,
        clauseRef: 'cross-cutting',
        clauseNumber: '全体',
        severity: 'low',
        category: 'operational_risk',
        title: '曖昧な用語の多用',
        issue: '解釈の余地がある曖昧な表現が多用されています',
        impact: '運用時の判断基準が不明確、認識の齟齬リスク',
        recommendation: '重要な義務については具体的な基準・手順を別途定義してください',
        evidence: [`検出された曖昧な表現: ${foundAmbiguous.join(', ')}`],
      });
    }

    return findings;
  }

  /**
   * 証拠となる条文を抽出
   */
  private extractEvidence(content: string, pattern: RegExp): string[] {
    const match = content.match(pattern);
    if (!match) return [content.substring(0, 200)];

    const index = match.index || 0;
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + match[0].length + 50);
    return [content.substring(start, end)];
  }

  /**
   * サマリー生成
   */
  protected async generateSummary(
    findings: Finding[],
    _context: AnalysisContext
  ): Promise<string> {
    const critical = findings.filter((f) => f.severity === 'critical');
    const high = findings.filter((f) => f.severity === 'high');

    let summary = `【現場責任者レビュー結果】\n`;
    summary += `運用上の課題: 致命的 ${critical.length}件、重大 ${high.length}件\n\n`;

    if (critical.length > 0) {
      summary += `🚨 致命的な運用リスク:\n`;
      critical.forEach((f) => {
        summary += `  - ${f.title}: ${f.issue}\n`;
      });
    }

    if (high.length > 0) {
      summary += `\n⚠️ 重大な運用上の課題:\n`;
      high.forEach((f) => {
        summary += `  - ${f.title}: ${f.issue}\n`;
      });
    }

    if (critical.length === 0 && high.length === 0) {
      summary += `✅ 重大な運用上の課題は検出されませんでした。\n`;
    }

    return summary;
  }
}

// =============================================================================
// エクスポート
// =============================================================================

export function createOperationsExpert(): OperationsExpert {
  return new OperationsExpert();
}
