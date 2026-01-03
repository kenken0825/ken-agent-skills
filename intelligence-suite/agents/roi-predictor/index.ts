/**
 * ROI Predictor Agent
 *
 * スキル導入のROI（投資対効果）を予測するエージェント
 * 企業規模・業種・ペイン深刻度からビジネスインパクトを算出
 */

import { EventEmitter } from 'events';
import {
  ROIPrediction,
  ROIPredictorOutput,
  ROIPredictorInput,
  IntelligenceAgentConfig
} from '../../types';
import { Skill } from '../../../shared/types';
import { UnifiedDataStore } from '../../store/unified-data-store';

/**
 * ROI Predictor Agent クラス
 */
export class ROIPredictorAgent extends EventEmitter {
  private config: IntelligenceAgentConfig['roiPredictor'];
  private dataStore: UnifiedDataStore;

  // 業界別ベンチマーク（年間削減率の平均）
  private industryBenchmarks: Record<string, number> = {
    manufacturing: 25,
    retail: 20,
    finance: 30,
    healthcare: 22,
    technology: 35,
    construction: 18,
    education: 15,
    hospitality: 20,
    logistics: 28,
    consulting: 25,
    government: 12,
    nonprofit: 10
  };

  // 企業規模別の基準コスト（万円）
  private sizeBaseCosts: Record<string, { implementation: number; training: number; infrastructure: number }> = {
    small: { implementation: 50, training: 20, infrastructure: 10 },
    medium: { implementation: 150, training: 50, infrastructure: 30 },
    large: { implementation: 400, training: 120, infrastructure: 80 },
    enterprise: { implementation: 1000, training: 300, infrastructure: 200 }
  };

  constructor(config?: IntelligenceAgentConfig['roiPredictor'], dataStore?: UnifiedDataStore) {
    super();
    this.config = {
      confidenceThreshold: config?.confidenceThreshold ?? 0.7,
      industryBenchmarks: config?.industryBenchmarks ?? this.industryBenchmarks
    };
    this.dataStore = dataStore || new UnifiedDataStore();
  }

  /**
   * ROI予測を実行
   */
  async execute(input: ROIPredictorInput): Promise<ROIPredictorOutput> {
    this.emit('prediction:start', { skillName: input.skill.name });

    // メイン予測を計算
    const prediction = this.calculateROIPrediction(input);

    // ベンチマーク取得
    const benchmarks = this.getBenchmarks(input.companyInfo.industry);

    // 推奨事項を生成
    const recommendations = this.generateRecommendations(prediction, input);

    // データストアに保存
    await this.dataStore.addROIPrediction(prediction);

    const output: ROIPredictorOutput = {
      prediction,
      benchmarks,
      recommendations,
      timestamp: new Date()
    };

    this.emit('prediction:complete', output);
    return output;
  }

  /**
   * ROI予測を計算
   */
  private calculateROIPrediction(input: ROIPredictorInput): ROIPrediction {
    const { skill, companyInfo, implementationContext } = input;

    // 初期投資を計算
    const initialInvestment = this.calculateInitialInvestment(companyInfo, implementationContext);

    // 年間削減額を計算
    const annualSavings = this.calculateAnnualSavings(skill, companyInfo);

    // ROIメトリクスを計算
    const roi = this.calculateROIMetrics(initialInvestment, annualSavings);

    // 信頼度レベルを判定
    const confidenceLevel = this.determineConfidenceLevel(skill, companyInfo);

    // 前提条件を生成
    const assumptions = this.generateAssumptions(companyInfo, implementationContext);

    // リスク要因を特定
    const riskFactors = this.identifyRiskFactors(skill, companyInfo);

    // 感度分析
    const sensitivityAnalysis = this.performSensitivityAnalysis(initialInvestment, annualSavings);

    return {
      skillId: skill.id || skill.name,
      skillName: skill.name,
      initialInvestment,
      annualSavings,
      roi,
      confidenceLevel,
      assumptions,
      riskFactors,
      sensitivityAnalysis
    };
  }

