/**
 * Contract Parser - 契約書構造化パーサー
 *
 * 契約書テキストを構造化されたContractオブジェクトに変換
 */

import {
  Contract,
  ContractType,
  ContractMetadata,
  Clause,
  ClauseType,
  Party,
  Obligation,
  Attachment,
} from '../models/types';

// =============================================================================
// 型定義
// =============================================================================

export interface ParserConfig {
  language?: 'ja' | 'en' | 'auto';
  strictMode?: boolean;
  extractObligations?: boolean;
}

export interface ParserResult {
  success: boolean;
  contract?: Contract;
  warnings: string[];
  errors: string[];
}

// =============================================================================
// パターン定義
// =============================================================================

/**
 * 日本語契約書のパターン
 */
const JA_PATTERNS = {
  // 条項パターン
  articleHeader: /^第(\d+)条[　\s]*[（\(]?([^）\)]*)[）\)]?/m,
  articleHeaderAlt: /^(\d+)[\.．][　\s]*(.+)/m,
  subArticle: /^(\d+)[　\s]+(.+)/m,
  itemNumber: /^[（\(](\d+)[）\)][　\s]*/m,

  // 当事者パターン
  partyDefinition: /[「（\(]([^」）\)]+)[」）\)][（\(]?以下[「（\(]?([甲乙丙丁A-Z]+)[」）\)]?/g,
  partyReference: /[甲乙丙丁]|当事者[A-Z]/g,

  // 義務パターン
  obligationMust: /(しなければならない|する義務を負う|するものとする|shall|must)/,
  obligationMustNot: /(してはならない|することができない|禁止する|shall not|must not)/,
  obligationMay: /(することができる|する権利を有する|may|can)/,
  obligationShould: /(するよう努める|努力する|should)/,

  // 期限パターン
  deadline: /(\d+)日以内|(\d+)ヶ月以内|(\d+)年以内|速やかに|遅滞なく/,

  // 契約タイプ検出
  contractTypes: {
    nda: /秘密保持|機密保持|NDA|守秘義務|Non-Disclosure/i,
    service_agreement: /業務委託|サービス契約|役務提供|請負|委任/i,
    license: /ライセンス|使用許諾|実施許諾|License/i,
    employment: /雇用契約|労働契約|就業/i,
    lease: /賃貸借|リース|Lease/i,
    sales: /売買契約|購入|販売|Sales/i,
    partnership: /提携|協業|パートナーシップ|Partnership|Alliance/i,
  },

  // 条項タイプ検出
  clauseTypes: {
    payment: /支払|対価|報酬|代金|料金|Payment/i,
    liability: /責任|賠償|損害|Liability|Damages/i,
    indemnification: /補償|免責|Indemnif/i,
    termination: /解除|終了|解約|Termination/i,
    confidentiality: /秘密|機密|守秘|Confidential/i,
    ip_rights: /知的財産|著作権|特許|商標|IP|Intellectual Property/i,
    dispute_resolution: /紛争|裁判|仲裁|調停|管轄|Dispute|Arbitration/i,
    force_majeure: /不可抗力|Force Majeure/i,
    warranty: /保証|瑕疵|Warranty/i,
    non_compete: /競業|競合|Non-Compete/i,
    assignment: /譲渡|移転|Assignment/i,
    governing_law: /準拠法|適用法|Governing Law/i,
  },

  // 添付資料パターン
  attachment: /別紙|別添|附則|Schedule|Exhibit|Appendix/i,
};

/**
 * 英語契約書のパターン
 */
