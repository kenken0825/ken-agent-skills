#!/usr/bin/env node

/**
 * Skilldex CLI Tool
 * Command-line interface for running the Skilldex Orchestrator
 */

import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as yaml from 'js-yaml';
import * as grayMatter from 'gray-matter';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Types
interface CompanyProfile {
  name: string;
  url?: string;
  industry?: string;
  services?: string[];
  facts: string[];
  hypotheses: Array<{ content: string; confidence: 'low' | 'med' | 'high' }>;
}

interface PainPattern {
  id: string;
  description: string;
  industry?: string;
  role?: string;
  impact: 'low' | 'medium' | 'high';
}

interface Skill {
  skill_id: string;
  skill_name: string;
  level: 1 | 2 | 3 | 4;
  scope: string;
  triggers: string[];
  pain_patterns: string[];
  score?: SkillScore;
}

interface SkillScore {
  fit_industry_role: number;
  pain_impact: number;
  adoption_cost: number;
  reproducibility: number;
  total: number;
}

interface AnalysisResult {
  company_profile: CompanyProfile;
  industry_role_map: {
    industry: string;
    roles: string[];
  };
  pain_patterns: PainPattern[];
  recommended_skills: Skill[];
}

// CLI setup
const program = new Command();

program
  .name('skilldex')
  .description('Skilldex Orchestrator CLI - Transform business consultations into actionable agent skills')
  .version('0.1.0');

