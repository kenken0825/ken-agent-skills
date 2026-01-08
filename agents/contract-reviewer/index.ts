/**
 * Contract Review Agent - 契約書レビューエージェント
 *
 * Multi-Persona Adversarial Review System
 *
 * 複数の専門家ペルソナが契約書を分析し、
 * 悪魔と天使の議論を経て、バランスの取れた評価を提供
 */

import { EventEmitter } from 'events';

// 型定義
import {
  Contract,
  ContractType,
  ContractReviewerInput,
  ContractReviewerOutput,
  ContractReviewReport,
  ContractReviewEvent,
  ContractReviewError,
  PersonaAnalysis,
  Finding,
} from './models/types';

// パーサー
import { ContractParser, parseContract } from './parsers/contract-parser';

// ペルソナ
import { LegalExpert, createLegalExpert } from './personas/legal-expert';
import { CFOExpert, createCFOExpert } from './personas/cfo-expert';
import { CISOExpert, createCISOExpert } from './personas/ciso-expert';
import { OperationsExpert, createOperationsExpert } from './personas/operations-expert';
import { AnalysisContext } from './personas/base-persona';

// アリーナ
import { DebateArena, createDebateArena, DebateArenaConfig } from './arena/debate-arena';

// シンセサイザー
import { FindingSynthesizer, createFindingSynthesizer } from './synthesizers/finding-synthesizer';

// ジェネレーター
import { ReportGenerator, createReportGenerator, ReportGeneratorConfig } from './generators/report-generator';

// =============================================================================
// 設定
// =============================================================================

export interface ContractReviewerConfig {
  enableDebate: boolean;
  debateRounds: number;
  findingsPerDebateRound: number;
  parallelAnalysis: boolean;
  reportFormat: 'full' | 'summary' | 'json';
  language: 'ja' | 'en';
}

const DEFAULT_CONFIG: ContractReviewerConfig = {
  enableDebate: true,
  debateRounds: 2,
  findingsPerDebateRound: 5,
  parallelAnalysis: true,
  reportFormat: 'full',
  language: 'ja',
};

// =============================================================================
// Contract Reviewer クラス
// =============================================================================

export class ContractReviewer extends EventEmitter {
  private config: ContractReviewerConfig;

  // コンポーネント
  private parser: ContractParser;
  private legalExpert: LegalExpert;
  private cfoExpert: CFOExpert;
  private cisoExpert: CISOExpert;
  private operationsExpert: OperationsExpert;
  private debateArena: DebateArena;
  private synthesizer: FindingSynthesizer;
  private reportGenerator: ReportGenerator;

  constructor(config?: Partial<ContractReviewerConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    // コンポーネントを初期化
    this.parser = new ContractParser();
    this.legalExpert = createLegalExpert();
    this.cfoExpert = createCFOExpert();
    this.cisoExpert = createCISOExpert();
    this.operationsExpert = createOperationsExpert();

    this.debateArena = createDebateArena({
      maxRounds: this.config.debateRounds,
      findingsPerRound: this.config.findingsPerDebateRound,
    });

    this.synthesizer = createFindingSynthesizer();
    this.reportGenerator = createReportGenerator({
      format: this.config.reportFormat,
      language: this.config.language,
    });
  }

  /**
   * 契約書をレビュー
   */
  public async review(input: ContractReviewerInput): Promise<ContractReviewerOutput> {
    const startTime = Date.now();

    try {
      // Stage 1: 契約書をパース
      this.emitEvent({ type: 'parsing:start' });
      const parseResult = this.parser.parse(
        input.contractText,
        input.contractType
      );

      if (!parseResult.success || !parseResult.contract) {
        throw new Error(`契約書のパースに失敗: ${parseResult.errors.join(', ')}`);
      }

      const contract = parseResult.contract;
      this.emitEvent({ type: 'parsing:complete', contract });

      // Stage 2: 専門家ペルソナによる分析
      const analysisContext: AnalysisContext = {
        contract,
        ourPartyName: input.ourPartyName,
        industry: input.context?.industry,
        notes: input.context?.notes,
      };

      const personaAnalyses = await this.analyzeWithPersonas(analysisContext);

      // 全指摘を収集
      const allFindings = personaAnalyses.flatMap((a) => a.findings);

      // Stage 3: 議論フェーズ（オプション）
      let debateOutcomes: import('./models/types').DebateOutcome[] = [];

      if (this.config.enableDebate && allFindings.length > 0) {
        this.emitEvent({ type: 'debate:start', round: 1 });

        const debateResult = await this.debateArena.conduct({
          contract,
          findings: allFindings,
          personaAnalyses,
        });

        debateOutcomes = debateResult.allOutcomes;

        this.emitEvent({
          type: 'debate:complete',
          round: debateResult.rounds.length,
          outcomes: debateOutcomes,
        });
      }

      // Stage 4: 指摘を統合
      this.emitEvent({ type: 'synthesis:start' });

      const synthesisResult = this.synthesizer.synthesize({
        contract,
        personaAnalyses,
        debateOutcomes,
      });

      this.emitEvent({ type: 'synthesis:complete' });

      // Stage 5: レポート生成
      this.emitEvent({ type: 'report:start' });

      const processingTime = Date.now() - startTime;
      const report = this.reportGenerator.generate({
        contract,
        personaAnalyses,
        debateOutcomes,
        synthesis: synthesisResult,
        processingTime,
      });

      this.emitEvent({ type: 'report:complete', report });

      return {
        success: true,
        report,
      };
    } catch (error) {
      const reviewError: ContractReviewError = {
        code: 'REVIEW_FAILED',
        message: error instanceof Error ? error.message : String(error),
        details: error,
      };

      this.emitEvent({ type: 'error', error: reviewError });

      return {
        success: false,
        error: reviewError,
      };
    }
  }

