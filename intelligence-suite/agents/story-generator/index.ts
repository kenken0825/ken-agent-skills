/**
 * Story Generator Agent
 *
 * スキル導入の成功事例を自動生成するエージェント
 * ヒアリングメモ・成功指標から事例記事を自動作成
 */

import { EventEmitter } from 'events';
import {
  GeneratedStory,
  StoryGeneratorOutput,
  StoryGeneratorInput,
  IntelligenceAgentConfig
} from '../../types';
import { Skill } from '../../../shared/types';
import { UnifiedDataStore } from '../../store/unified-data-store';

/**
 * Story Generator Agent クラス
 */
export class StoryGeneratorAgent extends EventEmitter {
  private config: IntelligenceAgentConfig['storyGenerator'];
  private dataStore: UnifiedDataStore;

  constructor(config?: IntelligenceAgentConfig['storyGenerator'], dataStore?: UnifiedDataStore) {
    super();
    this.config = {
      defaultFormat: config?.defaultFormat ?? 'markdown',
      includeTestimonials: config?.includeTestimonials ?? true
    };
    this.dataStore = dataStore || new UnifiedDataStore();
  }

  /**
   * ストーリー生成を実行
   */
  async execute(input: StoryGeneratorInput): Promise<StoryGeneratorOutput> {
    this.emit('generation:start', { skillName: input.skill.name });

    // メインストーリーを生成
    const story = this.generateStory(input);

    // バリエーションを生成
    const variations = this.generateVariations(input, story);

    // 推奨チャネルを提案
    const suggestedChannels = this.suggestChannels(input.implementation.industry);

    // データストアに保存
    await this.dataStore.addSuccessCase(story);

    const output: StoryGeneratorOutput = {
      story,
      variations,
      suggestedChannels,
      timestamp: new Date()
    };

    this.emit('generation:complete', output);
    return output;
  }

