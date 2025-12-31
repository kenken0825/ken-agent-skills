/**
 * Agent Integration Example
 * 
 * This example demonstrates how agents can use the skill repository
 * to find and recommend skills based on specific criteria
 */

import { SkillRepository, RepositorySkill } from '../skill-repository';
import { PainPattern, WinIndicator } from '../../shared/types';

// Mock pain patterns (would come from Pain Abstractor agent)
const mockPainPatterns: PainPattern[] = [
  {
    id: 'pain-001',
    name: 'Manual Invoice Processing',
    category: 'process',
    description: 'Time-consuming manual entry of invoice data',
    symptoms: ['High error rate', 'Slow processing', 'Duplicate payments'],
    impact: 85
  },
  {
    id: 'pain-002', 
    name: 'Reactive Maintenance',
    category: 'technology',
    description: 'Equipment failures causing production downtime',
    symptoms: ['Unexpected breakdowns', 'High repair costs', 'Production delays'],
    impact: 90
  }
];

// Mock win indicators (would come from Win Point Hunter agent)
const mockWinIndicators: WinIndicator[] = [
  {
    id: 'win-001',
    name: 'Process Automation',
    category: 'efficiency',
    description: 'Automate repetitive manual tasks',
    impact: 80,
    crystallized: true
  },
  {
    id: 'win-002',
    name: 'Predictive Analytics',
    category: 'quality',
    description: 'Use data to predict and prevent issues',
    impact: 75,
    crystallized: true
  }
];

/**
 * Skill Recommender Agent simulation
 */
class SkillRecommenderAgent {
  constructor(private repository: SkillRepository) {}

  /**
   * Find skills that address specific pain patterns
   */
  async findSkillsForPainPattern(pain: PainPattern): Promise<RepositorySkill[]> {
    // Map pain patterns to search criteria
    const searchCriteria: any = {};

    // Invoice processing pain -> finance automation skills
    if (pain.name.toLowerCase().includes('invoice')) {
      searchCriteria.category = 'finance_automation';
      searchCriteria.query = 'invoice';
    }

    // Maintenance pain -> predictive maintenance skills
    if (pain.name.toLowerCase().includes('maintenance')) {
      searchCriteria.category = 'maintenance';
      searchCriteria.query = 'predictive';
    }

    return await this.repository.searchSkills(searchCriteria);
  }

  /**
   * Score skills based on win indicators
   */
  scoreSkillsForWinIndicators(
    skills: RepositorySkill[], 
    winIndicators: WinIndicator[]
  ): Array<{ skill: RepositorySkill; score: number; reasons: string[] }> {
    return skills.map(skill => {
      let score = 0;
      const reasons: string[] = [];

      // Score based on evolution level
      if (skill.evolutionLevel) {
        score += skill.evolutionLevel * 10;
        reasons.push(`Evolution Level ${skill.evolutionLevel}`);
      }

      // Score based on win indicator alignment
      winIndicators.forEach(win => {
        if (win.category === 'efficiency' && skill.name.includes('Automat')) {
          score += win.impact;
          reasons.push(`Aligns with ${win.name}`);
        }
        if (win.category === 'quality' && skill.name.includes('Predictive')) {
          score += win.impact;
          reasons.push(`Aligns with ${win.name}`);
        }
      });

      // Bonus for lower complexity
      if (skill.complexity === 'low') score += 20;
      if (skill.complexity === 'medium') score += 10;

      return { skill, score, reasons };
    }).sort((a, b) => b.score - a.score);
  }
}

/**
 * Skill Evolution Judge Agent simulation
 */
class SkillEvolutionJudgeAgent {
  constructor(private repository: SkillRepository) {}

