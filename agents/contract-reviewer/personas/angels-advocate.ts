/**
 * Angel's Advocate Persona - 天使の代理人ペルソナ
 *
 * 契約締結のメリットを擁護し、リスクの緩和策を提示する
 * 「この契約を締結すべき」立場から主張を構築
 */

import {
  PersonaConfig,
  Finding,
  Argument,
  Contract,
  SEVERITY_WEIGHTS,
} from '../models/types';
import { BaseDebater, DebateContext } from './base-persona';

// =============================================================================
// 天使の代理人の設定
// =============================================================================

const ANGELS_ADVOCATE_CONFIG: PersonaConfig = {
  type: 'angels_advocate',
  name: '天使の代理人',
  description: '契約締結のビジネスメリットを擁護し、リスクを適切に評価して緩和策を提示する',
  focusAreas: [],
  riskCategories: [],
  systemPrompt: `あなたは「天使の代理人」です。
契約締結のビジネスメリットを強調し、
指摘されたリスクに対して現実的な緩和策を提示します。

【役割】
- 契約締結によるビジネスメリットを明確化する
- リスクを過大評価せず、現実的に評価する
- 実行可能な緩和策・対応策を提示する
- 取引の重要性と機会損失を強調する

【姿勢】
- 建設的かつ前向き
- リスクを否定せず、管理可能であることを示す
- ビジネス機会を逃さないよう主張する
- 実務的で現実的な視点を維持する`,
};

// =============================================================================
// リスク緩和パターン
// =============================================================================

interface RiskMitigationPattern {
  category: Finding['category'];
  mitigationStrategies: string[];
  businessJustifications: string[];
  industryPractices: string[];
  negotiationTips: string[];
}

const RISK_MITIGATION_PATTERNS: Record<string, RiskMitigationPattern> = {
  legal_risk: {
    mitigationStrategies: [
      '法務部による詳細レビューと修正交渉で対応可能',
      '保険（D&O保険、E&O保険等）によるリスクヘッジが可能',
      '相手方との良好な関係構築により、紛争リスクを低減できる',
      '定期的な契約見直し条項を追加することで、問題発生時に対応できる',
    ],
    businessJustifications: [
      'この程度の法的リスクは、ビジネス上許容範囲内である',
      '同業他社も類似の条件で契約を締結している',
      '取引関係の構築による長期的なメリットが大きい',
    ],
    industryPractices: [
      '業界標準の契約条件として広く使用されている',
      '主要な競合他社も同様の条件を受け入れている',
      '法的な争いに発展したケースは実際には稀である',
    ],
    negotiationTips: [
      '相互的な条項への修正を提案すれば、相手方も応じやすい',
      '責任上限の追加は業界標準として受け入れられやすい',
      '準拠法の交渉は、取引規模に応じて柔軟に対応可能',
    ],
  },
  financial_risk: {
    mitigationStrategies: [
      '予算に余裕を持たせることで、追加コストに対応可能',
      '為替予約やヘッジにより、為替リスクを軽減できる',
      '契約更新時に条件見直しを交渉することで、長期的なコストを管理できる',
      '成果連動型の支払い条件に変更することで、リスクを分散できる',
    ],
    businessJustifications: [
      'この投資により得られるリターンは、コストを大幅に上回る',
      '競合他社との差別化に必要な投資である',
      '内製化するよりも、コスト効率が高い',
    ],
    industryPractices: [
      'この価格帯は市場相場として妥当である',
      '前払いは業界慣行として一般的である',
      '自動更新条項は管理を簡素化するためのものである',
    ],
    negotiationTips: [
      'ボリュームディスカウントを交渉できる余地がある',
      '長期契約により、単価を引き下げられる可能性がある',
      '支払い条件の柔軟化は相手方も受け入れやすい',
    ],
  },
  security_risk: {
    mitigationStrategies: [
      '相手方のセキュリティ認証（ISO27001等）で一定の保証がある',
      '契約にセキュリティ要件を追加することで、保護レベルを向上できる',
      'サイバー保険によるリスク転嫁が可能',
      '定期的なセキュリティ監査により、継続的に状況を確認できる',
    ],
    businessJustifications: [
      'データ活用による業務効率化のメリットが大きい',
      '自社でシステム構築するよりも、セキュリティレベルが高い場合がある',
      '規制対応のコストを外部に委託することで、総コストを削減できる',
    ],
    industryPractices: [
      '大手企業も同様のクラウドサービスを利用している',
      'セキュリティ認証取得事業者との取引は業界標準である',
      'データ処理契約（DPA）の締結で法的要件を満たせる',
    ],
    negotiationTips: [
      'セキュリティ条項の追加は相手方も歓迎することが多い',
      '監査権の付与は交渉の余地がある',
      'インシデント通知義務の明確化は双方にメリットがある',
    ],
  },
  operational_risk: {
    mitigationStrategies: [
      '段階的な導入により、運用負荷を分散できる',
      '社内体制の強化により、SLA達成は十分可能',
      '外部リソースの活用により、一時的な負荷に対応できる',
      'プロジェクト管理の強化により、スケジュールリスクを低減できる',
    ],
    businessJustifications: [
      'この運用負荷は、業務改善効果で十分に正当化される',
      'チームのスキルアップにつながる',
      '将来的な内製化の基盤となる',
    ],
    industryPractices: [
      'このレベルのSLAは業界で一般的に達成されている',
      '類似のプロジェクトで成功した実績がある',
      '標準的なリソース配置で対応可能な範囲である',
    ],
    negotiationTips: [
      'SLAの段階的引き上げを提案すれば、相手方も受け入れやすい',
      '相互的なKPI設定により、公平な契約になる',
      '移行支援期間の延長は交渉可能である',
    ],
  },
  compliance_risk: {
    mitigationStrategies: [
      '専門家（弁護士、コンサルタント）の助言により適切に対応可能',
      '相手方のコンプライアンス体制を事前に確認することで、リスクを軽減できる',
      '定期的な法改正モニタリングにより、変化に対応できる',
      'コンプライアンスプログラムの強化で対応可能',
    ],
    businessJustifications: [
      'コンプライアンス対応は将来の競争力の源泉になる',
      '規制対応を先行することで、競合優位性を確保できる',
      'ステークホルダーからの信頼向上につながる',
    ],
    industryPractices: [
      '同業他社も同様の規制環境下で事業を行っている',
      '業界団体のガイドラインに沿った対応で十分である',
      '規制当局との良好な関係を維持している企業は問題が少ない',
    ],
    negotiationTips: [
      'コンプライアンス条項の追加は相手方も望ましいと考えることが多い',
      '規制変更時の対応義務の相互化は交渉可能である',
      'コンプライアンス費用の分担についても協議の余地がある',
    ],
  },
  reputational_risk: {
    mitigationStrategies: [
      '相手方の評判・信用調査を実施することでリスクを事前評価できる',
      '秘密保持条項により、契約内容の漏洩を防止できる',
      '危機管理計画の策定により、問題発生時に適切に対応できる',
      'ステークホルダーとの透明なコミュニケーションでリスクを軽減できる',
    ],
    businessJustifications: [
      'この取引関係の構築は、企業ブランド価値の向上につながる',
      '業界リーダーとの取引は、市場での信頼性を高める',
      '社会的責任を果たすことで、長期的な企業価値が向上する',
    ],
    industryPractices: [
      '信頼できるパートナーとの取引は業界の常識である',
      '適切なデューデリジェンスを実施することで、リスクは管理可能',
      '問題が発生しても、適切な対応により影響を最小化できる',
    ],
    negotiationTips: [
      '相互の秘密保持義務の強化は双方にメリットがある',
      'エスカレーション条項の追加により、問題の早期解決が可能',
      '定期的なレビュー会議の設定で、関係性を維持できる',
    ],
  },
};

