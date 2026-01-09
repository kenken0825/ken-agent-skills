#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, basename } from 'path';

interface SkillRecommendation {
  name: string;
  level: number;
  score: number;
  overview: string;
  features: string[];
  benefits: {
    efficiency?: string;
    quality?: string;
    cost?: string;
    growth?: string;
    satisfaction?: string;
  };
}

interface AnalysisReport {
  companyName: string;
  industry: string;
  location: string;
  employees: number;
  founded: number;
  strengths: string[];
  challenges: string[];
  skills: SkillRecommendation[];
  roadmap: {
    phase: string;
    duration: string;
    tasks: string[];
  }[];
  expectedResults: {
    quantitative: string[];
    qualitative: string[];
  };
}

class ProposalGenerator {
  private readonly baseHourlyRate = 15000; // Base hourly rate in JPY
  private readonly complexityMultipliers = {
    1: 0.8,  // Level 1: Simple
    2: 1.0,  // Level 2: Standard
    3: 1.5,  // Level 3: Complex
    4: 2.0,  // Level 4: Advanced
    5: 2.5   // Level 5: Expert
  };

  private readonly implementationHours = {
    1: 40,   // Level 1: 1 week
    2: 80,   // Level 2: 2 weeks
    3: 160,  // Level 3: 1 month
    4: 320,  // Level 4: 2 months
    5: 480   // Level 5: 3 months
  };

  generateProposal(reportPath: string, outputPath?: string): void {
    // Read and parse the analysis report
    const reportContent = readFileSync(reportPath, 'utf-8');
    const report = this.parseMarkdownReport(reportContent);

    // Generate the proposal
    const proposal = this.createProposal(report);

    // Output the proposal
    const outputFile = outputPath || reportPath.replace(/(-report|-analysis)\.md$/, '-proposal.md');
    writeFileSync(outputFile, proposal);
    
    console.log(`✅ Proposal generated successfully: ${outputFile}`);
  }

