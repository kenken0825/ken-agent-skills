/**
 * Skill YAML Generator
 * スキルのメタデータをYAML形式で生成
 */

import { Skill, SkillMetadata, GeneratorInterface } from '../models/types';

export class SkillYamlGenerator implements GeneratorInterface {
  /**
   * skill.yamlを生成
   */
  async generate(skill: Skill, metadata?: SkillMetadata): Promise<string> {
    const yamlData = this.buildYamlStructure(skill, metadata);
    return this.convertToYaml(yamlData);
  }
  
  /**
   * コンテンツの検証
   */
  validate(content: string): boolean {
    // 必須フィールドの確認
    const requiredFields = ['skill_id:', 'skill_name:', 'description:', 'category:'];
    return requiredFields.every(field => content.includes(field));
  }
  
  /**
   * YAML構造の構築
   */
  private buildYamlStructure(skill: Skill, metadata?: SkillMetadata): any {
    const yamlStructure: any = {
      // 基本情報
      skill_id: skill.id || this.generateSkillId(skill.name),
      skill_name: skill.name,
      description: skill.description,
      category: skill.category,
      version: metadata?.version || '1.0.0',
      
      // メタデータ
      metadata: {
        author: metadata?.author || 'Unknown',
        license: metadata?.license || 'MIT',
        created_date: metadata?.changelog?.[0]?.date || new Date().toISOString().split('T')[0],
        updated_date: new Date().toISOString().split('T')[0],
        stability: this.getStabilityLevel(skill.evolutionLevel),
        maturity: skill.evolutionLevel || 1
      },
      
      // ターゲット情報
      target: {
        industry: skill.targetIndustry || 'general',
        roles: skill.targetRole ? [skill.targetRole] : ['all'],
        company_size: ['small', 'medium', 'large', 'enterprise'],
        experience_level: this.getExperienceLevels(skill.evolutionLevel)
      },
      
      // トリガー情報
      triggers: skill.triggers || [],
      
      // ペインパターン
      pain_patterns: skill.painPatterns || [],
      
      // 実装情報
      implementation: {
        language: this.detectLanguages(skill),
        framework: this.detectFrameworks(skill),
        runtime: 'node',
        entry_point: 'scripts/main.js'
      },
      
      // アセット情報
      assets: this.buildAssetsSection(skill.assets),
      
      // 設定
      configuration: {
        required_env_vars: this.getRequiredEnvVars(skill),
        optional_env_vars: this.getOptionalEnvVars(skill),
        config_file: 'config.json',
        config_schema: 'schemas/config.schema.json'
      },
      
      // パフォーマンス指標
      performance: {
        average_execution_time: '5s',
        memory_usage: '100MB',
        throughput: '1000 records/min',
        scalability: 'horizontal'
      },
      
      // 依存関係
      dependencies: metadata?.dependencies || {},
      
      // タグ
      tags: this.generateTags(skill, metadata),
      
      // 統計情報
      statistics: {
        implementations: skill.implementations || 0,
        success_rate: skill.successRate || 0.95,
        user_satisfaction: 0.9,
        last_update: new Date().toISOString()
      }
    };
    
    // オプショナルフィールド
    if (metadata?.repository) {
      yamlStructure.repository = metadata.repository;
    }
    
    if (metadata?.homepage) {
      yamlStructure.homepage = metadata.homepage;
    }
    
    if (metadata?.bugs) {
      yamlStructure.bug_tracker = metadata.bugs;
    }
    
    return yamlStructure;
  }
  
  /**
   * オブジェクトをYAML文字列に変換
   */
  private convertToYaml(obj: any, indent: number = 0): string {
    const lines: string[] = [];
    const indentStr = '  '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        continue;
      }
      
