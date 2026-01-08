/**
 * Debate Arena - 議論アリーナ
 *
 * 悪魔の代理人と天使の代理人の議論を管理し、
 * 裁判官による最終判定を導く
 */

import { EventEmitter } from 'events';
import {
  Contract,
  Finding,
  DebateRound,
  DebateOutcome,
  Argument,
  PersonaAnalysis,
  SEVERITY_WEIGHTS,
} from '../models/types';
import { DevilsAdvocate, createDevilsAdvocate } from '../personas/devils-advocate';
import { AngelsAdvocate, createAngelsAdvocate } from '../personas/angels-advocate';
import { Judge, createJudge } from '../personas/judge';
import { DebateContext } from '../personas/base-persona';

// =============================================================================
// 型定義
// =============================================================================

export interface DebateArenaConfig {
  maxRounds: number;           // 最大議論ラウンド数
  findingsPerRound: number;    // 1ラウンドで議論する指摘数
  prioritizeBy: 'severity' | 'category' | 'mixed';
  enableProgressiveDebate: boolean;  // 前ラウンドの結果を踏まえた議論
}

export interface DebateArenaInput {
  contract: Contract;
  findings: Finding[];
  personaAnalyses: PersonaAnalysis[];
}

export interface DebateArenaOutput {
  rounds: DebateRound[];
  allOutcomes: DebateOutcome[];
  synthesis: {
    overallRisk: Finding['severity'];
    approvalRecommendation: 'approve' | 'approve_with_conditions' | 'reject' | 'needs_review';
    keyActions: string[];
    summary: string;
  };
  statistics: DebateStatistics;
}

export interface DebateStatistics {
  totalFindings: number;
  debatedFindings: number;
  devilWins: number;
  angelWins: number;
  ties: number;
  averageDevilScore: number;
  averageAngelScore: number;
  severityAdjustments: {
    upgraded: number;
    downgraded: number;
    unchanged: number;
  };
}

// =============================================================================
// イベント定義
// =============================================================================

export type DebateArenaEvent =
  | { type: 'arena:start'; totalFindings: number }
  | { type: 'round:start'; round: number; findings: Finding[] }
  | { type: 'debate:start'; findingId: string; topic: string }
  | { type: 'devil:argue'; findingId: string; argument: Argument }
  | { type: 'angel:argue'; findingId: string; argument: Argument }
  | { type: 'judge:deliberate'; findingId: string; outcome: DebateOutcome }
  | { type: 'round:complete'; round: number; outcomes: DebateOutcome[] }
  | { type: 'arena:complete'; output: DebateArenaOutput };

// =============================================================================
// Debate Arena クラス
// =============================================================================

export class DebateArena extends EventEmitter {
  private config: DebateArenaConfig;
  private devil: DevilsAdvocate;
  private angel: AngelsAdvocate;
  private judge: Judge;

  constructor(config?: Partial<DebateArenaConfig>) {
    super();
    this.config = {
      maxRounds: config?.maxRounds ?? 2,
      findingsPerRound: config?.findingsPerRound ?? 5,
      prioritizeBy: config?.prioritizeBy ?? 'severity',
      enableProgressiveDebate: config?.enableProgressiveDebate ?? true,
    };

    this.devil = createDevilsAdvocate();
    this.angel = createAngelsAdvocate();
    this.judge = createJudge();
  }

  /**
   * 議論を開始
   */
  public async conduct(input: DebateArenaInput): Promise<DebateArenaOutput> {
    const { contract, findings } = input;

    this.emit('arena:start', { totalFindings: findings.length });

    // 指摘を優先度でソート
    const prioritizedFindings = this.prioritizeFindings(findings);

    // 議論対象を選定（上位のみ）
    const findingsToDebate = prioritizedFindings.slice(
      0,
      this.config.maxRounds * this.config.findingsPerRound
    );

    const rounds: DebateRound[] = [];
    const allOutcomes: DebateOutcome[] = [];

    // ラウンドごとに議論を実施
    for (let roundNum = 1; roundNum <= this.config.maxRounds; roundNum++) {
      const startIdx = (roundNum - 1) * this.config.findingsPerRound;
      const endIdx = startIdx + this.config.findingsPerRound;
      const roundFindings = findingsToDebate.slice(startIdx, endIdx);

      if (roundFindings.length === 0) break;

      const round = await this.conductRound(
        roundNum,
        roundFindings,
        contract,
        allOutcomes
      );

      rounds.push(round);
      allOutcomes.push(...round.outcomes);
    }

    // 総合判定を生成
    const synthesis = this.judge.synthesizeVerdicts(allOutcomes);

    // 統計を計算
    const statistics = this.calculateStatistics(findings, allOutcomes);

    const output: DebateArenaOutput = {
      rounds,
      allOutcomes,
      synthesis,
      statistics,
    };

    this.emit('arena:complete', { output });

    return output;
  }

