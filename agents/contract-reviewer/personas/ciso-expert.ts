/**
 * CISO Expert Persona - セキュリティ専門家ペルソナ
 *
 * データ保護、情報セキュリティ、コンプライアンスの分析に特化
 */

import {
  PersonaConfig,
  Clause,
  Finding,
} from '../models/types';
import { BasePersona, AnalysisContext } from './base-persona';

// =============================================================================
// CISOの設定
// =============================================================================

const CISO_EXPERT_CONFIG: PersonaConfig = {
  type: 'ciso_expert',
  name: 'CISO（最高情報セキュリティ責任者）',
  description: 'セキュリティとコンプライアンスの観点から契約リスクを評価する',
  focusAreas: [
    'confidentiality',
    'ip_rights',
    'liability',
    'indemnification',
    'general',
  ],
  riskCategories: ['security_risk', 'compliance_risk'],
  systemPrompt: `あなたは金融機関のCISOです。
情報セキュリティとデータ保護の専門家として、契約のセキュリティリスクを徹底的に分析します。

【分析の視点】
- データの取り扱いと保護措置
- 情報漏洩時の責任と対応
- 規制要件（個人情報保護法、GDPR等）への適合
- サードパーティリスク
- セキュリティインシデント時の対応

【姿勢】
- セキュリティファースト
- 最悪のシナリオを想定
- コンプライアンスに厳格`,
};

// =============================================================================
// セキュリティリスクパターン定義
// =============================================================================

interface SecurityRiskPattern {
  id: string;
  name: string;
  pattern: RegExp;
  severity: Finding['severity'];
  category: Finding['category'];
  issue: string;
  impact: string;
  recommendation: string;
}

