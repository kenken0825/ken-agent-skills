#!/usr/bin/env node

/**
 * Intelligence Dashboard CLI
 *
 * ターミナルでダッシュボードを表示・操作するCLIツール
 */

import { Command } from 'commander';
import { IntelligenceOrchestrator } from '../orchestrator';
import { DashboardView, PainTrend, SkillHealthScore, SkillCombo } from '../types';
import { SkillRepository } from '../../repository/skill-repository';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

/**
 * ダッシュボード表示クラス
 */
class DashboardDisplay {
  /**
   * メインダッシュボードを表示
   */
  static render(dashboard: DashboardView): void {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║           📊 SKILLDEX INTELLIGENCE DASHBOARD                       ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log(`║  最終更新: ${dashboard.lastRefresh.toLocaleString('ja-JP')}                          ║`);
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('');

    // 需要トレンドセクション
    this.renderDemandSection(dashboard);

    // ヘルスセクション
    this.renderHealthSection(dashboard);

    // ROIセクション
    this.renderROISection(dashboard);

    // トップコンボセクション
    this.renderComboSection(dashboard);

    // アラートセクション
    this.renderAlertSection(dashboard);

    console.log('');
  }

  /**
   * 需要トレンドセクションを表示
   */
  static renderDemandSection(dashboard: DashboardView): void {
    console.log('┌──────────────────────────────────────────────────────────────────┐');
    console.log('│ 🔥 需要トレンド                                                  │');
    console.log('├──────────────────────────────────────────────────────────────────┤');

    if (dashboard.demandSummary.topTrends.length === 0) {
      console.log('│   データなし                                                     │');
    } else {
      dashboard.demandSummary.topTrends.slice(0, 5).forEach((trend, i) => {
        const icon = trend.trend === 'rising' ? '📈' : trend.trend === 'declining' ? '📉' : '➡️';
        const change = trend.changePercent >= 0 ? `+${trend.changePercent}%` : `${trend.changePercent}%`;
        const line = `│  ${i + 1}. ${icon} ${trend.painName.padEnd(30)} ${change.padStart(8)} │`;
        console.log(line.substring(0, 70) + '│');
      });
    }

    console.log('├──────────────────────────────────────────────────────────────────┤');
    console.log(`│  急上昇: ${dashboard.demandSummary.emergingCount}件  |  減少中: ${dashboard.demandSummary.decliningCount}件`.padEnd(69) + '│');
    console.log('└──────────────────────────────────────────────────────────────────┘');
    console.log('');
  }