const EN_PATTERNS = {
  articleHeader: /^(?:Article|Section|Clause)\s+(\d+)[.:]\s*(.+)/im,
  subArticle: /^(\d+)\.(\d+)\s+(.+)/m,

  partyDefinition: /"([^"]+)"\s*\((?:the\s+)?"([^"]+)"\)/g,

  obligationMust: /\b(shall|must|will be required to|is obligated to)\b/i,
  obligationMustNot: /\b(shall not|must not|may not|is prohibited from)\b/i,
  obligationMay: /\b(may|is entitled to|has the right to)\b/i,
  obligationShould: /\b(should|shall endeavor to|shall use .* efforts)\b/i,

  deadline: /within\s+(\d+)\s+(days?|months?|years?)|promptly|without delay/i,

  contractTypes: {
    nda: /Non-Disclosure|Confidentiality Agreement|NDA/i,
    service_agreement: /Service Agreement|Master Service|Professional Services/i,
    license: /License Agreement|Software License|End User License/i,
    employment: /Employment Agreement|Employment Contract/i,
    lease: /Lease Agreement|Rental Agreement/i,
    sales: /Sales Agreement|Purchase Agreement|Sale Contract/i,
    partnership: /Partnership Agreement|Alliance Agreement|Joint Venture/i,
  },

  clauseTypes: {
    payment: /Payment|Fee|Compensation|Price/i,
    liability: /Liability|Damages|Limitation of Liability/i,
    indemnification: /Indemnif|Hold Harmless/i,
    termination: /Termination|Expir/i,
    confidentiality: /Confidential|Non-Disclosure/i,
    ip_rights: /Intellectual Property|Copyright|Patent|Trademark/i,
    dispute_resolution: /Dispute|Arbitration|Jurisdiction|Governing Law/i,
    force_majeure: /Force Majeure/i,
    warranty: /Warrant|Representation/i,
    non_compete: /Non-Compete|Non-Competition/i,
    assignment: /Assignment|Transfer/i,
    governing_law: /Governing Law|Applicable Law|Choice of Law/i,
  },

  attachment: /Schedule|Exhibit|Appendix|Annex/i,
};

// =============================================================================
// パーサークラス
// =============================================================================

export class ContractParser {
  private config: ParserConfig;
  private patterns: typeof JA_PATTERNS | typeof EN_PATTERNS;
  private warnings: string[] = [];
  private errors: string[] = [];

  constructor(config: ParserConfig = {}) {
    this.config = {
      language: config.language || 'auto',
      strictMode: config.strictMode ?? false,
      extractObligations: config.extractObligations ?? true,
    };
    this.patterns = JA_PATTERNS; // デフォルト
  }

  /**
   * 契約書テキストをパースしてContractオブジェクトを返す
   */
  public parse(text: string, suggestedType?: ContractType): ParserResult {
    this.warnings = [];
    this.errors = [];

    try {
      // 言語検出とパターン選択
      const language = this.detectLanguage(text);
      this.patterns = language === 'en' ? EN_PATTERNS : JA_PATTERNS;

      // 契約タイプの検出
      const contractType = suggestedType || this.detectContractType(text);

      // 当事者の抽出
      const parties = this.extractParties(text);

      // 条項の抽出
      const clauses = this.extractClauses(text);

      // 添付資料の抽出
      const attachments = this.extractAttachments(text);

      // メタデータ生成
      const metadata = this.generateMetadata(text, language);

      const contract: Contract = {
        id: this.generateContractId(),
        title: this.extractTitle(text) || '無題の契約書',
        type: contractType,
        parties,
        clauses,
        attachments,
        rawText: text,
        metadata,
      };

      // 日付情報の抽出（オプション）
      const dates = this.extractDates(text);
      if (dates.effective) contract.effectiveDate = dates.effective;
      if (dates.termination) contract.terminationDate = dates.termination;

      return {
        success: true,
        contract,
        warnings: this.warnings,
        errors: this.errors,
      };
    } catch (error) {
      this.errors.push(`パース中にエラーが発生: ${error}`);
      return {
        success: false,
        warnings: this.warnings,
        errors: this.errors,
      };
    }
  }

  /**
   * 言語を検出
   */
  private detectLanguage(text: string): 'ja' | 'en' {
    if (this.config.language && this.config.language !== 'auto') {
      return this.config.language;
    }

    // 日本語文字の比率で判定
    const japaneseChars = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g);
    const japaneseRatio = (japaneseChars?.length || 0) / text.length;

