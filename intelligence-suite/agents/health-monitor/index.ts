/**
 * Health Monitor Agent
 *
 * スキルの「健康度」を監視し、劣化・陳腐化を検知するエージェント
 * 使用頻度、成功率、フィードバックから総合的な健康スコアを算出
 */

import { EventEmitter } from 'events';
import {
  SkillHealthScore,
  HealthAlert,
  HealthMonitorOutput,
  IntelligenceAgentConfig
} from '../../types';
import { Skill } from '../../../shared/types';
import { UnifiedDataStore } from '../../store/unified-data-store';

/**
 * Health Monitor 入力
 */
export interface HealthMonitorInput {
  skills: Skill[];
  usageData?: SkillUsageData[];
  feedbackData?: SkillFeedback[];
}

/**
 * スキル使用データ
 */
export interface SkillUsageData {
  skillId: string;
  usageCount: number;
  lastUsed: Date;
  successCount: number;
  failureCount: number;
}

/**
 * スキルフィードバック
 */
export interface SkillFeedback {
  skillId: string;
  rating: number; // 1-5
  comment?: string;
  date: Date;
}

/**
 * Health Monitor Agent クラス
 */
export class HealthMonitorAgent extends EventEmitter {
  private config: IntelligenceAgentConfig['healthMonitor'];
  private dataStore: UnifiedDataStore;

  constructor(config?: IntelligenceAgentConfig['healthMonitor'], dataStore?: UnifiedDataStore) {
    super();
    this.config = {
      checkInterval: config?.checkInterval ?? 86400000, // 24 hours
      alertThresholds: config?.alertThresholds ?? {
        usageDropPercent: 50,
        minSuccessRate: 70,
        minFeedbackScore: 3.0,
        stalenessDays: 90
      }
    };
    this.dataStore = dataStore || new UnifiedDataStore();
  }

  /**
   * 健康度チェックを実行
   */
  async execute(input: HealthMonitorInput): Promise<HealthMonitorOutput> {
    this.emit('check:start', { skillCount: input.skills.length });

    const healthScores: SkillHealthScore[] = [];

    for (const skill of input.skills) {
      const usageData = input.usageData?.find(u => u.skillId === skill.id);
      const feedbacks = input.feedbackData?.filter(f => f.skillId === skill.id) || [];

      const healthScore = this.calculateHealthScore(skill, usageData, feedbacks);
      healthScores.push(healthScore);

      // データストアに保存
      await this.dataStore.upsertHealthScore(healthScore);
    }

    // 分類
    const healthySkills = healthScores.filter(h => h.status === 'healthy');
    const warningSkills = healthScores.filter(h => h.status === 'warning');
    const criticalSkills = healthScores.filter(h => h.status === 'critical');
    const retireCandidate = healthScores.filter(h => h.status === 'retired');

    // 全体スコア計算
    const overallHealthScore = healthScores.length > 0
      ? Math.round(healthScores.reduce((sum, h) => sum + h.overallScore, 0) / healthScores.length)
      : 100;

    const output: HealthMonitorOutput = {
      healthySkills,
      warningSkills,
      criticalSkills,
      retireCandidate,
      overallHealthScore,
      timestamp: new Date()
    };

    this.emit('check:complete', output);
    return output;
  }

