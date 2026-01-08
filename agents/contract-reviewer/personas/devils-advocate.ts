/**
 * Devil's Advocate Persona - 悪魔の代理人ペルソナ
 *
 * リスクを最大化する視点で契約の危険性を指摘する
 * 「この契約を締結すべきでない」立場から主張を構築
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
// 悪魔の代理人の設定
// =============================================================================

const DEVILS_ADVOCATE_CONFIG: PersonaConfig = {
  type: 'devils_advocate',
  name: '悪魔の代理人',
  description: 'あらゆるリスクを最悪のシナリオで解釈し、契約締結に反対する立場から主張する',
  focusAreas: [],
  riskCategories: [],
  systemPrompt: `あなたは「悪魔の代理人」です。
契約に潜むすべてのリスクを最悪のシナリオで解釈し、
この契約を締結すべきでない理由を徹底的に主張します。

【役割】
- すべての指摘事項を最も深刻に解釈する
- 隠れたリスクを暴き出す
- 楽観的な見方を徹底的に否定する
- 過去の訴訟事例や失敗例を引用する

【姿勢】
- 極めて悲観的
- 「最悪の場合」を常に想定
- 相手方の善意を信用しない
- この契約は危険だと警告する`,
};

// =============================================================================
// リスク増幅パターン
// =============================================================================

interface RiskAmplificationPattern {
  category: Finding['category'];
  worstCaseScenarios: string[];
  historicalReferences: string[];
  hiddenDangers: string[];
}

const RISK_AMPLIFICATION_PATTERNS: Record<string, RiskAmplificationPattern> = {
  legal_risk: {
    worstCaseScenarios: [
      '訴訟に発展し、巨額の損害賠償を請求される',
      '契約違反を理由に取引停止され、事業継続が困難になる',
      '条項の解釈で不利な判決が下され、判例として定着する',
      '相手方が悪意を持って契約を利用し、法的責任を押し付けてくる',
    ],
    historicalReferences: [
      '類似の曖昧な条項で数億円の損害賠償が認められた判例がある',
      '免責条項が無効と判断され、全額賠償を命じられたケースがある',
      '準拠法が外国法の場合、日本企業が不利な判決を受ける傾向がある',
    ],
    hiddenDangers: [
      'この条項は将来の法改正で無効になる可能性がある',
      '相手方が経営破綻した場合、この契約が負債として残る',
      '競合他社に買収された場合、契約が不利に利用される',
    ],
  },
  financial_risk: {
    worstCaseScenarios: [
      '隠れたコストが積み上がり、当初見積もりの3倍以上の支出になる',
      '為替変動で支払額が急増し、予算を大幅超過する',
      '違約金条項により、サービス未利用でも多額の支払いが発生する',
      '自動更新を見逃し、不要な契約が何年も継続する',
    ],
    historicalReferences: [
      '最低コミットメント条項で年間数億円の損失を出した企業がある',
      '価格改定条項により、契約期間中に費用が2倍になった事例がある',
      '中途解約金が契約総額を超えたケースが報告されている',
    ],
    hiddenDangers: [
      '「追加費用」の定義が曖昧で、想定外の請求が来る可能性がある',
      '為替リスクがヘッジされておらず、円安で支払額が急増する',
      '税金の取り扱いが不明確で、消費税分の追加請求がありえる',
    ],
  },
  security_risk: {
    worstCaseScenarios: [
      '個人情報漏洩により、数百億円規模の損害賠償と業務停止命令を受ける',
      'サイバー攻撃により顧客データが流出し、企業としての信用を完全に失う',
      '規制当局から法令違反を指摘され、業務停止処分を受ける',
      '再委託先でインシデントが発生し、責任を問われる',
    ],
    historicalReferences: [
      '個人情報漏洩で500億円以上の和解金を支払った企業がある',
      'GDPR違反で年間売上高の4%を超える制裁金が課された事例がある',
      '下請業者の不正で元請企業が責任を問われた判例がある',
    ],
    hiddenDangers: [
      '暗号化要件が不十分で、データが容易に復号される可能性がある',
      '監査権がなく、相手方のセキュリティ体制を検証できない',
      '契約終了後のデータ削除が保証されていない',
    ],
  },
  operational_risk: {
    worstCaseScenarios: [
      '達成不可能なSLAにより、毎月ペナルティを支払い続ける',
      '24時間対応要件により、チームが疲弊しバーンアウトが続出する',
      '曖昧な検収条件により、永遠に検収が完了しない',
      '移行義務により、契約終了後も数年間拘束される',
    ],
    historicalReferences: [
      '99.99%のSLAを約束して達成できず、契約解除された事例がある',
      '無制限の変更要求により、プロジェクトが破綻したケースがある',
      '保証期間が10年の契約で、サポートコストが利益を上回った例がある',
    ],
    hiddenDangers: [
      '「合理的な協力」の範囲が曖昧で、際限なく要求される',
      '報告義務が重く、本来業務に支障をきたす',
      '専任者要件を満たせず、契約違反を問われる可能性がある',
    ],
  },
  compliance_risk: {
    worstCaseScenarios: [
      '規制違反により業務停止命令を受け、事業継続が不可能になる',
      '行政処分により企業イメージが失墜し、株価が暴落する',
      '経営者が個人責任を問われ、刑事罰を受ける可能性がある',
    ],
    historicalReferences: [
      '個人情報保護法違反で業務改善命令を受けた企業がある',
      '下請法違反で公正取引委員会から勧告を受けた事例がある',
      '越境データ移転で規制当局から差し止め命令を受けたケースがある',
    ],
    hiddenDangers: [
      '法改正により、現在は適法でも将来違法になる可能性がある',
      '業界ガイドラインへの準拠が不明確で、監査で指摘される',
      '海外規制（GDPR等）の適用を見落としている可能性がある',
    ],
  },
  reputational_risk: {
    worstCaseScenarios: [
      '相手方の不祥事に巻き込まれ、レピュテーションが低下する',
      'SNSで契約内容が暴露され、炎上する',
      '競合他社に不利な条件が漏洩し、交渉力を失う',
    ],
    historicalReferences: [
      '取引先の不正会計に巻き込まれ、株価が下落した事例がある',
      '契約条件がリークされ、業界全体での評判を落とした例がある',
    ],
    hiddenDangers: [
      '相手方の経営状態が悪化しており、倒産リスクがある',
      '相手方のコンプライアンス体制に問題がある兆候がある',
    ],
  },
};

// =============================================================================
// 悪魔の代理人クラス
// =============================================================================

export class DevilsAdvocate extends BaseDebater {
  public readonly config = DEVILS_ADVOCATE_CONFIG;

  /**
   * 議論における主張を生成
   */
  public async argue(context: DebateContext): Promise<Argument> {
    const { finding, opponentArgument, round } = context;

    // 最悪のシナリオを構築
    const worstCase = this.buildWorstCaseScenario(finding);

    // 反論への対応を準備
    const counterpoints = this.prepareCounterpoints(opponentArgument);

    // 主張を構築
    const position = this.buildPosition(finding, worstCase, round);
    const reasoning = this.buildReasoning(finding, worstCase);
    const evidence = this.gatherEvidence(finding, context.contract);

    return {
      position,
      reasoning,
      evidence,
      counterpoints,
    };
  }

  /**
   * 最悪のシナリオを構築
   */
  private buildWorstCaseScenario(finding: Finding): {
    scenarios: string[];
    historical: string[];
    hidden: string[];
  } {
    const pattern = RISK_AMPLIFICATION_PATTERNS[finding.category];

    if (!pattern) {
      return {
        scenarios: ['この問題が引き金となり、予期しない連鎖的な損害が発生する可能性がある'],
        historical: [],
        hidden: ['表面化していない追加のリスクが潜んでいる可能性が高い'],
      };
    }

    return {
      scenarios: pattern.worstCaseScenarios,
      historical: pattern.historicalReferences,
      hidden: pattern.hiddenDangers,
    };
  }

  /**
   * ポジション（主張）を構築
   */
  private buildPosition(
    finding: Finding,
    worstCase: { scenarios: string[]; historical: string[]; hidden: string[] },
    round: number
  ): string {
    const severityEmphasis = {
      critical: 'この契約には致命的な欠陥があり、絶対に締結すべきではありません。',
      high: 'この契約には重大なリスクがあり、このままでは締結を推奨できません。',
      medium: 'この契約にはリスクが存在し、慎重な検討が必要です。',
      low: 'このリスクは軽視されがちですが、問題が拡大する可能性があります。',
    };

    let position = severityEmphasis[finding.severity];

    // ラウンドに応じて主張を強化
    if (round === 1) {
      position += `\n\n【問題点】\n${finding.issue}\n\n【最悪のシナリオ】\n`;
      position += worstCase.scenarios.slice(0, 2).map((s) => `• ${s}`).join('\n');
    } else {
      position += `\n\n前回の議論を踏まえても、このリスクは軽減されていません。`;
      position += `\n\n【見落とされている危険】\n`;
      position += worstCase.hidden.slice(0, 2).map((s) => `• ${s}`).join('\n');
    }

    return position;
  }

  /**
   * 根拠を構築
   */
  private buildReasoning(
    finding: Finding,
    worstCase: { scenarios: string[]; historical: string[]; hidden: string[] }
  ): string {
    let reasoning = `【リスクの根拠】\n`;
    reasoning += `1. ${finding.impact}\n`;
    reasoning += `2. 相手方が契約を自己に有利に解釈する可能性が高い\n`;
    reasoning += `3. 紛争発生時に当方が不利な立場に置かれる\n`;

    if (worstCase.historical.length > 0) {
      reasoning += `\n【過去の事例から】\n`;
      reasoning += worstCase.historical.slice(0, 2).map((h) => `• ${h}`).join('\n');
    }

    reasoning += `\n\n【結論】\n`;
    reasoning += `この条項を修正せずに契約を締結することは、企業として許容できないリスクを受け入れることを意味します。`;

    return reasoning;
  }

  /**
   * 証拠を収集
   */
  private gatherEvidence(finding: Finding, contract: Contract): string[] {
    const evidence = [...finding.evidence];

    // 契約全体から追加の懸念材料を抽出
    const concernPatterns = [
      { pattern: /相手方の判断|相手方が決定/g, concern: '相手方に裁量権が集中している' },
      { pattern: /一方的に|任意に/g, concern: '一方的な権限行使が可能' },
      { pattern: /直ちに|速やかに/g, concern: '曖昧な期限設定' },
    ];

    for (const { pattern, concern } of concernPatterns) {
      if (pattern.test(contract.rawText)) {
        evidence.push(`契約全体の懸念: ${concern}`);
        break; // 1つだけ追加
      }
    }

    return evidence;
  }

  /**
   * 反論への対応を準備
   */
  private prepareCounterpoints(opponentArgument?: Argument): string[] {
    if (!opponentArgument) return [];

    const counterpoints: string[] = [];

    // 楽観的な見方への反論
    if (opponentArgument.position.includes('低い') ||
        opponentArgument.position.includes('可能性は限定的')) {
      counterpoints.push('「可能性が低い」という楽観論は、リスク管理として適切ではありません。発生確率が低くても、発生時の影響が甚大であれば対策が必要です。');
    }

    // 修正交渉への反論
    if (opponentArgument.position.includes('交渉') ||
        opponentArgument.position.includes('修正')) {
      counterpoints.push('相手方が修正に応じる保証はありません。交渉が決裂した場合、このリスクをそのまま受け入れることになります。');
    }

    // ビジネスメリットへの反論
    if (opponentArgument.position.includes('メリット') ||
        opponentArgument.position.includes('利益')) {
      counterpoints.push('短期的なビジネスメリットは、長期的なリスクの前には霞みます。一度トラブルが発生すれば、得られた利益を遥かに超える損失が生じます。');
    }

    // デフォルトの反論
    if (counterpoints.length === 0) {
      counterpoints.push('天使の代理人の主張は楽観的に過ぎます。リスク管理の観点からは、最悪の事態を想定すべきです。');
    }

    return counterpoints;
  }

  /**
   * 重要度スコアを計算（高いほど危険）
   */
  public calculateDangerScore(finding: Finding): number {
    const baseScore = SEVERITY_WEIGHTS[finding.severity];

    // リスクカテゴリによる重み付け
    const categoryWeights: Record<string, number> = {
      legal_risk: 1.3,
      financial_risk: 1.2,
      security_risk: 1.4,
      compliance_risk: 1.3,
      operational_risk: 1.0,
      reputational_risk: 1.1,
    };

    const categoryWeight = categoryWeights[finding.category] || 1.0;

    // 証拠の数による調整
    const evidenceBonus = Math.min(finding.evidence.length * 0.1, 0.3);

    return baseScore * categoryWeight + evidenceBonus;
  }
}

// =============================================================================
// エクスポート
// =============================================================================

export function createDevilsAdvocate(): DevilsAdvocate {
  return new DevilsAdvocate();
}