  /**
   * メインストーリーを生成
   */
  private generateStory(input: StoryGeneratorInput): GeneratedStory {
    const { skill, implementation, results, challenges, testimonials } = input;

    // タイトルを生成
    const title = this.generateTitle(implementation.companyName, skill.name, results);

    // サブタイトルを生成
    const subtitle = this.generateSubtitle(results);

    // サマリーを生成
    const summary = this.generateSummary(skill, implementation, results);

    // セクションを生成
    const sections = this.generateSections(input);

    // メタデータ
    const metadata = {
      industry: implementation.industry,
      role: implementation.role,
      skillName: skill.name,
      companyName: implementation.companyName,
      generatedAt: new Date()
    };

    // 各フォーマットで出力
    const formats = this.generateFormats(title, subtitle, summary, sections);

    // キーメトリクスを抽出
    const keyMetrics = this.extractKeyMetrics(results);

    const id = `story_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    return {
      id,
      title,
      subtitle,
      summary,
      sections,
      metadata,
      formats,
      keyMetrics
    };
  }

  /**
   * タイトルを生成
   */
  private generateTitle(
    companyName: string,
    skillName: string,
    results: StoryGeneratorInput['results']
  ): string {
    // 最も印象的な結果を見つける
    const bestResult = results.reduce((best, current) => {
      const currentChange = Math.abs(current.percentChange || 0);
      const bestChange = Math.abs(best.percentChange || 0);
      return currentChange > bestChange ? current : best;
    }, results[0]);

    if (bestResult?.percentChange) {
      const direction = bestResult.percentChange > 0 ? '向上' : '削減';
      return `${companyName}様：${skillName}導入で${bestResult.metric}を${Math.abs(bestResult.percentChange)}%${direction}`;
    }

    return `${companyName}様：${skillName}導入事例`;
  }

  /**
   * サブタイトルを生成
   */
  private generateSubtitle(results: StoryGeneratorInput['results']): string {
    const improvements = results
      .filter(r => r.percentChange && r.percentChange !== 0)
      .map(r => `${r.metric}${r.percentChange! > 0 ? '+' : ''}${r.percentChange}%`)
      .slice(0, 3);

    if (improvements.length > 0) {
      return improvements.join(' / ');
    }

    return '業務効率化を実現';
  }

  /**
   * サマリーを生成
   */
  private generateSummary(
    skill: Skill,
    implementation: StoryGeneratorInput['implementation'],
    results: StoryGeneratorInput['results']
  ): string {
    const resultSummary = results
      .slice(0, 2)
      .map(r => `${r.metric}が${r.before}から${r.after}に改善`)
      .join('、');

    return `${implementation.industry}業界の${implementation.companyName}様では、` +
      `${skill.name}の導入により${resultSummary}しました。` +
      `${implementation.duration}ヶ月のプロジェクトで、${implementation.teamSize}名のチームが取り組みました。`;
  }

  /**
   * セクションを生成
   */
  private generateSections(input: StoryGeneratorInput): GeneratedStory['sections'] {
    const { skill, implementation, results, challenges, testimonials } = input;

    // 課題セクション
    const challenge = this.generateChallengeSection(challenges, implementation);

    // ソリューションセクション
    const solution = this.generateSolutionSection(skill);

    // 実装セクション
    const implementationSection = this.generateImplementationSection(implementation);

    // 結果セクション
    const resultsSection = this.generateResultsSection(results);

    // テスティモニアルセクション
    const testimonial = testimonials?.length
      ? `> "${testimonials[0]}"`
      : undefined;

    // 次のステップセクション
    const nextSteps = this.generateNextSteps(skill, results);

    return {
      challenge,
      solution,
      implementation: implementationSection,
      results: resultsSection,
      testimonial,
      nextSteps
    };
  }

  /**
   * 課題セクションを生成
   */
  private generateChallengeSection(
    challenges?: string[],
    implementation?: StoryGeneratorInput['implementation']
  ): string {
    if (challenges && challenges.length > 0) {
      let section = '導入前、お客様は以下の課題を抱えていました：\n\n';
      challenges.forEach(c => {
        section += `- ${c}\n`;
      });
      return section;
    }

    return `${implementation?.industry}業界において、多くの企業が業務効率化の課題を抱えています。` +
      `${implementation?.companyName}様も同様の課題に直面していました。`;
  }

  /**
   * ソリューションセクションを生成
   */
  private generateSolutionSection(skill: Skill): string {
    let section = `${skill.name}を導入することで、これらの課題に対応しました。\n\n`;
    section += `**主な特徴:**\n`;
    section += `- ${skill.description}\n`;

    if (skill.triggers.length > 0) {
      section += `\n**対応トリガー:**\n`;
      skill.triggers.slice(0, 3).forEach(t => {
        section += `- ${t}\n`;
      });
    }

    return section;
  }

  /**
   * 実装セクションを生成
   */
  private generateImplementationSection(
    implementation: StoryGeneratorInput['implementation']
  ): string {
    const startDate = implementation.startDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long'
    });

    return `${startDate}からプロジェクトを開始し、${implementation.duration}ヶ月で導入を完了しました。\n\n` +
      `- **プロジェクト期間:** ${implementation.duration}ヶ月\n` +
      `- **チーム規模:** ${implementation.teamSize}名\n` +
      `- **対象部門:** ${implementation.role}`;
  }

  /**
   * 結果セクションを生成
   */
  private generateResultsSection(results: StoryGeneratorInput['results']): string {
    let section = '導入後、以下の成果を達成しました：\n\n';
    section += '| 指標 | 導入前 | 導入後 | 改善率 |\n';
    section += '|------|--------|--------|--------|\n';

    for (const result of results) {
      const improvement = result.percentChange
        ? `${result.percentChange > 0 ? '+' : ''}${result.percentChange}%`
        : '-';
      section += `| ${result.metric} | ${result.before} | ${result.after} | ${improvement} |\n`;
    }

    return section;
  }

  /**
   * 次のステップを生成
   */
  private generateNextSteps(skill: Skill, results: StoryGeneratorInput['results']): string {
    const avgImprovement = results
      .filter(r => r.percentChange)
      .reduce((sum, r) => sum + Math.abs(r.percentChange!), 0) / results.length;

    if (avgImprovement >= 30) {
      return `今後は${skill.name}の活用範囲を他部門にも拡大し、さらなる効率化を目指します。`;
    }

    return `継続的な改善を通じて、${skill.name}の効果を最大化していきます。`;
  }

  /**
   * 各フォーマットを生成
   */
  private generateFormats(
    title: string,
    subtitle: string,
    summary: string,
    sections: GeneratedStory['sections']
  ): GeneratedStory['formats'] {
    // Markdown形式
    const markdown = this.generateMarkdownFormat(title, subtitle, summary, sections);

    // HTML形式
    const html = this.generateHTMLFormat(title, subtitle, summary, sections);

    // プレーンテキスト形式
    const plainText = this.generatePlainTextFormat(title, subtitle, summary, sections);

    // ソーシャルメディア形式
    const socialMedia = this.generateSocialMediaFormats(title, subtitle, summary);

    return {
      markdown,
      html,
      plainText,
      socialMedia
    };
  }

  /**
   * Markdown形式を生成
   */
  private generateMarkdownFormat(
    title: string,
    subtitle: string,
    summary: string,
    sections: GeneratedStory['sections']
  ): string {
    let md = `# ${title}\n\n`;
    md += `**${subtitle}**\n\n`;
    md += `${summary}\n\n`;
    md += `---\n\n`;
    md += `## 課題\n\n${sections.challenge}\n\n`;
    md += `## ソリューション\n\n${sections.solution}\n\n`;
    md += `## 導入プロセス\n\n${sections.implementation}\n\n`;
    md += `## 成果\n\n${sections.results}\n\n`;

    if (sections.testimonial) {
      md += `## お客様の声\n\n${sections.testimonial}\n\n`;
    }

    if (sections.nextSteps) {
      md += `## 今後の展望\n\n${sections.nextSteps}\n`;
    }

    return md;
  }