  /**
   * スキルの健康度スコアを計算
   */
  private calculateHealthScore(
    skill: Skill,
    usageData?: SkillUsageData,
    feedbacks?: SkillFeedback[]
  ): SkillHealthScore {
    const now = new Date();
    const alerts: HealthAlert[] = [];
    const recommendations: string[] = [];

    // 使用頻度スコア (0-100)
    let usageFrequency = 50; // デフォルト
    if (usageData) {
      const daysSinceLastUse = Math.floor((now.getTime() - usageData.lastUsed.getTime()) / (1000 * 60 * 60 * 24));
      usageFrequency = Math.max(0, 100 - daysSinceLastUse * 2);

      if (daysSinceLastUse > this.config!.alertThresholds!.stalenessDays!) {
        alerts.push({
          type: 'outdated',
          severity: 'high',
          message: `${daysSinceLastUse}日間使用されていません`,
          triggeredAt: now,
          suggestedAction: 'スキルの更新または廃止を検討してください'
        });
      }
    }

    // 成功率スコア (0-100)
    let successRate = 85; // デフォルト
    if (usageData && usageData.usageCount > 0) {
      const total = usageData.successCount + usageData.failureCount;
      if (total > 0) {
        successRate = Math.round((usageData.successCount / total) * 100);
      }

      if (successRate < this.config!.alertThresholds!.minSuccessRate!) {
        alerts.push({
          type: 'low_success',
          severity: 'medium',
          message: `成功率が${successRate}%と低下しています`,
          triggeredAt: now,
          suggestedAction: 'スキルの改善または問題点の調査が必要です'
        });
        recommendations.push('成功率向上のためのスキル改善を検討');
      }
    }

    // フィードバックスコア (0-100)
    let feedbackScore = 80; // デフォルト
    if (feedbacks && feedbacks.length > 0) {
      const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
      feedbackScore = Math.round(avgRating * 20);

      if (avgRating < this.config!.alertThresholds!.minFeedbackScore!) {
        alerts.push({
          type: 'negative_feedback',
          severity: 'medium',
          message: `平均評価が${avgRating.toFixed(1)}と低下しています`,
          triggeredAt: now,
          suggestedAction: 'ユーザーフィードバックを確認し改善を検討'
        });
      }
    }

    // メンテナンス状態スコア (0-100)
    const maintenanceStatus = this.calculateMaintenanceScore(skill);

    // 関連性スコア (0-100)
    const relevanceScore = this.calculateRelevanceScore(skill);

    // 総合スコア計算 (重み付け平均)
    const weights = {
      usageFrequency: 0.25,
      successRate: 0.25,
      feedbackScore: 0.20,
      maintenanceStatus: 0.15,
      relevanceScore: 0.15
    };

    const overallScore = Math.round(
      usageFrequency * weights.usageFrequency +
      successRate * weights.successRate +
      feedbackScore * weights.feedbackScore +
      maintenanceStatus * weights.maintenanceStatus +
      relevanceScore * weights.relevanceScore
    );

    // ステータス判定
    const status = this.determineStatus(overallScore, alerts);

    // 推奨アクション追加
    if (status === 'warning') {
      recommendations.push('定期的なモニタリングを継続');
    } else if (status === 'critical') {
      recommendations.push('早急な対応が必要です');
      recommendations.push('スキルの更新または代替スキルへの移行を検討');
    } else if (status === 'retired') {
      recommendations.push('このスキルの廃止を推奨します');
    }

    return {
      skillId: skill.id || skill.name,
      skillName: skill.name,
      overallScore,
      metrics: {
        usageFrequency,
        successRate,
        feedbackScore,
        maintenanceStatus,
        relevanceScore
      },
      status,
      alerts,
      recommendations,
      lastUsed: usageData?.lastUsed || now,
      lastUpdated: now
    };
  }

  /**
   * メンテナンス状態スコアを計算
   */
  private calculateMaintenanceScore(skill: Skill): number {
    let score = 80;

    // 最終更新日をチェック（メタデータに含まれていれば）
    if (skill.metadata?.updated_date) {
      const updateDate = new Date(skill.metadata.updated_date);
      const daysSinceUpdate = Math.floor((Date.now() - updateDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceUpdate > 180) {
        score -= 30;
      } else if (daysSinceUpdate > 90) {
        score -= 15;
      }
    }

    // ドキュメント完全性チェック
    if (!skill.description || skill.description.length < 50) {
      score -= 10;
    }

    if (!skill.triggers || skill.triggers.length === 0) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  /**
   * 関連性スコアを計算
   */
  private calculateRelevanceScore(skill: Skill): number {
    let score = 75;

    // 進化レベルが高いほど関連性が高い
    if (skill.evolutionLevel) {
      score += skill.evolutionLevel * 5;
    }

    // 複数業界に適用可能なら関連性が高い
    if (skill.targetIndustry === 'general' || !skill.targetIndustry) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * ステータスを判定
   */
  private determineStatus(score: number, alerts: HealthAlert[]): SkillHealthScore['status'] {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const highAlerts = alerts.filter(a => a.severity === 'high').length;

    if (score < 30 || criticalAlerts > 0) {
      return 'retired';
    } else if (score < 50 || highAlerts >= 2) {
      return 'critical';
    } else if (score < 70 || highAlerts >= 1) {
      return 'warning';
    }
    return 'healthy';
  }

  /**
   * リタイア候補を取得
   */
  async getRetireCandidates(): Promise<SkillHealthScore[]> {
    const healthScores = this.dataStore.getHealthScores();
    return healthScores.filter(h => h.status === 'retired' || h.overallScore < 40);
  }

  /**
   * アラートサマリーを生成
   */
  generateAlertSummary(healthScores: SkillHealthScore[]): string {
    const criticalCount = healthScores.filter(h => h.status === 'critical').length;
    const warningCount = healthScores.filter(h => h.status === 'warning').length;
    const totalAlerts = healthScores.reduce((sum, h) => sum + h.alerts.length, 0);

    let summary = `📊 スキル健康度サマリー\n`;
    summary += `━━━━━━━━━━━━━━━━━━━━\n`;
    summary += `🔴 クリティカル: ${criticalCount}件\n`;
    summary += `🟡 警告: ${warningCount}件\n`;
    summary += `📢 総アラート数: ${totalAlerts}件\n`;

    if (criticalCount > 0) {
      summary += `\n⚠️ 早急な対応が必要なスキル:\n`;
      healthScores
        .filter(h => h.status === 'critical')
        .slice(0, 5)
        .forEach(h => {
          summary += `  • ${h.skillName} (スコア: ${h.overallScore})\n`;
        });
    }

    return summary;
  }
}

export default HealthMonitorAgent;