const SECURITY_RISK_PATTERNS: SecurityRiskPattern[] = [
  // データ保護関連
  {
    id: 'personal-data-handling',
    name: '個人データの取り扱い',
    pattern: /個人情報|個人データ|パーソナルデータ|personal.{0,5}(?:data|information)|PII/i,
    severity: 'high',
    category: 'security_risk',
    issue: '個人情報の取り扱いが含まれています',
    impact: '個人情報保護法違反、漏洩時の賠償責任と信用失墜リスク',
    recommendation: 'データ処理の目的、保管期間、削除義務、漏洩時の通知義務を確認してください',
  },
  {
    id: 'data-transfer',
    name: 'データの越境移転',
    pattern: /(?:海外|外国|国外).{0,10}(?:移転|転送|保管)|cross.{0,5}border|data.{0,5}transfer|overseas/i,
    severity: 'critical',
    category: 'compliance_risk',
    issue: 'データの越境移転が含まれる可能性があります',
    impact: '各国の規制違反リスク（GDPR、個人情報保護法等）',
    recommendation: '移転先国、データ保護措置、規制対応状況を確認し、DPA（データ処理契約）を締結してください',
  },
  {
    id: 'subprocessor',
    name: '再委託・下請け',
    pattern: /再委託|下請|外注|第三者.{0,10}委託|subcontract|subprocessor|third.{0,5}party/i,
    severity: 'high',
    category: 'security_risk',
    issue: '第三者への再委託が許可されている可能性があります',
    impact: 'セキュリティ管理が及ばない第三者によるデータ処理リスク',
    recommendation: '再委託の事前承認要件、下請業者のセキュリティ要件を確認してください',
  },
  {
    id: 'data-retention',
    name: 'データ保持期間',
    pattern: /(?:保存|保管|保持).{0,10}(?:期間|期限)|(?:削除|廃棄).{0,10}(?:義務|しなければ)|retention.{0,5}period|data.{0,5}deletion/i,
    severity: 'medium',
    category: 'compliance_risk',
    issue: 'データの保持・削除に関する規定があります',
    impact: '過剰なデータ保持による漏洩リスク増大、規制違反の可能性',
    recommendation: 'データ保持期間の妥当性を確認し、契約終了時の削除手続きを明確にしてください',
  },

  // セキュリティ要件関連
  {
    id: 'security-standards',
    name: 'セキュリティ基準',
    pattern: /ISO.?27001|SOC.?2|ISMS|セキュリティ.{0,10}(?:基準|認証)|security.{0,10}(?:standard|certification)/i,
    severity: 'low',
    category: 'security_risk',
    issue: 'セキュリティ認証への言及があります',
    impact: '認証の有効性と適用範囲の確認が必要',
    recommendation: '認証の有効期限、適用範囲、最新の監査報告書を確認してください',
  },
  {
    id: 'encryption',
    name: '暗号化要件',
    pattern: /暗号化|encrypt|SSL|TLS|AES/i,
    severity: 'low',
    category: 'security_risk',
    issue: 'データの暗号化に関する規定があります',
    impact: '暗号化要件の具体性と実装状況の確認が必要',
    recommendation: '暗号化の対象（保存時/通信時）、暗号化方式、鍵管理方法を確認してください',
  },
  {
    id: 'access-control',
    name: 'アクセス制御',
    pattern: /アクセス.{0,10}(?:制御|管理|権限)|access.{0,10}(?:control|management|right)/i,
    severity: 'medium',
    category: 'security_risk',
    issue: 'アクセス制御に関する規定があります',
    impact: 'アクセス権限管理の具体性と実効性の確認が必要',
    recommendation: '権限付与の原則（最小権限）、定期見直し、ログ管理について確認してください',
  },

  // インシデント対応関連
  {
    id: 'breach-notification',
    name: '漏洩通知義務',
    pattern: /(?:漏洩|漏えい|インシデント).{0,10}(?:通知|報告|連絡)|breach.{0,10}notif|incident.{0,10}report/i,
    severity: 'high',
    category: 'security_risk',
    issue: 'セキュリティインシデント時の通知義務があります',
    impact: '通知期限と手続きの明確化が重要',
    recommendation: '通知期限（72時間等）、通知先、通知内容を確認し、社内手順と整合させてください',
  },
  {
    id: 'security-audit',
    name: 'セキュリティ監査権',
    pattern: /セキュリティ.{0,10}監査|security.{0,10}audit|penetration.{0,5}test|脆弱性.{0,10}診断/i,
    severity: 'medium',
    category: 'security_risk',
    issue: 'セキュリティ監査に関する規定があります',
    impact: '監査対応の負担と、相手方環境への監査権の有無',
    recommendation: '監査の頻度、範囲、費用負担、相互の監査権を確認してください',
  },

  // コンプライアンス関連
  {
    id: 'gdpr-reference',
    name: 'GDPR対応',
    pattern: /GDPR|General Data Protection|EU.{0,10}(?:規制|規則)|European.{0,10}regulation/i,
    severity: 'high',
    category: 'compliance_risk',
    issue: 'GDPRへの言及があります',
    impact: 'EU域内のデータ処理に対する厳格な規制の適用',
    recommendation: 'GDPRの各義務（DPO設置、DPIA実施、権利対応等）への対応状況を確認してください',
  },
  {
    id: 'industry-regulation',
    name: '業界規制',
    pattern: /(?:金融庁|FISC|PCI.?DSS|HIPAA|医療|金融).{0,10}(?:規制|基準|ガイドライン)/i,
    severity: 'high',
    category: 'compliance_risk',
    issue: '業界固有の規制への言及があります',
    impact: '業界規制違反時の行政処分、業務停止リスク',
    recommendation: '該当する規制要件を特定し、相手方の対応状況を確認してください',
  },

  // 知的財産関連
  {
    id: 'ip-ownership',
    name: '知的財産権の帰属',
    pattern: /(?:知的財産|著作権|特許).{0,10}(?:帰属|所有|移転)|ownership.{0,10}(?:IP|intellectual)/i,
    severity: 'high',
    category: 'security_risk',
    issue: '知的財産権の帰属に関する規定があります',
    impact: '権利帰属が不明確だと、成果物の利用やソースコードの取得に支障',
    recommendation: '成果物の権利帰属、ソースコードの提供条件を明確にしてください',
  },
  {
    id: 'source-code-escrow',
    name: 'ソースコードエスクロー',
    pattern: /エスクロー|escrow|ソースコード.{0,10}(?:開示|提供|預託)/i,
    severity: 'low',
    category: 'security_risk',
    issue: 'ソースコードエスクローに関する規定があります',
    impact: 'ベンダー倒産時のシステム継続性確保',
    recommendation: 'エスクロー発動条件、更新頻度、費用負担を確認してください',
  },
];

// =============================================================================
// CISOクラス
// =============================================================================

export class CISOExpert extends BasePersona {
  public readonly config = CISO_EXPERT_CONFIG;

