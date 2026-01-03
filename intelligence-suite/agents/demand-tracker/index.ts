/**
 * Demand Tracker Agent
 *
 * ペインパターンのトレンドを追跡し、「今熱い」ニーズを検知するエージェント
 * ヒアリングメモから抽出されたペインの発生頻度・変化率を分析
 */

import { EventEmitter } from 'events';
import {
  PainTrend,
  DemandTrackerOutput,
  IntelligenceAgentConfig
} from '../../types';
import { PainPattern, IndustryCategory } from '../../../shared/types';
import { UnifiedDataStore } from '../../store/unified-data-store';

/**
 * Demand Tracker 入力
 */
export interface DemandTrackerInput {
  painPatterns: PainPattern[];
  lookbackDays?: number;
  industryFilter?: string[];
}

/**
 * Demand Tracker Agent クラス
 */
export class DemandTrackerAgent extends EventEmitter {
  private config: IntelligenceAgentConfig['demandTracker'];
  private dataStore: UnifiedDataStore;

  constructor(config?: IntelligenceAgentConfig['demandTracker'], dataStore?: UnifiedDataStore) {
    super();
    this.config = {
      lookbackDays: config?.lookbackDays ?? 30,
      minTrendThreshold: config?.minTrendThreshold ?? 10
    };
    this.dataStore = dataStore || new UnifiedDataStore();
  }

  /**
   * トレンド分析を実行
   */
  async execute(input: DemandTrackerInput): Promise<DemandTrackerOutput> {
    this.emit('analysis:start', { painCount: input.painPatterns.length });

    // 既存のトレンドデータを取得
    const existingTrends = this.dataStore.getTrends();

    // 新しいペインパターンを集計
    const painCounts = this.aggregatePainPatterns(input.painPatterns);

    // トレンドを計算
    const trends = this.calculateTrends(painCounts, existingTrends);

    // トレンドを分類
    const topTrends = trends
      .filter(t => t.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 10);

    const emergingPains = trends
      .filter(t => t.trend === 'rising' && t.changePercent > 100)
      .sort((a, b) => b.changePercent - a.changePercent);

    const decliningPains = trends
      .filter(t => t.trend === 'declining')
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);

    // 業界別ブレイクダウン
    const industryBreakdown = this.groupByIndustry(trends);

    // トレンドをデータストアに保存
    for (const trend of trends) {
      await this.dataStore.upsertTrend(trend);
    }

    const output: DemandTrackerOutput = {
      topTrends,
      emergingPains,
      decliningPains,
      industryBreakdown,
      timestamp: new Date()
    };

    this.emit('analysis:complete', output);
    return output;
  }

  /**
   * ペインパターンを集計
   */
  private aggregatePainPatterns(patterns: PainPattern[]): Map<string, {
    count: number;
    pattern: PainPattern;
    industries: Set<string>;
  }> {
    const counts = new Map<string, {
      count: number;
      pattern: PainPattern;
      industries: Set<string>;
    }>();

    for (const pattern of patterns) {
      const key = this.generatePainKey(pattern);
      const existing = counts.get(key);

      if (existing) {
        existing.count++;
        if (pattern.applicableIndustries) {
          pattern.applicableIndustries.forEach(i => existing.industries.add(i));
        }
      } else {
        counts.set(key, {
          count: 1,
          pattern,
          industries: new Set(pattern.applicableIndustries || [])
        });
      }
    }

    return counts;
  }

  /**
   * トレンドを計算
   */
  private calculateTrends(
    currentCounts: Map<string, { count: number; pattern: PainPattern; industries: Set<string> }>,
    existingTrends: PainTrend[]
  ): PainTrend[] {
    const trends: PainTrend[] = [];
    const now = new Date();

    // 既存トレンドをマップ化
    const existingMap = new Map(existingTrends.map(t => [t.painId, t]));

    for (const [key, data] of currentCounts) {
      const existing = existingMap.get(key);
      const previousCount = existing?.currentCount || 0;
      const changePercent = previousCount > 0
        ? ((data.count - previousCount) / previousCount) * 100
        : data.count > 0 ? 100 : 0;

      const trend: PainTrend = {
        painId: key,
        painName: data.pattern.name,
        category: data.pattern.category,
        currentCount: data.count,
        previousCount,
        changePercent: Math.round(changePercent * 10) / 10,
        trend: this.determineTrend(changePercent),
        industries: Array.from(data.industries),
        firstSeen: existing?.firstSeen || now,
        lastSeen: now
      };

      trends.push(trend);
    }

    return trends;
  }

  /**
   * トレンド方向を判定
   */
  private determineTrend(changePercent: number): 'rising' | 'stable' | 'declining' {
    if (changePercent > this.config!.minTrendThreshold!) {
      return 'rising';
    } else if (changePercent < -this.config!.minTrendThreshold!) {
      return 'declining';
    }
    return 'stable';
  }

  /**
   * 業界別にグループ化
   */
  private groupByIndustry(trends: PainTrend[]): Record<string, PainTrend[]> {
    const groups: Record<string, PainTrend[]> = {};

    for (const trend of trends) {
      for (const industry of trend.industries) {
        if (!groups[industry]) {
          groups[industry] = [];
        }
        groups[industry].push(trend);
      }
    }

    // 各業界内でソート
    for (const industry of Object.keys(groups)) {
      groups[industry].sort((a, b) => b.changePercent - a.changePercent);
    }

    return groups;
  }

  /**
   * ペインパターンの一意キーを生成
   */
  private generatePainKey(pattern: PainPattern): string {
    return pattern.id || `${pattern.category}_${pattern.name.toLowerCase().replace(/\s+/g, '_')}`;
  }

  /**
   * 急上昇ペインを検知
   */
  async detectSurge(threshold: number = 200): Promise<PainTrend[]> {
    const trends = this.dataStore.getTrends();
    return trends.filter(t => t.changePercent >= threshold);
  }

  /**
   * アラートを生成
   */
  generateAlerts(trends: PainTrend[]): Array<{
    type: 'surge' | 'emerging' | 'declining';
    message: string;
    trend: PainTrend;
  }> {
    const alerts: Array<{
      type: 'surge' | 'emerging' | 'declining';
      message: string;
      trend: PainTrend;
    }> = [];

    for (const trend of trends) {
      if (trend.changePercent >= 300) {
        alerts.push({
          type: 'surge',
          message: `🔥 急上昇: "${trend.painName}" が +${trend.changePercent}% 増加`,
          trend
        });
      } else if (trend.changePercent >= 100 && trend.trend === 'rising') {
        alerts.push({
          type: 'emerging',
          message: `📈 新興ペイン: "${trend.painName}" が注目を集めています`,
          trend
        });
      } else if (trend.changePercent <= -50) {
        alerts.push({
          type: 'declining',
          message: `📉 減少傾向: "${trend.painName}" の発生が減少中`,
          trend
        });
      }
    }

    return alerts;
  }
}

export default DemandTrackerAgent;