  /**
   * 初期投資を計算
   */
  private calculateInitialInvestment(
    companyInfo: ROIPredictorInput['companyInfo'],
    context?: ROIPredictorInput['implementationContext']
  ): ROIPrediction['initialInvestment'] {
    const baseCosts = this.sizeBaseCosts[companyInfo.size] || this.sizeBaseCosts.medium;

    // 複雑さによる調整
    const complexityMultiplier: Record<string, number> = {
      low: 0.7,
      medium: 1.0,
      high: 1.5
    };
    const complexity = context?.complexity || 'medium';
    const multiplier = complexityMultiplier[complexity];

    const implementation = Math.round(baseCosts.implementation * multiplier);
    const training = Math.round(baseCosts.training * multiplier);
    const infrastructure = Math.round(baseCosts.infrastructure * multiplier);

    return {
      implementation,
      training,
      infrastructure,
      total: implementation + training + infrastructure
    };
  }

  /**
   * 年間削減額を計算
   */
  private calculateAnnualSavings(
    skill: Skill,
    companyInfo: ROIPredictorInput['companyInfo']
  ): ROIPrediction['annualSavings'] {
    // 基準年間プロセスコスト（万円）
    const baseProcessCost = companyInfo.currentProcessCost || this.estimateProcessCost(companyInfo);

    // 業界別削減率
    const industryBenchmark = this.industryBenchmarks[companyInfo.industry.toLowerCase()] || 20;

    // スキル進化レベルによる調整
    const levelMultiplier = 1 + ((skill.evolutionLevel || 1) - 1) * 0.15;

    // ペイン深刻度による調整
    const painMultiplier = 1 + ((companyInfo.painSeverity || 5) - 5) * 0.1;

    // 削減率を計算
    const effectiveRate = (industryBenchmark / 100) * levelMultiplier * painMultiplier;

    // 各カテゴリの削減額
    const laborCost = Math.round(baseProcessCost * effectiveRate * 0.5);
    const errorReduction = Math.round(baseProcessCost * effectiveRate * 0.25);
    const efficiencyGain = Math.round(baseProcessCost * effectiveRate * 0.25);

    return {
      laborCost,
      errorReduction,
      efficiencyGain,
      total: laborCost + errorReduction + efficiencyGain
    };
  }

  /**
   * プロセスコストを推定
   */
  private estimateProcessCost(companyInfo: ROIPredictorInput['companyInfo']): number {
    const sizeCosts: Record<string, number> = {
      small: 500,
      medium: 2000,
      large: 8000,
      enterprise: 20000
    };

    const baseCost = sizeCosts[companyInfo.size] || 2000;

    // 従業員数による調整
    if (companyInfo.employeeCount) {
      return Math.round(companyInfo.employeeCount * 10);
    }

    return baseCost;
  }

  /**
   * ROIメトリクスを計算
   */
  private calculateROIMetrics(
    investment: ROIPrediction['initialInvestment'],
    savings: ROIPrediction['annualSavings']
  ): ROIPrediction['roi'] {
    const totalInvestment = investment.total;
    const annualSavings = savings.total;

    // ROIパーセンテージ
    const percentage = Math.round((annualSavings / totalInvestment) * 100);

    // 回収期間（月）
    const paybackMonths = annualSavings > 0
      ? Math.round((totalInvestment / annualSavings) * 12)
      : 999;

    // 3年価値
    const threeYearValue = (annualSavings * 3) - totalInvestment;

    // 5年価値
    const fiveYearValue = (annualSavings * 5) - totalInvestment;

    return {
      percentage,
      paybackMonths,
      threeYearValue,
      fiveYearValue
    };
  }

