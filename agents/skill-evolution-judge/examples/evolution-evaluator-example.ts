/**
 * Evolution Evaluator 使用例
 * 
 * スキルの進化レベル評価の実践的な使い方を示すサンプル
 */

import { evolutionEvaluator } from '../evaluators/evolution-evaluator';
import { Skill, EvolutionEvidence } from '../models/types';

async function main() {
  console.log('=== スキル進化レベル評価デモ ===\n');

  // サンプルスキルデータ
  const skills: Array<{ skill: Skill; evidence: EvolutionEvidence }> = [
    {
      skill: {
        id: 'skill-001',
        name: 'Slack定例報告Bot',
        description: '毎朝の定例報告をSlackで自動収集・整形',
        category: 'コミュニケーション効率化',
        targetIndustry: 'IT',
        targetRole: 'エンジニア',
        triggers: ['朝会', '進捗報告', 'デイリースクラム'],
        implementations: 2,
        successRate: 0.9,
        evolutionLevel: 1
      },
      evidence: {
        implementations: 2,
        industries: ['IT'],
        roles: ['エンジニア', 'デザイナー'],
        successRate: 0.9,
        feedbacks: [
          '朝会の時間が15分から5分に短縮',
          'チーム全体の情報共有が改善'
        ]
      }
    },
    {
      skill: {
        id: 'skill-002',
        name: '在庫最適化AI',
        description: '需要予測に基づく自動発注システム',
        category: '在庫管理',
        targetIndustry: '小売',
        targetRole: '店長',
        triggers: ['在庫切れ', '過剰在庫', '発注業務'],
        implementations: 8,
        successRate: 0.82,
        evolutionLevel: 2
      },
      evidence: {
        implementations: 8,
        industries: ['小売', 'EC'],
        roles: ['店長', '在庫管理担当', 'バイヤー'],
        successRate: 0.82,
        feedbacks: [
          '在庫回転率が30%向上',
          '欠品率が50%減少',
          '複数のチェーン店で導入成功'
        ],
        crossIndustrySuccess: true
      }
    },
    {
      skill: {
        id: 'skill-003',
        name: 'KPIダッシュボード自動生成',
        description: '各種データソースからKPIを集約・可視化',
        category: 'データ分析',
        targetRole: 'マネージャー',
        triggers: ['月次報告', 'KPI管理', '経営会議'],
        implementations: 15,
        successRate: 0.88,
        evolutionLevel: 3
      },
      evidence: {
        implementations: 15,
        industries: ['IT', '製造業', '金融', 'サービス業'],
        roles: ['マネージャー', 'ディレクター', 'アナリスト', '経営企画', 'PM'],
        successRate: 0.88,
        crossIndustrySuccess: true,
        feedbacks: [
          'レポート作成時間を80%削減',
          '意思決定スピードが向上',
          '業界を問わず高い評価'
        ]
      }
    }
  ];

  // 各スキルの評価を実行
  for (const { skill, evidence } of skills) {
    console.log(`\n📊 スキル: ${skill.name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // 現在のレベルを評価
    const currentLevel = await evolutionEvaluator.evaluate(skill, evidence);
    console.log(`\n現在のレベル: レベル${currentLevel.level} - ${currentLevel.name}`);
    console.log(`説明: ${currentLevel.description}`);

    // 進化評価を実行
    const assessment = await evolutionEvaluator.assessEvolution(skill, evidence);

    // 進捗メトリクスを表示
    console.log(`\n📈 進捗メトリクス:`);
    console.log(`  - 実装数: ${assessment.progressMetrics.implementationCount}件`);
    console.log(`  - 業種多様性: ${assessment.progressMetrics.industryDiversity}業種`);
    console.log(`  - 職種カバレッジ: ${assessment.progressMetrics.roleDiversity}職種`);
    console.log(`  - 成功率: ${(assessment.progressMetrics.successRate * 100).toFixed(0)}%`);

    // 次レベルへの準備度
    const readinessPercentage = (assessment.readinessScore * 100).toFixed(0);
    const progressBar = generateProgressBar(assessment.readinessScore);
    console.log(`\n🎯 次レベルへの準備度: ${readinessPercentage}% ${progressBar}`);
    console.log(`  ${assessment.readyForNextLevel ? '✅ 次レベルへの進化準備が整っています' : '⏳ もう少しで次レベルです'}`);

    // 強みを表示
    if (assessment.strengths.length > 0) {
      console.log(`\n💪 強み:`);
      assessment.strengths.forEach(strength => {
        console.log(`  ✓ ${strength}`);
      });
    }

    // ギャップを表示
    if (assessment.gaps.length > 0) {
      console.log(`\n🔍 改善ポイント:`);
      assessment.gaps.forEach(gap => {
        console.log(`  • ${gap}`);
      });
    }

    // レベル別の詳細説明
    const levelDescription = evolutionEvaluator.generateLevelDescription(currentLevel, evidence);
    console.log(`\n💡 詳細評価: ${levelDescription}`);

    // フィードバックがある場合は表示
    if (evidence.feedbacks && evidence.feedbacks.length > 0) {
      console.log(`\n📝 実際のフィードバック:`);
      evidence.feedbacks.forEach(feedback => {
        console.log(`  "✓ ${feedback}"`);
      });
    }

    console.log('\n');
  }

  // サマリー表示
  console.log('\n=== 評価サマリー ===');
  console.log('レベル分布:');
  const levelCounts = skills.reduce((acc, { skill, evidence }) => {
    const level = skill.evolutionLevel || 1;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  for (let level = 1; level <= 4; level++) {
    const count = levelCounts[level] || 0;
    const bar = '█'.repeat(count * 5);
    console.log(`  レベル${level}: ${bar} (${count}スキル)`);
  }
}

/**
 * プログレスバーを生成
 */
function generateProgressBar(progress: number): string {
  const filled = Math.floor(progress * 20);
  const empty = 20 - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}

// 実行
main().catch(console.error);