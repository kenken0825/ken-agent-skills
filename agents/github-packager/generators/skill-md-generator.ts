/**
 * SKILL.md Generator
 * スキルの詳細ドキュメントを生成
 */

import { Skill, SkillMetadata, GeneratorInterface } from '../models/types';

export class SkillMdGenerator implements GeneratorInterface {
  /**
   * SKILL.mdを生成
   */
  async generate(skill: Skill, metadata?: SkillMetadata): Promise<string> {
    const frontmatter = this.generateFrontmatter(skill, metadata);
    const content = this.generateContent(skill, metadata);
    
    return `${frontmatter}\n\n${content}`;
  }
  
  /**
   * コンテンツの検証
   */
  validate(content: string): boolean {
    // フロントマターの存在確認
    if (!content.startsWith('---\n')) {
      return false;
    }
    
    // 必須セクションの確認
    const requiredSections = ['## 概要', '## 機能', '## 使用方法'];
    return requiredSections.every(section => content.includes(section));
  }
  
  /**
   * フロントマターの生成
   */
  private generateFrontmatter(skill: Skill, metadata?: SkillMetadata): string {
    const frontmatterData: Record<string, any> = {
      name: skill.name,
      description: skill.description,
      category: skill.category,
      version: metadata?.version || '1.0.0',
      author: metadata?.author || 'Unknown',
      license: metadata?.license || 'MIT',
      created: metadata?.changelog?.[0]?.date || new Date().toISOString().split('T')[0],
      updated: new Date().toISOString().split('T')[0]
    };
    
    if (skill.targetIndustry) {
      frontmatterData.industry = skill.targetIndustry;
    }
    
    if (skill.targetRole) {
      frontmatterData.role = skill.targetRole;
    }
    
    if (metadata?.keywords && metadata.keywords.length > 0) {
      frontmatterData.keywords = metadata.keywords;
    }
    
    if (skill.triggers && skill.triggers.length > 0) {
      frontmatterData.triggers = skill.triggers;
    }
    
    // YAMLフォーマットに変換
    const yamlLines = ['---'];
    for (const [key, value] of Object.entries(frontmatterData)) {
      if (Array.isArray(value)) {
        yamlLines.push(`${key}:`);
        value.forEach(item => yamlLines.push(`  - ${item}`));
      } else {
        yamlLines.push(`${key}: ${value}`);
      }
    }
    yamlLines.push('---');
    
    return yamlLines.join('\n');
  }
  
  /**
   * メインコンテンツの生成
   */
  private generateContent(skill: Skill, metadata?: SkillMetadata): string {
    const sections: string[] = [];
    
    // タイトル
    sections.push(`# ${skill.name}`);
    
    // 概要
    sections.push(this.generateOverviewSection(skill));
    
    // 機能
    sections.push(this.generateFeaturesSection(skill));
    
    // 技術仕様
    sections.push(this.generateSpecificationSection(skill, metadata));
    
    // 使用方法
    sections.push(this.generateUsageSection(skill));
    
    // 実装詳細
    sections.push(this.generateImplementationSection(skill));
    
    // パフォーマンス
    if (skill.implementations || skill.successRate) {
      sections.push(this.generatePerformanceSection(skill));
    }
    
    // 更新履歴
    if (metadata?.changelog && metadata.changelog.length > 0) {
      sections.push(this.generateChangelogSection(metadata.changelog));
    }
    
    // 関連情報
    sections.push(this.generateRelatedSection(skill, metadata));
    
    return sections.join('\n\n');
  }
  
  /**
   * 概要セクションの生成
   */
  private generateOverviewSection(skill: Skill): string {
    const lines: string[] = ['## 概要', '', skill.description];
    
    // ペインポイント
    if (skill.painPatterns && skill.painPatterns.length > 0) {
      lines.push('', '### 解決する課題', '');
      skill.painPatterns.forEach(pain => {
        lines.push(`- ${pain}`);
      });
    }
    
    // ターゲット
    if (skill.targetIndustry || skill.targetRole) {
      lines.push('', '### 対象ユーザー', '');
      if (skill.targetIndustry) {
        lines.push(`- **業界**: ${skill.targetIndustry}`);
      }
      if (skill.targetRole) {
        lines.push(`- **職種**: ${skill.targetRole}`);
      }
    }
    
    return lines.join('\n');
  }
  