// =============================================================================
// 天使の代理人クラス
// =============================================================================

export class AngelsAdvocate extends BaseDebater {
  public readonly config = ANGELS_ADVOCATE_CONFIG;

  /**
   * 議論における主張を生成
   */
  public async argue(context: DebateContext): Promise<Argument> {
    const { finding, opponentArgument, round } = context;

    // 緩和策を構築
    const mitigation = this.buildMitigationStrategy(finding);

    // 反論への対応を準備
    const counterpoints = this.prepareCounterpoints(opponentArgument);

    // 主張を構築
    const position = this.buildPosition(finding, mitigation, round);
    const reasoning = this.buildReasoning(finding, mitigation);
    const evidence = this.gatherEvidence(finding, context.contract);

    return {
      position,
      reasoning,
      evidence,
      counterpoints,
    };
  }

  /**
   * 緩和策を構築
   */
  private buildMitigationStrategy(finding: Finding): {
    strategies: string[];
    justifications: string[];
    practices: string[];
    tips: string[];
  } {
    const pattern = RISK_MITIGATION_PATTERNS[finding.category];

    if (!pattern) {
      return {
        strategies: ['適切な管理体制の構築により、このリスクは管理可能です'],
        justifications: ['ビジネス上のメリットがリスクを上回ります'],
        practices: ['同様のリスクを管理しながら取引を行う企業は多数あります'],
        tips: ['相手方との協議により、懸念事項を解消できる可能性があります'],
      };
    }

    return {
      strategies: pattern.mitigationStrategies,
      justifications: pattern.businessJustifications,
      practices: pattern.industryPractices,
      tips: pattern.negotiationTips,
    };
  }

  /**
   * ポジション（主張）を構築
   */
  private buildPosition(
    finding: Finding,
    mitigation: { strategies: string[]; justifications: string[]; practices: string[]; tips: string[] },
    round: number
  ): string {
    const severityResponse = {
      critical: 'この指摘は重要ですが、適切な対策により管理可能なリスクです。',
      high: 'このリスクは認識していますが、緩和策を講じることで対応できます。',
      medium: 'この程度のリスクはビジネス上許容範囲内であり、標準的な対応で十分です。',
      low: 'このリスクは軽微であり、過度な懸念は不要です。',
    };

    let position = severityResponse[finding.severity];

    // ラウンドに応じて主張を構成
    if (round === 1) {
      position += `\n\n【緩和策】\n`;
      position += mitigation.strategies.slice(0, 2).map((s) => `• ${s}`).join('\n');
      position += `\n\n【ビジネス上の正当性】\n`;
      position += mitigation.justifications.slice(0, 1).map((j) => `• ${j}`).join('\n');
    } else {
      position += `\n\n悪魔の代理人の懸念は理解しますが、過度に悲観的です。`;
      position += `\n\n【交渉により解決可能】\n`;
      position += mitigation.tips.slice(0, 2).map((t) => `• ${t}`).join('\n');
    }

    return position;
  }

