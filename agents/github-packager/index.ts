/**
 * GitHub Packager Agent
 * スキルをGitHubプール投入可能な形式にパッケージング
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  Skill, 
  SkillPackage, 
  SkillMetadata,
  PackageOptions 
} from './models/types';
import { SkillMdGenerator } from './generators/skill-md-generator';
import { SkillYamlGenerator } from './generators/skill-yaml-generator';
import { ReadmeGenerator } from './generators/readme-generator';
import { ChangelogGenerator } from './generators/changelog-generator';

export interface GitHubPackagerConfig {
  outputDir?: string;
  includeExamples?: boolean;
  generateTests?: boolean;
  templateDir?: string;
  debug?: boolean;
}

export interface GitHubPackagerInput {
  skill: Skill;
  metadata: SkillMetadata;
  options?: PackageOptions;
}

export interface GitHubPackagerOutput {
  packagePath: string;
  structure: {
    files: string[];
    directories: string[];
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export class GitHubPackagerAgent {
  private skillMdGenerator: SkillMdGenerator;
  private yamlGenerator: SkillYamlGenerator;
  private readmeGenerator: ReadmeGenerator;
  private changelogGenerator: ChangelogGenerator;

  constructor(private config: GitHubPackagerConfig = {}) {
    this.skillMdGenerator = new SkillMdGenerator();
    this.yamlGenerator = new SkillYamlGenerator();
    this.readmeGenerator = new ReadmeGenerator();
    this.changelogGenerator = new ChangelogGenerator();
    
    // デフォルト設定
    this.config.outputDir = config.outputDir || './output/skills';
    this.config.includeExamples = config.includeExamples !== false;
  }

  /**
   * スキルのパッケージング実行
   */
  async execute(input: GitHubPackagerInput): Promise<GitHubPackagerOutput> {
    // スキルIDの生成（まだない場合）
    const skillId = input.skill.id || this.generateSkillId(input.skill.name);
    
    // パッケージディレクトリの作成
    const packagePath = await this.createPackageDirectory(skillId);
    
    // 各ファイルの生成
    const files = await this.generatePackageFiles(
      packagePath,
      input.skill,
      input.metadata,
      input.options
    );
    
    // ディレクトリ構造の作成
    const directories = await this.createSubDirectories(
      packagePath,
      input.options
    );
    
    // パッケージの検証
    const validation = await this.validatePackage(packagePath);
    
    return {
      packagePath,
      structure: {
        files,
        directories
      },
      validation
    };
  }

  /**
   * スキルIDの生成
   */
  private generateSkillId(skillName: string): string {
    return skillName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * パッケージディレクトリの作成
   */
  private async createPackageDirectory(skillId: string): Promise<string> {
    const packagePath = path.join(this.config.outputDir!, skillId);
    
    try {
      await fs.mkdir(packagePath, { recursive: true });
    } catch (error) {
      if (this.config.debug) {
        console.error(`Failed to create directory: ${packagePath}`, error);
      }
    }
    
    return packagePath;
  }

  /**
   * パッケージファイルの生成
   */
  private async generatePackageFiles(
    packagePath: string,
    skill: Skill,
    metadata: SkillMetadata,
    options?: PackageOptions
  ): Promise<string[]> {
    const files: string[] = [];
    
    // SKILL.md生成
    const skillMdContent = await this.skillMdGenerator.generate(skill, metadata);
    const skillMdPath = path.join(packagePath, 'SKILL.md');
    await fs.writeFile(skillMdPath, skillMdContent, 'utf8');
    files.push('SKILL.md');
    
    // skill.yaml生成
    const yamlContent = await this.yamlGenerator.generate(skill, metadata);
    const yamlPath = path.join(packagePath, 'skill.yaml');
    await fs.writeFile(yamlPath, yamlContent, 'utf8');
    files.push('skill.yaml');
    
    // README.md生成
    // ReadmeGeneratorはPackageOptionsを期待するので、optionsを渡す
    const readmeContent = await this.readmeGenerator.generate(skill, options);
    const readmePath = path.join(packagePath, 'README.md');
    await fs.writeFile(readmePath, readmeContent, 'utf8');
    files.push('README.md');
    
    // CHANGELOG.md生成
    const changelogContent = await this.changelogGenerator.generate(skill, metadata);
    const changelogPath = path.join(packagePath, 'CHANGELOG.md');
    await fs.writeFile(changelogPath, changelogContent, 'utf8');
    files.push('CHANGELOG.md');
    
    // LICENSE生成（必要な場合）
    if (metadata.license) {
      const licensePath = path.join(packagePath, 'LICENSE');
      await fs.writeFile(licensePath, this.generateLicense(metadata.license), 'utf8');
      files.push('LICENSE');
    }
    
    return files;
  }

  /**
   * サブディレクトリの作成
   */
  private async createSubDirectories(
    packagePath: string,
    options?: PackageOptions
  ): Promise<string[]> {
    const directories: string[] = [];
    
    // pages/ディレクトリ（ドキュメント用）
    if (options?.includeDocs) {
      const pagesPath = path.join(packagePath, 'pages');
      await fs.mkdir(pagesPath, { recursive: true });
      directories.push('pages/');
      
      // サンプルドキュメントの作成
      if (this.config.includeExamples) {
        await this.createSampleDocs(pagesPath);
      }
    }
    
    // scripts/ディレクトリ（実装スクリプト用）
    if (options?.includeScripts) {
      const scriptsPath = path.join(packagePath, 'scripts');
      await fs.mkdir(scriptsPath, { recursive: true });
      directories.push('scripts/');
      
      // サンプルスクリプトの作成
      if (this.config.includeExamples) {
        await this.createSampleScripts(scriptsPath);
      }
    }
    
    // tests/ディレクトリ（テスト用）
    if (this.config.generateTests) {
      const testsPath = path.join(packagePath, 'tests');
      await fs.mkdir(testsPath, { recursive: true });
      directories.push('tests/');
    }
    
    // examples/ディレクトリ（使用例用）
    if (this.config.includeExamples) {
      const examplesPath = path.join(packagePath, 'examples');
      await fs.mkdir(examplesPath, { recursive: true });
      directories.push('examples/');
    }
    
    return directories;
  }

  /**
   * パッケージの検証
   */
  private async validatePackage(packagePath: string): Promise<any> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 必須ファイルの確認
    const requiredFiles = ['SKILL.md', 'skill.yaml', 'README.md'];
    for (const file of requiredFiles) {
      const filePath = path.join(packagePath, file);
      try {
        await fs.access(filePath);
      } catch {
        errors.push(`Required file missing: ${file}`);
      }
    }
    
    // SKILL.mdの検証
    try {
      const skillMdContent = await fs.readFile(
        path.join(packagePath, 'SKILL.md'), 
        'utf8'
      );
      this.validateSkillMd(skillMdContent, errors, warnings);
    } catch {
      errors.push('Failed to read SKILL.md');
    }
    
    // skill.yamlの検証
    try {
      const yamlContent = await fs.readFile(
        path.join(packagePath, 'skill.yaml'), 
        'utf8'
      );
      this.validateSkillYaml(yamlContent, errors, warnings);
    } catch {
      errors.push('Failed to read skill.yaml');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * SKILL.mdの検証
   */
  private validateSkillMd(content: string, errors: string[], warnings: string[]) {
    // フロントマターの確認
    if (!content.startsWith('---')) {
      errors.push('SKILL.md must start with YAML frontmatter');
    }
    
    // 必須フィールドの確認
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      if (!frontmatter.includes('name:')) {
        errors.push('SKILL.md frontmatter must include "name" field');
      }
      if (!frontmatter.includes('description:')) {
        errors.push('SKILL.md frontmatter must include "description" field');
      }
    }
    
    // コンテンツの確認
    if (content.length < 500) {
      warnings.push('SKILL.md content seems too short');
    }
  }

  /**
   * skill.yamlの検証
   */
  private validateSkillYaml(content: string, errors: string[], warnings: string[]) {
    // YAML構文の基本チェック
    if (!content.includes('skill_id:')) {
      errors.push('skill.yaml must include "skill_id" field');
    }
    if (!content.includes('skill_name:')) {
      errors.push('skill.yaml must include "skill_name" field');
    }
    
    // 推奨フィールドの確認
    if (!content.includes('triggers:')) {
      warnings.push('skill.yaml should include "triggers" field');
    }
  }

  /**
   * サンプルドキュメントの作成
   */
  private async createSampleDocs(pagesPath: string): Promise<void> {
    const sampleDoc = `# スキル使用ガイド

このドキュメントでは、スキルの詳細な使用方法を説明します。

## 前提条件

- 必要な環境
- 必要な権限

## 使用手順

1. ステップ1
2. ステップ2
3. ステップ3

## トラブルシューティング

よくある問題と解決方法を記載します。
`;
    
    await fs.writeFile(path.join(pagesPath, 'guide.md'), sampleDoc, 'utf8');
  }

  /**
   * サンプルスクリプトの作成
   */
  private async createSampleScripts(scriptsPath: string): Promise<void> {
    const sampleScript = `#!/usr/bin/env python3
"""
スキル実装のサンプルスクリプト
"""

def main():
    print("Skill implementation example")
    # TODO: Implement actual skill logic

if __name__ == "__main__":
    main()
`;
    
    await fs.writeFile(path.join(scriptsPath, 'main.py'), sampleScript, 'utf8');
  }

  /**
   * ライセンスの生成
   */
  private generateLicense(licenseType: string): string {
    // 簡易的なライセンステキスト生成
    if (licenseType === 'MIT') {
      return `MIT License

Copyright (c) ${new Date().getFullYear()}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
    }
    
    return `Copyright (c) ${new Date().getFullYear()}. All rights reserved.`;
  }
}