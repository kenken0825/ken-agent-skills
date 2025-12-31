# Skill Repository

The Skill Repository provides a comprehensive interface for loading, querying, and managing skills from the mock skill pool. It offers various methods for finding skills by ID, filtering, searching, and analyzing skill data.

## Features

- **Load skills from YAML files**: Automatically loads all skills from the mock skill pool
- **Multiple indexing strategies**: Fast lookups by ID, industry, category, and evolution level
- **Advanced search capabilities**: Search by text query, industry, category, complexity, and more
- **Flexible filtering**: Support for multiple filter conditions with various operators
- **Pagination and sorting**: Handle large result sets efficiently
- **Statistical analysis**: Get insights about skill distribution
- **Related skills discovery**: Find similar skills based on multiple criteria

## Installation

```typescript
import { SkillRepository } from './repository/skill-repository';
```

## Usage

### Basic Usage

```typescript
// Initialize repository
const repository = new SkillRepository();

// Load skills (automatically done on first operation)
await repository.loadSkills();

// Get all skills
const allSkills = await repository.getAllSkills();

// Get skill by ID
const skill = await repository.getSkillById('it-fin-003');

// Get skills by industry
const itSkills = await repository.getSkillsByIndustry('IT');

// Get skills by evolution level
const level3Skills = await repository.getSkillsByEvolutionLevel(3);
```

### Search Capabilities

```typescript
// Search with multiple criteria
const results = await repository.searchSkills({
  query: 'automation',         // Text search in name and description
  industry: 'IT',              // Filter by industry
  category: 'finance_automation', // Filter by category
  evolutionLevel: 3,           // Filter by evolution level
  complexity: 'medium',        // Filter by complexity
  tags: ['RPA', 'OCR'],       // Filter by tags
  status: 'active'            // Filter by status
});
```

### Advanced Filtering

```typescript
// Complex filtering with operators
const filtered = await repository.filterSkills({
  filters: [
    { field: 'industry', operator: 'in', value: ['IT', 'retail'] },
    { field: 'evolutionLevel', operator: 'gte', value: 3 },
    { field: 'complexity', operator: 'notEquals', value: 'high' }
  ],
  sort: { field: 'evolutionLevel', direction: 'desc' },
  pagination: { page: 1, limit: 10 }
});

console.log(filtered.skills);      // Array of skills
console.log(filtered.pagination);   // Pagination info
```

### Available Filter Operators

- `equals`: Exact match
- `notEquals`: Not equal to value
- `contains`: Contains substring (case-insensitive)
- `startsWith`: Starts with string (case-insensitive)
- `endsWith`: Ends with string (case-insensitive)
- `gt`: Greater than
- `gte`: Greater than or equal
- `lt`: Less than
- `lte`: Less than or equal
- `in`: Value is in array
- `notIn`: Value is not in array

### Statistics and Analytics

```typescript
// Get repository statistics
const stats = await repository.getStatistics();
console.log(stats);
// {
//   totalSkills: 12,
//   byIndustry: { manufacturing: 4, IT: 4, retail: 4 },
//   byCategory: { ... },
//   byEvolutionLevel: { 1: 0, 2: 4, 3: 5, 4: 3 },
//   byComplexity: { low: 2, medium: 6, high: 4 },
//   byStatus: { active: 12, inactive: 0, deprecated: 0 }
// }

// Get available filter options
const filters = await repository.getAvailableFilters();
// Returns lists of all available industries, categories, levels, etc.
```

### Related Skills Discovery

```typescript
// Find skills related to a specific skill
const relatedSkills = await repository.getRelatedSkills('it-fin-003', 5);
// Returns up to 5 skills most similar to the specified skill
```

## Data Model

### RepositorySkill Interface

```typescript
interface RepositorySkill extends Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string;
  triggers: string[];
  evolutionLevel?: number;
  complexity?: 'low' | 'medium' | 'high';
  prerequisites?: string[];
  implementation?: {
    estimated_hours: number;
    technologies: string[];
    integration_points: string[];
  };
  benefits?: string[];
  metrics?: string[];
  tags?: string[];
  status?: 'active' | 'inactive' | 'deprecated';
  created_date?: string;
  updated_date?: string;
  metadata?: Record<string, any>;
}
```

## Performance Considerations

- Skills are loaded once and cached in memory
- Multiple indexes are maintained for O(1) lookups by ID and O(n) for filtered queries
- Pagination is recommended for large result sets
- Use `clearCache()` to force reload if skill data changes

## Testing

Run the test suite to verify functionality:

```bash
npm run test repository/skill-repository.test.ts
```

Or run directly with ts-node:

```bash
npx ts-node repository/skill-repository.test.ts
```

## Error Handling

The repository throws errors in the following cases:
- Failed to read skill files
- Invalid YAML format
- Missing required skill fields

Always wrap repository calls in try-catch blocks for production use.

## Future Enhancements

- Full-text search with relevance scoring
- Skill versioning support
- Real-time updates via file watchers
- Database backend option
- Caching strategies for large datasets
- GraphQL API support