    return japaneseRatio > 0.1 ? 'ja' : 'en';
  }

  /**
   * 契約タイプを検出
   */
  private detectContractType(text: string): ContractType {
    const patterns = this.patterns as typeof JA_PATTERNS;

    for (const [type, pattern] of Object.entries(patterns.contractTypes)) {
      if (pattern.test(text)) {
        return type as ContractType;
      }
    }

    this.warnings.push('契約タイプを自動検出できませんでした。"other" として処理します。');
    return 'other';
  }

  /**
   * タイトルを抽出
   */
  private extractTitle(text: string): string | null {
    const lines = text.split('\n').filter((line) => line.trim());

    // 最初の数行からタイトルらしきものを探す
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      if (line.includes('契約書') || line.includes('Agreement') || line.includes('Contract')) {
        return line;
      }
    }

    return lines[0]?.trim() || null;
  }

  /**
   * 当事者を抽出
   */
  private extractParties(text: string): Party[] {
    const parties: Party[] = [];
    const patterns = this.patterns as typeof JA_PATTERNS;
    let match: RegExpExecArray | null;

    // パターンをリセット
    patterns.partyDefinition.lastIndex = 0;

    while ((match = patterns.partyDefinition.exec(text)) !== null) {
      const [, fullName, shortName] = match;
      parties.push({
        id: `party-${parties.length + 1}`,
        name: fullName,
        role: this.inferPartyRole(shortName, parties.length),
        isOurSide: parties.length === 0, // 最初の当事者を自社側と仮定
      });
    }

    if (parties.length === 0) {
      this.warnings.push('当事者を自動検出できませんでした。');
    }

    return parties;
  }

  /**
   * 当事者の役割を推定
   */
  private inferPartyRole(
    shortName: string,
    index: number
  ): Party['role'] {
    const lowerName = shortName.toLowerCase();

    if (lowerName.includes('甲') || lowerName === 'a' || index === 0) {
      return 'client';
    }
    if (lowerName.includes('乙') || lowerName === 'b' || index === 1) {
      return 'vendor';
    }
    if (lowerName.includes('丙') || lowerName === 'c') {
      return 'partner';
    }

    return 'other';
  }

  /**
   * 条項を抽出
   */
  private extractClauses(text: string): Clause[] {
    const clauses: Clause[] = [];
    const patterns = this.patterns as typeof JA_PATTERNS;

    // 条項の区切りを検出
    const lines = text.split('\n');
    let currentClause: Partial<Clause> | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // 新しい条項のヘッダーをチェック
      const articleMatch = trimmedLine.match(patterns.articleHeader) ||
                          trimmedLine.match(patterns.articleHeaderAlt);

      if (articleMatch) {
        // 前の条項を保存
        if (currentClause && currentClause.number) {
          currentClause.content = currentContent.join('\n');
          currentClause.obligations = this.config.extractObligations
            ? this.extractObligations(currentClause.content)
            : [];
          clauses.push(currentClause as Clause);
        }

        // 新しい条項を開始
        const [, number, title] = articleMatch;
        currentClause = {
          id: `clause-${clauses.length + 1}`,
          number: `第${number}条`,
          type: this.detectClauseType(title + ' ' + trimmedLine),
          title: title || '',
          content: '',
          obligations: [],
        };
        currentContent = [trimmedLine];
      } else if (currentClause) {
        currentContent.push(trimmedLine);
      }
    }

    // 最後の条項を保存
    if (currentClause && currentClause.number) {
      currentClause.content = currentContent.join('\n');
      currentClause.obligations = this.config.extractObligations
        ? this.extractObligations(currentClause.content)
        : [];
      clauses.push(currentClause as Clause);
    }

    if (clauses.length === 0) {
      // 条項が見つからない場合、全文を1つの条項として扱う
      this.warnings.push('条項構造を検出できませんでした。全文を1つの条項として処理します。');
      clauses.push({
        id: 'clause-1',
        number: '全文',
        type: 'general',
        title: '契約本文',
        content: text,
        obligations: this.config.extractObligations ? this.extractObligations(text) : [],
      });
    }

    return clauses;
  }

  /**
   * 条項タイプを検出
   */
  private detectClauseType(text: string): ClauseType {
    const patterns = this.patterns as typeof JA_PATTERNS;

    for (const [type, pattern] of Object.entries(patterns.clauseTypes)) {
      if (pattern.test(text)) {
        return type as ClauseType;
      }
    }

    return 'general';
  }

  /**
   * 義務を抽出
   */
  private extractObligations(content: string): Obligation[] {
    const obligations: Obligation[] = [];
    const patterns = this.patterns as typeof JA_PATTERNS;

    // 文単位で分割
    const sentences = content.split(/[。.]/);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      let type: Obligation['type'] | null = null;

      if (patterns.obligationMust.test(trimmed)) {
        type = 'must';
      } else if (patterns.obligationMustNot.test(trimmed)) {
        type = 'must_not';
      } else if (patterns.obligationMay.test(trimmed)) {
        type = 'may';
      } else if (patterns.obligationShould.test(trimmed)) {
        type = 'should';
      }

      if (type) {
        const deadlineMatch = trimmed.match(patterns.deadline);
        obligations.push({
          id: `obligation-${obligations.length + 1}`,
          party: this.extractObligationParty(trimmed),
          type,
          description: trimmed,
          deadline: deadlineMatch ? deadlineMatch[0] : undefined,
        });
      }
    }

    return obligations;
  }

  /**
   * 義務の主体（当事者）を抽出
   */
  private extractObligationParty(sentence: string): string {
    const patterns = this.patterns as typeof JA_PATTERNS;
    const match = sentence.match(patterns.partyReference);
    return match ? match[0] : 'unknown';
  }

  /**
   * 添付資料を抽出
   */
  private extractAttachments(text: string): Attachment[] {
    const attachments: Attachment[] = [];
    const patterns = this.patterns as typeof JA_PATTERNS;

    const matches = text.matchAll(new RegExp(patterns.attachment, 'gi'));

    for (const match of matches) {
      // 重複を避けつつ添付資料を記録
      const name = match[0];
      if (!attachments.some((a) => a.name === name)) {
        attachments.push({
          id: `attachment-${attachments.length + 1}`,
          name,
          type: this.inferAttachmentType(name),
          description: `${name}への参照が契約書内に存在`,
        });
      }
    }

    return attachments;
  }

  /**
   * 添付資料のタイプを推定
   */
  private inferAttachmentType(name: string): Attachment['type'] {
    const lower = name.toLowerCase();
    if (lower.includes('schedule') || lower.includes('別紙')) return 'schedule';
    if (lower.includes('exhibit') || lower.includes('別添')) return 'exhibit';
    return 'appendix';
  }

  /**
   * 日付を抽出
   */
  private extractDates(text: string): { effective?: string; termination?: string } {
    const result: { effective?: string; termination?: string } = {};

    // 日本語の日付パターン
    const jaDatePattern = /(?:令和|平成|昭和)?(\d{1,4})年(\d{1,2})月(\d{1,2})日/g;
    // 西暦パターン
    const enDatePattern = /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/g;

    const matches = [...text.matchAll(jaDatePattern), ...text.matchAll(enDatePattern)];

    if (matches.length > 0) {
      // 最初の日付を発効日と仮定
      const firstMatch = matches[0];
      result.effective = firstMatch[0];

      // 終了日のヒントを探す
      const terminationHints = /終了日|満了日|期限|expir|terminat/i;
      for (const match of matches) {
        const context = text.substring(
          Math.max(0, match.index! - 50),
          match.index! + match[0].length
        );
        if (terminationHints.test(context)) {
          result.termination = match[0];
          break;
        }
      }
    }

    return result;
  }

  /**
   * メタデータを生成
   */
  private generateMetadata(text: string, language: 'ja' | 'en'): ContractMetadata {
    const wordCount = text.split(/\s+/).length;
    const lineCount = text.split('\n').length;

    return {
      language,
      wordCount,
      pageCount: Math.ceil(lineCount / 50), // 概算
      parsedAt: new Date().toISOString(),
    };
  }

  /**
   * 契約書IDを生成
   */
  private generateContractId(): string {
    return `contract-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// =============================================================================
// エクスポート
// =============================================================================

export function parseContract(
  text: string,
  config?: ParserConfig,
  suggestedType?: ContractType
): ParserResult {
  const parser = new ContractParser(config);
  return parser.parse(text, suggestedType);
}
