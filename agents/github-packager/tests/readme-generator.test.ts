/**
 * README Generator テスト
 */

import { ReadmeGenerator } from '../generators/readme-generator';
import { Skill, SkillMetadata, PackageOptions } from '../models/types';

// テスト用のサンプルスキル
const sampleSkill: Skill = {
  id: 'invoice-automation',
  name: '請求書自動化スキル',
  description: '請求データから自動的に請求書を生成し、PDFで出力するスキル',
  category: 'business',
  targetIndustry: 'IT・ソフトウェア',
  targetRole: '経理担当者',
  triggers: ['請求書作成', '請求書生成', 'インボイス作成'],
  painPatterns: [
    '毎月の請求書作成に時間がかかる',
    '請求書のフォーマットが統一されていない',
    '請求金額の計算ミスが発生する'
  ],
  implementations: 25,
  successRate: 0.96,
  evolutionLevel: 3,
  assets: {
    scripts: [
      'scripts/generate-invoice.js',
      'scripts/validate-data.js',
      'scripts/convert-to-pdf.js'
    ],
    templates: [
      'templates/invoice-template.xlsx',
      'templates/invoice-simple.docx'
    ],
    documents: [
      'docs/setup-guide.md',
      'docs/api-reference.md'
    ]
  }
};

// テスト用のメタデータ
const sampleMetadata: SkillMetadata = {
  version: '2.1.0',
  author: 'Ken Skills Team',
  license: 'MIT',
  repository: 'https://github.com/ken-skills/invoice-automation',
  homepage: 'https://ken-skills.com/invoice-automation',
  bugs: 'https://github.com/ken-skills/invoice-automation/issues',
  keywords: ['invoice', 'automation', 'pdf', 'business'],
  dependencies: {
    'puppeteer': '^19.0.0',
    'xlsx': '^0.18.5',
    'pdfkit': '^0.13.0'
  },
  changelog: [
    {
      version: '2.1.0',
      date: '2024-01-15',
      changes: [
        'PDF生成エンジンをアップグレード',
        'テンプレートカスタマイズ機能を追加',
        'バッチ処理の性能を改善'
      ]
    },
    {
      version: '2.0.0',
      date: '2023-12-01',
      changes: [
        '新しいテンプレートエンジンを実装',
        'APIインターフェースを刷新',
        '古いフォーマットのサポートを削除'
      ]
    }
  ]
};

// テスト用のオプション
const sampleOptions: PackageOptions = {
  includeChangelog: true,
  includeExamples: true,
  includeDocs: true,
  includeScripts: true,
  includeTests: true,
  language: 'ja'
};

// テスト実行
async function runTest() {
  console.log('README Generator Test');
  console.log('====================\n');
  
  const generator = new ReadmeGenerator();
  
  // Test 1: スキルとオプションを使用した生成
  console.log('Test 1: Generate with PackageOptions');
  console.log('------------------------------------');
  const readme1 = await generator.generate(sampleSkill, sampleOptions);
  console.log(readme1.substring(0, 500) + '...\n');
  
  // Test 2: スキルとメタデータを使用した生成
  console.log('Test 2: Generate with SkillMetadata');
  console.log('------------------------------------');
  const readme2 = await generator.generate(sampleSkill, sampleMetadata);
  console.log(readme2.substring(0, 500) + '...\n');
  
  // Test 3: 検証
  console.log('Test 3: Validate content');
  console.log('------------------------');
  const isValid1 = generator.validate(readme1);
  const isValid2 = generator.validate(readme2);
  console.log(`Validation result 1: ${isValid1 ? 'PASS' : 'FAIL'}`);
  console.log(`Validation result 2: ${isValid2 ? 'PASS' : 'FAIL'}`);
  
  // 完全な出力例を保存
  const fs = require('fs/promises');
  const path = require('path');
  const outputDir = path.join(__dirname, 'output');
  await fs.mkdir(outputDir, { recursive: true });
  
  await fs.writeFile(
    path.join(outputDir, 'sample-readme-with-options.md'),
    readme1,
    'utf8'
  );
  
  await fs.writeFile(
    path.join(outputDir, 'sample-readme-with-metadata.md'),
    readme2,
    'utf8'
  );
  
  console.log('\nSample files saved to:', outputDir);
}

// テストを実行
if (require.main === module) {
  runTest().catch(console.error);
}