  /**
   * HTML形式を生成
   */
  private generateHTMLFormat(
    title: string,
    subtitle: string,
    summary: string,
    sections: GeneratedStory['sections']
  ): string {
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
</head>
<body>
  <article>
    <h1>${title}</h1>
    <p class="subtitle"><strong>${subtitle}</strong></p>
    <p class="summary">${summary}</p>
    <hr>
    <section>
      <h2>課題</h2>
      <p>${sections.challenge.replace(/\n/g, '<br>')}</p>
    </section>
    <section>
      <h2>ソリューション</h2>
      <p>${sections.solution.replace(/\n/g, '<br>')}</p>
    </section>
    <section>
      <h2>導入プロセス</h2>
      <p>${sections.implementation.replace(/\n/g, '<br>')}</p>
    </section>
    <section>
      <h2>成果</h2>
      <p>${sections.results.replace(/\n/g, '<br>')}</p>
    </section>
    ${sections.testimonial ? `
    <section>
      <h2>お客様の声</h2>
      <blockquote>${sections.testimonial}</blockquote>
    </section>
    ` : ''}
  </article>
</body>
</html>`.trim();
  }

  /**
   * プレーンテキスト形式を生成
   */
  private generatePlainTextFormat(
    title: string,
    subtitle: string,
    summary: string,
    sections: GeneratedStory['sections']
  ): string {
    let text = `${title}\n`;
    text += '='.repeat(title.length) + '\n\n';
    text += `${subtitle}\n\n`;
    text += `${summary}\n\n`;
    text += '-'.repeat(40) + '\n\n';
    text += `【課題】\n${sections.challenge}\n\n`;
    text += `【ソリューション】\n${sections.solution}\n\n`;
    text += `【導入プロセス】\n${sections.implementation}\n\n`;
    text += `【成果】\n${sections.results}\n\n`;

    if (sections.testimonial) {
      text += `【お客様の声】\n${sections.testimonial}\n`;
    }

    return text;
  }

  /**
   * ソーシャルメディア形式を生成
   */
  private generateSocialMediaFormats(
    title: string,
    subtitle: string,
    summary: string
  ): { twitter: string; linkedin: string } {
    // Twitter (280文字制限)
    const twitterText = `📈 ${title.substring(0, 100)}

${subtitle}

#DX #業務効率化 #自動化`;

    // LinkedIn (より詳細)
    const linkedinText = `🚀 導入事例のご紹介

${title}

${summary}

詳細はこちら ▼

#DigitalTransformation #業務改善 #自動化 #DX事例`;

    return {
      twitter: twitterText.substring(0, 280),
      linkedin: linkedinText
    };
  }