  /**
   * 指摘を優先度でソート
   */
  private prioritizeFindings(findings: Finding[]): Finding[] {
    return [...findings].sort((a, b) => {
      switch (this.config.prioritizeBy) {
        case 'severity':
          return SEVERITY_WEIGHTS[b.severity] - SEVERITY_WEIGHTS[a.severity];

        case 'category':
          // カテゴリ優先度
          const categoryPriority: Record<string, number> = {
            legal_risk: 6,
            compliance_risk: 5,
            security_risk: 4,
            financial_risk: 3,
            operational_risk: 2,
            reputational_risk: 1,
          };
          const catDiff =
            (categoryPriority[b.category] || 0) - (categoryPriority[a.category] || 0);
          if (catDiff !== 0) return catDiff;
          return SEVERITY_WEIGHTS[b.severity] - SEVERITY_WEIGHTS[a.severity];

        case 'mixed':
        default:
          // 重要度とカテゴリを混合
          const scoreA = SEVERITY_WEIGHTS[a.severity] * 10 +
            (categoryPriority[a.category] || 0);
          const scoreB = SEVERITY_WEIGHTS[b.severity] * 10 +
            (categoryPriority[b.category] || 0);
          return scoreB - scoreA;
      }
    });
  }

  /**
   * 1ラウンドの議論を実施
   */
  private async conductRound(
    roundNum: number,
    findings: Finding[],
    contract: Contract,
    previousOutcomes: DebateOutcome[]
  ): Promise<DebateRound> {
    this.emit('round:start', { round: roundNum, findings });

    const outcomes: DebateOutcome[] = [];

    for (const finding of findings) {
      const outcome = await this.debateFinding(
        finding,
        contract,
        roundNum,
        previousOutcomes
      );
      outcomes.push(outcome);
    }

    const round: DebateRound = {
      round: roundNum,
      topic: `ラウンド${roundNum}: ${findings.map((f) => f.title).join(', ')}`,
      findings,
      outcomes,
      completedAt: new Date().toISOString(),
    };

    this.emit('round:complete', { round: roundNum, outcomes });

    return round;
  }

  /**
   * 1つの指摘について議論
   */
  private async debateFinding(
    finding: Finding,
    contract: Contract,
    round: number,
    previousOutcomes: DebateOutcome[]
  ): Promise<DebateOutcome> {
    this.emit('debate:start', {
      findingId: finding.id,
      topic: finding.title,
    });

    // 議論コンテキストを作成
    const baseContext: DebateContext = {
      contract,
      finding,
      round,
    };

    // 悪魔の代理人の主張
    const devilArgument = await this.devil.argue(baseContext);
    this.emit('devil:argue', { findingId: finding.id, argument: devilArgument });

    // 天使の代理人の主張（悪魔の主張を踏まえて）
    const angelContext: DebateContext = {
      ...baseContext,
      opponentArgument: devilArgument,
    };
    const angelArgument = await this.angel.argue(angelContext);
    this.emit('angel:argue', { findingId: finding.id, argument: angelArgument });

    // 前ラウンドの結果を踏まえた追加議論（オプション）
    if (this.config.enableProgressiveDebate && previousOutcomes.length > 0) {
      // 関連する過去の議論を参照
      const relatedOutcome = this.findRelatedOutcome(finding, previousOutcomes);
      if (relatedOutcome) {
        // 過去の議論を踏まえた補足を追加
        devilArgument.evidence.push(
          `関連する過去の議論: ${relatedOutcome.finding.title}`
        );
      }
    }

    // 裁判官による判定
    const outcome = await this.judge.deliberate(finding, devilArgument, angelArgument);
    this.emit('judge:deliberate', { findingId: finding.id, outcome });

    return outcome;
  }

