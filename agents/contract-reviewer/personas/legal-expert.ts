/**
 * Legal Expert Persona - 法務官僚ペルソナ
 *
 * 契約法の適合性、法的リスク、無効条項の検出に特化
 */

import {
  PersonaConfig,
  Clause,
  Finding,
  ClauseType,
} from '../models/types';
import { BasePersona, AnalysisContext } from './base-persona';

// =============================================================================
// 法務専門家の設定
// =============================================================================

const LEGAL_EXPERT_CONFIG: PersonaConfig = {
  type: 'legal_expert',
  name: '法務専門家',
  description: '契約法の番人として、法的リスクと無効条項を厳格にチェックする',
  focusAreas: [
    'liability',
    'indemnification',
    'termination',
    'dispute_resolution',
    'governing_law',
    'warranty',
    'assignment',
    'general',
  ],
  riskCategories: ['legal_risk', 'compliance_risk'],
  systemPrompt: `あなたは20年以上の経験を持つ法務部長です。
企業法務のスペシャリストとして、契約書の法的リスクを徹底的に分析します。

【分析の視点】
- 契約法上の問題点（無効条項、曖昧な表現）
- 一方的に不利な条項
- 紛争発生時のリスク
- 法令違反の可能性
- 裁判管轄・準拠法の妥当性

【姿勢】
- 保守的かつ厳格
- リスクは過大評価するくらいがちょうど良い
- 曖昧な表現は必ず指摘する`,
};

// =============================================================================
// リスクパターン定義
// =============================================================================

interface LegalRiskPattern {
  id: string;
  name: string;
  pattern: RegExp;
  severity: Finding['severity'];
  category: Finding['category'];
  issue: string;
  impact: string;
  recommendation: string;
}