  /**
   * 信頼度レベルを判定
   */
  private determineConfidenceLevel(
    skill: Skill,
    companyInfo: ROIPredictorInput['companyInfo']
  ): 'low' | 'medium' | 'high' {
    let confidenceScore = 0;

    // スキルの実装実績
    if (skill.implementations && skill.implementations >= 10) {
      confidenceScore += 30;
    } else if (skill.implementations && skill.implementations >= 5) {
      confidenceScore += 20;
    } else {
      confidenceScore += 10;
    }

    // 成功率
    if (skill.successRate && skill.successRate >= 0.8) {
      confidenceScore += 30;
    } else if (skill.successRate && skill.successRate >= 0.6) {
      confidenceScore += 20;
    } else {
      confidenceScore += 10;
    }

    // 進化レベル
    if (skill.evolutionLevel && skill.evolutionLevel >= 3) {
      confidenceScore += 25;
    } else if (skill.evolutionLevel && skill.evolutionLevel >= 2) {
      confidenceScore += 15;
    } else {
      confidenceScore += 5;
    }

    // 業界ベンチマークの有無
    if (this.industryBenchmarks[companyInfo.industry.toLowerCase()]) {
      confidenceScore += 15;
    }

    if (confidenceScore >= 80) return 'high';
    if (confidenceScore >= 50) return 'medium';
    return 'low';
  }

  /**
   * 前提条件を生成
   */
  private generateAssumptions(
    companyInfo: ROIPredictorInput['companyInfo'],
    context?: ROIPredictorInput['implementationContext']
  ): string[] {
    const assumptions: string[] = [];

    assumptions.push(`企業規模: ${companyInfo.size}`);
    assumptions.push(`業界: ${companyInfo.industry}`);

    if (context?.timeframe) {
      assumptions.push(`実装期間: ${context.timeframe}ヶ月`);
    }

    assumptions.push('既存プロセスからの移行がスムーズに行われる');
    assumptions.push('ユーザーのトレーニングが計画通り完了する');
    assumptions.push('技術的な障害が発生しない');

    return assumptions;
  }

  /**
   * リスク要因を特定
   */
  private identifyRiskFactors(
    skill: Skill,
    companyInfo: ROIPredictorInput['companyInfo']
  ): string[] {
    const risks: string[] = [];

    // 実装実績が少ない
    if (!skill.implementations || skill.implementations < 5) {
      risks.push('導入実績が限られているため、予測の不確実性が高い');
    }

    // 成功率が低い
    if (skill.successRate && skill.successRate < 0.7) {
      risks.push('成功率が70%未満のため、追加サポートが必要な可能性');
    }

    // 複雑なスキル
    if ((skill.metadata as any)?.complexity === 'high') {
      risks.push('高度なスキルのため、導入期間が延びる可能性');
    }

    // 汎用的なリスク
    risks.push('組織の変更管理への抵抗');
    risks.push('既存システムとの統合課題');

    return risks;
  }

  /**
   * 感度分析を実行
   */
  private performSensitivityAnalysis(
    investment: ROIPrediction['initialInvestment'],
    savings: ROIPrediction['annualSavings']
  ): ROIPrediction['sensitivityAnalysis'] {
    // ベストケース: 投資20%減、削減30%増
    const bestCaseInvestment = investment.total * 0.8;
    const bestCaseSavings = savings.total * 1.3;
    const bestCaseROI = Math.round((bestCaseSavings / bestCaseInvestment) * 100);
    const bestCasePayback = Math.round((bestCaseInvestment / bestCaseSavings) * 12);

    // ワーストケース: 投資30%増、削減30%減
    const worstCaseInvestment = investment.total * 1.3;
    const worstCaseSavings = savings.total * 0.7;
    const worstCaseROI = Math.round((worstCaseSavings / worstCaseInvestment) * 100);
    const worstCasePayback = Math.round((worstCaseInvestment / worstCaseSavings) * 12);

    return {
      bestCase: { roi: bestCaseROI, paybackMonths: bestCasePayback },
      worstCase: { roi: worstCaseROI, paybackMonths: worstCasePayback }
    };
  }