  /**
   * 関連する過去の議論を検索
   */
  private findRelatedOutcome(
    finding: Finding,
    previousOutcomes: DebateOutcome[]
  ): DebateOutcome | undefined {
    // 同じ条項への指摘を検索
    const sameClause = previousOutcomes.find(
      (o) => o.finding.clauseRef === finding.clauseRef
    );
    if (sameClause) return sameClause;

    // 同じカテゴリの指摘を検索
    const sameCategory = previousOutcomes.find(
      (o) => o.finding.category === finding.category
    );
    return sameCategory;
  }

  /**
   * 統計を計算
   */
  private calculateStatistics(
    allFindings: Finding[],
    outcomes: DebateOutcome[]
  ): DebateStatistics {
    let devilWins = 0;
    let angelWins = 0;
    let ties = 0;
    let totalDevilScore = 0;
    let totalAngelScore = 0;
    let upgraded = 0;
    let downgraded = 0;
    let unchanged = 0;

    for (const outcome of outcomes) {
      const original = outcome.finding.severity;
      const adjusted = outcome.verdict.adjustedSeverity;

      // 勝敗判定（簡易的に重要度変化で判断）
      if (SEVERITY_WEIGHTS[adjusted] > SEVERITY_WEIGHTS[original]) {
        devilWins++;
        upgraded++;
      } else if (SEVERITY_WEIGHTS[adjusted] < SEVERITY_WEIGHTS[original]) {
        angelWins++;
        downgraded++;
      } else {
        ties++;
        unchanged++;
      }

      // スコア集計（概算）
      totalDevilScore += SEVERITY_WEIGHTS[adjusted] / 4;
      totalAngelScore += (4 - SEVERITY_WEIGHTS[adjusted]) / 4;
    }

    return {
      totalFindings: allFindings.length,
      debatedFindings: outcomes.length,
      devilWins,
      angelWins,
      ties,
      averageDevilScore: outcomes.length > 0 ? totalDevilScore / outcomes.length : 0,
      averageAngelScore: outcomes.length > 0 ? totalAngelScore / outcomes.length : 0,
      severityAdjustments: {
        upgraded,
        downgraded,
        unchanged,
      },
    };
  }

  /**
   * 議論なしでクイック判定（軽微な指摘用）
   */
  public async quickJudge(finding: Finding): Promise<DebateOutcome> {
    // 簡易的な判定（悪魔・天使の議論なし）
    const defaultDevil: Argument = {
      position: '軽微なリスクですが、無視すべきではありません。',
      reasoning: finding.issue,
      evidence: finding.evidence,
    };

    const defaultAngel: Argument = {
      position: 'このリスクは管理可能な範囲内です。',
      reasoning: finding.recommendation,
      evidence: [],
    };

    return this.judge.deliberate(finding, defaultDevil, defaultAngel);
  }

  /**
   * イベントを登録
   */
  public onEvent(callback: (event: DebateArenaEvent) => void): void {
    this.on('arena:start', (data) => callback({ type: 'arena:start', ...data }));
    this.on('round:start', (data) => callback({ type: 'round:start', ...data }));
    this.on('debate:start', (data) => callback({ type: 'debate:start', ...data }));
    this.on('devil:argue', (data) => callback({ type: 'devil:argue', ...data }));
    this.on('angel:argue', (data) => callback({ type: 'angel:argue', ...data }));
    this.on('judge:deliberate', (data) => callback({ type: 'judge:deliberate', ...data }));
    this.on('round:complete', (data) => callback({ type: 'round:complete', ...data }));
    this.on('arena:complete', (data) => callback({ type: 'arena:complete', ...data }));
  }
}

// =============================================================================
// ファクトリ関数
// =============================================================================

export function createDebateArena(config?: Partial<DebateArenaConfig>): DebateArena {
  return new DebateArena(config);
}