const LEGAL_RISK_PATTERNS: LegalRiskPattern[] = [
  // 責任・賠償関連
  {
    id: 'unlimited-liability',
    name: '無制限の責任',
    pattern: /無制限|上限なく|全額|一切の損害|unlimited|without limitation/i,
    severity: 'critical',
    category: 'legal_risk',
    issue: '損害賠償責任に上限が設定されていません',
    impact: '予測不能な巨額の損害賠償責任を負う可能性があります',
    recommendation: '責任上限条項（cap on liability）の追加を交渉してください',
  },
  {
    id: 'consequential-damages',
    name: '間接損害の責任',
    pattern: /間接損害|特別損害|逸失利益|consequential|incidental|special damages/i,
    severity: 'high',
    category: 'legal_risk',
    issue: '間接損害・逸失利益の責任が含まれている可能性があります',
    impact: '直接的な損害を超えた広範な賠償責任を負うリスク',
    recommendation: '間接損害の免責条項を追加するか、範囲を限定してください',
  },

  // 契約終了関連
  {
    id: 'unilateral-termination',
    name: '一方的解除権',
    pattern: /いつでも.{0,10}解除|自由に.{0,10}終了|理由なく.{0,10}解約|at any time.{0,20}terminate|without cause/i,
    severity: 'high',
    category: 'legal_risk',
    issue: '相手方に一方的な契約解除権が付与されています',
    impact: '予告なく契約を終了される可能性があり、事業継続に支障',
    recommendation: '解除予告期間の設定、または相互的な解除権への修正を求めてください',
  },
  {
    id: 'no-termination-right',
    name: '解除権の欠如',
    pattern: /解除.{0,10}できない|終了.{0,10}不可|cannot.{0,10}terminat/i,
    severity: 'medium',
    category: 'legal_risk',
    issue: '当方の契約解除権が制限されています',
    impact: '問題が生じても契約から離脱できないリスク',
    recommendation: '正当事由による解除権の追加を交渉してください',
  },

  // 紛争解決関連
  {
    id: 'foreign-jurisdiction',
    name: '不利な裁判管轄',
    pattern: /(?:外国|海外|アメリカ|中国|シンガポール).{0,20}(?:裁判所|管轄)|foreign.{0,20}jurisdiction/i,
    severity: 'high',
    category: 'legal_risk',
    issue: '外国の裁判所を管轄とする条項があります',
    impact: '紛争発生時に多大な時間とコストがかかります',
    recommendation: '日本国内の裁判所を管轄とするよう交渉してください',
  },
  {
    id: 'mandatory-arbitration',
    name: '強制仲裁条項',
    pattern: /仲裁.{0,10}(?:によって|により|のみ)|(?:唯一|専属).{0,10}仲裁|exclusive.{0,10}arbitration/i,
    severity: 'medium',
    category: 'legal_risk',
    issue: '紛争解決手段が仲裁のみに限定されています',
    impact: '訴訟オプションがなく、仲裁費用が高額になる場合があります',
    recommendation: '仲裁機関、仲裁地、仲裁言語を確認し、必要に応じて修正を求めてください',
  },

  // 保証関連
  {
    id: 'as-is',
    name: '保証の放棄',
    pattern: /現状有姿|現状のまま|保証.{0,10}(?:しない|なし|排除)|as.{0,3}is|without warranty/i,
    severity: 'medium',
    category: 'legal_risk',
    issue: '製品・サービスの保証が放棄されています',
    impact: '品質問題が発生しても救済を受けられない可能性',
    recommendation: '最低限の品質保証条項の追加を交渉してください',
  },

  // 譲渡関連
  {
    id: 'assignment-without-consent',
    name: '同意なき譲渡',
    pattern: /(?:同意|承諾).{0,10}(?:なく|なしに|不要).{0,10}譲渡|freely.{0,10}assign|without.{0,10}consent.{0,10}assign/i,
    severity: 'medium',
    category: 'legal_risk',
    issue: '相手方が契約を自由に第三者へ譲渡できる条項があります',
    impact: '見知らぬ第三者が契約当事者になるリスク',
    recommendation: '事前の書面同意を条件とする譲渡制限条項を追加してください',
  },

  // 曖昧な表現
  {
    id: 'ambiguous-terms',
    name: '曖昧な表現',
    pattern: /合理的な|相当の|適切な|速やかに|可能な限り|reasonable|appropriate|promptly|as soon as practicable/i,
    severity: 'low',
    category: 'legal_risk',
    issue: '解釈の余地がある曖昧な表現が使用されています',
    impact: '当事者間で解釈が異なり、紛争の原因となる可能性',
    recommendation: '具体的な期限や基準を明記することを推奨します',
  },

  // 準拠法
  {
    id: 'unfavorable-governing-law',
    name: '不利な準拠法',
    pattern: /(?:英国|米国|デラウェア州|ニューヨーク州|シンガポール).{0,10}法|governed by.{0,20}(?:English|New York|Delaware|Singapore) law/i,
    severity: 'medium',
    category: 'legal_risk',
    issue: '日本法以外が準拠法として指定されています',
    impact: '外国法の適用により、予期しない法的リスクが生じる可能性',
    recommendation: '日本法を準拠法とするよう交渉するか、専門家に外国法リスクを確認してください',
  },
];

// =============================================================================
// 法務専門家クラス
// =============================================================================

export class LegalExpert extends BasePersona {
  public readonly config = LEGAL_EXPERT_CONFIG;

