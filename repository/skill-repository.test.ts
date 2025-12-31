/**
 * Skill Repository Test Suite
 * 
 * Example usage and tests for the skill repository implementation
 */

import { SkillRepository } from './skill-repository';

async function testSkillRepository() {
  console.log('=== Skill Repository Test Suite ===\n');

  // Initialize repository
  const repository = new SkillRepository();

  try {
    // Test 1: Load all skills
    console.log('Test 1: Loading all skills...');
    await repository.loadSkills();
    const allSkills = await repository.getAllSkills();
    console.log(`✓ Loaded ${allSkills.length} skills\n`);

    // Test 2: Get skill by ID
    console.log('Test 2: Getting skill by ID...');
    const skillById = await repository.getSkillById('it-fin-003');
    if (skillById) {
      console.log(`✓ Found skill: ${skillById.name}`);
      console.log(`  Industry: ${skillById.industry}`);
      console.log(`  Category: ${skillById.category}`);
      console.log(`  Evolution Level: ${skillById.evolutionLevel}\n`);
    }

    // Test 3: Get skills by industry
    console.log('Test 3: Getting skills by industry...');
    const itSkills = await repository.getSkillsByIndustry('IT');
    console.log(`✓ Found ${itSkills.length} IT skills:`);
    itSkills.forEach(skill => {
      console.log(`  - ${skill.name} (Level ${skill.evolutionLevel})`);
    });
    console.log();

    // Test 4: Get skills by evolution level
    console.log('Test 4: Getting skills by evolution level...');
    const level3Skills = await repository.getSkillsByEvolutionLevel(3);
    console.log(`✓ Found ${level3Skills.length} Level 3 skills:`);
    level3Skills.forEach(skill => {
      console.log(`  - ${skill.name} (${skill.industry})`);
    });
    console.log();

    // Test 5: Search skills
    console.log('Test 5: Searching skills...');
    const searchResults = await repository.searchSkills({
      query: 'automation',
      evolutionLevel: 3
    });
    console.log(`✓ Found ${searchResults.length} skills matching 'automation' at Level 3:`);
    searchResults.forEach(skill => {
      console.log(`  - ${skill.name}`);
    });
    console.log();

    // Test 6: Advanced filtering with pagination
    console.log('Test 6: Advanced filtering with pagination...');
    const filterResults = await repository.filterSkills({
      filters: [
        { field: 'industry', operator: 'in', value: ['IT', 'retail'] },
        { field: 'evolutionLevel', operator: 'gte', value: 3 }
      ],
      sort: { field: 'evolutionLevel', direction: 'desc' },
      pagination: { page: 1, limit: 5 }
    });
    console.log(`✓ Filtered results (Page 1 of ${filterResults.pagination?.totalPages}):`);
    filterResults.skills.forEach(skill => {
      console.log(`  - ${skill.name} (${skill.industry}, Level ${skill.evolutionLevel})`);
    });
    console.log();

    // Test 7: Get statistics
    console.log('Test 7: Getting statistics...');
    const stats = await repository.getStatistics();
    console.log('✓ Repository statistics:');
    console.log(`  Total skills: ${stats.totalSkills}`);
    console.log('  By Industry:', stats.byIndustry);
    console.log('  By Evolution Level:', stats.byEvolutionLevel);
    console.log('  By Complexity:', stats.byComplexity);
    console.log();

    // Test 8: Get available filters
    console.log('Test 8: Getting available filters...');
    const filters = await repository.getAvailableFilters();
    console.log('✓ Available filters:');
    console.log(`  Industries: ${filters.industries.join(', ')}`);
    console.log(`  Categories: ${filters.categories.join(', ')}`);
    console.log(`  Evolution Levels: ${filters.evolutionLevels.join(', ')}`);
    console.log(`  Tags: ${filters.tags.slice(0, 5).join(', ')}...`);
    console.log();

    // Test 9: Get related skills
    console.log('Test 9: Getting related skills...');
    if (skillById) {
      const relatedSkills = await repository.getRelatedSkills(skillById.id, 3);
      console.log(`✓ Skills related to "${skillById.name}":`);
      relatedSkills.forEach(skill => {
        console.log(`  - ${skill.name} (${skill.industry}, ${skill.category})`);
      });
      console.log();
    }

    // Test 10: Complex search scenario
    console.log('Test 10: Complex search scenario...');
    console.log('Searching for: Medium complexity automation skills in manufacturing or IT');
    const complexSearch = await repository.searchSkills({
      query: 'system',
      industry: 'manufacturing',
      complexity: 'medium'
    });
    const complexSearch2 = await repository.searchSkills({
      query: 'system',
      industry: 'IT',
      complexity: 'medium'
    });
    const combinedResults = [...complexSearch, ...complexSearch2];
    console.log(`✓ Found ${combinedResults.length} matching skills:`);
    combinedResults.forEach(skill => {
      console.log(`  - ${skill.name} (${skill.industry})`);
    });
    console.log();

    // Test 11: Export to JSON
    console.log('Test 11: Exporting to JSON...');
    const jsonExport = await repository.exportToJSON();
    const exportedData = JSON.parse(jsonExport);
    console.log(`✓ Exported ${exportedData.length} skills to JSON format`);
    console.log(`  First skill: ${exportedData[0].name}`);
    console.log();

    console.log('=== All tests completed successfully! ===');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testSkillRepository().catch(console.error);
}