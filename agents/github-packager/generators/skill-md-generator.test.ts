/**
 * SKILL.md Generator Tests
 */

import { SkillMdGenerator } from './skill-md-generator';
import { Skill } from '../../skill-recommender/models/types';

describe('SkillMdGenerator', () => {
  let generator: SkillMdGenerator;

  beforeEach(() => {
    generator = new SkillMdGenerator();
  });

  describe('generate', () => {
    it('should generate a valid SKILL.md with minimal skill data', async () => {
      const skill: Skill = {
        name: 'test-skill',
        description: 'A test skill for unit testing',
        category: 'development',
        triggers: ['test trigger 1', 'test trigger 2']
      };

      const result = await generator.generate(skill);

      // フロントマターのチェック
      expect(result).toContain('---');
      expect(result).toContain('name: test-skill');
      expect(result).toContain('description: A test skill for unit testing');
      expect(result).toContain('Use this skill when: (1) test trigger 1, (2) test trigger 2');

      // 本文のチェック
      expect(result).toContain('# test-skill');
      expect(result).toContain('## 概要');
      expect(result).toContain('## 主な機能');
      expect(result).toContain('- test trigger 1');
      expect(result).toContain('- test trigger 2');
    });

    it('should generate English content when language is en', async () => {
      const skill: Skill = {
        name: 'test-skill',
        description: 'A test skill',
        category: 'development',
        triggers: ['trigger 1']
      };

      const result = await generator.generate(skill, { language: 'en' });

      expect(result).toContain('## Overview');
      expect(result).toContain('## Key Features');
      expect(result).toContain('## Usage');
    });

    it('should include all optional sections when data is available', async () => {
      const skill: Skill = {
        name: 'advanced-skill',
        description: 'An advanced skill with all features',
        category: 'business',
        targetIndustry: 'IT',
        targetRole: 'Developer',
        triggers: ['feature 1', 'feature 2'],
        painPatterns: ['pain 1', 'pain 2'],
        implementations: 10,
        successRate: 0.95,
        evolutionLevel: 3,
        assets: {
          scripts: ['script1.py', 'script2.js'],
          templates: ['template1.md'],
          documents: ['guide.md', 'reference.md']
        },
        metadata: {
          version: '1.0.0',
          author: 'Test Author',
          config: { key: 'value' }
        }
      };

      const result = await generator.generate(skill);

      // アセットセクション
      expect(result).toContain('## リソース');
      expect(result).toContain('### スクリプト');
      expect(result).toContain('`scripts/script1.py`');
      expect(result).toContain('### テンプレート');
      expect(result).toContain('`templates/template1.md`');
      expect(result).toContain('### ドキュメント');
      expect(result).toContain('`references/guide.md`');

      // 実装例セクション
      expect(result).toContain('## 実装例');
      expect(result).toContain('10 件の実装実績');
      expect(result).toContain('成功率: 95.0%');

      // 技術仕様セクション
      expect(result).toContain('## 技術仕様');
      expect(result).toContain('進化レベル: 3');
      expect(result).toContain('解決する課題:');
      expect(result).toContain('- pain 1');

      // メタデータセクション
      expect(result).toContain('## その他の情報');
      expect(result).toContain('version: 1.0.0');
      expect(result).toContain('```json');
    });

    it('should exclude optional sections based on options', async () => {
      const skill: Skill = {
        name: 'test-skill',
        description: 'A test skill',
        category: 'development',
        triggers: ['trigger 1'],
        implementations: 5
      };

      const result = await generator.generate(skill, {
        includeExamples: false,
        includeDocs: false
      });

      expect(result).not.toContain('## 実装例');
      expect(result).not.toContain('## 技術仕様');
    });
  });

  describe('validate', () => {
    it('should validate a correctly formatted SKILL.md', () => {
      const content = `---
name: test-skill
description: A test skill
license: Complete terms in LICENSE.txt
---

# test-skill

Content here...`;

      expect(generator.validate(content)).toBe(true);
    });

    it('should reject content without frontmatter', () => {
      const content = `# test-skill

Content without frontmatter`;

      expect(generator.validate(content)).toBe(false);
    });

    it('should reject frontmatter without required fields', () => {
      const content = `---
name: test-skill
license: Complete terms in LICENSE.txt
---

# test-skill`;

      expect(generator.validate(content)).toBe(false);
    });

    it('should reject improperly formatted frontmatter', () => {
      const content = `---
name: test-skill
description: A test skill
license: Complete terms in LICENSE.txt

# test-skill`;

      expect(generator.validate(content)).toBe(false);
    });
  });
});

// 使用例を示すサンプル
async function example() {
  const generator = new SkillMdGenerator();
  
  const skill: Skill = {
    name: 'data-analyzer',
    description: 'Automated data analysis and visualization tool',
    category: 'data-analysis',
    targetIndustry: 'Finance',
    targetRole: 'Data Analyst',
    triggers: [
      'Analyze CSV/Excel data',
      'Generate statistical reports',
      'Create data visualizations'
    ],
    painPatterns: [
      'Manual data processing takes too long',
      'Difficulty in creating consistent reports',
      'Lack of automated visualization'
    ],
    implementations: 25,
    successRate: 0.88,
    evolutionLevel: 2,
    assets: {
      scripts: ['analyze_data.py', 'generate_report.py'],
      templates: ['report_template.md'],
      documents: ['usage_guide.md', 'api_reference.md']
    }
  };

  // 日本語版を生成
  const jaContent = await generator.generate(skill);
  console.log('Japanese SKILL.md:\n', jaContent);

  // 英語版を生成
  const enContent = await generator.generate(skill, { language: 'en' });
  console.log('\nEnglish SKILL.md:\n', enContent);

  // 検証
  console.log('\nValidation result:', generator.validate(jaContent));
}