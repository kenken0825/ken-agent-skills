/**
 * Unified Data Store
 *
 * スキル、トレンド、事例、メトリクスを統合管理するデータストア
 * Intelligence Suite の全エージェントが共有するデータ基盤
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import {
  DataEntry,
  DataStoreStats,
  DataStoreQuery,
  PainTrend,
  SkillHealthScore,
  SkillCombo,
  ROIPrediction,
  GeneratedStory,
  ComboSuccessCase
} from '../types';
import { Skill, PainPattern } from '../../shared/types';

/**
 * Unified Data Store クラス
 */
export class UnifiedDataStore extends EventEmitter {
  private entries: Map<string, DataEntry> = new Map();
  private indexes: {
    byType: Map<string, Set<string>>;
    byIndustry: Map<string, Set<string>>;
    bySkillId: Map<string, Set<string>>;
    byDate: Map<string, Set<string>>;
  };
  private persistPath: string;
  private autoSave: boolean;
  private version: number = 1;

  constructor(options: { persistPath?: string; autoSave?: boolean } = {}) {
    super();
    this.persistPath = options.persistPath || path.join(process.cwd(), 'data', 'intelligence-store.json');
    this.autoSave = options.autoSave ?? true;
    this.indexes = {
      byType: new Map(),
      byIndustry: new Map(),
      bySkillId: new Map(),
      byDate: new Map()
    };
  }

  /**
   * データストアを初期化
   */
  async initialize(): Promise<void> {
    try {
      if (fs.existsSync(this.persistPath)) {
        const data = JSON.parse(fs.readFileSync(this.persistPath, 'utf8'));
        this.loadFromJSON(data);
        this.emit('store:loaded', { entriesCount: this.entries.size });
      }
    } catch (error) {
      console.warn('Failed to load persisted data, starting fresh:', error);
    }
    this.emit('store:initialized');
  }

  // ========================================
  // CRUD 操作
  // ========================================

  /**
   * エントリを追加
   */
  async add(type: DataEntry['type'], data: any, metadata?: Partial<DataEntry['metadata']>): Promise<string> {
    const id = this.generateId(type);
    const entry: DataEntry = {
      id,
      type,
      data,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        source: metadata?.source || 'manual',
        version: 1
      },
      relations: []
    };

    this.entries.set(id, entry);
    this.addToIndexes(entry);

    if (this.autoSave) {
      await this.persist();
    }