// URL Analysis mode
program
  .command('analyze')
  .description('Analyze a company URL to extract business context and recommend skills')
  .requiredOption('-u, --url <url>', 'Company URL to analyze')
  .option('-o, --output <path>', 'Output path for the analysis report', './skilldex-report.md')
  .option('-f, --format <format>', 'Output format (markdown, json, yaml)', 'markdown')
  .action(async (options) => {
    console.log('🔍 Starting URL analysis...');
    try {
      const result = await analyzeURL(options.url);
      await saveAnalysisResult(result, options.output, options.format);
      console.log(`✅ Analysis complete! Report saved to: ${options.output}`);
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  });

// Consultation Analysis mode
program
  .command('consult')
  .description('Analyze consultation notes to extract pain points and recommend skills')
  .requiredOption('-f, --file <path>', 'Path to consultation notes file')
  .option('-o, --output <path>', 'Output path for the analysis report', './skilldex-report.md')
  .option('--format <format>', 'Output format (markdown, json, yaml)', 'markdown')
  .action(async (options) => {
    console.log('📋 Starting consultation analysis...');
    try {
      const notes = await fs.readFile(options.file, 'utf-8');
      const result = await analyzeConsultation(notes);
      await saveAnalysisResult(result, options.output, options.format);
      console.log(`✅ Analysis complete! Report saved to: ${options.output}`);
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  });

// Hybrid mode
program
  .command('hybrid')
  .description('Analyze both URL and consultation notes for comprehensive skill recommendations')
  .requiredOption('-u, --url <url>', 'Company URL to analyze')
  .requiredOption('-f, --file <path>', 'Path to consultation notes file')
  .option('-o, --output <path>', 'Output path for the analysis report', './skilldex-report.md')
  .option('--format <format>', 'Output format (markdown, json, yaml)', 'markdown')
  .action(async (options) => {
    console.log('🔄 Starting hybrid analysis...');
    try {
      const notes = await fs.readFile(options.file, 'utf-8');
      const result = await analyzeHybrid(options.url, notes);
      await saveAnalysisResult(result, options.output, options.format);
      console.log(`✅ Analysis complete! Report saved to: ${options.output}`);
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  });

// Interactive mode
program
  .command('interactive')
  .description('Start an interactive session to guide through the analysis process')
  .action(async () => {
    console.log('💬 Starting interactive mode...');
    console.log('This feature is coming soon!');
    // TODO: Implement interactive mode with inquirer
  });

// Quick commands
program
  .command('intake')
  .description('Quick intake: create initial company profile and industry/role map')
  .requiredOption('-u, --url <url>', 'Company URL or path to data')
  .action(async (options) => {
    console.log('📥 Running INTAKE command...');
    try {
      const profile = await createCompanyProfile(options.url);
      console.log('\n📊 Company Profile:');
      console.log(JSON.stringify(profile, null, 2));
    } catch (error) {
      console.error('❌ Intake failed:', error);
      process.exit(1);
    }
  });

program
  .command('discover')
  .description('Quick discover: extract pain patterns and find candidate skills')
  .requiredOption('-f, --file <path>', 'Path to pain patterns or consultation file')
  .action(async (options) => {
    console.log('🔍 Running DISCOVER command...');
    try {
      const notes = await fs.readFile(options.file, 'utf-8');
      const patterns = await extractPainPatterns(notes);
      const skills = await discoverSkills(patterns);
      console.log('\n🎯 Discovered Skills:');
      skills.forEach((skill, i) => {
        console.log(`${i + 1}. ${skill.skill_name} (Level ${skill.level})`);
      });
    } catch (error) {
      console.error('❌ Discovery failed:', error);
      process.exit(1);
    }
  });

program
  .command('rank')
  .description('Quick rank: score and rank skills based on criteria')
  .requiredOption('-s, --skills <path>', 'Path to skills data file')
  .action(async (options) => {
    console.log('📈 Running RANK command...');
    try {
      const skillsData = await fs.readJSON(options.skills);
      const rankedSkills = await rankSkills(skillsData);
      console.log('\n🏆 Skill Rankings:');
      rankedSkills.forEach((skill, i) => {
        console.log(`${i + 1}. ${skill.skill_name} - Score: ${skill.score?.total.toFixed(2)}`);
      });
    } catch (error) {
      console.error('❌ Ranking failed:', error);
      process.exit(1);
    }
  });

program
  .command('evolve')
  .description('Quick evolve: check evolution level and suggest next steps')
  .requiredOption('-s, --skill <id>', 'Skill ID to evaluate')
  .action(async (options) => {
    console.log('🔄 Running EVOLVE command...');
    try {
      const evolution = await evaluateEvolution(options.skill);
      console.log('\n📊 Evolution Status:');
      console.log(`Current Level: ${evolution.currentLevel}`);
      console.log(`Progress: ${evolution.progressBar}`);
      console.log(`Next Steps: ${evolution.nextSteps}`);
    } catch (error) {
      console.error('❌ Evolution check failed:', error);
      process.exit(1);
    }
  });

program
  .command('package')
  .description('Quick package: generate GitHub-ready skill package')
  .requiredOption('-s, --skill <path>', 'Path to skill data')
  .requiredOption('-o, --output <dir>', 'Output directory for package')
  .action(async (options) => {
    console.log('📦 Running PACKAGE command...');
    try {
      const skillData = await fs.readJSON(options.skill);
      await createSkillPackage(skillData, options.output);
      console.log(`✅ Package created at: ${options.output}`);
    } catch (error) {
      console.error('❌ Packaging failed:', error);
      process.exit(1);
    }
  });

// Core functions

async function analyzeURL(url: string): Promise<AnalysisResult> {
  console.log(`🌐 Fetching content from: ${url}`);
  
  // Fetch and parse HTML
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  
  // Extract company information
  const companyProfile = await createCompanyProfile(url);
  
  // Mock implementation - in real version, these would use AI/NLP
  const industryRoleMap = {
    industry: 'Technology',
    roles: ['Engineering', 'Product', 'Sales']
  };
  
  const painPatterns: PainPattern[] = [
    {
      id: 'pp-001',
      description: 'Manual repetitive tasks consuming valuable time',
      industry: 'Technology',
      role: 'Engineering',
      impact: 'high'
    }
  ];
  
  const recommendedSkills = await discoverSkills(painPatterns);
  
  return {
    company_profile: companyProfile,
    industry_role_map: industryRoleMap,
    pain_patterns: painPatterns,
    recommended_skills: recommendedSkills
  };
}

async function analyzeConsultation(notes: string): Promise<AnalysisResult> {
  console.log('📝 Analyzing consultation notes...');
  
  // Extract pain patterns from notes
  const painPatterns = await extractPainPatterns(notes);
  
  // Mock company profile from consultation
  const companyProfile: CompanyProfile = {
    name: 'Consultation Client',
    facts: ['Extracted from consultation notes'],
    hypotheses: [
      { content: 'Needs process automation', confidence: 'high' }
    ]
  };
  
  const industryRoleMap = {
    industry: 'General Business',
    roles: ['Operations', 'Management']
  };
  
  const recommendedSkills = await discoverSkills(painPatterns);
  
  return {
    company_profile: companyProfile,
    industry_role_map: industryRoleMap,
    pain_patterns: painPatterns,
    recommended_skills: recommendedSkills
  };
}

async function analyzeHybrid(url: string, notes: string): Promise<AnalysisResult> {
  console.log('🔄 Performing hybrid analysis...');
  
  // Combine both URL and consultation analysis
  const urlResult = await analyzeURL(url);
  const consultResult = await analyzeConsultation(notes);
  
  // Merge results (prioritize consultation data)
  return {
    company_profile: {
      ...urlResult.company_profile,
      facts: [...urlResult.company_profile.facts, ...consultResult.company_profile.facts],
      hypotheses: [...urlResult.company_profile.hypotheses, ...consultResult.company_profile.hypotheses]
    },
    industry_role_map: consultResult.industry_role_map,
    pain_patterns: [...urlResult.pain_patterns, ...consultResult.pain_patterns],
    recommended_skills: await rankSkills([...urlResult.recommended_skills, ...consultResult.recommended_skills])
  };
}

async function createCompanyProfile(url: string): Promise<CompanyProfile> {
  if (url.startsWith('http')) {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    return {
      name: $('title').text() || 'Unknown Company',
      url,
      facts: [
        `Website: ${url}`,
        `Title: ${$('title').text()}`
      ],
      hypotheses: [
        { content: 'Technology-focused company', confidence: 'med' }
      ]
    };
  } else {
    // Handle file path
    const content = await fs.readFile(url, 'utf-8');
    const parsed = grayMatter(content);
    
    return {
      name: parsed.data.company || 'Unknown Company',
      facts: parsed.data.facts || [],
      hypotheses: parsed.data.hypotheses || []
    };
  }
}

async function extractPainPatterns(notes: string): Promise<PainPattern[]> {
  // Simple keyword-based extraction (mock implementation)
  const patterns: PainPattern[] = [];
  
  const painKeywords = ['problem', 'issue', 'challenge', 'difficulty', 'pain', 'struggle'];
  const lines = notes.split('\n');
  
  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    if (painKeywords.some(keyword => lowerLine.includes(keyword))) {
      patterns.push({
        id: `pp-${index}`,
        description: line.trim(),
        impact: 'medium'
      });
    }
  });
  
  return patterns;
}

async function discoverSkills(patterns: PainPattern[]): Promise<Skill[]> {
  // Mock skill discovery based on pain patterns
  const mockSkills: Skill[] = [
    {
      skill_id: 'skill-001',
      skill_name: 'Process Automation Toolkit',
      level: 3,
      scope: 'Cross-functional',
      triggers: ['manual tasks', 'repetitive work'],
      pain_patterns: patterns.map(p => p.id)
    },
    {
      skill_id: 'skill-002',
      skill_name: 'Data Analysis Dashboard',
      level: 2,
      scope: 'Analytics',
      triggers: ['reporting', 'metrics'],
      pain_patterns: []
    }
  ];
  
  return mockSkills;
}

async function rankSkills(skills: Skill[]): Promise<Skill[]> {
  // Apply scoring to each skill
  const scoredSkills = skills.map(skill => {
    const score: SkillScore = {
      fit_industry_role: Math.random() * 100,
      pain_impact: Math.random() * 100,
      adoption_cost: Math.random() * 100,
      reproducibility: Math.random() * 100,
      total: 0
    };
    
    score.total = (score.fit_industry_role + score.pain_impact + score.adoption_cost + score.reproducibility) / 4;
    
    return {
      ...skill,
      score
    };
  });
  
  // Sort by total score
  return scoredSkills.sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0));
}