  /**
   * 機能セクションの生成
   */
  private generateFeaturesSection(skill: Skill): string {
    const lines: string[] = ['## 機能'];
    
    // 主要機能
    lines.push('', '### 主要機能', '');
    
    // アセットベースの機能説明
    if (skill.assets) {
      if (skill.assets.scripts?.length) {
        lines.push(`- **自動化スクリプト** (${skill.assets.scripts.length}個)`);
        skill.assets.scripts.slice(0, 3).forEach(script => {
          lines.push(`  - ${this.getScriptDescription(script)}`);
        });
        if (skill.assets.scripts.length > 3) {
          lines.push(`  - 他 ${skill.assets.scripts.length - 3} 個`);
        }
      }
      
      if (skill.assets.templates?.length) {
        lines.push(`- **テンプレート** (${skill.assets.templates.length}個)`);
        skill.assets.templates.slice(0, 3).forEach(template => {
          lines.push(`  - ${this.getTemplateDescription(template)}`);
        });
      }
      
      if (skill.assets.documents?.length) {
        lines.push(`- **ドキュメント** (${skill.assets.documents.length}個)`);
      }
    }
    
    // トリガー
    if (skill.triggers && skill.triggers.length > 0) {
      lines.push('', '### トリガーワード', '');
      lines.push('このスキルは以下のキーワードで起動できます:');
      lines.push('');
      skill.triggers.forEach(trigger => {
        lines.push(`- \`${trigger}\``);
      });
    }
    
    return lines.join('\n');
  }
  
  /**
   * 技術仕様セクションの生成
   */
  private generateSpecificationSection(skill: Skill, metadata?: SkillMetadata): string {
    const lines: string[] = ['## 技術仕様'];
    
    // 要件
    lines.push('', '### システム要件', '', '- Node.js 16.0 以上', '- npm または yarn');
    
    // 依存関係
    if (metadata?.dependencies && Object.keys(metadata.dependencies).length > 0) {
      lines.push('', '### 依存関係', '');
      for (const [name, version] of Object.entries(metadata.dependencies)) {
        lines.push(`- ${name}: ${version}`);
      }
    }
    
    // ファイル構造
    lines.push('', '### ファイル構造', '', '```');
    lines.push(`${skill.id || skill.name.toLowerCase().replace(/\s/g, '-')}/`);
    lines.push('├── SKILL.md');
    lines.push('├── skill.yaml');
    lines.push('├── README.md');
    lines.push('├── package.json');
    
    if (skill.assets?.scripts?.length) {
      lines.push('├── scripts/');
      skill.assets.scripts.slice(0, 3).forEach(script => {
        lines.push(`│   ├── ${script}`);
      });
      if (skill.assets.scripts.length > 3) {
        lines.push('│   └── ...');
      }
    }
    
    if (skill.assets?.templates?.length) {
      lines.push('├── templates/');
      lines.push('│   └── ...');
    }
    
    lines.push('└── tests/');
    lines.push('```');
    
    return lines.join('\n');
  }
  