  /**
   * 根拠を構築
   */
  private buildReasoning(
    finding: Finding,
    mitigation: { strategies: string[]; justifications: string[]; practices: string[]; tips: string[] }
  ): string {
    let reasoning = `【リスク管理の観点】\n`;
    reasoning += `1. このリスクは業界で一般的に認識されており、管理手法が確立されています\n`;
    reasoning += `2. 適切な緩和策により、実害が発生する可能性は低減できます\n`;
    reasoning += `3. 完全なリスク排除を求めると、ビジネス機会を逃すことになります\n`;

    if (mitigation.practices.length > 0) {
      reasoning += `\n【業界の実態】\n`;
      reasoning += mitigation.practices.slice(0, 2).map((p) => `• ${p}`).join('\n');
    }

    reasoning += `\n\n【結論】\n`;
    reasoning += `このリスクを理由に契約を見送ることは、ビジネス機会の損失につながります。`;
    reasoning += `適切な緩和策を講じた上で、契約を締結することを推奨します。`;

    return reasoning;
  }

  /**
   * 証拠を収集
   */
  private gatherEvidence(finding: Finding, contract: Contract): string[] {
    const evidence: string[] = [];

    // ポジティブな条項を抽出
    const positivePatterns = [
      { pattern: /相互.{0,10}協力|mutual.{0,10}cooperation/gi, benefit: '相互協力条項があり、良好な関係構築が期待できる' },
      { pattern: /誠実.{0,10}協議|good.{0,10}faith/gi, benefit: '誠実協議条項があり、問題解決の意思が示されている' },
      { pattern: /定期.{0,10}見直し|periodic.{0,10}review/gi, benefit: '定期見直し条項があり、柔軟な対応が可能' },
    ];

    for (const { pattern, benefit } of positivePatterns) {
      if (pattern.test(contract.rawText)) {
        evidence.push(benefit);
        break; // 1つだけ追加
      }
    }

    // 緩和要素の存在
    if (finding.recommendation) {
      evidence.push(`推奨される対策: ${finding.recommendation}`);
    }

    // 業界標準への言及
    evidence.push('同業他社も類似の条件で契約を締結している事例がある');

    return evidence;
  }

  /**
   * 反論への対応を準備
   */
  private prepareCounterpoints(opponentArgument?: Argument): string[] {
    if (!opponentArgument) return [];

    const counterpoints: string[] = [];

    // 最悪のシナリオへの反論
    if (opponentArgument.position.includes('最悪') ||
        opponentArgument.position.includes('致命的')) {
      counterpoints.push('最悪のシナリオを想定することは重要ですが、その発生確率も考慮すべきです。低確率のリスクに過度に反応すると、ビジネス機会を逃します。');
    }

    // 過去の失敗事例への反論
    if (opponentArgument.reasoning.includes('事例') ||
        opponentArgument.reasoning.includes('判例')) {
      counterpoints.push('過去の失敗事例は学ぶべき教訓ですが、すべてのケースに当てはまるわけではありません。当社の状況と相手方の信頼性を考慮すれば、同様の問題は回避できます。');
    }

    // 契約拒否への反論
    if (opponentArgument.position.includes('締結すべきでない') ||
        opponentArgument.position.includes('拒否')) {
      counterpoints.push('契約を拒否することのコストも考慮すべきです。競合他社がこの機会を得れば、市場でのポジションが悪化します。');
    }

    // デフォルトの反論
    if (counterpoints.length === 0) {
      counterpoints.push('悪魔の代理人の主張は過度に悲観的です。リスクを認識しつつも、適切に管理することで、ビジネス価値を実現できます。');
    }

    return counterpoints;
  }

  /**
   * メリットスコアを計算（高いほど契約締結を推奨）
   */
  public calculateOpportunityScore(finding: Finding): number {
    // 重要度が低いほど、締結への影響は小さい
    const baseScore = 5 - SEVERITY_WEIGHTS[finding.severity];

    // 緩和策の有無による調整
    const hasMitigation = RISK_MITIGATION_PATTERNS[finding.category] !== undefined;
    const mitigationBonus = hasMitigation ? 1.5 : 0;

    // 推奨事項の存在による調整
    const recommendationBonus = finding.recommendation ? 0.5 : 0;

    return baseScore + mitigationBonus + recommendationBonus;
  }
}

// =============================================================================
// エクスポート
// =============================================================================

export function createAngelsAdvocate(): AngelsAdvocate {
  return new AngelsAdvocate();
}