  /**
   * 条項を分析
   */
  protected async analyzeClause(
    clause: Clause,
    context: AnalysisContext
  ): Promise<Finding[]> {
    const findings: Finding[] = [];

    // パターンベースのリスク検出
    for (const pattern of LEGAL_RISK_PATTERNS) {
      if (this.isRelevantClause(clause, pattern) && pattern.pattern.test(clause.content)) {
        findings.push(this.createFinding(clause, {
          severity: pattern.severity,
          category: pattern.category,
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
   * パターンが該当する条項タイプかチェック
   */
  private isRelevantClause(clause: Clause, pattern: LegalRiskPattern): boolean {
    // 一般的なパターンはすべての条項に適用
    const generalPatterns = ['ambiguous-terms'];
    if (generalPatterns.includes(pattern.id)) return true;

    // 条項タイプに基づくフィルタリング
    const patternToClauseTypes: Record<string, ClauseType[]> = {
      'unlimited-liability': ['liability', 'indemnification'],
      'consequential-damages': ['liability', 'indemnification'],
      'unilateral-termination': ['termination'],
      'no-termination-right': ['termination'],
      'foreign-jurisdiction': ['dispute_resolution', 'governing_law'],
      'mandatory-arbitration': ['dispute_resolution'],
      'as-is': ['warranty', 'general'],
      'assignment-without-consent': ['assignment', 'general'],
      'unfavorable-governing-law': ['governing_law', 'dispute_resolution'],
    };

    const relevantTypes = patternToClauseTypes[pattern.id];
    return !relevantTypes || relevantTypes.includes(clause.type);
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
      case 'liability':
        findings.push(...this.analyzeLiabilityClause(clause, context));
        break;
      case 'termination':
        findings.push(...this.analyzeTerminationClause(clause, context));
        break;
      case 'indemnification':
        findings.push(...this.analyzeIndemnificationClause(clause, context));
        break;
      case 'dispute_resolution':
        findings.push(...this.analyzeDisputeClause(clause, context));
        break;
    }

    return findings;
  }

  /**
   * 責任条項の分析
   */
  private analyzeLiabilityClause(clause: Clause, _context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];

    // 責任上限の有無チェック
    const hasLiabilityCap = /上限|限度額|を超えない|cap|limit/i.test(clause.content);
    if (!hasLiabilityCap && clause.content.length > 100) {
      findings.push(this.createFinding(clause, {
        severity: 'high',
        category: 'legal_risk',
        title: '責任上限条項の欠如',
        issue: '損害賠償責任の上限が明記されていません',
        impact: '無制限の責任を負う可能性があります',
        recommendation: '契約金額や年間報酬額を上限とする条項の追加を交渉してください',
      }));
    }

    // 故意・重過失の除外チェック
    const hasGrossNegligence = /故意|重過失|悪意|gross negligence|willful/i.test(clause.content);
    if (hasLiabilityCap && !hasGrossNegligence) {
      findings.push(this.createFinding(clause, {
        severity: 'low',
        category: 'legal_risk',
        title: '故意・重過失の除外規定なし',
        issue: '責任上限から故意・重過失が除外されていません',
        impact: '相手方の悪意ある行為に対しても責任上限が適用される可能性',
        recommendation: '故意・重過失による損害を責任上限の適用除外とすることを検討してください',
      }));
    }

    return findings;
  }

  /**
   * 解除条項の分析
   */
  private analyzeTerminationClause(clause: Clause, _context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];

    // 解除予告期間のチェック
    const hasNoticePeriod = /(\d+)日前|(\d+)ヶ月前|事前.{0,10}通知|prior.{0,10}notice/i.test(clause.content);
    if (!hasNoticePeriod) {
      findings.push(this.createFinding(clause, {
        severity: 'medium',
        category: 'legal_risk',
        title: '解除予告期間の未設定',
        issue: '契約解除の予告期間が明記されていません',
        impact: '突然の契約終了により事業に支障をきたす可能性',
        recommendation: '30日〜90日の予告期間を設定することを推奨します',
      }));
    }

    // 解除後の義務チェック
    const hasSurvivalClause = /存続|残存|survive|surviving/i.test(clause.content);
    if (!hasSurvivalClause && clause.content.length > 200) {
      findings.push(this.createFinding(clause, {
        severity: 'low',
        category: 'legal_risk',
        title: '存続条項の確認推奨',
        issue: '契約終了後も存続する条項が明確でない可能性があります',
        impact: '秘密保持義務等の終了後の義務が不明確',
        recommendation: '終了後も存続する条項（秘密保持、損害賠償等）を明記することを推奨します',
      }));
    }

    return findings;
  }

  /**
   * 補償条項の分析
   */
  private analyzeIndemnificationClause(clause: Clause, context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];

    // 一方的な補償条項チェック
    const ourParty = context.ourPartyName || '甲';
    const isOnesided = new RegExp(`${ourParty}.{0,20}補償|${ourParty}.{0,20}indemnif`, 'i').test(clause.content);
    const isMutual = /相互|双方|each party|mutual/i.test(clause.content);

    if (isOnesided && !isMutual) {
      findings.push(this.createFinding(clause, {
        severity: 'high',
        category: 'legal_risk',
        title: '一方的な補償義務',
        issue: '当方のみが補償義務を負う構造になっています',
        impact: '相手方の責任により生じた損害も当方が補償するリスク',
        recommendation: '相互的な補償条項への修正を交渉してください',
      }));
    }

    // 補償範囲の広さチェック
    const broadScope = /あらゆる|一切の|すべての|全ての|any and all|all/i.test(clause.content);
    if (broadScope) {
      findings.push(this.createFinding(clause, {
        severity: 'medium',
        category: 'legal_risk',
        title: '補償範囲が広範',
        issue: '補償の対象となる損害の範囲が非常に広く設定されています',
        impact: '予期しない事象についても補償責任を負う可能性',
        recommendation: '補償対象を具体的に列挙し、範囲を限定することを推奨します',
      }));
    }

    return findings;
  }

  /**
   * 紛争解決条項の分析
   */
  private analyzeDisputeClause(clause: Clause, _context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];

    // 複数の紛争解決手段の有無
    const hasArbitration = /仲裁|arbitration/i.test(clause.content);
    const hasLitigation = /裁判|訴訟|court|litigation/i.test(clause.content);
    const hasMediation = /調停|mediation/i.test(clause.content);

    if (hasArbitration && !hasMediation) {
      findings.push(this.createFinding(clause, {
        severity: 'low',
        category: 'legal_risk',
        title: '段階的紛争解決条項の検討',
        issue: '仲裁の前段階としての協議・調停手続きがありません',
        impact: '軽微な紛争でも直ちに仲裁となり、コストが増大する可能性',
        recommendation: '仲裁前の協議期間や調停手続きの追加を検討してください',
      }));
    }

    // 仲裁の場合の詳細チェック
    if (hasArbitration) {
      const hasArbitrationDetails = /仲裁機関|仲裁規則|仲裁人|仲裁地|arbitration rules|arbitrator|seat of arbitration/i.test(clause.content);
      if (!hasArbitrationDetails) {
        findings.push(this.createFinding(clause, {
          severity: 'medium',
          category: 'legal_risk',
          title: '仲裁条項の詳細不足',
          issue: '仲裁機関、仲裁規則、仲裁地等の詳細が不明確です',
          impact: '紛争発生時に仲裁手続きの前提で争いが生じる可能性',
          recommendation: '仲裁機関（JCAA等）、仲裁地、仲裁言語を明記してください',
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

    // 準拠法条項の存在チェック
    const hasGoverningLaw = contract.clauses.some((c) => c.type === 'governing_law');
    if (!hasGoverningLaw) {
      findings.push({
        id: this.generateFindingId(),
        persona: this.config.type,
        clauseRef: 'cross-cutting',
        clauseNumber: '該当条項なし',
        severity: 'high',
        category: 'legal_risk',
        title: '準拠法条項の欠如',
        issue: '契約に準拠法を定める条項がありません',
        impact: '紛争発生時にどの国の法律が適用されるか不明確',
        recommendation: '日本法を準拠法とする条項を追加してください',
        evidence: ['契約書全体を確認しましたが、準拠法に関する条項が見つかりませんでした'],
      });
    }

    // 紛争解決条項の存在チェック
    const hasDisputeResolution = contract.clauses.some((c) => c.type === 'dispute_resolution');
    if (!hasDisputeResolution) {
      findings.push({
        id: this.generateFindingId(),
        persona: this.config.type,
        clauseRef: 'cross-cutting',
        clauseNumber: '該当条項なし',
        severity: 'medium',
        category: 'legal_risk',
        title: '紛争解決条項の欠如',
        issue: '紛争解決方法を定める条項がありません',
        impact: '紛争発生時の解決手続きが不明確',
        recommendation: '管轄裁判所または仲裁条項を追加してください',
        evidence: ['契約書全体を確認しましたが、紛争解決に関する条項が見つかりませんでした'],
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

    // マッチした箇所の前後を含めて抽出
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

    let summary = `【法務レビュー結果】\n`;
    summary += `検出された法的リスク: 致命的 ${critical.length}件、重大 ${high.length}件\n\n`;

    if (critical.length > 0) {
      summary += `⚠️ 致命的リスク:\n`;
      critical.forEach((f) => {
        summary += `  - ${f.title}: ${f.issue}\n`;
      });
    }

    if (high.length > 0) {
      summary += `\n⚡ 重大リスク:\n`;
      high.forEach((f) => {
        summary += `  - ${f.title}: ${f.issue}\n`;
      });
    }

    if (critical.length === 0 && high.length === 0) {
      summary += `✅ 重大な法的リスクは検出されませんでした。\n`;
    }

    return summary;
  }
}

// =============================================================================
// エクスポート
// =============================================================================

export function createLegalExpert(): LegalExpert {
  return new LegalExpert();
}