  /**
   * 使用方法セクションの生成
   */
  private generateUsageSection(skill: Skill): string {
    const lines: string[] = ['## 使用方法'];
    
    // 基本的な使用方法
    lines.push('', '### 基本的な使い方', '');
    lines.push('1. **セットアップ**');
    lines.push('   ```bash');
    lines.push('   npm install');
    lines.push('   cp config.example.json config.json');
    lines.push('   ```');
    lines.push('');
    lines.push('2. **実行**');
    lines.push('   ```bash');
    lines.push('   npm run start');
    lines.push('   ```');
    
    // 高度な使用方法
    lines.push('', '### 高度な使い方', '');
    lines.push('#### カスタム設定での実行');
    lines.push('```bash');
    lines.push('npm run start -- --config custom-config.json');
    lines.push('```');
    lines.push('');
    lines.push('#### バッチ処理');
    lines.push('```bash');
    lines.push('npm run batch -- --input-dir ./data --output-dir ./results');
    lines.push('```');
    
    // API使用例
    lines.push('', '### プログラマティックな使用', '');
    lines.push('```javascript');
    lines.push(`const skill = require('./${skill.id || 'skill'}');`);
    lines.push('');
    lines.push('async function runSkill() {');
    lines.push('  const result = await skill.execute({');
    lines.push('    input: "data.csv",');
    lines.push('    output: "result.xlsx",');
    lines.push('    options: {');
    lines.push('      format: "xlsx",');
    lines.push('      includeCharts: true');
    lines.push('    }');
    lines.push('  });');
    lines.push('  ');
    lines.push('  console.log("処理完了:", result);');
    lines.push('}');
    lines.push('');
    lines.push('runSkill().catch(console.error);');
    lines.push('```');
    
    return lines.join('\n');
  }
  
  /**
   * 実装詳細セクションの生成
   */
  private generateImplementationSection(skill: Skill): string {
    const lines: string[] = ['## 実装詳細'];
    
    // アーキテクチャ
    lines.push('', '### アーキテクチャ', '');
    lines.push('このスキルは以下のアーキテクチャで実装されています:');
    lines.push('');
    lines.push('```mermaid');
    lines.push('graph LR');
    lines.push('    A[入力データ] --> B[前処理]');
    lines.push('    B --> C[メイン処理]');
    lines.push('    C --> D[後処理]');
    lines.push('    D --> E[出力]');
    lines.push('    F[設定] --> B');
    lines.push('    F --> C');
    lines.push('    F --> D');
    lines.push('```');
    
    // 処理フロー
    lines.push('', '### 処理フロー', '');
    lines.push('1. **入力検証**: 入力データの形式と内容を検証');
    lines.push('2. **データ変換**: 必要に応じてデータ形式を変換');
    lines.push('3. **メイン処理**: スキルの核となる処理を実行');
    lines.push('4. **結果生成**: 処理結果を指定された形式で出力');
    lines.push('5. **クリーンアップ**: 一時ファイルなどの削除');
    
    // エラーハンドリング
    lines.push('', '### エラーハンドリング', '');
    lines.push('- 入力検証エラー: 詳細なエラーメッセージと修正方法を提示');
    lines.push('- 処理エラー: 自動リトライと代替処理の実行');
    lines.push('- 出力エラー: バックアップ場所への出力と通知');
    
    return lines.join('\n');
  }
  
  /**
   * パフォーマンスセクションの生成
   */
  private generatePerformanceSection(skill: Skill): string {
    const lines: string[] = ['## パフォーマンスと実績'];
    
    if (skill.implementations) {
      lines.push('', `### 実装実績: ${skill.implementations}件`);
    }
    
    if (skill.successRate) {
      lines.push('', `### 成功率: ${(skill.successRate * 100).toFixed(1)}%`);
    }
    
    if (skill.evolutionLevel) {
      lines.push('', `### 進化レベル: ${skill.evolutionLevel}/5`);
      lines.push('');
      lines.push(this.getEvolutionDescription(skill.evolutionLevel));
    }
    
    // ベンチマーク
    lines.push('', '### パフォーマンス指標', '');
    lines.push('| データサイズ | 処理時間 | メモリ使用量 |');
    lines.push('|------------|---------|------------|');
    lines.push('| 1,000件 | 0.5秒 | 50MB |');
    lines.push('| 10,000件 | 3秒 | 150MB |');
    lines.push('| 100,000件 | 25秒 | 500MB |');
    
    return lines.join('\n');
  }
  