    this.emit('entry:added', { id, type });
    return id;
  }

  /**
   * エントリを取得
   */
  get(id: string): DataEntry | undefined {
    return this.entries.get(id);
  }

  /**
   * エントリを更新
   */
  async update(id: string, data: Partial<any>): Promise<boolean> {
    const entry = this.entries.get(id);
    if (!entry) return false;

    entry.data = { ...entry.data, ...data };
    entry.metadata.updatedAt = new Date();
    entry.metadata.version++;

    if (this.autoSave) {
      await this.persist();
    }

    this.emit('entry:updated', { id });
    return true;
  }

  /**
   * エントリを削除
   */
  async delete(id: string): Promise<boolean> {
    const entry = this.entries.get(id);
    if (!entry) return false;

    this.removeFromIndexes(entry);
    this.entries.delete(id);

    if (this.autoSave) {
      await this.persist();
    }

    this.emit('entry:deleted', { id });
    return true;
  }

  // ========================================
  // クエリ操作
  // ========================================

  /**
   * タイプでエントリを検索
   */
  getByType(type: DataEntry['type']): DataEntry[] {
    const ids = this.indexes.byType.get(type);
    if (!ids) return [];
    return Array.from(ids).map(id => this.entries.get(id)!).filter(Boolean);
  }

  /**
   * 高度なクエリ
   */
  query(query: DataStoreQuery): DataEntry[] {
    let results = Array.from(this.entries.values());

    // タイプフィルター
    if (query.type) {
      results = results.filter(e => e.type === query.type);
    }

    // カスタムフィルター
    if (query.filters) {
      for (const [field, value] of Object.entries(query.filters)) {
        results = results.filter(e => {
          const fieldValue = this.getNestedValue(e, field);
          if (Array.isArray(value)) {
            return value.includes(fieldValue);
          }
          return fieldValue === value;
        });
      }
    }

    // ソート
    if (query.sort) {
      const { field, direction } = query.sort;
      results.sort((a, b) => {
        const aVal = this.getNestedValue(a, field);
        const bVal = this.getNestedValue(b, field);
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return direction === 'desc' ? -cmp : cmp;
      });
    }

    // ページネーション
    if (query.offset !== undefined) {
      results = results.slice(query.offset);
    }
    if (query.limit !== undefined) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  // ========================================
  // 特殊化されたアクセサ
  // ========================================

  /**
   * すべてのスキルを取得
   */
  getSkills(): Skill[] {
    return this.getByType('skill').map(e => e.data as Skill);
  }

  /**
   * すべてのペインパターンを取得
   */
  getPainPatterns(): PainPattern[] {
    return this.getByType('pain').map(e => e.data as PainPattern);
  }

  /**
   * すべてのトレンドを取得
   */
  getTrends(): PainTrend[] {
    return this.getByType('trend').map(e => e.data as PainTrend);
  }

  /**
   * すべての健康度スコアを取得
   */
  getHealthScores(): SkillHealthScore[] {
    return this.getByType('health').map(e => e.data as SkillHealthScore);
  }

  /**
   * すべてのコンボを取得
   */
  getCombos(): SkillCombo[] {
    return this.getByType('combo').map(e => e.data as SkillCombo);
  }

  /**
   * すべてのROI予測を取得
   */
  getROIPredictions(): ROIPrediction[] {
    return this.getByType('roi').map(e => e.data as ROIPrediction);
  }

  /**
   * すべての成功事例を取得
   */
  getSuccessCases(): GeneratedStory[] {
    return this.getByType('case').map(e => e.data as GeneratedStory);
  }

  // ========================================
  // 特殊化された追加メソッド
  // ========================================

  /**
   * スキルを追加
   */
  async addSkill(skill: Skill): Promise<string> {
    return this.add('skill', skill, { source: 'skill-repository' });
  }

  /**
   * ペインパターンを追加
   */
  async addPainPattern(pain: PainPattern): Promise<string> {
    return this.add('pain', pain, { source: 'pain-abstractor' });
  }

  /**
   * トレンドを追加/更新
   */
  async upsertTrend(trend: PainTrend): Promise<string> {
    const existing = this.query({
      type: 'trend',
      filters: { 'data.painId': trend.painId }
    })[0];

    if (existing) {
      await this.update(existing.id, trend);
      return existing.id;
    }
    return this.add('trend', trend, { source: 'demand-tracker' });
  }

  /**
   * 健康度スコアを追加/更新
   */
  async upsertHealthScore(health: SkillHealthScore): Promise<string> {
    const existing = this.query({
      type: 'health',
      filters: { 'data.skillId': health.skillId }
    })[0];

    if (existing) {
      await this.update(existing.id, health);
      return existing.id;
    }
    return this.add('health', health, { source: 'health-monitor' });
  }

  /**
   * コンボを追加
   */
  async addCombo(combo: SkillCombo): Promise<string> {
    return this.add('combo', combo, { source: 'combo-optimizer' });
  }

  /**
   * ROI予測を追加
   */
  async addROIPrediction(prediction: ROIPrediction): Promise<string> {
    return this.add('roi', prediction, { source: 'roi-predictor' });
  }

  /**
   * 成功事例を追加
   */
  async addSuccessCase(story: GeneratedStory): Promise<string> {
    return this.add('case', story, { source: 'story-generator' });
  }

  // ========================================
  // 関連付け
  // ========================================

  /**
   * エントリ間の関連を追加
   */
  async addRelation(sourceId: string, targetId: string, relationType: string, strength?: number): Promise<boolean> {
    const source = this.entries.get(sourceId);
    if (!source) return false;

    source.relations.push({
      type: relationType,
      targetId,
      strength
    });

    if (this.autoSave) {
      await this.persist();
    }

    this.emit('relation:added', { sourceId, targetId, relationType });
    return true;
  }

  /**
   * 関連エントリを取得
   */
  getRelated(id: string, relationType?: string): DataEntry[] {
    const entry = this.entries.get(id);
    if (!entry) return [];

    let relations = entry.relations;
    if (relationType) {
      relations = relations.filter(r => r.type === relationType);
    }

    return relations
      .map(r => this.entries.get(r.targetId))
      .filter(Boolean) as DataEntry[];
  }

  // ========================================
  // 統計
  // ========================================

  /**
   * ストア統計を取得
   */
  getStats(): DataStoreStats {
    const entriesByType: Record<string, number> = {};
    for (const [type, ids] of this.indexes.byType) {
      entriesByType[type] = ids.size;
    }

    return {
      totalEntries: this.entries.size,
      entriesByType,
      lastUpdated: new Date(),
      storageSize: this.calculateStorageSize()
    };
  }

  /**
   * 業界別統計
   */
  getIndustryStats(): Record<string, { skills: number; pains: number; cases: number }> {
    const stats: Record<string, { skills: number; pains: number; cases: number }> = {};

    for (const entry of this.entries.values()) {
      const industry = this.extractIndustry(entry);
      if (!industry) continue;

      if (!stats[industry]) {
        stats[industry] = { skills: 0, pains: 0, cases: 0 };
      }

      switch (entry.type) {
        case 'skill':
          stats[industry].skills++;
          break;
        case 'pain':
          stats[industry].pains++;
          break;
        case 'case':
          stats[industry].cases++;
          break;
      }
    }

    return stats;
  }

  // ========================================
  // 永続化
  // ========================================

  /**
   * データを永続化
   */
  async persist(): Promise<void> {
    const data = this.toJSON();
    const dir = path.dirname(this.persistPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.persistPath, JSON.stringify(data, null, 2));
    this.emit('store:persisted');
  }

  /**
   * JSONにエクスポート
   */
  toJSON(): any {
    return {
      version: this.version,
      exportedAt: new Date().toISOString(),
      entries: Array.from(this.entries.values()).map(e => ({
        ...e,
        metadata: {
          ...e.metadata,
          createdAt: e.metadata.createdAt.toISOString(),
          updatedAt: e.metadata.updatedAt.toISOString()
        }
      }))
    };
  }

  /**
   * JSONからロード
   */
  private loadFromJSON(data: any): void {
    if (!data.entries) return;

    for (const entryData of data.entries) {
      const entry: DataEntry = {
        ...entryData,
        metadata: {
          ...entryData.metadata,
          createdAt: new Date(entryData.metadata.createdAt),
          updatedAt: new Date(entryData.metadata.updatedAt)
        }
      };
      this.entries.set(entry.id, entry);
      this.addToIndexes(entry);
    }
  }

  /**
   * ストアをクリア
   */
  clear(): void {
    this.entries.clear();
    for (const index of Object.values(this.indexes)) {
      index.clear();
    }
    this.emit('store:cleared');
  }

  // ========================================
  // ヘルパーメソッド
  // ========================================

  private generateId(type: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${type}_${timestamp}_${random}`;
  }

  private addToIndexes(entry: DataEntry): void {
    // Type index
    if (!this.indexes.byType.has(entry.type)) {
      this.indexes.byType.set(entry.type, new Set());
    }
    this.indexes.byType.get(entry.type)!.add(entry.id);

    // Industry index
    const industry = this.extractIndustry(entry);
    if (industry) {
      if (!this.indexes.byIndustry.has(industry)) {
        this.indexes.byIndustry.set(industry, new Set());
      }
      this.indexes.byIndustry.get(industry)!.add(entry.id);
    }

    // Skill ID index
    const skillId = this.extractSkillId(entry);
    if (skillId) {
      if (!this.indexes.bySkillId.has(skillId)) {
        this.indexes.bySkillId.set(skillId, new Set());
      }
      this.indexes.bySkillId.get(skillId)!.add(entry.id);
    }

    // Date index (by day)
    const dateKey = entry.metadata.createdAt.toISOString().split('T')[0];
    if (!this.indexes.byDate.has(dateKey)) {
      this.indexes.byDate.set(dateKey, new Set());
    }
    this.indexes.byDate.get(dateKey)!.add(entry.id);
  }

  private removeFromIndexes(entry: DataEntry): void {
    this.indexes.byType.get(entry.type)?.delete(entry.id);

    const industry = this.extractIndustry(entry);
    if (industry) {
      this.indexes.byIndustry.get(industry)?.delete(entry.id);
    }

    const skillId = this.extractSkillId(entry);
    if (skillId) {
      this.indexes.bySkillId.get(skillId)?.delete(entry.id);
    }

    const dateKey = entry.metadata.createdAt.toISOString().split('T')[0];
    this.indexes.byDate.get(dateKey)?.delete(entry.id);
  }

  private extractIndustry(entry: DataEntry): string | null {
    const data = entry.data;
    return data?.industry || data?.targetIndustry || data?.metadata?.industry || null;
  }

  private extractSkillId(entry: DataEntry): string | null {
    const data = entry.data;
    if (entry.type === 'skill') return data?.id;
    return data?.skillId || null;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private calculateStorageSize(): number {
    const json = JSON.stringify(this.toJSON());
    return Buffer.byteLength(json, 'utf8');
  }
}

// デフォルトインスタンスをエクスポート
export const dataStore = new UnifiedDataStore();
export default dataStore;