  /**
   * 専門家ペルソナによる分析を実行
   */
  private async analyzeWithPersonas(
    context: AnalysisContext
  ): Promise<PersonaAnalysis[]> {
    const personas = [
      { expert: this.legalExpert, type: 'legal_expert' as const },
      { expert: this.cfoExpert, type: 'cfo_expert' as const },
      { expert: this.cisoExpert, type: 'ciso_expert' as const },
      { expert: this.operationsExpert, type: 'operations_expert' as const },
    ];

    const analyses: PersonaAnalysis[] = [];

    if (this.config.parallelAnalysis) {
      // 並列実行
      const promises = personas.map(async ({ expert, type }) => {
        this.emitEvent({ type: 'analysis:start', persona: type });
        const analysis = await expert.analyze(context);
        this.emitEvent({
          type: 'analysis:complete',
          persona: type,
          findings: analysis.findings,
        });
        return analysis;
      });

      const results = await Promise.all(promises);
      analyses.push(...results);
    } else {
      // 順次実行
      for (const { expert, type } of personas) {
        this.emitEvent({ type: 'analysis:start', persona: type });
        const analysis = await expert.analyze(context);
        this.emitEvent({
          type: 'analysis:complete',
          persona: type,
          findings: analysis.findings,
        });
        analyses.push(analysis);
      }
    }

    return analyses;
  }

  /**
   * イベントを発行
   */
  private emitEvent(event: ContractReviewEvent): void {
    this.emit(event.type, event);
    this.emit('event', event);
  }

  /**
   * イベントリスナーを登録
   */
  public onEvent(callback: (event: ContractReviewEvent) => void): void {
    this.on('event', callback);
  }

  /**
   * レポートをテキスト形式で取得
   */
  public formatReport(report: ContractReviewReport): string {
    return this.reportGenerator.formatAsText(report);
  }

  /**
   * 設定を更新
   */
  public updateConfig(config: Partial<ContractReviewerConfig>): void {
    this.config = { ...this.config, ...config };

    // 必要に応じてコンポーネントを再初期化
    if (config.debateRounds || config.findingsPerDebateRound) {
      this.debateArena = createDebateArena({
        maxRounds: this.config.debateRounds,
        findingsPerRound: this.config.findingsPerDebateRound,
      });
    }

    if (config.reportFormat || config.language) {
      this.reportGenerator = createReportGenerator({
        format: this.config.reportFormat,
        language: this.config.language,
      });
    }
  }
}

// =============================================================================
// ファクトリ関数
// =============================================================================

/**
 * ContractReviewerのインスタンスを作成
 */
export function createContractReviewer(
  config?: Partial<ContractReviewerConfig>
): ContractReviewer {
  return new ContractReviewer(config);
}

/**
 * シンプルなレビュー関数
 */
export async function reviewContract(
  contractText: string,
  options?: {
    contractType?: ContractType;
    ourPartyName?: string;
    enableDebate?: boolean;
  }
): Promise<ContractReviewerOutput> {
  const reviewer = createContractReviewer({
    enableDebate: options?.enableDebate ?? true,
  });

  return reviewer.review({
    contractText,
    contractType: options?.contractType,
    ourPartyName: options?.ourPartyName,
  });
}

// =============================================================================
// Re-exports
// =============================================================================

export * from './models/types';
export { parseContract } from './parsers/contract-parser';
export { createLegalExpert } from './personas/legal-expert';
export { createCFOExpert } from './personas/cfo-expert';
export { createCISOExpert } from './personas/ciso-expert';
export { createOperationsExpert } from './personas/operations-expert';
export { createDevilsAdvocate } from './personas/devils-advocate';
export { createAngelsAdvocate } from './personas/angels-advocate';
export { createJudge } from './personas/judge';
export { createDebateArena } from './arena/debate-arena';
export { createFindingSynthesizer } from './synthesizers/finding-synthesizer';
export { createReportGenerator } from './generators/report-generator';