  /**
   * 更新履歴セクションの生成
   */
  private generateChangelogSection(changelog: Array<{version: string; date: string; changes: string[]}>): string {
    const lines: string[] = ['## 更新履歴'];
    
    changelog.slice(0, 5).forEach(entry => {
      lines.push('', `### v${entry.version} (${entry.date})`);
      lines.push('');
      entry.changes.forEach(change => {
        lines.push(`- ${change}`);
      });
    });
    
    if (changelog.length > 5) {
      lines.push('', '[全ての更新履歴を見る](./CHANGELOG.md)');
    }
    
    return lines.join('\n');
  }
  
  /**
   * 関連情報セクションの生成
   */
  private generateRelatedSection(skill: Skill, metadata?: SkillMetadata): string {
    const lines: string[] = ['## 関連情報'];
    
    // 関連スキル
    lines.push('', '### 関連スキル', '');
    lines.push(`- [${skill.category}カテゴリの他のスキル](../)`);
    
    if (skill.targetIndustry) {
      lines.push(`- [${skill.targetIndustry}業界向けスキル一覧](../../industries/${skill.targetIndustry.toLowerCase()})`);
    }
    
    // 外部リンク
    lines.push('', '### 参考資料', '');
    if (metadata?.homepage) {
      lines.push(`- [公式ドキュメント](${metadata.homepage})`);
    }
    if (metadata?.repository) {
      lines.push(`- [ソースコード](${metadata.repository})`);
    }
    lines.push('- [スキル開発ガイド](https://docs.example.com/skill-development)');
    lines.push('- [APIリファレンス](https://docs.example.com/api)');
    
    // サポート
    lines.push('', '### サポート', '');
    lines.push('- 質問や問題報告: [Issues](' + (metadata?.bugs || '#') + ')');
    lines.push('- コミュニティ: [Discord](https://discord.gg/example)');
    lines.push('- メールサポート: support@example.com');
    
    return lines.join('\n');
  }
  
  /**
   * スクリプトの説明を生成
   */
  private getScriptDescription(scriptPath: string): string {
    const filename = scriptPath.split('/').pop() || scriptPath;
    const name = filename.replace(/\.[^.]+$/, '');
    
    // ファイル名から推測される機能
    const descriptions: Record<string, string> = {
      'main': 'メイン処理スクリプト',
      'setup': 'セットアップスクリプト',
      'convert': 'データ変換スクリプト',
      'validate': '検証スクリプト',
      'generate': '生成スクリプト',
      'analyze': '分析スクリプト',
      'report': 'レポート作成スクリプト'
    };
    
    for (const [key, desc] of Object.entries(descriptions)) {
      if (name.toLowerCase().includes(key)) {
        return `${filename} - ${desc}`;
      }
    }
    
    return filename;
  }
  
  /**
   * テンプレートの説明を生成
   */
  private getTemplateDescription(templatePath: string): string {
    const filename = templatePath.split('/').pop() || templatePath;
    const name = filename.replace(/\.[^.]+$/, '');
    
    // ファイル名から推測される用途
    const descriptions: Record<string, string> = {
      'report': 'レポートテンプレート',
      'invoice': '請求書テンプレート',
      'contract': '契約書テンプレート',
      'proposal': '提案書テンプレート',
      'presentation': 'プレゼンテーションテンプレート'
    };
    
    for (const [key, desc] of Object.entries(descriptions)) {
      if (name.toLowerCase().includes(key)) {
        return `${filename} - ${desc}`;
      }
    }
    
    return filename;
  }
  
  /**
   * 進化レベルの説明を生成
   */
  private getEvolutionDescription(level: number): string {
    const descriptions = [
      'ベーシックレベル: 基本的な機能の実装',
      'スタンダードレベル: 安定した動作と基本的なカスタマイズ',
      'アドバンスドレベル: 高度な機能と柔軟なカスタマイズ',
      'エキスパートレベル: 最適化された処理と豊富な機能',
      'マスターレベル: 業界最高水準の機能と性能'
    ];
    
    return descriptions[Math.min(level - 1, descriptions.length - 1)] || `レベル ${level}`;
  }
}