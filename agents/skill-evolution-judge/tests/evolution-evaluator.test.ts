/**
 * Evolution Evaluator テスト
 */

import { evolutionEvaluator } from '../evaluators/evolution-evaluator';
import { Skill, EvolutionEvidence } from '../models/types';

describe('EvolutionEvaluator', () => {
  describe('evaluate', () => {
    it('レベル1: 個別最適（個人特化）の判定', async () => {
      const skill: Skill = {
        id: 'skill-001',
        name: 'デイリースクラム自動化',
        description: 'Slackでの定例報告を自動化',
        category: '業務効率化',
        targetIndustry: 'IT',
        targetRole: 'エンジニア',
        triggers: ['定例報告', '進捗共有'],
        implementations: 1,
        successRate: 0.8,
        evolutionLevel: 1
      };

      const evidence: EvolutionEvidence = {
        implementations: 1,
        industries: ['IT'],
        roles: ['エンジニア'],
        successRate: 0.8,
        feedbacks: ['報告作成時間が削減できた']
      };

      const level = await evolutionEvaluator.evaluate(skill, evidence);
      expect(level.level).toBe(1);
      expect(level.name).toBe('個別最適（個人特化）');
    });

    it('レベル2: 再現性確認（業種特化）の判定', async () => {
      const skill: Skill = {
        id: 'skill-002',
        name: 'カルテ自動要約',
        description: '診療記録を自動的に要約',
        category: '情報管理',
        targetIndustry: '医療',
        targetRole: '医師',
        triggers: ['診療記録', 'カルテ作成'],
        implementations: 5,
        successRate: 0.75,
        evolutionLevel: 2
      };

      const evidence: EvolutionEvidence = {
        implementations: 5,
        industries: ['医療'],
        roles: ['医師', '看護師'],
        successRate: 0.75,
        feedbacks: ['複数の病院で採用', '医療現場の共通課題を解決']
      };

      const level = await evolutionEvaluator.evaluate(skill, evidence);
      expect(level.level).toBe(2);
      expect(level.name).toBe('再現性確認（業種特化）');
    });

    it('レベル3: 構造抽出（職種共通）の判定', async () => {
      const skill: Skill = {
        id: 'skill-003',
        name: 'データ可視化ダッシュボード',
        description: 'KPIの自動集計と可視化',
        category: '分析・レポート',
        targetRole: 'マネージャー',
        triggers: ['KPI管理', 'レポート作成'],
        implementations: 8,
        successRate: 0.8,
        evolutionLevel: 3
      };

      const evidence: EvolutionEvidence = {
        implementations: 8,
        industries: ['IT', '製造業', '小売'],
        roles: ['マネージャー', 'リーダー', 'アナリスト'],
        successRate: 0.8,
        crossIndustrySuccess: true
      };

      const level = await evolutionEvaluator.evaluate(skill, evidence);
      expect(level.level).toBe(3);
      expect(level.name).toBe('構造抽出（職種共通）');
    });

    it('レベル4: 汎用スキル（OS級）の判定', async () => {
      const skill: Skill = {
        id: 'skill-004',
        name: 'タスク自動振り分けシステム',
        description: '優先度とスキルに基づく最適配分',
        category: 'タスク管理',
        triggers: ['タスク配分', 'リソース管理'],
        implementations: 20,
        successRate: 0.85,
        evolutionLevel: 4
      };

      const evidence: EvolutionEvidence = {
        implementations: 20,
        industries: ['IT', '製造業', '小売', '医療', '教育'],
        roles: ['マネージャー', 'リーダー', 'コーディネーター', 'ディレクター', 'PM'],
        successRate: 0.85,
        crossIndustrySuccess: true
      };

      const level = await evolutionEvaluator.evaluate(skill, evidence);
      expect(level.level).toBe(4);
      expect(level.name).toBe('汎用スキル（OS級）');
    });
  });

  describe('calculateReadiness', () => {
    it('次レベルへの準備度を正しく計算', () => {
      const currentLevel = {
        level: 2 as const,
        name: '再現性確認（業種特化）',
        description: '同業種で再現し「業界あるある」へ'
      };

      const evidence: EvolutionEvidence = {
        implementations: 4, // レベル3には5件必要
        industries: ['IT', '製造業'], // レベル3には2業種必要（達成）
        roles: ['マネージャー', 'リーダー'], // レベル3には3職種必要
        successRate: 0.77 // レベル3には0.75必要（達成）
      };

      const readiness = evolutionEvaluator.calculateReadiness(evidence, currentLevel);
      
      // 期待値: (4/5*0.3 + 2/2*0.25 + 2/3*0.25 + 1.0*0.2) = 0.24 + 0.25 + 0.167 + 0.2 = 0.857
      expect(readiness).toBeCloseTo(0.857, 2);
    });

    it('最高レベルでは常に1.0を返す', () => {
      const currentLevel = {
        level: 4 as const,
        name: '汎用スキル（OS級）',
        description: '文脈フリーで使える"道具"へ'
      };

      const evidence: EvolutionEvidence = {
        implementations: 10,
        industries: ['IT'],
        roles: ['エンジニア'],
        successRate: 0.8
      };

      const readiness = evolutionEvaluator.calculateReadiness(evidence, currentLevel);
      expect(readiness).toBe(1.0);
    });
  });

  describe('identifyGaps', () => {
    it('目標レベルとのギャップを正確に特定', () => {
      const evidence: EvolutionEvidence = {
        implementations: 3,
        industries: ['IT'],
        roles: ['エンジニア', 'マネージャー'],
        successRate: 0.7
      };

      const gaps = evolutionEvaluator.identifyGaps(evidence, 3);
      
      expect(gaps).toHaveLength(3);
      expect(gaps).toContain('実装数が不足しています（現在: 3件、必要: 5件）');
      expect(gaps).toContain('業種の多様性が不足しています（現在: 1業種、必要: 2業種）');
      expect(gaps).toContain('職種のカバレッジが不足しています（現在: 2職種、必要: 3職種）');
    });

    it('すべての条件を満たしている場合は空配列を返す', () => {
      const evidence: EvolutionEvidence = {
        implementations: 10,
        industries: ['IT', '製造業', '小売', '医療'],
        roles: ['マネージャー', 'リーダー', 'アナリスト', 'コーディネーター', 'PM'],
        successRate: 0.85
      };

      const gaps = evolutionEvaluator.identifyGaps(evidence, 4);
      expect(gaps).toHaveLength(0);
    });
  });

  describe('assessEvolution', () => {
    it('包括的な進化評価を実行', async () => {
      const skill: Skill = {
        id: 'skill-005',
        name: 'プロジェクト進捗自動レポート',
        description: '各種ツールから進捗を集約してレポート化',
        category: 'プロジェクト管理',
        targetRole: 'PM',
        triggers: ['進捗報告', 'ステータス更新'],
        implementations: 6,
        successRate: 0.78,
        evolutionLevel: 2
      };

      const evidence: EvolutionEvidence = {
        implementations: 6,
        industries: ['IT', '製造業'],
        roles: ['PM', 'マネージャー', 'リーダー'],
        successRate: 0.78,
        crossIndustrySuccess: true
      };

      const assessment = await evolutionEvaluator.assessEvolution(skill, evidence);

      expect(assessment.readyForNextLevel).toBe(true);
      expect(assessment.readinessScore).toBeGreaterThan(0.8);
      expect(assessment.strengths).toContain('業種を超えた成功実績');
      expect(assessment.gaps).toHaveLength(0);
      expect(assessment.progressMetrics).toEqual({
        implementationCount: 6,
        industryDiversity: 2,
        roleDiversity: 3,
        successRate: 0.78
      });
    });
  });
});