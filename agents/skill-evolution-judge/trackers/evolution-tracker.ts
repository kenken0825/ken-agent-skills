/**
 * Evolution Tracker
 * 
 * スキルの進化履歴を追跡・記録するコンポーネント
 */

import { EvolutionHistory, EvolutionTrackerInterface } from '../models/types';

export class EvolutionTracker implements EvolutionTrackerInterface {
  private history: Map<string, EvolutionHistory[]> = new Map();

  /**
   * 進化履歴を記録
   */
  async record(history: Omit<EvolutionHistory, 'previousLevel' | 'newLevel'>): Promise<void> {
    const skillHistory = this.history.get(history.skillId) || [];
    
    // 前回のレベルを取得
    const previousLevel = await this.getCurrentLevel(history.skillId);
    const newLevel = history.evidence.implementations >= 10 ? 4 : 
                    history.evidence.implementations >= 5 ? 3 : 
                    history.evidence.implementations >= 3 ? 2 : 1;

    const fullHistory: EvolutionHistory = {
      ...history,
      previousLevel,
      newLevel
    };

    skillHistory.push(fullHistory);
    this.history.set(history.skillId, skillHistory);
  }

  /**
   * スキルの進化履歴を取得
   */
  async getHistory(skillId: string): Promise<EvolutionHistory[]> {
    return this.history.get(skillId) || [];
  }

  /**
   * 現在のレベルを取得
   */
  async getCurrentLevel(skillId: string): Promise<number> {
    const skillHistory = this.history.get(skillId) || [];
    if (skillHistory.length === 0) return 1;
    
    return skillHistory[skillHistory.length - 1].newLevel;
  }

  /**
   * 履歴をクリア（テスト用）
   */
  clear(): void {
    this.history.clear();
  }
}

export const evolutionTracker = new EvolutionTracker();