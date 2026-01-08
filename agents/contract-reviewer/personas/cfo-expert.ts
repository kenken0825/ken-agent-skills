/**
 * CFO Expert Persona - 財務専門家ペルソナ
 *
 * 支払い条件、財務リスク、コスト影響の分析に特化
 */

import {
  PersonaConfig,
  Clause,
  Finding,
} from '../models/types';
import { BasePersona, AnalysisContext } from './base-persona';

// =============================================================================
// CFOの設定
// =============================================================================

const CFO_EXPERT_CONFIG: PersonaConfig = {
  type: 'cfo_expert',
  name: 'CFO（最高財務責任者）',
  description: '財務的観点から契約のコスト構造とリスクを評価する',
  focusAreas: [
    'payment',
    'liability',
    'indemnification',
    'termination',
    'warranty',
    'general',
  ],
  riskCategories: ['financial_risk', 'operational_risk'],
  systemPrompt: `あなたは上場企業のCFOです。
財務の専門家として、契約が会社の財務に与える影響を徹底的に分析します。

【分析の視点】
- 支払い条件とキャッシュフローへの影響
- 隠れたコストと追加費用の可能性
- 違約金・ペナルティの財務インパクト
- 為替リスク・価格変動リスク
- 予算計上・会計処理上の問題

【姿勢】
- 数字に厳格
- キャッシュフローを最重視
- 隠れたコストを見逃さない`,
};

// =============================================================================
// 財務リスクパターン定義
// =============================================================================

interface FinancialRiskPattern {
  id: string;
  name: string;
  pattern: RegExp;
  severity: Finding['severity'];
  issue: string;
  impact: string;
  recommendation: string;
}

const FINANCIAL_RISK_PATTERNS: FinancialRiskPattern[] = [
  // 支払い関連
  {
    id: 'advance-payment',
    name: '前払い要求',
    pattern: /前払い|着手金|deposit|advance payment|upfront/i,
    severity: 'medium',
    category: 'financial_risk',
    issue: '前払いまたは着手金の支払いが要求されています',
    impact: 'キャッシュフローへの悪影響、相手方不履行時の回収リスク',
    recommendation: '前払い比率の低減、または成果物納品と連動した支払いスケジュールへの変更を交渉してください',
  },
  {
    id: 'auto-renewal',
    name: '自動更新条項',
    pattern: /自動.{0,5}(?:更新|延長)|自動的に.{0,10}(?:更新|継続)|auto.{0,5}renew|automatically.{0,10}extend/i,
    severity: 'medium',
    category: 'financial_risk',
    issue: '契約が自動更新される条項があります',
    impact: '更新を望まない場合でも通知期限を逃すと自動継続し、予期しない支出が発生',
    recommendation: '更新停止の通知期限を確認し、カレンダーに登録してください',
  },
  {
    id: 'price-escalation',
    name: '価格改定条項',
    pattern: /価格.{0,10}(?:改定|変更|見直し)|値上げ|price.{0,10}(?:increase|adjustment|change)/i,
    severity: 'medium',
    category: 'financial_risk',
    issue: '相手方による価格改定が可能な条項があります',
    impact: '予算超過のリスク、長期契約での総コスト増大',
    recommendation: '価格上昇の上限（年X%等）や価格改定の事前通知期間を交渉してください',
  },
  {
    id: 'minimum-commitment',
    name: '最低購入義務',
    pattern: /最低.{0,10}(?:購入|発注|利用)|minimum.{0,10}(?:order|commitment|purchase)/i,
    severity: 'high',
    category: 'financial_risk',
    issue: '最低購入数量または金額が設定されています',
    impact: '需要が減少しても最低金額の支払い義務が残る',
    recommendation: '最低コミットメント額が妥当か検証し、下方修正または廃止を交渉してください',
  },
  {
    id: 'penalty-clause',
    name: '違約金条項',
    pattern: /違約金|ペナルティ|遅延損害金|penalty|liquidated damages/i,
    severity: 'high',
    category: 'financial_risk',
    issue: '違約金またはペナルティ条項が含まれています',
    impact: '履行遅延や不履行時に多額の支払いが発生するリスク',
    recommendation: '違約金の金額・計算方法を確認し、上限設定を交渉してください',
  },
  {
    id: 'currency-risk',
    name: '外貨建て取引',
    pattern: /(?:米ドル|USD|EUR|ユーロ|GBP|ポンド).{0,10}(?:建て|払い)|payable in.{0,10}(?:USD|EUR|GBP)/i,
    severity: 'medium',
    category: 'financial_risk',
    issue: '外貨建ての支払いが含まれています',
    impact: '為替変動により支払額が増加するリスク',
    recommendation: '円建てへの変更、または為替レート固定条項を交渉してください',
  },
  {
    id: 'hidden-fees',
    name: '追加費用の可能性',
    pattern: /(?:別途|追加で|オプション).{0,10}(?:費用|料金|請求)|additional.{0,10}(?:fee|charge|cost)/i,
    severity: 'medium',
    category: 'financial_risk',
    issue: '基本料金以外の追加費用が発生する可能性があります',
    impact: '総コストが当初見積もりを大幅に超過するリスク',
    recommendation: '追加費用の項目と概算金額を事前に確認し、上限を設定してください',
  },
  {
    id: 'audit-rights',
    name: '監査権条項',
    pattern: /監査.{0,10}(?:権|受ける)|audit.{0,10}right/i,
    severity: 'low',
    category: 'financial_risk',
    issue: '相手方に監査権が付与されています',
    impact: '監査対応の工数・コストが発生、過少申告発覚時のペナルティリスク',
    recommendation: '監査の頻度制限、事前通知期間、監査費用負担を確認してください',
  },
];

