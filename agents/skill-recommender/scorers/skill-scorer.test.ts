/**
 * Skill Scorer Tests
 */

import { SkillScorer } from './skill-scorer';
import { Skill, PainPattern, RecommendationContext } from '../models/types';

describe('SkillScorer', () => {
  let scorer: SkillScorer;

  beforeEach(() => {
    scorer = new SkillScorer();
  });

  describe('calculateMetrics', () => {
    it('should calculate all scoring metrics correctly', () => {
      const skill: Skill = {
        id: 'test-skill',
        name: 'Test Automation Skill',
        description: 'Automates testing processes for software development',
        category: 'automation',
        targetIndustry: 'tech',
        targetRole: 'engineer',
        triggers: ['test', 'automation', 'ci/cd'],
        implementations: 10,
        successRate: 85,
        evolutionLevel: 3,
        assets: {
          scripts: ['test.js', 'setup.py'],
          templates: ['test-template.yml'],
          documents: ['README.md']
        }
      };

      const matchedPains: PainPattern[] = [
        {
          name: 'Manual Testing Overhead',
          description: 'Too much time spent on manual testing',
          category: 'efficiency',
          impact: 0.8,
          occurrenceCount: 15
        },
        {
          name: 'Inconsistent Test Results',
          description: 'Test results vary between runs',
          category: 'quality',
          impact: 0.6,
          occurrenceCount: 8
        }
      ];

      const context: RecommendationContext = {
        industry: 'tech',
        roles: ['engineer', 'qa'],
        companySize: 'medium',
        urgency: 'high'
      };

      const metrics = scorer.calculateMetrics(skill, matchedPains, context);

      expect(metrics).toHaveProperty('fitIndustryRole');
      expect(metrics).toHaveProperty('painImpact');
      expect(metrics).toHaveProperty('adoptionCost');
      expect(metrics).toHaveProperty('reproducibility');

      // All metrics should be between 0 and 1
      expect(metrics.fitIndustryRole).toBeGreaterThanOrEqual(0);
      expect(metrics.fitIndustryRole).toBeLessThanOrEqual(1);
      expect(metrics.painImpact).toBeGreaterThanOrEqual(0);
      expect(metrics.painImpact).toBeLessThanOrEqual(1);
      expect(metrics.adoptionCost).toBeGreaterThanOrEqual(0);
      expect(metrics.adoptionCost).toBeLessThanOrEqual(1);
      expect(metrics.reproducibility).toBeGreaterThanOrEqual(0);
      expect(metrics.reproducibility).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateFitScore', () => {
    it('should give high score for perfect industry and role match', () => {
      const skill: Skill = {
        name: 'Finance Automation',
        description: 'Automates financial processes',
        category: 'automation',
        targetIndustry: 'finance',
        targetRole: 'analyst',
        triggers: []
      };

      const context: RecommendationContext = {
        industry: 'finance',
        roles: ['analyst'],
        companySize: 'large'
      };

      const score = scorer.calculateFitScore(skill, context);
      expect(score).toBeGreaterThan(0.8);
    });

    it('should give lower score for mismatched industry', () => {
      const skill: Skill = {
        name: 'Healthcare Compliance',
        description: 'Healthcare specific compliance tool',
        category: 'compliance',
        targetIndustry: 'healthcare',
        targetRole: 'compliance officer',
        triggers: []
      };

      const context: RecommendationContext = {
        industry: 'finance',
        roles: ['analyst'],
        companySize: 'medium'
      };

      const score = scorer.calculateFitScore(skill, context);
      expect(score).toBeLessThan(0.5);
    });

    it('should handle missing context gracefully', () => {
      const skill: Skill = {
        name: 'Generic Tool',
        description: 'A generic productivity tool',
        category: 'productivity',
        triggers: []
      };

      const context: RecommendationContext = {
        industry: 'tech',
        roles: []
      };

      const score = scorer.calculateFitScore(skill, context);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });

  describe('calculateImpactScore', () => {
    it('should give high score for high-impact pains', () => {
      const highImpactPains: PainPattern[] = [
        {
          name: 'Critical System Downtime',
          description: 'System crashes frequently',
          category: 'reliability',
          impact: 0.95,
          occurrenceCount: 20
        },
        {
          name: 'Data Loss',
          description: 'Regular data loss incidents',
          category: 'data',
          impact: 0.9,
          occurrenceCount: 10
        }
      ];

      const score = scorer.calculateImpactScore(highImpactPains);
      expect(score).toBeGreaterThan(0.8);
    });

    it('should give bonus for solving multiple pains', () => {
      const manyPains: PainPattern[] = Array(6).fill(null).map((_, i) => ({
        name: `Pain ${i}`,
        description: `Description ${i}`,
        category: 'various',
        impact: 0.5,
        occurrenceCount: 5
      }));

      const score = scorer.calculateImpactScore(manyPains);
      expect(score).toBeGreaterThan(0.5); // Base impact + coverage bonus
    });

    it('should return 0 for no matched pains', () => {
      const score = scorer.calculateImpactScore([]);
      expect(score).toBe(0);
    });
  });

  describe('calculateCostScore', () => {
    it('should give low cost score for skill with many assets', () => {
      const skill: Skill = {
        name: 'Well-Documented Skill',
        description: 'Has extensive documentation and assets',
        category: 'automation',
        triggers: [],
        assets: {
          scripts: ['script1.js', 'script2.py', 'script3.sh'],
          templates: ['template1.docx', 'template2.xlsx'],
          documents: ['README.md', 'GUIDE.md', 'API.md', 'EXAMPLES.md']
        },
        implementations: 15,
        successRate: 90
      };

      const score = scorer.calculateCostScore(skill);
      expect(score).toBeLessThan(0.3); // Low cost = good
    });

    it('should give high cost score for complex skill with no assets', () => {
      const skill: Skill = {
        name: 'Complex Enterprise Integration',
        description: 'Complex enterprise-scale integration requiring distributed systems',
        category: 'integration',
        triggers: []
      };

      const score = scorer.calculateCostScore(skill);
      expect(score).toBeGreaterThan(0.5); // High cost
    });
  });

  describe('calculateReproducibilityScore', () => {
    it('should give high score for well-documented, proven skill', () => {
      const skill: Skill = {
        name: 'Proven Automation',
        description: 'Simple, well-tested automation',
        category: 'automation',
        triggers: [],
        assets: {
          scripts: ['main.py'],
          templates: ['config.yml'],
          documents: ['setup.md', 'usage.md']
        },
        implementations: 25,
        successRate: 92,
        evolutionLevel: 4
      };

      const score = scorer.calculateReproducibilityScore(skill);
      expect(score).toBeGreaterThan(0.8);
    });

    it('should give lower score for specialized skill', () => {
      const skill: Skill = {
        name: 'Industry-Specific Tool',
        description: 'Highly specialized tool for specific industry',
        category: 'specialized',
        targetIndustry: 'aerospace',
        targetRole: 'specialist',
        triggers: [],
        implementations: 2,
        successRate: 65
      };

      const score = scorer.calculateReproducibilityScore(skill);
      expect(score).toBeLessThan(0.6);
    });
  });

  describe('getDetailedScoringBreakdown', () => {
    it('should provide detailed breakdown of all metrics', () => {
      const skill: Skill = {
        name: 'Test Skill',
        description: 'A test skill for breakdown',
        category: 'test',
        targetIndustry: 'tech',
        triggers: [],
        assets: {
          scripts: ['test.js']
        }
      };

      const pains: PainPattern[] = [
        {
          name: 'Test Pain',
          description: 'A test pain',
          category: 'test',
          impact: 0.7
        }
      ];

      const context: RecommendationContext = {
        industry: 'tech',
        roles: ['developer']
      };

      const breakdown = scorer.getDetailedScoringBreakdown(skill, pains, context);

      expect(breakdown).toHaveProperty('metrics');
      expect(breakdown).toHaveProperty('details');
      expect(breakdown.details).toHaveProperty('fitIndustryRole');
      expect(breakdown.details).toHaveProperty('painImpact');
      expect(breakdown.details).toHaveProperty('adoptionCost');
      expect(breakdown.details).toHaveProperty('reproducibility');

      expect(breakdown.details.fitIndustryRole).toHaveProperty('industryFit');
      expect(breakdown.details.fitIndustryRole).toHaveProperty('roleFit');
      expect(breakdown.details.fitIndustryRole).toHaveProperty('sizeFit');
    });
  });
});