  private parseMarkdownReport(content: string): AnalysisReport {
    // Extract company information - handle line breaks and extra spaces
    const companyMatch = content.match(/\*\*企業名\*\*:\s*(.+?)[\s\n]/);
    const industryMatch = content.match(/\*\*業種\*\*:\s*(.+?)[\s\n]/);
    const locationMatch = content.match(/\*\*所在地\*\*:\s*(.+?)[\s\n]/);
    const employeesMatch = content.match(/\*\*従業員数\*\*:\s*(\d+)/);
    const foundedMatch = content.match(/\*\*創業\*\*:\s*(\d{4})/);

    // Extract strengths and challenges
    const strengthsSection = content.match(/### 強み[\s\S]*?(?=###|##\s|$)/);
    const challengesSection = content.match(/### 課題[\s\S]*?(?=###|##\s|$)/);
    
    const strengths = strengthsSection ? 
      [...strengthsSection[0].matchAll(/- ✅ (.+)/g)].map(m => m[1]) : [];
    const challenges = challengesSection ? 
      [...challengesSection[0].matchAll(/- ⚠️ (.+)/g)].map(m => m[1]) : [];

    // Extract skill recommendations
    const skills = this.extractSkills(content);

    // Extract roadmap
    const roadmap = this.extractRoadmap(content);

    // Extract expected results
    const expectedResults = this.extractExpectedResults(content);

    return {
      companyName: companyMatch?.[1]?.trim() || '貴社',
      industry: industryMatch?.[1]?.trim() || '専門サービス業',
      location: locationMatch?.[1]?.trim() || '日本',
      employees: parseInt(employeesMatch?.[1] || '10'),
      founded: parseInt(foundedMatch?.[1] || '2020'),
      strengths,
      challenges,
      skills,
      roadmap,
      expectedResults
    };
  }

  private extractSkills(content: string): SkillRecommendation[] {
    const skills: SkillRecommendation[] = [];
    
    // Split by skill sections
    const skillSections = content.split(/### \d+\./);
    
    for (let i = 1; i < skillSections.length; i++) {
      const section = skillSections[i];
      
      // Extract name and level
      const titleMatch = section.match(/[🥇🥈🥉📱📊]\s*\*\*(.+?)\*\*\s*\(Level (\d+)/);
      if (!titleMatch) continue;
      
      const name = titleMatch[1];
      const level = parseInt(titleMatch[2]);
      
      // Extract score
      const scoreMatch = section.match(/\*\*スコア\*\*:\s*(\d+)/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      
      // Extract overview
      const overviewMatch = section.match(/####\s*概要\s*\n(.+)/);
      const overview = overviewMatch?.[1] || '';
      
      // Extract features
      const featuresSection = section.match(/####\s*主要機能[\s\S]*?(?=####|---|$)/);
      const features = featuresSection ? 
        [...featuresSection[0].matchAll(/^-\s+(.+)$/gm)].map(m => m[1]) : [];
      
      // Extract benefits
      const benefitsSection = section.match(/####\s*導入効果[\s\S]*?(?=---|###|$)/);
      const benefits: any = {};
      
      if (benefitsSection) {
        const efficiencyMatch = benefitsSection[0].match(/\*\*効率性\*\*:\s*(.+)/);
        const qualityMatch = benefitsSection[0].match(/\*\*品質\*\*:\s*(.+)/);
        const costMatch = benefitsSection[0].match(/\*\*コスト\*\*:\s*(.+)/);
        const growthMatch = benefitsSection[0].match(/\*\*成長\*\*:\s*(.+)/);
        const satisfactionMatch = benefitsSection[0].match(/\*\*満足度\*\*:\s*(.+)/);

        if (efficiencyMatch) benefits.efficiency = efficiencyMatch[1];
        if (qualityMatch) benefits.quality = qualityMatch[1];
        if (costMatch) benefits.cost = costMatch[1];
        if (growthMatch) benefits.growth = growthMatch[1];
        if (satisfactionMatch) benefits.satisfaction = satisfactionMatch[1];
      }
      
      skills.push({
        name,
        level,
        score,
        overview,
        features: features.slice(0, 4),
        benefits
      });
    }
    
    return skills;
  }

  private extractRoadmap(content: string): any[] {
    const roadmap: any[] = [];
    const phasePattern = /###\s*Phase\s*(\d+)[^（]*（(.+?)）\s*\n([\s\S]*?)(?=###\s*Phase|##\s|$)/g;
    
    let match;
    while ((match = phasePattern.exec(content)) !== null) {
      const tasks = [...match[3].matchAll(/^\d+\.\s*(.+)$/gm)].map(m => m[1]);
      roadmap.push({
        phase: `Phase ${match[1]}`,
        duration: match[2],
        tasks
      });
    }

    return roadmap;
  }

  private extractExpectedResults(content: string): any {
    const resultsSection = content.match(/##\s*💡\s*期待される成果[\s\S]*?(?=##\s|$)/);
    if (!resultsSection) return { quantitative: [], qualitative: [] };

    const quantSection = resultsSection[0].match(/###\s*定量的効果[\s\S]*?(?=###|$)/);
    const qualSection = resultsSection[0].match(/###\s*定性的効果[\s\S]*?(?=###|$)/);

    const quantitative = quantSection ? 
      [...quantSection[0].matchAll(/^-\s+(.+)$/gm)].map(m => m[1]) : [];
    const qualitative = qualSection ? 
      [...qualSection[0].matchAll(/^-\s+(.+)$/gm)].map(m => m[1]) : [];

    return { quantitative, qualitative };
  }

  private createProposal(report: AnalysisReport): string {
    const currentDate = new Date().toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const validityPeriod = new Date();
    validityPeriod.setMonth(validityPeriod.getMonth() + 1);
    const validityDate = validityPeriod.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const totalCost = this.calculateTotalCost(report.skills);
    const timeline = this.calculateTimeline(report.skills);

    return `# 業務効率化システム導入提案書

**${report.companyName} 御中**

提案日: ${currentDate}  
有効期限: ${validityDate}

---

## エグゼクティブサマリー

${report.companyName}様の業務効率化と成長戦略の実現に向けて、AIとデジタル技術を活用した包括的なソリューションをご提案いたします。

### 提案の概要

本提案では、貴社の${report.industry}における豊富な経験と実績を更に強化し、以下の課題解決を実現します：

${report.challenges.map((challenge, index) => `${index + 1}. ${challenge}`).join('\n')}

### 期待される成果

**投資回収期間**: 約${this.calculateROI(totalCost, report)}ヶ月

**主要な効果**:
${report.expectedResults.quantitative.map(result => `- ${result}`).join('\n')}

---

## 1. 現状分析と提案背景

### 1.1 貴社の強み

${report.strengths.map(strength => `- ${strength}`).join('\n')}

### 1.2 解決すべき課題

現在、貴社では以下の課題により、業務効率化の機会損失が発生しています：

${report.challenges.map((challenge, index) => {
  return `#### ${index + 1}. ${challenge}
- 現在の影響: 業務時間の増加、品質のばらつき
- 放置した場合のリスク: 競合他社との差別化困難、成長機会の損失`;
}).join('\n\n')}

---

## 2. ソリューション提案

### 2.1 推奨システム一覧

${report.skills.map((skill, index) => {
  const cost = this.calculateSkillCost(skill);
  const duration = this.calculateSkillDuration(skill);
  
  return `#### ${index + 1}. ${skill.name}
**優先度**: ${this.getPriorityEmoji(index)} | **適合度**: ${skill.score}%

**概要**
${skill.overview}

**主要機能**
${skill.features.map(feature => `- ${feature}`).join('\n')}

**期待効果**
${Object.entries(skill.benefits).map(([key, value]) => `- ${this.getBenefitLabel(key)}: ${value}`).join('\n')}

**投資額**: ¥${cost.toLocaleString()}（税別）
**実装期間**: ${duration}
`;
}).join('\n---\n\n')}

---

## 3. 実装計画

### 3.1 フェーズ別実装スケジュール

${report.roadmap.map(phase => {
  return `#### ${phase.phase} (${phase.duration})
${phase.tasks.map((task, index) => `${index + 1}. ${task}`).join('\n')}
`;
}).join('\n')}

### 3.2 プロジェクト体制

**貴社側**
- プロジェクトオーナー: 経営層（意思決定）
- プロジェクトマネージャー: 管理部門責任者（進捗管理）
- 業務担当者: 各部門代表（要件定義・テスト）

**弊社側**
- プロジェクトマネージャー: 1名（全体統括）
- システムエンジニア: 2-3名（開発実装）
- UIデザイナー: 1名（画面設計）
- サポートエンジニア: 1名（導入支援）

---

## 4. 投資計画

### 4.1 初期投資

| 項目 | 金額（税別） | 備考 |
|------|------------|------|
${report.skills.map(skill => {
  const cost = this.calculateSkillCost(skill);
  return `| ${skill.name} | ¥${cost.toLocaleString()} | ${this.getSkillDurationLabel(skill)} |`;
}).join('\n')}
| **合計** | **¥${totalCost.toLocaleString()}** | |

### 4.2 ランニングコスト（年間）

| 項目 | 金額（税別） | 備考 |
|------|------------|------|
| クラウドサービス利用料 | ¥${(totalCost * 0.15).toLocaleString()} | 月額¥${Math.round(totalCost * 0.15 / 12).toLocaleString()} |
| 保守・サポート費用 | ¥${(totalCost * 0.2).toLocaleString()} | 初年度無料 |
| **年間合計** | **¥${(totalCost * 0.35).toLocaleString()}** | 2年目以降 |

### 4.3 投資対効果（ROI）

**削減可能なコスト（年間）**
- 人件費削減: ¥${this.estimateLabourSavings(report).toLocaleString()}
- 業務効率化: ¥${this.estimateEfficiencySavings(report).toLocaleString()}
- 機会損失回避: ¥${this.estimateOpportunitySavings(report).toLocaleString()}

**総削減額**: ¥${this.calculateTotalSavings(report).toLocaleString()}/年

**投資回収期間**: 約${this.calculateROI(totalCost, report)}ヶ月

---

## 5. 成功要因と保証

### 5.1 成功のための取り組み

1. **段階的導入**
   - スモールスタートでリスク最小化
   - 成功体験の積み重ね

2. **徹底した教育・研修**
   - 全従業員向け操作研修
   - 管理者向け活用研修

3. **継続的な改善**
   - 定期的な効果測定
   - フィードバックに基づく改善

### 5.2 品質保証

- **開発品質**: ISO9001準拠の開発プロセス
- **セキュリティ**: SSL/TLS暗号化、定期的な脆弱性診断
- **サポート**: 平日9:00-18:00の電話・メールサポート
- **SLA**: システム稼働率99.9%保証

---

## 6. 導入事例

### 類似業界での成功事例

**事例1: A法律事務所（従業員15名）**
- 導入システム: 案件管理・文書作成システム
- 効果: 業務時間50%削減、売上30%増加
- 投資回収: 8ヶ月

**事例2: B行政書士事務所（従業員5名）**
- 導入システム: 顧客管理・予約システム
- 効果: 新規顧客20%増加、業務効率40%向上
- 投資回収: 10ヶ月

---

## 7. 次のステップ

### 7.1 ご検討いただきたい事項

1. 優先的に導入したいシステムの選定
2. 導入時期・予算の確定
3. プロジェクト体制の構築

### 7.2 今後のスケジュール

1. **ご提案内容の検討**: 1-2週間
2. **詳細打ち合わせ**: ご決定後1週間以内
3. **要件定義**: 2-4週間
4. **開発着手**: 要件確定後即時

---

## お問い合わせ

本提案に関するご質問・ご相談は、下記までお気軽にお問い合わせください。

**株式会社スキルデックス**  
デジタルトランスフォーメーション事業部

📧 sales@skilldex.jp  
📞 03-XXXX-XXXX  
🌐 https://www.skilldex.jp

担当: 山田 太郎

---

*本提案書の内容は${validityDate}まで有効です。*  
*記載の金額は全て税別表示となっております。*`;
  }

  private calculateSkillCost(skill: SkillRecommendation): number {
    const baseHours = this.implementationHours[skill.level] || 160;
    const multiplier = this.complexityMultipliers[skill.level] || 1.0;
    return Math.round(baseHours * this.baseHourlyRate * multiplier);
  }

  private calculateSkillDuration(skill: SkillRecommendation): string {
    const hours = this.implementationHours[skill.level] || 160;
    if (hours <= 40) return '1週間';
    if (hours <= 80) return '2週間';
    if (hours <= 160) return '1ヶ月';
    if (hours <= 320) return '2ヶ月';
    return '3ヶ月';
  }

  private getSkillDurationLabel(skill: SkillRecommendation): string {
    return `実装期間: ${this.calculateSkillDuration(skill)}`;
  }

  private calculateTotalCost(skills: SkillRecommendation[]): number {
    return skills.reduce((total, skill) => total + this.calculateSkillCost(skill), 0);
  }

  private calculateTimeline(skills: SkillRecommendation[]): string {
    const totalHours = skills.reduce((total, skill) => {
      return total + (this.implementationHours[skill.level] || 160);
    }, 0);
    const months = Math.ceil(totalHours / 160);
    return `${months}ヶ月`;
  }

  private getPriorityEmoji(index: number): string {
    const emojis = ['🥇最優先', '🥈高', '🥉中', '📱中', '📊低'];
    return emojis[index] || '📊低';
  }

  private getBenefitLabel(key: string): string {
    const labels: { [key: string]: string } = {
      efficiency: '効率性',
      quality: '品質',
      cost: 'コスト削減',
      growth: '成長性',
      satisfaction: '満足度'
    };
    return labels[key] || key;
  }

  private estimateLabourSavings(report: AnalysisReport): number {
    // Estimate based on employee count and efficiency improvements
    const avgSalary = 4000000; // Average annual salary
    const efficiencyGain = 0.3; // 30% efficiency gain
    return Math.round(report.employees * avgSalary * efficiencyGain);
  }

  private estimateEfficiencySavings(report: AnalysisReport): number {
    // Additional efficiency savings beyond labor
    return Math.round(this.estimateLabourSavings(report) * 0.5);
  }

  private estimateOpportunitySavings(report: AnalysisReport): number {
    // Opportunity cost savings from new business
    return Math.round(this.estimateLabourSavings(report) * 0.3);
  }

  private calculateTotalSavings(report: AnalysisReport): number {
    return this.estimateLabourSavings(report) + 
           this.estimateEfficiencySavings(report) + 
           this.estimateOpportunitySavings(report);
  }

  private calculateROI(totalCost: number, report: AnalysisReport): number {
    const annualSavings = this.calculateTotalSavings(report);
    const monthlyROI = totalCost / (annualSavings / 12);
    return Math.ceil(monthlyROI);
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: generate-proposal <analysis-report-path> [output-path]

Example:
  generate-proposal ./data/miyagawa-skill-report.md
  generate-proposal ./data/miyagawa-skill-report.md ./output/proposal.md
`);
    process.exit(1);
  }

  const reportPath = args[0];
  const outputPath = args[1];

  if (!existsSync(reportPath)) {
    console.error(`❌ Error: Analysis report not found: ${reportPath}`);
    process.exit(1);
  }

  const generator = new ProposalGenerator();
  
  try {
    generator.generateProposal(reportPath, outputPath);
  } catch (error) {
    console.error('❌ Error generating proposal:', error);
    process.exit(1);
  }
}

export { ProposalGenerator };