async function evaluateEvolution(skillId: string): Promise<any> {
  // Mock evolution evaluation
  const levels = ['■□□□', '■■□□', '■■■□', '■■■■'];
  const currentLevel = Math.ceil(Math.random() * 4) as 1 | 2 | 3 | 4;
  
  return {
    currentLevel,
    progressBar: levels[currentLevel - 1],
    nextSteps: currentLevel < 4 ? 
      `Implement in ${5 - currentLevel} more industries to reach Level ${currentLevel + 1}` :
      'Skill has reached maximum evolution level!'
  };
}

async function createSkillPackage(skill: Skill, outputDir: string): Promise<void> {
  // Create directory structure
  await fs.ensureDir(outputDir);
  await fs.ensureDir(path.join(outputDir, 'pages'));
  await fs.ensureDir(path.join(outputDir, 'scripts'));
  
  // Generate SKILL.md
  const skillMd = `---
id: ${skill.skill_id}
name: ${skill.skill_name}
level: ${skill.level}
scope: ${skill.scope}
---

# ${skill.skill_name}

## Overview
This skill addresses pain patterns in ${skill.scope} operations.

## Triggers
${skill.triggers.map(t => `- ${t}`).join('\n')}

## Implementation
Details about how to implement this skill...
`;
  
  await fs.writeFile(path.join(outputDir, 'SKILL.md'), skillMd);
  
  // Generate skill.yaml
  const skillYaml = yaml.dump({
    skill_id: skill.skill_id,
    skill_name: skill.skill_name,
    level: skill.level,
    scope: skill.scope,
    triggers: skill.triggers,
    pain_patterns: skill.pain_patterns,
    workflow: {
      steps: ['Analyze', 'Implement', 'Validate']
    }
  });
  
  await fs.writeFile(path.join(outputDir, 'skill.yaml'), skillYaml);
  
  // Generate README.md
  const readme = `# ${skill.skill_name}

## Quick Start
1. Install dependencies
2. Configure settings
3. Run the skill

## Documentation
See SKILL.md for detailed information.
`;
  
  await fs.writeFile(path.join(outputDir, 'README.md'), readme);
  
  // Generate CHANGELOG.md
  const changelog = `# Changelog

## [1.0.0] - ${new Date().toISOString().split('T')[0]}
### Added
- Initial implementation
- Core functionality
`;
  
  await fs.writeFile(path.join(outputDir, 'CHANGELOG.md'), changelog);
}