  /**
   * 条項を分析
   */
  protected async analyzeClause(
    clause: Clause,
    context: AnalysisContext
  ): Promise<Finding[]> {
    const findings: Finding[] = [];

    // パターンベースのリスク検出
    for (const pattern of SECURITY_RISK_PATTERNS) {
      if (pattern.pattern.test(clause.content)) {
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
   * 条項タイプ固有の分析
   */
  private async analyzeByClauseType(
    clause: Clause,
    context: AnalysisContext
  ): Promise<Finding[]> {
    const findings: Finding[] = [];

    switch (clause.type) {
      case 'confidentiality':
        findings.push(...this.analyzeConfidentialityClause(clause, context));
        break;
      case 'ip_rights':
        findings.push(...this.analyzeIPClause(clause, context));
        break;
    }

    return findings;
  }

  /**
   * 秘密保持条項の詳細分析
   */
  private analyzeConfidentialityClause(clause: Clause, _context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];

    // 秘密情報の定義チェック
    const hasDefinition = /秘密情報.{0,10}(?:とは|を|の定義)|confidential.{0,10}(?:means|defined|includes)/i.test(clause.content);
    if (!hasDefinition) {
      findings.push(this.createFinding(clause, {
        severity: 'medium',
        category: 'security_risk',
        title: '秘密情報の定義不明確',
        issue: '秘密情報の定義が明確でありません',
        impact: '保護対象の範囲が不明確で、紛争時に争点となる可能性',
        recommendation: '秘密情報の具体的な定義と例示を追加してください',
      }));
    }

    // 秘密保持期間のチェック
    const hasDuration = /(?:秘密保持|守秘).{0,10}(?:期間|年間|永久)|confidentiality.{0,10}(?:period|year|perpetual)/i.test(clause.content);
    if (!hasDuration) {
      findings.push(this.createFinding(clause, {
        severity: 'medium',
        category: 'security_risk',
        title: '秘密保持期間の未設定',
        issue: '秘密保持義務の存続期間が明記されていません',
        impact: '永久に秘密保持義務を負う可能性、または義務が曖昧になるリスク',
        recommendation: '秘密保持義務の存続期間（例：契約終了後3年間）を明記してください',
      }));
    }

    // 例外規定のチェック
    const hasExceptions = /(?:秘密情報.{0,20}(?:除く|含まない)|exception|exclude)/i.test(clause.content);
    if (!hasExceptions) {
      findings.push(this.createFinding(clause, {
        severity: 'low',
        category: 'security_risk',
        title: '秘密情報の例外規定なし',
        issue: '秘密情報から除外される情報が定義されていません',
        impact: '公知の情報や独自開発情報も秘密情報扱いになるリスク',
        recommendation: '公知情報、独自開発情報、第三者から適法に取得した情報等を例外として定義してください',
      }));
    }

    // 返還・破棄義務のチェック
    const hasReturnObligation = /(?:返還|破棄|削除).{0,10}(?:義務|しなければ)|return.{0,10}(?:or|and).{0,10}destroy/i.test(clause.content);
    if (!hasReturnObligation) {
      findings.push(this.createFinding(clause, {
        severity: 'medium',
        category: 'security_risk',
        title: '秘密情報の返還・破棄規定なし',
        issue: '契約終了時の秘密情報の取り扱いが規定されていません',
        impact: '契約終了後も相手方が秘密情報を保持し続けるリスク',
        recommendation: '契約終了時の返還または破棄義務と、破棄証明書の提出を規定してください',
      }));
    }

    return findings;
  }

  /**
   * 知的財産権条項の詳細分析
   */
  private analyzeIPClause(clause: Clause, _context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];

    // ワークフォーハイヤー条項のチェック
    const hasWorkForHire = /(?:成果物|著作物).{0,10}(?:帰属|所有).{0,10}(?:発注者|委託者|甲)|work.{0,5}for.{0,5}hire|ownership.{0,10}vest/i.test(clause.content);
    const hasJointOwnership = /共有|共同.{0,5}(?:所有|帰属)|joint.{0,5}ownership/i.test(clause.content);

    if (!hasWorkForHire && !hasJointOwnership) {
      findings.push(this.createFinding(clause, {
        severity: 'high',
        category: 'security_risk',
        title: '権利帰属の不明確',
        issue: '成果物の知的財産権の帰属が明確でありません',
        impact: '成果物を自由に利用・改変できないリスク',
        recommendation: '成果物の権利帰属を明確に規定し、必要な利用権を確保してください',
      }));
    }

    // オープンソースの取り扱いチェック
    const mentionsOpenSource = /オープンソース|OSS|open.{0,3}source|GPL|MIT|Apache/i.test(clause.content);
    if (mentionsOpenSource) {
      findings.push(this.createFinding(clause, {
        severity: 'medium',
        category: 'compliance_risk',
        title: 'オープンソースの利用',
        issue: 'オープンソースソフトウェアの利用が含まれています',
        impact: 'ライセンス条件への違反リスク、ソースコード開示義務の発生可能性',
        recommendation: '使用するOSSのライセンス種別と義務（帰属表示、ソース開示等）を確認してください',
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

    // 秘密保持条項の存在チェック
    const hasConfidentiality = contract.clauses.some((c) => c.type === 'confidentiality');
    if (!hasConfidentiality) {
      // 全文に秘密保持の言及があるかチェック
      const mentionsConfidential = /秘密|機密|confidential/i.test(contract.rawText);
      if (mentionsConfidential) {
        findings.push({
          id: this.generateFindingId(),
          persona: this.config.type,
          clauseRef: 'cross-cutting',
          clauseNumber: '該当条項なし',
          severity: 'high',
          category: 'security_risk',
          title: '独立した秘密保持条項の欠如',
          issue: '秘密保持に関する言及はありますが、独立した条項として整理されていません',
          impact: '秘密保持義務の範囲、期間、例外が不明確',
          recommendation: '独立した秘密保持条項を追加し、義務の内容を明確化してください',
          evidence: ['契約書内に秘密情報への言及がありますが、専用条項がありません'],
        });
      }
    }

    // データ処理契約（DPA）の必要性チェック
    const mentionsPersonalData = /個人情報|個人データ|personal.{0,5}data/i.test(contract.rawText);
    const hasDPA = /データ処理|data.{0,5}processing.{0,5}agreement|DPA/i.test(contract.rawText);
    if (mentionsPersonalData && !hasDPA) {
      findings.push({
        id: this.generateFindingId(),
        persona: this.config.type,
        clauseRef: 'cross-cutting',
        clauseNumber: '該当条項なし',
        severity: 'high',
        category: 'compliance_risk',
        title: 'データ処理契約（DPA）の検討',
        issue: '個人データの取り扱いがありますが、データ処理契約への言及がありません',
        impact: '個人情報保護法やGDPRの要件を満たせない可能性',
        recommendation: '別途データ処理契約（DPA）を締結するか、本契約にデータ処理条項を追加してください',
        evidence: ['個人データの取り扱いが含まれますが、DPAへの言及がありません'],
      });
    }

    // セキュリティ要件の包括性チェック
    const securityKeywords = ['暗号化', 'アクセス制御', 'ログ', '監査', 'バックアップ', 'encrypt', 'access control', 'audit', 'backup'];
    const foundKeywords = securityKeywords.filter((kw) => contract.rawText.toLowerCase().includes(kw.toLowerCase()));

    if (mentionsPersonalData && foundKeywords.length < 3) {
      findings.push({
        id: this.generateFindingId(),
        persona: this.config.type,
        clauseRef: 'cross-cutting',
        clauseNumber: '全体',
        severity: 'medium',
        category: 'security_risk',
        title: 'セキュリティ要件の不足',
        issue: '個人データを扱う契約ですが、技術的セキュリティ要件が限定的です',
        impact: 'データ保護に必要なセキュリティ対策が確保されないリスク',
        recommendation: '暗号化、アクセス制御、ログ管理、バックアップ等のセキュリティ要件を追加してください',
        evidence: [`検出されたセキュリティ関連用語: ${foundKeywords.join(', ') || 'なし'}`],
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
    const securityFindings = findings.filter((f) => f.category === 'security_risk');
    const complianceFindings = findings.filter((f) => f.category === 'compliance_risk');

    let summary = `【CISOセキュリティレビュー結果】\n`;
    summary += `セキュリティリスク: ${securityFindings.length}件、コンプライアンスリスク: ${complianceFindings.length}件\n\n`;

    if (critical.length > 0) {
      summary += `🔴 致命的リスク:\n`;
      critical.forEach((f) => {
        summary += `  - ${f.title}: ${f.issue}\n`;
      });
    }

    if (high.length > 0) {
      summary += `\n🟠 重大リスク:\n`;
      high.forEach((f) => {
        summary += `  - ${f.title}: ${f.issue}\n`;
      });
    }

    if (critical.length === 0 && high.length === 0) {
      summary += `✅ 重大なセキュリティ/コンプライアンスリスクは検出されませんでした。\n`;
    }

    return summary;
  }
}

// =============================================================================
// エクスポート
// =============================================================================

export function createCISOExpert(): CISOExpert {
  return new CISOExpert();
}