  /**
   * Analyze skills ready for evolution
   */
  async findSkillsReadyForEvolution(): Promise<RepositorySkill[]> {
    const allSkills = await this.repository.getAllSkills();
    
    return allSkills.filter(skill => {
      // Skills at level 2 with proven results
      if (skill.evolutionLevel === 2 && skill.status === 'active') {
        return true;
      }
      // Skills at level 3 with cross-industry potential
      if (skill.evolutionLevel === 3 && skill.tags?.includes('cross-industry')) {
        return true;
      }
      return false;
    });
  }

  /**
   * Suggest evolution strategies
   */
  suggestEvolutionStrategy(skill: RepositorySkill): string[] {
    const strategies: string[] = [];

    if (skill.evolutionLevel === 2) {
      strategies.push('Test in different industries to validate cross-industry applicability');
      strategies.push('Abstract core patterns that work across contexts');
    }

    if (skill.evolutionLevel === 3) {
      strategies.push('Remove industry-specific dependencies');
      strategies.push('Create configurable templates for different contexts');
    }

    if (skill.complexity === 'high') {
      strategies.push('Break down into smaller, reusable components');
    }

    return strategies;
  }
}

/**
 * Main orchestration example
 */
async function demonstrateAgentIntegration() {
  const repository = new SkillRepository();
  const recommender = new SkillRecommenderAgent(repository);
  const evolutionJudge = new SkillEvolutionJudgeAgent(repository);

  console.log('=== Agent Integration Example ===\n');

  // Step 1: Process pain patterns
  console.log('Step 1: Finding skills for identified pain patterns...');
  for (const pain of mockPainPatterns) {
    console.log(`\nPain: ${pain.name} (Impact: ${pain.impact})`);
    const skills = await recommender.findSkillsForPainPattern(pain);
    console.log(`Found ${skills.length} matching skills:`);
    skills.forEach(skill => {
      console.log(`  - ${skill.name} (${skill.industry}, Level ${skill.evolutionLevel})`);
    });
  }

  // Step 2: Score skills based on win indicators
  console.log('\n\nStep 2: Scoring skills based on win indicators...');
  const allSkills = await repository.getAllSkills();
  const scoredSkills = recommender.scoreSkillsForWinIndicators(allSkills, mockWinIndicators);
  
  console.log('Top 5 recommended skills:');
  scoredSkills.slice(0, 5).forEach((item, index) => {
    console.log(`${index + 1}. ${item.skill.name} (Score: ${item.score})`);
    console.log(`   Reasons: ${item.reasons.join(', ')}`);
  });

  // Step 3: Identify evolution opportunities
  console.log('\n\nStep 3: Identifying skill evolution opportunities...');
  const evolutionCandidates = await evolutionJudge.findSkillsReadyForEvolution();
  
  console.log(`Found ${evolutionCandidates.length} skills ready for evolution:`);
  evolutionCandidates.forEach(skill => {
    console.log(`\n- ${skill.name} (Current Level: ${skill.evolutionLevel})`);
    const strategies = evolutionJudge.suggestEvolutionStrategy(skill);
    console.log('  Evolution strategies:');
    strategies.forEach(strategy => console.log(`    • ${strategy}`));
  });

  // Step 4: Cross-reference for optimal recommendations
  console.log('\n\nStep 4: Cross-referenced recommendations...');
  const optimalSkills = scoredSkills
    .filter(item => item.score > 50)
    .filter(item => item.skill.evolutionLevel >= 3)
    .slice(0, 3);

  console.log('Optimal skills for immediate implementation:');
  optimalSkills.forEach(item => {
    console.log(`\n${item.skill.name}`);
    console.log(`  Industry: ${item.skill.industry}`);
    console.log(`  Category: ${item.skill.category}`);
    console.log(`  Evolution Level: ${item.skill.evolutionLevel}`);
    console.log(`  Complexity: ${item.skill.complexity}`);
    if (item.skill.implementation) {
      console.log(`  Implementation: ${item.skill.implementation.estimated_hours} hours`);
    }
  });
}

// Run the demonstration
if (require.main === module) {
  demonstrateAgentIntegration().catch(console.error);
}