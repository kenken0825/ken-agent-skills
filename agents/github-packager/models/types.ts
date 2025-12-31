/**
 * GitHub Packager Agent - 型定義
 */

import { Skill } from '../../skill-recommender/models/types';

/**
 * パッケージタイプ
 */
export type PackageType = 'basic' | 'advanced' | 'enterprise';

/**
 * パッケージ構成
 */
export interface PackageStructure {
  type: PackageType;
  files: PackageFile[];
  directories: string[];
  metadata: PackageMetadata;
}

/**
 * パッケージファイル
 */
export interface PackageFile {
  path: string;
  content: string;
  type: 'markdown' | 'yaml' | 'json' | 'script' | 'template';
  encoding?: string;
}

/**
 * パッケージメタデータ
 */
export interface PackageMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  tags?: string[];
  created?: Date;
  updated?: Date;
}

/**
 * GitHubリポジトリ設定
 */
export interface GitHubRepoConfig {
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
}

/**
 * パッケージテンプレート
 */
export interface PackageTemplate {
  id: string;
  name: string;
  description: string;
  structure: {
    directories: string[];
    files: Array<{
      path: string;
      template: string;
    }>;
  };
}

/**
 * 生成オプション
 */
export interface GenerationOptions {
  includeChangelog?: boolean;
  includeExamples?: boolean;
  includeDocs?: boolean;
  includeTests?: boolean;
  language?: 'ja' | 'en';
}

/**
 * フォーマッター設定
 */
export interface FormatterConfig {
  markdown?: {
    lineWidth?: number;
    headingStyle?: 'atx' | 'setext';
  };
  yaml?: {
    indent?: number;
    flowLevel?: number;
  };
}

/**
 * ジェネレーターインターフェース
 */
export interface GeneratorInterface {
  generate(skill: Skill, options?: GenerationOptions): Promise<string>;
  validate(content: string): boolean;
}

/**
 * フォーマッターインターフェース
 */
export interface FormatterInterface {
  format(content: string, config?: FormatterConfig): string;
  validate(content: string): boolean;
}

/**
 * パッケージビルダーインターフェース
 */
export interface PackageBuilderInterface {
  build(skill: Skill, template: PackageTemplate): Promise<PackageStructure>;
  validate(structure: PackageStructure): boolean;
}

// Config型のエクスポート
export interface GitHubPackagerConfig {
  defaultTemplate?: string;
  outputPath?: string;
  generateOptions?: GenerationOptions;
  formatterConfig?: FormatterConfig;
  debug?: boolean;
}

// 追加の型定義
export interface SkillMetadata {
  version: string;
  author?: string;
  license?: string;
  repository?: string;
  homepage?: string;
  bugs?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  changelog?: Array<{
    version: string;
    date: string;
    changes: string[];
  }>;
}

export interface PackageOptions {
  includeChangelog?: boolean;
  includeExamples?: boolean;
  includeDocs?: boolean;
  includeScripts?: boolean;
  includeTests?: boolean;
  language?: 'ja' | 'en';
}

export interface SkillPackage {
  skill: Skill;
  metadata: SkillMetadata;
  structure: PackageStructure;
}

// Input/Output型のエクスポート
export interface GitHubPackagerInput {
  skill: Skill;
  packageType?: PackageType;
  template?: string;
  options?: {
    includeChangelog?: boolean;
    includeExamples?: boolean;
    language?: 'ja' | 'en';
  };
}

export interface GitHubPackagerOutput {
  package: {
    structure: PackageStructure;
    mainFile: string;
    supportFiles: string[];
  };
  repository: {
    suggested: GitHubRepoConfig;
    structure: string;
  };
  artifacts: {
    'SKILL.md': string;
    'skill.yaml': string;
    'README.md': string;
    'CHANGELOG.md'?: string;
  };
  metrics: {
    filesGenerated: number;
    totalSize: number;
    generationTime: number;
  };
}