  /**
   * キーメトリクスを抽出
   */
  private extractKeyMetrics(
    results: StoryGeneratorInput['results']
  ): GeneratedStory['keyMetrics'] {
    return results.slice(0, 4).map(result => ({
      label: result.metric,
      value: result.percentChange
        ? `${result.percentChange > 0 ? '+' : ''}${result.percentChange}%`
        : `${result.before} → ${result.after}`,
      icon: this.getMetricIcon(result.metric)
    }));
  }

  /**
   * メトリクスに適したアイコンを取得
   */
  private getMetricIcon(metric: string): string {
    const metricLower = metric.toLowerCase();

    if (metricLower.includes('時間') || metricLower.includes('time')) return '⏱️';
    if (metricLower.includes('コスト') || metricLower.includes('cost')) return '💰';
    if (metricLower.includes('効率') || metricLower.includes('efficiency')) return '⚡';
    if (metricLower.includes('品質') || metricLower.includes('quality')) return '✨';
    if (metricLower.includes('エラー') || metricLower.includes('error')) return '🛡️';
    if (metricLower.includes('満足') || metricLower.includes('satisfaction')) return '😊';

    return '📊';
  }

  /**
   * バリエーションを生成
   */
  private generateVariations(
    input: StoryGeneratorInput,
    mainStory: GeneratedStory
  ): GeneratedStory[] {
    const variations: GeneratedStory[] = [];

    // 短縮版を生成
    const shortVersion = this.generateShortVersion(input, mainStory);
    variations.push(shortVersion);

    return variations;
  }

  /**
   * 短縮版を生成
   */
  private generateShortVersion(
    input: StoryGeneratorInput,
    mainStory: GeneratedStory
  ): GeneratedStory {
    const shortSummary = mainStory.summary.substring(0, 200) + '...';

    return {
      ...mainStory,
      id: mainStory.id + '_short',
      summary: shortSummary,
      sections: {
        challenge: mainStory.sections.challenge.split('\n')[0],
        solution: mainStory.sections.solution.split('\n')[0],
        implementation: mainStory.sections.implementation.split('\n')[0],
        results: mainStory.sections.results
      }
    };
  }

  /**
   * 推奨チャネルを提案
   */
  private suggestChannels(industry: string): string[] {
    const baseChannels = ['自社ウェブサイト', 'メールマガジン', 'LinkedIn'];

    const industryChannels: Record<string, string[]> = {
      manufacturing: ['製造業向け専門メディア', '展示会資料'],
      technology: ['技術ブログ', 'Qiita', 'Twitter'],
      finance: ['金融専門誌', 'セミナー資料'],
      healthcare: ['医療情報サイト', '学会発表'],
      retail: ['小売業界誌', 'Instagram']
    };

    const specific = industryChannels[industry.toLowerCase()] || [];

    return [...baseChannels, ...specific];
  }
}

export default StoryGeneratorAgent;