async function saveAnalysisResult(result: AnalysisResult, outputPath: string, format: string): Promise<void> {
  switch (format) {
    case 'json':
      await fs.writeJSON(outputPath, result, { spaces: 2 });
      break;
      
    case 'yaml':
      await fs.writeFile(outputPath, yaml.dump(result));
      break;
      
    case 'markdown':
    default:
      const markdown = generateMarkdownReport(result);
      await fs.writeFile(outputPath, markdown);
      break;
  }
}

function generateMarkdownReport(result: AnalysisResult): string {
  return `# Skilldex Analysis Report

Generated: ${new Date().toISOString()}

## Company Profile
**Name:** ${result.company_profile.name}
${result.company_profile.url ? `**URL:** ${result.company_profile.url}` : ''}

### Facts
${result.company_profile.facts.map(f => `- ${f}`).join('\n')}

### Hypotheses
${result.company_profile.hypotheses.map(h => `- ${h.content} (Confidence: ${h.confidence})`).join('\n')}

## Industry & Role Mapping
- **Industry:** ${result.industry_role_map.industry}
- **Key Roles:** ${result.industry_role_map.roles.join(', ')}

## Pain Patterns Identified
${result.pain_patterns.map((p, i) => `
### Pattern ${i + 1}: ${p.id}
- **Description:** ${p.description}
- **Impact:** ${p.impact}
${p.industry ? `- **Industry:** ${p.industry}` : ''}
${p.role ? `- **Role:** ${p.role}` : ''}
`).join('\n')}

## Recommended Skills

${result.recommended_skills.map((skill, i) => `
### ${i + 1}. ${skill.skill_name}
- **ID:** ${skill.skill_id}
- **Level:** ${skill.level} ${'■'.repeat(skill.level)}${'□'.repeat(4 - skill.level)}
- **Scope:** ${skill.scope}
- **Triggers:** ${skill.triggers.join(', ')}
${skill.score ? `
- **Scores:**
  - Industry/Role Fit: ${skill.score.fit_industry_role.toFixed(1)}
  - Pain Impact: ${skill.score.pain_impact.toFixed(1)}
  - Adoption Cost: ${skill.score.adoption_cost.toFixed(1)}
  - Reproducibility: ${skill.score.reproducibility.toFixed(1)}
  - **Total: ${skill.score.total.toFixed(1)}**
` : ''}
`).join('\n')}

## Next Steps
1. Review recommended skills with stakeholders
2. Select skills for implementation
3. Create implementation roadmap
4. Track skill evolution progress

---
*Report generated by Skilldex Orchestrator v0.1.0*
`;
}

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}