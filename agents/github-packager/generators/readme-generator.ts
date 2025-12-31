/**
 * README Generator
 * スキル用のユーザーフレンドリーなREADME.mdを生成
 */

import { Skill, PackageOptions, SkillMetadata, GeneratorInterface } from '../models/types';

export class ReadmeGenerator implements GeneratorInterface {
  /**
   * README.mdを生成
   */
  async generate(skill: Skill, optionsOrMetadata?: any): Promise<string> {
    // optionsOrMetadataがPackageOptionsの場合とSkillMetadataの場合を処理
    const options = this.isPackageOptions(optionsOrMetadata) ? optionsOrMetadata as PackageOptions : undefined;
    const metadata = this.isSkillMetadata(optionsOrMetadata) ? optionsOrMetadata as SkillMetadata : undefined;
    
    const sections: string[] = [];
    
    // ヘッダー
    sections.push(this.generateHeader(skill));
    
    // バッジセクション
    if (metadata) {
      sections.push(this.generateBadges(skill, metadata));
    }
    
    // 概要
    sections.push(this.generateOverview(skill, options));
    
    // 目次
    sections.push(this.generateTableOfContents(options));
    
    // 特徴
    sections.push(this.generateFeatures(skill, options));
    
    // インストール/セットアップ
    sections.push(this.generateInstallation(skill, metadata));
    
    // 使用方法
    sections.push(this.generateUsage(skill, options));
    
    // 設定
    sections.push(this.generateConfiguration(skill));
    
    // 例
    if (options?.includeExamples !== false) {
      sections.push(this.generateExamples(skill, options));
    }
    
    // API/スクリプトドキュメント
    if (options?.includeScripts) {
      sections.push(this.generateApiDocs(skill));
    }
    
    // トラブルシューティング
    sections.push(this.generateTroubleshooting(skill));
    
    // 貢献ガイド
    sections.push(this.generateContributing());
    
    // ライセンス
    if (metadata?.license) {
      sections.push(this.generateLicense(metadata.license));
    }
    
    // リンク集
    sections.push(this.generateLinks(skill, metadata));
    
    return sections.filter(Boolean).join('\n\n');
  }
  
  /**
   * コンテンツの検証
   */
  validate(content: string): boolean {
    // 最低限必要なセクションの確認
    const requiredSections = ['#', '## 概要', '## 使用方法'];
    return requiredSections.every(section => content.includes(section));
  }
  
  /**
   * ヘッダーセクションの生成
   */
  private generateHeader(skill: Skill): string {
    return `# ${skill.name}

${skill.description}`;
  }
  
  /**
   * バッジセクションの生成
   */
  private generateBadges(skill: Skill, metadata: SkillMetadata): string {
    const badges: string[] = [];
    
    // バージョンバッジ
    if (metadata.version) {
      badges.push(`![Version](https://img.shields.io/badge/version-${metadata.version}-blue)`);
    }
    
    // ライセンスバッジ
    if (metadata.license) {
      badges.push(`![License](https://img.shields.io/badge/license-${metadata.license}-green)`);
    }
    
    // カテゴリバッジ
    if (skill.category) {
      badges.push(`![Category](https://img.shields.io/badge/category-${skill.category.replace(/\s/g, '_')}-orange)`);
    }
    
    // 業界バッジ
    if (skill.targetIndustry) {
      badges.push(`![Industry](https://img.shields.io/badge/industry-${skill.targetIndustry.replace(/\s/g, '_')}-purple)`);
    }
    
    return badges.length > 0 ? badges.join(' ') : '';
  }
  
  /**
   * 概要セクションの生成
   */
  private generateOverview(skill: Skill, options?: PackageOptions): string {
    const lang = options?.language || 'ja';
    
    const sections = [`## ${lang === 'ja' ? '概要' : 'Overview'}

${skill.description}`];
    
    // ターゲット情報
    if (skill.targetIndustry || skill.targetRole) {
      sections.push(`### ${lang === 'ja' ? '対象' : 'Target Users'}

${skill.targetIndustry ? `- **業界**: ${skill.targetIndustry}` : ''}
${skill.targetRole ? `- **職種**: ${skill.targetRole}` : ''}`);
    }
    
    // トリガーワード
    if (skill.triggers && skill.triggers.length > 0) {
      sections.push(`### ${lang === 'ja' ? 'トリガーワード' : 'Trigger Words'}

このスキルは以下のようなキーワードで起動されます:

${skill.triggers.map(trigger => `- ${trigger}`).join('\n')}`);
    }
    
    // ペインポイント
    if (skill.painPatterns && skill.painPatterns.length > 0) {
      sections.push(`### ${lang === 'ja' ? '解決する課題' : 'Problems Solved'}

${skill.painPatterns.map(pain => `- ${pain}`).join('\n')}`);
    }
    
    return sections.join('\n\n');
  }
  
