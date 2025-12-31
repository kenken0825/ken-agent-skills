/**
 * Basic Usage Example for Skill Repository
 * 
 * This example demonstrates common use cases for the skill repository
 */

import { SkillRepository } from '../skill-repository';

async function main() {
  // Initialize repository
  const repository = new SkillRepository();

  // Example 1: Find skills for a specific industry and role
  console.log('=== Finding skills for IT Finance teams ===');
  const itFinanceSkills = await repository.searchSkills({
    industry: 'IT',
    category: 'finance_automation'
  });
  
  itFinanceSkills.forEach(skill => {
    console.log(`\n${skill.name}`);
    console.log(`Description: ${skill.description}`);
    console.log(`Complexity: ${skill.complexity}`);
    console.log(`Evolution Level: ${skill.evolutionLevel}`);
    if (skill.benefits) {
      console.log('Benefits:');
      skill.benefits.forEach(benefit => console.log(`  - ${benefit}`));
    }
  });

  // Example 2: Find advanced skills ready for enterprise deployment
  console.log('\n\n=== Enterprise-ready skills (Level 3+) ===');
  const enterpriseSkills = await repository.filterSkills({
    filters: [
      { field: 'evolutionLevel', operator: 'gte', value: 3 },
      { field: 'status', operator: 'equals', value: 'active' }
    ],
    sort: { field: 'evolutionLevel', direction: 'desc' }
  });

  console.log(`Found ${enterpriseSkills.skills.length} enterprise-ready skills:`);
  enterpriseSkills.skills.forEach(skill => {
    console.log(`- ${skill.name} (${skill.industry}, Level ${skill.evolutionLevel})`);
  });

  // Example 3: Analyze skill distribution
  console.log('\n\n=== Skill Distribution Analysis ===');
  const stats = await repository.getStatistics();
  
  console.log('Skills by Industry:');
  Object.entries(stats.byIndustry).forEach(([industry, count]) => {
    console.log(`  ${industry}: ${count} skills`);
  });
  
  console.log('\nSkills by Evolution Level:');
  Object.entries(stats.byEvolutionLevel).forEach(([level, count]) => {
    console.log(`  Level ${level}: ${count} skills`);
  });

  // Example 4: Find automation opportunities
  console.log('\n\n=== Automation Opportunities ===');
  const automationSkills = await repository.searchSkills({
    query: 'automat',
    status: 'active'
  });

  console.log(`Found ${automationSkills.length} automation-related skills:`);
  const byIndustry = automationSkills.reduce((acc, skill) => {
    acc[skill.industry] = (acc[skill.industry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(byIndustry).forEach(([industry, count]) => {
    console.log(`  ${industry}: ${count} automation opportunities`);
  });

  // Example 5: Skills for quick wins (low complexity, high impact)
  console.log('\n\n=== Quick Win Opportunities ===');
  const quickWins = await repository.filterSkills({
    filters: [
      { field: 'complexity', operator: 'in', value: ['low', 'medium'] },
      { field: 'evolutionLevel', operator: 'gte', value: 2 }
    ]
  });

  console.log('Skills with lower complexity but proven results:');
  quickWins.skills.forEach(skill => {
    console.log(`- ${skill.name}`);
    console.log(`  Complexity: ${skill.complexity}, Evolution Level: ${skill.evolutionLevel}`);
    if (skill.implementation) {
      console.log(`  Estimated Hours: ${skill.implementation.estimated_hours}`);
    }
  });
}

// Run the examples
if (require.main === module) {
  main().catch(console.error);
}