      if (Array.isArray(value)) {
        if (value.length === 0) {
          lines.push(`${indentStr}${key}: []`);
        } else if (typeof value[0] === 'string' || typeof value[0] === 'number') {
          // シンプルな配列
          lines.push(`${indentStr}${key}:`);
          value.forEach(item => {
            lines.push(`${indentStr}  - ${this.escapeValue(item)}`);
          });
        } else {
          // オブジェクトの配列
          lines.push(`${indentStr}${key}:`);
          value.forEach(item => {
            lines.push(`${indentStr}  -`);
            const subYaml = this.convertToYaml(item, indent + 2);
            lines.push(subYaml.split('\n').map(line => '  ' + line).join('\n'));
          });
        }
      } else if (typeof value === 'object') {
        if (Object.keys(value).length === 0) {
          lines.push(`${indentStr}${key}: {}`);
        } else {
          lines.push(`${indentStr}${key}:`);
          lines.push(this.convertToYaml(value, indent + 1));
        }
      } else {
        lines.push(`${indentStr}${key}: ${this.escapeValue(value)}`);
      }
    }
    
    return lines.join('\n');
  }
  
  /**
   * 値のエスケープ
   */
  private escapeValue(value: any): string {
    if (typeof value === 'string') {
      // 特殊文字を含む場合はクォート
      if (value.includes(':') || value.includes('#') || value.includes('"') || 
          value.includes("'") || value.includes('\n') || value.includes('|') ||
          value.includes('>') || value.startsWith(' ') || value.endsWith(' ')) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    return String(value);
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
   * 安定性レベルの判定
   */
  private getStabilityLevel(evolutionLevel?: number): string {
    if (!evolutionLevel) return 'experimental';
    
    const levels = ['experimental', 'alpha', 'beta', 'stable', 'mature'];
    return levels[Math.min(evolutionLevel - 1, levels.length - 1)];
  }
  
  /**
   * 経験レベルの取得
   */
  private getExperienceLevels(evolutionLevel?: number): string[] {
    if (!evolutionLevel || evolutionLevel <= 1) {
      return ['beginner', 'intermediate', 'advanced'];
    } else if (evolutionLevel <= 3) {
      return ['intermediate', 'advanced'];
    } else {
      return ['advanced', 'expert'];
    }
  }
  
  /**
   * 使用言語の検出
   */
  private detectLanguages(skill: Skill): string[] {
    const languages = new Set<string>();
    
    if (skill.assets?.scripts) {
      skill.assets.scripts.forEach(script => {
        if (script.endsWith('.js') || script.endsWith('.ts')) {
          languages.add('javascript');
        } else if (script.endsWith('.py')) {
          languages.add('python');
        } else if (script.endsWith('.rb')) {
          languages.add('ruby');
        } else if (script.endsWith('.sh') || script.endsWith('.bash')) {
          languages.add('bash');
        }
      });
    }
    
    return Array.from(languages).length > 0 ? Array.from(languages) : ['javascript'];
  }
  
  /**
   * フレームワークの検出
   */
  private detectFrameworks(skill: Skill): string[] {
    const frameworks: string[] = [];
    
    // スキル名や説明から推測
    const text = `${skill.name} ${skill.description}`.toLowerCase();
    
    if (text.includes('react')) frameworks.push('react');
    if (text.includes('vue')) frameworks.push('vue');
    if (text.includes('express')) frameworks.push('express');
    if (text.includes('django')) frameworks.push('django');
    if (text.includes('flask')) frameworks.push('flask');
    
    return frameworks.length > 0 ? frameworks : ['none'];
  }
  
  /**
   * アセットセクションの構築
   */
  private buildAssetsSection(assets?: Skill['assets']): any {
    if (!assets) {
      return {
        scripts: [],
        templates: [],
        documents: [],
        schemas: [],
        examples: []
      };
    }
    
    return {
      scripts: assets.scripts || [],
      templates: assets.templates || [],
      documents: assets.documents || [],
      schemas: this.inferSchemas(assets),
      examples: this.inferExamples(assets)
    };
  }
  
  /**
   * スキーマファイルの推測
   */
  private inferSchemas(assets: Skill['assets']): string[] {
    const schemas: string[] = [];
    
    if (assets?.scripts?.some(s => s.includes('validate'))) {
      schemas.push('schemas/input.schema.json');
      schemas.push('schemas/output.schema.json');
    }
    
    if (assets?.templates?.length) {
      schemas.push('schemas/template.schema.json');
    }
    
    return schemas;
  }
  
  /**
   * サンプルファイルの推測
   */
  private inferExamples(assets: Skill['assets']): string[] {
    const examples: string[] = [];
    
    if (assets?.scripts?.length) {
      examples.push('examples/basic-usage.js');
      examples.push('examples/advanced-usage.js');
    }
    
    if (assets?.templates?.length) {
      examples.push('examples/template-usage.md');
    }
    
    return examples;
  }
  
  /**
   * 必須環境変数の取得
   */
  private getRequiredEnvVars(skill: Skill): string[] {
    const vars: string[] = [];
    
    // スキルのカテゴリや説明から推測
    const text = `${skill.name} ${skill.description}`.toLowerCase();
    
    if (text.includes('api') || text.includes('外部')) {
      vars.push('API_KEY');
      vars.push('API_SECRET');
    }
    
    if (text.includes('database') || text.includes('データベース')) {
      vars.push('DATABASE_URL');
    }
    
    if (text.includes('aws')) {
      vars.push('AWS_ACCESS_KEY_ID');
      vars.push('AWS_SECRET_ACCESS_KEY');
    }
    
    return vars;
  }
  
  /**
   * オプショナル環境変数の取得
   */
  private getOptionalEnvVars(skill: Skill): string[] {
    return [
      'LOG_LEVEL',
      'DEBUG',
      'TEMP_DIR',
      'OUTPUT_DIR',
      'MAX_RETRIES',
      'TIMEOUT'
    ];
  }
  
  /**
   * タグの生成
   */
  private generateTags(skill: Skill, metadata?: SkillMetadata): string[] {
    const tags = new Set<string>();
    
    // カテゴリ
    tags.add(skill.category.toLowerCase().replace(/\s/g, '-'));
    
    // 業界
    if (skill.targetIndustry) {
      tags.add(skill.targetIndustry.toLowerCase().replace(/\s/g, '-'));
    }
    
    // 職種
    if (skill.targetRole) {
      tags.add(skill.targetRole.toLowerCase().replace(/\s/g, '-'));
    }
    
    // キーワード
    if (metadata?.keywords) {
      metadata.keywords.forEach(keyword => tags.add(keyword));
    }
    
    // 自動タグ
    if (skill.assets?.scripts?.some(s => s.includes('automation'))) {
      tags.add('automation');
    }
    
    if (skill.assets?.templates?.length) {
      tags.add('templates');
    }
    
    if (skill.evolutionLevel && skill.evolutionLevel >= 4) {
      tags.add('enterprise-ready');
    }
    
    return Array.from(tags);
  }
}