// =============================================================================
// CFOクラス
// =============================================================================

export class CFOExpert extends BasePersona {
  public readonly config = CFO_EXPERT_CONFIG;

  /**
   * 条項を分析
   */
  protected async analyzeClause(
    clause: Clause,
    context: AnalysisContext
  ): Promise<Finding[]> {
    const findings: Finding[] = [];

    // パターンベースのリスク検出
    for (const pattern of FINANCIAL_RISK_PATTERNS) {
      if (pattern.pattern.test(clause.content)) {
        findings.push(this.createFinding(clause, {
          severity: pattern.severity,
          category: 'financial_risk',
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
      case 'payment':
        findings.push(...this.analyzePaymentClause(clause, context));
        break;
      case 'termination':
        findings.push(...this.analyzeTerminationFinancials(clause, context));
        break;
      case 'liability':
        findings.push(...this.analyzeLiabilityFinancials(clause, context));
        break;
    }

    return findings;
  }

  /**
   * 支払い条項の詳細分析
   */
  private analyzePaymentClause(clause: Clause, _context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];

    // 支払いサイトのチェック
    const paymentTermsMatch = clause.content.match(/(\d+)日以内|(\d+)日後|net\s*(\d+)/i);
    if (paymentTermsMatch) {
      const days = parseInt(paymentTermsMatch[1] || paymentTermsMatch[2] || paymentTermsMatch[3]);
      if (days < 30) {
        findings.push(this.createFinding(clause, {
          severity: 'medium',
          category: 'financial_risk',
          title: '短い支払いサイト',
          issue: `支払い期限が${days}日と短く設定されています`,
          impact: 'キャッシュフローへの圧迫、資金繰りの悪化リスク',
          recommendation: '支払いサイトを30日以上に延長するよう交渉してください',
        }));
      }
    }

    // 支払い方法のチェック
    const hasPaymentMethod = /振込|口座|送金|wire|bank transfer/i.test(clause.content);
    if (!hasPaymentMethod && clause.content.length > 100) {
      findings.push(this.createFinding(clause, {
        severity: 'low',
        category: 'financial_risk',
        title: '支払い方法の未指定',
        issue: '具体的な支払い方法が明記されていません',
        impact: '支払い手続きで認識の齟齬が生じる可能性',
        recommendation: '銀行振込先情報や支払い手続きを明記してください',
      }));
    }

    // 税金の取り扱いチェック
    const hasTaxClause = /消費税|税込|税別|税抜|VAT|exclusive of tax|inclusive of tax/i.test(clause.content);
    if (!hasTaxClause) {
      findings.push(this.createFinding(clause, {
        severity: 'medium',
        category: 'financial_risk',
        title: '税金の取り扱い不明確',
        issue: '消費税等の税金の取り扱いが明記されていません',
        impact: '税込・税別の認識相違により予算超過のリスク',
        recommendation: '金額が税込か税別かを明記し、税率変更時の対応も規定してください',
      }));
    }

    return findings;
  }

  /**
   * 解除条項の財務影響分析
   */
  private analyzeTerminationFinancials(clause: Clause, _context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];

    // 中途解約金のチェック
    const hasEarlyTerminationFee = /中途解約.{0,10}(?:金|料|費)|解約.{0,10}ペナルティ|early termination.{0,10}fee/i.test(clause.content);
    if (hasEarlyTerminationFee) {
      findings.push(this.createFinding(clause, {
        severity: 'high',
        category: 'financial_risk',
        title: '中途解約金の存在',
        issue: '契約の中途解約に費用が発生します',
        impact: '事業状況の変化に柔軟に対応できず、不要なコストが発生',
        recommendation: '解約金の計算方法と上限を確認し、削減または廃止を交渉してください',
      }));
    }

    // 残存期間の支払い義務チェック
    const hasRemainingPayment = /残存期間.{0,10}(?:支払|負担)|remaining.{0,10}(?:payment|period)/i.test(clause.content);
    if (hasRemainingPayment) {
      findings.push(this.createFinding(clause, {
        severity: 'critical',
        category: 'financial_risk',
        title: '残存期間の支払い義務',
        issue: '解約後も残存期間分の支払い義務が発生する可能性があります',
        impact: 'サービス未利用でも多額の支払いが必要になるリスク',
        recommendation: '残存期間支払い条項の削除を強く交渉してください',
      }));
    }

    return findings;
  }

  /**
   * 責任条項の財務影響分析
   */
  private analyzeLiabilityFinancials(clause: Clause, _context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];

    // 責任上限の金額チェック
    const liabilityCapMatch = clause.content.match(/(?:上限|限度).{0,10}(\d+(?:,\d+)*(?:万円|百万円|億円|円))/);
    if (liabilityCapMatch) {
      const capText = liabilityCapMatch[1];
      // 金額を概算で評価（詳細な計算は省略）
      if (capText.includes('億') || (capText.includes('百万') && !capText.includes('円'))) {
        findings.push(this.createFinding(clause, {
          severity: 'high',
          category: 'financial_risk',
          title: '高額な責任上限',
          issue: `責任上限が${capText}と高額に設定されています`,
          impact: '問題発生時に多額の賠償責任を負うリスク',
          recommendation: '責任上限の引き下げ、または保険でのカバーを検討してください',
        }));
      }
    }

    // 保険要求のチェック
    const hasInsuranceRequirement = /保険.{0,10}(?:加入|付保|維持)|insurance.{0,10}(?:maintain|carry|procure)/i.test(clause.content);
    if (hasInsuranceRequirement) {
      findings.push(this.createFinding(clause, {
        severity: 'medium',
        category: 'financial_risk',
        title: '保険加入義務',
        issue: '特定の保険への加入が義務付けられています',
        impact: '保険料コストの発生、適切な保険商品の手配が必要',
        recommendation: '必要な保険の種類、補償額、保険料を確認し、既存保険でカバー可能か検証してください',
      }));
    }

    return findings;
  }

  /**
   * 条項横断的な分析
   */
  protected async analyzeCrossCutting(context: AnalysisContext): Promise<Finding[]> {
    const findings: Finding[] = [];
    const contract = context.contract;

    // 総コストの把握可能性チェック
    const paymentClauses = contract.clauses.filter((c) => c.type === 'payment');
    if (paymentClauses.length === 0) {
      findings.push({
        id: this.generateFindingId(),
        persona: this.config.type,
        clauseRef: 'cross-cutting',
        clauseNumber: '該当条項なし',
        severity: 'high',
        category: 'financial_risk',
        title: '支払い条件の欠如',
        issue: '支払いに関する条項が見つかりません',
        impact: '料金・支払い条件が不明確で、予算策定が困難',
        recommendation: '支払い金額、時期、方法を明記した条項を追加してください',
        evidence: ['契約書全体を確認しましたが、支払いに関する条項が見つかりませんでした'],
      });
    }

    // 長期契約の財務リスク警告
    if (contract.terminationDate) {
      const effectiveDate = contract.effectiveDate ? new Date(contract.effectiveDate) : new Date();
      const terminationDate = new Date(contract.terminationDate);
      const durationMonths = (terminationDate.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

      if (durationMonths > 24) {
        findings.push({
          id: this.generateFindingId(),
          persona: this.config.type,
          clauseRef: 'cross-cutting',
          clauseNumber: '契約期間',
          severity: 'medium',
          category: 'financial_risk',
          title: '長期契約のリスク',
          issue: `契約期間が${Math.round(durationMonths)}ヶ月と長期です`,
          impact: '事業環境の変化に対応できず、不要なコストが継続発生するリスク',
          recommendation: '中途解約条項の有無を確認し、定期的な見直し条項を追加してください',
          evidence: [`契約期間: ${contract.effectiveDate} 〜 ${contract.terminationDate}`],
        });
      }
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

    let summary = `【CFO財務レビュー結果】\n`;
    summary += `財務リスク: 致命的 ${critical.length}件、重大 ${high.length}件\n\n`;

    if (critical.length > 0) {
      summary += `💰 致命的な財務リスク:\n`;
      critical.forEach((f) => {
        summary += `  - ${f.title}: ${f.issue}\n`;
      });
    }

    if (high.length > 0) {
      summary += `\n💸 重大な財務リスク:\n`;
      high.forEach((f) => {
        summary += `  - ${f.title}: ${f.issue}\n`;
      });
    }

    if (critical.length === 0 && high.length === 0) {
      summary += `✅ 重大な財務リスクは検出されませんでした。\n`;
    }

    return summary;
  }
}

// =============================================================================
// エクスポート
// =============================================================================

export function createCFOExpert(): CFOExpert {
  return new CFOExpert();
}