  /**
   * 目次の生成
   */
  private generateTableOfContents(options?: PackageOptions): string {
    const lang = options?.language || 'ja';
    const items = [
      lang === 'ja' ? '概要' : 'Overview',
      lang === 'ja' ? '特徴' : 'Features',
      lang === 'ja' ? 'インストール' : 'Installation',
      lang === 'ja' ? '使用方法' : 'Usage',
      lang === 'ja' ? '設定' : 'Configuration'
    ];
    
    if (options?.includeExamples !== false) {
      items.push(lang === 'ja' ? '使用例' : 'Examples');
    }
    
    if (options?.includeScripts) {
      items.push(lang === 'ja' ? 'API ドキュメント' : 'API Documentation');
    }
    
    items.push(
      lang === 'ja' ? 'トラブルシューティング' : 'Troubleshooting',
      lang === 'ja' ? '貢献方法' : 'Contributing'
    );
    
    return `## ${lang === 'ja' ? '目次' : 'Table of Contents'}

${items.map(item => `- [${item}](#${item.toLowerCase().replace(/\s/g, '-')})`).join('\n')}`;
  }
  
  /**
   * 特徴セクションの生成
   */
  private generateFeatures(skill: Skill, options?: PackageOptions): string {
    const lang = options?.language || 'ja';
    const features: string[] = [];
    
    // 基本機能
    if (skill.description) {
      features.push(`✨ ${skill.description}`);
    }
    
    // アセット情報
    if (skill.assets?.scripts?.length) {
      features.push(`🛠 ${skill.assets.scripts.length}個の自動化スクリプト`);
    }
    
    if (skill.assets?.templates?.length) {
      features.push(`📄 ${skill.assets.templates.length}個のテンプレート`);
    }
    
    if (skill.assets?.documents?.length) {
      features.push(`📚 ${skill.assets.documents.length}個のドキュメント`);
    }
    
    // メトリクス
    if (skill.implementations) {
      features.push(`📊 ${skill.implementations}件の実装実績`);
    }
    
    if (skill.successRate) {
      features.push(`✅ ${(skill.successRate * 100).toFixed(0)}%の成功率`);
    }
    
    // 進化レベル
    if (skill.evolutionLevel) {
      const levelText = this.getEvolutionLevelText(skill.evolutionLevel);
      features.push(`📈 進化レベル: ${levelText}`);
    }
    
    return `## ${lang === 'ja' ? '特徴' : 'Features'}

${features.length > 0 ? features.join('\n') : '- 効率的な業務自動化\n- 簡単な設定とカスタマイズ\n- 柔軟な拡張性'}`;
  }
  
  /**
   * インストールセクションの生成
   */
  private generateInstallation(skill: Skill, metadata?: SkillMetadata): string {
    const sections: string[] = ['## インストール'];
    
    // 前提条件
    sections.push(`### 前提条件

- Node.js 16.0以上
- npm または yarn`);
    
    if (metadata?.dependencies && Object.keys(metadata.dependencies).length > 0) {
      sections.push(`- 依存関係:
${Object.entries(metadata.dependencies)
  .map(([name, version]) => `  - ${name}: ${version}`)
  .join('\n')}`);
    }
    
    // インストール手順
    sections.push(`### インストール手順

1. リポジトリのクローン
\`\`\`bash
git clone ${metadata?.repository || 'https://github.com/your-repo/skill-name.git'}
cd ${skill.id || skill.name.toLowerCase().replace(/\s/g, '-')}
\`\`\`

2. 依存関係のインストール
\`\`\`bash
npm install
# または
yarn install
\`\`\`

3. 設定ファイルの準備
\`\`\`bash
cp config.example.json config.json
# 必要に応じて config.json を編集
\`\`\``);
    
    return sections.join('\n\n');
  }
  
  /**
   * 使用方法セクションの生成
   */
  private generateUsage(skill: Skill, options?: PackageOptions): string {
    const lang = options?.language || 'ja';
    
    return `## ${lang === 'ja' ? '使用方法' : 'Usage'}

### 基本的な使い方

1. **スキルの起動**
   \`\`\`bash
   npm run start
   # または
   node scripts/main.js
   \`\`\`

2. **パラメータの指定**
   \`\`\`bash
   npm run start -- --input data.csv --output result.xlsx
   \`\`\`

3. **バッチ処理**
   \`\`\`bash
   npm run batch -- --files "*.csv" --output-dir ./results
   \`\`\`

### コマンドラインオプション

| オプション | 説明 | デフォルト |
|----------|------|----------|
| \`--input\` | 入力ファイルパス | - |
| \`--output\` | 出力ファイルパス | ./output |
| \`--format\` | 出力フォーマット | xlsx |
| \`--verbose\` | 詳細ログの表示 | false |
| \`--help\` | ヘルプの表示 | - |`;
  }
  
  /**
   * 設定セクションの生成
   */
  private generateConfiguration(skill: Skill): string {
    return `## 設定

### 設定ファイル (config.json)

\`\`\`json
{
  "general": {
    "language": "ja",
    "timezone": "Asia/Tokyo",
    "logLevel": "info"
  },
  "skill": {
    "autoSave": true,
    "backupEnabled": true,
    "maxRetries": 3
  },
  "output": {
    "format": "xlsx",
    "encoding": "utf-8",
    "includeTimestamp": true
  }
}
\`\`\`

### 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| \`API_KEY\` | APIアクセスキー | ○ |
| \`API_SECRET\` | APIシークレットキー | ○ |
| \`LOG_LEVEL\` | ログレベル (debug/info/warn/error) | - |
| \`TEMP_DIR\` | 一時ファイルディレクトリ | - |`;
  }
  
  /**
   * 使用例セクションの生成
   */
  private generateExamples(skill: Skill, options?: PackageOptions): string {
    const lang = options?.language || 'ja';
    const examples: string[] = [];
    
    // 基本的な例
    examples.push(`### 例1: 基本的な使用

\`\`\`javascript
const skill = require('./${skill.id || 'skill'}');

// スキルの実行
skill.execute({
  input: 'data.csv',
  output: 'result.xlsx'
}).then(result => {
  console.log('処理完了:', result);
}).catch(error => {
  console.error('エラー:', error);
});
\`\`\``);
    
    // 高度な例
    examples.push(`### 例2: カスタム設定での使用

\`\`\`javascript
const skill = require('./${skill.id || 'skill'}');

// カスタム設定
const config = {
  format: 'pdf',
  template: 'custom-template.xlsx',
  options: {
    includeCharts: true,
    autoFormat: true
  }
};

// バッチ処理
const files = ['file1.csv', 'file2.csv', 'file3.csv'];

Promise.all(files.map(file => 
  skill.execute({
    input: file,
    output: file.replace('.csv', '_result.pdf'),
    config: config
  })
)).then(results => {
  console.log('すべての処理が完了しました');
}).catch(error => {
  console.error('バッチ処理エラー:', error);
});
\`\`\``);
    
    // Python例（もしPythonスクリプトがある場合）
    if (skill.assets?.scripts?.some(s => s.endsWith('.py'))) {
      examples.push(`### 例3: Pythonでの使用

\`\`\`python
import sys
sys.path.append('./scripts')
from main import SkillProcessor

# インスタンスの作成
processor = SkillProcessor()

# データの処理
result = processor.process(
    input_file='data.csv',
    output_file='result.xlsx',
    options={
        'format': 'xlsx',
        'include_summary': True
    }
)

print(f"処理結果: {result}")
\`\`\``);
    }
    
    return `## ${lang === 'ja' ? '使用例' : 'Examples'}

${examples.join('\n\n')}`;
  }
  
  /**
   * APIドキュメントセクションの生成
   */
  private generateApiDocs(skill: Skill): string {
    return `## API ドキュメント

### SkillProcessor クラス

#### constructor(config?: Config)
スキルプロセッサーのインスタンスを作成します。

**パラメータ:**
- \`config\` (オプション): 設定オブジェクト

#### execute(options: ExecuteOptions): Promise<Result>
スキルを実行します。

**パラメータ:**
- \`options.input\`: 入力ファイルまたはデータ
- \`options.output\`: 出力先パス
- \`options.format\`: 出力フォーマット（デフォルト: 'xlsx'）

**戻り値:**
処理結果を含むPromise

#### validate(data: any): ValidationResult
入力データの検証を行います。

**パラメータ:**
- \`data\`: 検証対象のデータ

**戻り値:**
検証結果オブジェクト

### ユーティリティ関数

#### formatData(data: any[], template?: string): FormattedData
データを指定されたテンプレートに従ってフォーマットします。

#### generateReport(results: Result[]): Report
複数の処理結果からレポートを生成します。`;
  }
  
  /**
   * トラブルシューティングセクションの生成
   */
  private generateTroubleshooting(skill: Skill): string {
    return `## トラブルシューティング

### よくある問題と解決方法

#### 1. インストールエラー
**問題**: \`npm install\` が失敗する
**解決方法**:
- Node.jsのバージョンを確認してください（16.0以上が必要）
- \`npm cache clean --force\` を実行してキャッシュをクリア
- 管理者権限で実行してみてください

#### 2. 実行時エラー
**問題**: "Module not found" エラー
**解決方法**:
- \`npm install\` を再度実行
- \`node_modules\` フォルダを削除して再インストール

#### 3. 出力ファイルが生成されない
**問題**: 処理は完了するが出力ファイルが見つからない
**解決方法**:
- 出力ディレクトリの書き込み権限を確認
- 絶対パスで出力先を指定してみてください
- ログファイルでエラーメッセージを確認

#### 4. メモリ不足エラー
**問題**: 大きなファイルの処理でメモリエラーが発生
**解決方法**:
- Node.jsのメモリ制限を増やす: \`node --max-old-space-size=4096 scripts/main.js\`
- バッチサイズを小さくする
- ストリーミング処理モードを使用する

### デバッグモード

詳細なデバッグ情報を取得するには:

\`\`\`bash
# 環境変数でデバッグモードを有効化
export DEBUG=true
npm run start

# またはコマンドラインオプションで指定
npm run start -- --debug
\`\`\`

### ログファイル

ログは以下の場所に保存されます:
- 通常ログ: \`./logs/app.log\`
- エラーログ: \`./logs/error.log\`
- デバッグログ: \`./logs/debug.log\` (デバッグモード時のみ)`;
  }
  
  /**
   * 貢献ガイドセクションの生成
   */
  private generateContributing(): string {
    return `## 貢献方法

このプロジェクトへの貢献を歓迎します！

### 貢献の手順

1. このリポジトリをフォーク
2. 機能ブランチを作成 (\`git checkout -b feature/amazing-feature\`)
3. 変更をコミット (\`git commit -m 'Add some amazing feature'\`)
4. ブランチにプッシュ (\`git push origin feature/amazing-feature\`)
5. プルリクエストを作成

### 開発ガイドライン

- コードスタイルガイドに従ってください
- 適切なテストを追加してください
- ドキュメントを更新してください
- コミットメッセージは明確に記述してください

### バグ報告

バグを見つけた場合は、以下の情報を含めてIssueを作成してください:

- バグの詳細な説明
- 再現手順
- 期待される動作
- 実際の動作
- 環境情報（OS、Node.jsバージョンなど）`;
  }
  
  /**
   * ライセンスセクションの生成
   */
  private generateLicense(license: string): string {
    return `## ライセンス

このプロジェクトは ${license} ライセンスの下で公開されています。詳細は [LICENSE](./LICENSE) ファイルを参照してください。`;
  }
  
  /**
   * リンク集セクションの生成
   */
  private generateLinks(skill: Skill, metadata?: SkillMetadata): string {
    const links: string[] = [];
    
    if (metadata?.repository) {
      links.push(`- [GitHubリポジトリ](${metadata.repository})`);
    }
    
    if (metadata?.homepage) {
      links.push(`- [ホームページ](${metadata.homepage})`);
    }
    
    if (metadata?.bugs) {
      links.push(`- [バグ報告](${metadata.bugs})`);
    }
    
    // スキル関連のリンク
    links.push('- [スキルカタログ](https://github.com/your-org/skill-catalog)');
    links.push('- [開発者ドキュメント](https://docs.your-org.com/skills)');
    
    return links.length > 0 ? `## 関連リンク

${links.join('\n')}` : '';
  }
  
  /**
   * 進化レベルのテキスト変換
   */
  private getEvolutionLevelText(level: number): string {
    const levels = [
      'ベーシック',
      'スタンダード',
      'アドバンスド',
      'エキスパート',
      'マスター'
    ];
    return levels[Math.min(level - 1, levels.length - 1)] || `レベル ${level}`;
  }
  
  /**
   * 型ガード: PackageOptions判定
   */
  private isPackageOptions(obj: any): obj is PackageOptions {
    return obj && (
      'includeChangelog' in obj ||
      'includeExamples' in obj ||
      'includeDocs' in obj ||
      'includeScripts' in obj ||
      'includeTests' in obj ||
      'language' in obj
    );
  }
  
  /**
   * 型ガード: SkillMetadata判定
   */
  private isSkillMetadata(obj: any): obj is SkillMetadata {
    return obj && (
      'version' in obj ||
      'author' in obj ||
      'license' in obj ||
      'repository' in obj
    );
  }
}