  /**
   * ヘルスセクションを表示
   */
  static renderHealthSection(dashboard: DashboardView): void {
    console.log('┌──────────────────────────────────────────────────────────────────┐');
    console.log('│ 💚 スキル健康度                                                   │');
    console.log('├──────────────────────────────────────────────────────────────────┤');

    // プログレスバー
    const score = dashboard.healthSummary.overallScore;
    const barLength = 40;
    const filled = Math.round((score / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    const color = score >= 70 ? '🟢' : score >= 50 ? '🟡' : '🔴';

    console.log(`│  ${color} 全体スコア: [${bar}] ${score}%`.padEnd(69) + '│');
    console.log('├──────────────────────────────────────────────────────────────────┤');
    console.log(`│  🟢 健全: ${dashboard.healthSummary.healthyCount}  |  🟡 警告: ${dashboard.healthSummary.warningCount}  |  🔴 クリティカル: ${dashboard.healthSummary.criticalCount}`.padEnd(69) + '│');
    console.log('└──────────────────────────────────────────────────────────────────┘');
    console.log('');
  }

  /**
   * ROIセクションを表示
   */
  static renderROISection(dashboard: DashboardView): void {
    console.log('┌──────────────────────────────────────────────────────────────────┐');
    console.log('│ 💰 ROI サマリー                                                   │');
    console.log('├──────────────────────────────────────────────────────────────────┤');
    console.log(`│  平均ROI: ${dashboard.roiSummary.averageROI}%`.padEnd(69) + '│');
    console.log(`│  年間削減見込み: ${dashboard.roiSummary.totalSavings}万円`.padEnd(69) + '│');
    console.log(`│  成功率: ${dashboard.roiSummary.successRate}%`.padEnd(69) + '│');
    console.log('└──────────────────────────────────────────────────────────────────┘');
    console.log('');
  }

  /**
   * コンボセクションを表示
   */
  static renderComboSection(dashboard: DashboardView): void {
    console.log('┌──────────────────────────────────────────────────────────────────┐');
    console.log('│ 🎯 推奨スキルコンボ                                               │');
    console.log('├──────────────────────────────────────────────────────────────────┤');

    if (dashboard.topCombos.length === 0) {
      console.log('│   データなし                                                     │');
    } else {
      dashboard.topCombos.slice(0, 3).forEach((combo, i) => {
        const skills = combo.skills.map(s => s.name).join(' + ');
        console.log(`│  ${i + 1}. ${combo.name.substring(0, 35).padEnd(35)} スコア: ${combo.synergyScore}`.padEnd(69) + '│');
        console.log(`│     ${skills.substring(0, 60)}`.padEnd(69) + '│');
      });
    }

    console.log('└──────────────────────────────────────────────────────────────────┘');
    console.log('');
  }

  /**
   * アラートセクションを表示
   */
  static renderAlertSection(dashboard: DashboardView): void {
    if (dashboard.alerts.length === 0) return;

    console.log('┌──────────────────────────────────────────────────────────────────┐');
    console.log('│ ⚠️ アラート                                                       │');
    console.log('├──────────────────────────────────────────────────────────────────┤');

    dashboard.alerts.slice(0, 5).forEach(alert => {
      const icon = alert.severity === 'critical' ? '🔴' :
                   alert.severity === 'high' ? '🟠' :
                   alert.severity === 'medium' ? '🟡' : '🔵';
      console.log(`│  ${icon} ${alert.message.substring(0, 60)}`.padEnd(69) + '│');
    });

    console.log('└──────────────────────────────────────────────────────────────────┘');
  }

  /**
   * トレンド詳細を表示
   */
  static renderTrendDetails(trends: PainTrend[]): void {
    console.log('\n📈 トレンド詳細レポート');
    console.log('═'.repeat(70));

    trends.forEach((trend, i) => {
      console.log(`\n${i + 1}. ${trend.painName}`);
      console.log(`   カテゴリ: ${trend.category}`);
      console.log(`   現在カウント: ${trend.currentCount} (前回: ${trend.previousCount})`);
      console.log(`   変化率: ${trend.changePercent >= 0 ? '+' : ''}${trend.changePercent}%`);
      console.log(`   トレンド: ${trend.trend}`);
      console.log(`   関連業界: ${trend.industries.join(', ')}`);
    });
  }

  /**
   * コンボ詳細を表示
   */
  static renderComboDetails(combo: SkillCombo): void {
    console.log(`\n🎯 コンボ詳細: ${combo.name}`);
    console.log('═'.repeat(70));
    console.log(`シナジースコア: ${combo.synergyScore}/100`);
    console.log(`推定ROI: ${combo.estimatedROI}%`);
    console.log('\n構成スキル:');
    combo.skills.forEach((skill, i) => {
      console.log(`  ${i + 1}. ${skill.name}`);
      console.log(`     ${skill.description.substring(0, 60)}...`);
    });
    console.log('\nシナジー要素:');
    console.log(`  ワークフロー統合: ${combo.synergyFactors.workflowIntegration}/100`);
    console.log(`  データ共有: ${combo.synergyFactors.dataSharing}/100`);
    console.log(`  スキル補完: ${combo.synergyFactors.skillComplement}/100`);
    console.log(`  習得容易性: ${combo.synergyFactors.learningCurve}/100`);
    console.log('\nベネフィット:');
    combo.benefits.forEach(b => console.log(`  • ${b}`));
    console.log('\n実装順序:');
    combo.implementationOrder.forEach((id, i) => console.log(`  ${i + 1}. ${id}`));
  }
}

// CLI コマンド定義
program
  .name('intelligence-cli')
  .description('Skilldex Intelligence Suite CLI')
  .version('1.0.0');

program
  .command('dashboard')
  .description('ダッシュボードを表示')
  .option('-r, --refresh', '最新データでリフレッシュ')
  .action(async (options) => {
    console.log('📊 ダッシュボードを読み込み中...');

    const orchestrator = new IntelligenceOrchestrator();
    const repository = new SkillRepository();

    try {
      await repository.loadSkills();
      const skills = await repository.getAllSkills();

      const result = await orchestrator.execute({
        mode: 'analyze',
        data: { skills }
      });

      DashboardDisplay.render(result.dashboard);

      if (result.insights.length > 0) {
        console.log('💡 インサイト:');
        result.insights.forEach(insight => console.log(`   ${insight}`));
      }
    } catch (error) {
      console.error('エラー:', error);
    }
  });

program
  .command('trends')
  .description('需要トレンドを分析')
  .option('-i, --industry <industry>', '業界でフィルタ')
  .option('-n, --limit <number>', '表示件数', '10')
  .action(async (options) => {
    console.log('📈 トレンドを分析中...');

    const orchestrator = new IntelligenceOrchestrator();

    // サンプルペインパターン（実際にはデータソースから取得）
    const painPatterns = [
      { name: 'インボイス制度対応', category: 'compliance', symptoms: ['請求書処理'], description: '' },
      { name: 'リモートワーク管理', category: 'process', symptoms: ['勤怠管理'], description: '' },
      { name: '採用効率化', category: 'resource', symptoms: ['人材不足'], description: '' }
    ];

    try {
      const result = await orchestrator.executeCommand('DEMAND', { painPatterns });
      DashboardDisplay.renderTrendDetails(result.topTrends);
    } catch (error) {
      console.error('エラー:', error);
    }
  });

program
  .command('health')
  .description('スキル健康度をチェック')
  .option('-c, --critical-only', 'クリティカルのみ表示')
  .action(async (options) => {
    console.log('💚 スキル健康度をチェック中...');

    const orchestrator = new IntelligenceOrchestrator();
    const repository = new SkillRepository();

    try {
      await repository.loadSkills();
      const skills = await repository.getAllSkills();

      const result = await orchestrator.executeCommand('HEALTH', { skills });

      console.log('\n📊 スキル健康度レポート');
      console.log('═'.repeat(70));
      console.log(`全体スコア: ${result.overallHealthScore}/100`);
      console.log(`\n🟢 健全: ${result.healthySkills.length}件`);
      console.log(`🟡 警告: ${result.warningSkills.length}件`);
      console.log(`🔴 クリティカル: ${result.criticalSkills.length}件`);

      if (result.criticalSkills.length > 0) {
        console.log('\n⚠️ クリティカルスキル:');
        result.criticalSkills.forEach((skill: SkillHealthScore) => {
          console.log(`  • ${skill.skillName} (スコア: ${skill.overallScore})`);
          skill.alerts.forEach(alert => {
            console.log(`    - ${alert.message}`);
          });
        });
      }
    } catch (error) {
      console.error('エラー:', error);
    }
  });

program
  .command('combo')
  .description('スキルコンボを最適化')
  .option('-i, --industry <industry>', '業界を指定')
  .option('-n, --max-size <number>', '最大コンボサイズ', '4')
  .action(async (options) => {
    console.log('🎯 スキルコンボを最適化中...');

    const orchestrator = new IntelligenceOrchestrator();
    const repository = new SkillRepository();

    try {
      await repository.loadSkills();
      const skills = await repository.getAllSkills();

      // サンプルペインパターン
      const painPatterns = [
        { name: '業務効率化', category: 'process', symptoms: ['手作業が多い'], description: '' },
        { name: 'コスト削減', category: 'resource', symptoms: ['予算不足'], description: '' }
      ];

      const result = await orchestrator.executeCommand('COMBO', {
        skills,
        painPatterns,
        industry: options.industry || 'general'
      });

      if (result.topCombo) {
        DashboardDisplay.renderComboDetails(result.topCombo);
      }

      console.log(`\n📋 他の推奨コンボ: ${result.recommendedCombos.length - 1}件`);
    } catch (error) {
      console.error('エラー:', error);
    }
  });

program
  .command('roi <skill-id>')
  .description('スキルのROIを予測')
  .option('-i, --industry <industry>', '業界', 'technology')
  .option('-s, --size <size>', '企業規模', 'medium')
  .action(async (skillId, options) => {
    console.log(`💰 ROIを予測中: ${skillId}`);

    const orchestrator = new IntelligenceOrchestrator();
    const repository = new SkillRepository();

    try {
      await repository.loadSkills();
      const skill = await repository.getSkillById(skillId);

      if (!skill) {
        console.error(`スキルが見つかりません: ${skillId}`);
        return;
      }

      const result = await orchestrator.executeCommand('ROI', {
        skill,
        companyInfo: {
          industry: options.industry,
          size: options.size
        }
      });

      const p = result.prediction;
      console.log('\n📊 ROI予測レポート');
      console.log('═'.repeat(70));
      console.log(`スキル: ${p.skillName}`);
      console.log(`\n【初期投資】`);
      console.log(`  導入: ${p.initialInvestment.implementation}万円`);
      console.log(`  トレーニング: ${p.initialInvestment.training}万円`);
      console.log(`  インフラ: ${p.initialInvestment.infrastructure}万円`);
      console.log(`  合計: ${p.initialInvestment.total}万円`);
      console.log(`\n【年間削減効果】`);
      console.log(`  人件費: ${p.annualSavings.laborCost}万円`);
      console.log(`  エラー削減: ${p.annualSavings.errorReduction}万円`);
      console.log(`  効率化: ${p.annualSavings.efficiencyGain}万円`);
      console.log(`  合計: ${p.annualSavings.total}万円/年`);
      console.log(`\n【ROI指標】`);
      console.log(`  ROI: ${p.roi.percentage}%`);
      console.log(`  回収期間: ${p.roi.paybackMonths}ヶ月`);
      console.log(`  3年価値: ${p.roi.threeYearValue}万円`);
      console.log(`  信頼度: ${p.confidenceLevel.toUpperCase()}`);
    } catch (error) {
      console.error('エラー:', error);
    }
  });

program
  .command('story')
  .description('成功事例を生成')
  .option('-s, --skill <skill-id>', 'スキルID')
  .option('-o, --output <file>', '出力ファイル')
  .action(async (options) => {
    console.log('📝 成功事例を生成中...');

    const orchestrator = new IntelligenceOrchestrator();
    const repository = new SkillRepository();

    try {
      await repository.loadSkills();
      let skill;

      if (options.skill) {
        skill = await repository.getSkillById(options.skill);
      } else {
        const skills = await repository.getAllSkills();
        skill = skills[0];
      }

      if (!skill) {
        console.error('スキルが見つかりません');
        return;
      }

      const result = await orchestrator.executeCommand('STORY', {
        skill,
        implementation: {
          companyName: 'サンプル株式会社',
          industry: skill.industry || 'technology',
          role: 'Operations',
          startDate: new Date(),
          duration: 3,
          teamSize: 5
        },
        results: [
          { metric: '処理時間', before: '40時間/月', after: '10時間/月', percentChange: -75 },
          { metric: 'エラー率', before: '5%', after: '0.5%', percentChange: -90 }
        ]
      });

      console.log('\n📄 生成されたストーリー');
      console.log('═'.repeat(70));
      console.log(result.story.formats.markdown);

      if (options.output) {
        fs.writeFileSync(options.output, result.story.formats.markdown);
        console.log(`\n✅ ファイルに保存しました: ${options.output}`);
      }
    } catch (error) {
      console.error('エラー:', error);
    }
  });

program
  .command('full')
  .description('フル分析を実行')
  .option('-i, --industry <industry>', '業界')
  .action(async (options) => {
    console.log('🚀 フル分析を実行中...');

    const orchestrator = new IntelligenceOrchestrator();
    const repository = new SkillRepository();

    try {
      await repository.loadSkills();
      const skills = await repository.getAllSkills();

      const painPatterns = [
        { name: '業務効率化', category: 'process' as const, symptoms: ['手作業'], description: '' },
        { name: 'コスト削減', category: 'resource' as const, symptoms: ['予算'], description: '' }
      ];

      const result = await orchestrator.execute({
        mode: 'full',
        data: {
          skills,
          painPatterns,
          companyInfo: {
            name: 'サンプル企業',
            industry: options.industry || 'technology',
            description: '',
            values: [],
            services: [],
            size: 'medium' as const
          }
        },
        options: {
          generateStories: true
        }
      });

      DashboardDisplay.render(result.dashboard);

      console.log('\n💡 インサイト:');
      result.insights.forEach(insight => console.log(`   ${insight}`));

      console.log(`\n⏱️ 実行時間: ${result.executionTime}ms`);
    } catch (error) {
      console.error('エラー:', error);
    }
  });

// プログラムを実行
program.parse();

export { DashboardDisplay };