  /**
   * ベンチマークを取得
   */
  private getBenchmarks(industry: string): ROIPredictorOutput['benchmarks'] {
    const industryAverage = this.industryBenchmarks[industry.toLowerCase()] || 20;

    // トップパフォーマー（平均の1.5倍）
    const topPerformers = Math.round(industryAverage * 1.5);

    // 類似実装（平均の1.1倍）
    const similarImplementations = Math.round(industryAverage * 1.1);

    return {
      industryAverage,
      topPerformers,
      similarImplementations
    };
  }

  /**
   * 推奨事項を生成
   */
  private generateRecommendations(
    prediction: ROIPrediction,
    input: ROIPredictorInput
  ): string[] {
    const recommendations: string[] = [];

    // 回収期間に基づく推奨
    if (prediction.roi.paybackMonths <= 6) {
      recommendations.push('🟢 短期間で投資回収が見込めるため、早期導入を推奨');
    } else if (prediction.roi.paybackMonths <= 12) {
      recommendations.push('🟡 1年以内の投資回収が見込めるため、導入を検討');
    } else {
      recommendations.push('🟠 投資回収に時間がかかるため、段階的導入を検討');
    }

    // 信頼度に基づく推奨
    if (prediction.confidenceLevel === 'low') {
      recommendations.push('パイロットプロジェクトでの検証を推奨');
    }

    // ROIに基づく推奨
    if (prediction.roi.percentage >= 200) {
      recommendations.push('高ROIが期待できるため、予算拡大も検討価値あり');
    }

    // リスク軽減策
    if (prediction.riskFactors.length > 2) {
      recommendations.push('リスク軽減のため、専門家サポートの活用を推奨');
    }

    return recommendations;
  }

  /**
   * ROIレポートを生成
   */
  generateReport(prediction: ROIPrediction): string {
    let report = '📊 ROI予測レポート\n';
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    report += `📌 スキル: ${prediction.skillName}\n\n`;

    report += '【初期投資】\n';
    report += `  導入費用: ${prediction.initialInvestment.implementation}万円\n`;
    report += `  トレーニング: ${prediction.initialInvestment.training}万円\n`;
    report += `  インフラ: ${prediction.initialInvestment.infrastructure}万円\n`;
    report += `  合計: ${prediction.initialInvestment.total}万円\n\n`;

    report += '【年間削減効果】\n';
    report += `  人件費削減: ${prediction.annualSavings.laborCost}万円\n`;
    report += `  エラー削減: ${prediction.annualSavings.errorReduction}万円\n`;
    report += `  効率化効果: ${prediction.annualSavings.efficiencyGain}万円\n`;
    report += `  合計: ${prediction.annualSavings.total}万円/年\n\n`;

    report += '【ROI指標】\n';
    report += `  ROI: ${prediction.roi.percentage}%\n`;
    report += `  回収期間: ${prediction.roi.paybackMonths}ヶ月\n`;
    report += `  3年価値: ${prediction.roi.threeYearValue}万円\n`;
    report += `  5年価値: ${prediction.roi.fiveYearValue}万円\n\n`;

    report += `【信頼度】 ${prediction.confidenceLevel.toUpperCase()}\n\n`;

    report += '【感度分析】\n';
    report += `  ベストケース: ROI ${prediction.sensitivityAnalysis.bestCase.roi}%, 回収${prediction.sensitivityAnalysis.bestCase.paybackMonths}ヶ月\n`;
    report += `  ワーストケース: ROI ${prediction.sensitivityAnalysis.worstCase.roi}%, 回収${prediction.sensitivityAnalysis.worstCase.paybackMonths}ヶ月\n`;

    return report;
  }
}

export default ROIPredictorAgent;
