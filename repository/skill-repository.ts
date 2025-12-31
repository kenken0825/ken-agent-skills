/**
 * Skill Repository Implementation
 * 
 * This repository provides methods for loading and querying skills 
 * from the mock skill pool, including filtering, searching, and 
 * retrieving skills by various criteria.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { 
  Skill, 
  IndustryCategory, 
  FilterCondition, 
  FilterOperator,
  SortInfo,
  PaginationInfo,
  ApiResponse,
  ApiError,
  EVOLUTION_LEVELS
} from '../shared/types';

/**
 * Extended Skill interface for repository with additional fields from mock data
 */
export interface RepositorySkill extends Skill {
  id: string;
  industry: string;
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
}

/**
 * Skill search criteria
 */
export interface SkillSearchCriteria {
  query?: string;
  industry?: string;
  category?: string;
  evolutionLevel?: number;
  complexity?: 'low' | 'medium' | 'high';
  tags?: string[];
  status?: 'active' | 'inactive' | 'deprecated';
}

/**
 * Skill filter options
 */
export interface SkillFilterOptions {
  filters?: FilterCondition<RepositorySkill>[];
  sort?: SortInfo<keyof RepositorySkill>;
  pagination?: {
    page: number;
    limit: number;
  };
}

/**
 * Skill Repository Class
 */
export class SkillRepository {
  private skills: Map<string, RepositorySkill> = new Map();
  private skillsByIndustry: Map<string, Set<string>> = new Map();
  private skillsByCategory: Map<string, Set<string>> = new Map();
  private skillsByLevel: Map<number, Set<string>> = new Map();
  private skillIndex: any = null;
  private dataPath: string;
  private isLoaded: boolean = false;

  constructor(dataPath?: string) {
    this.dataPath = dataPath || path.join(process.cwd(), 'data', 'mock-skills');
  }

  /**
   * Load all skills from the mock skill pool
   */
  async loadSkills(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    try {
      // Load skill index
      const indexPath = path.join(this.dataPath, 'skill-index.yaml');
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      this.skillIndex = yaml.load(indexContent) as any;

      // Load all skill files
      const files = fs.readdirSync(this.dataPath)
        .filter(file => file.endsWith('.yaml') && file !== 'skill-index.yaml');

      for (const file of files) {
        const filePath = path.join(this.dataPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const skillData = yaml.load(content) as any;

        if (skillData && skillData.id) {
          const skill = this.mapToRepositorySkill(skillData);
          this.addSkillToIndexes(skill);
        }
      }

      this.isLoaded = true;
    } catch (error) {
      throw new Error(`Failed to load skills: ${error.message}`);
    }
  }

  /**
   * Map raw skill data to RepositorySkill interface
   */
  private mapToRepositorySkill(data: any): RepositorySkill {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      industry: data.industry,
      triggers: data.triggers || [],
      evolutionLevel: data.evolution_level,
      complexity: data.complexity,
      prerequisites: data.prerequisites,
      implementation: data.implementation,
      benefits: data.benefits,
      metrics: data.metrics,
      tags: data.tags,
      status: data.status,
      created_date: data.created_date,
      updated_date: data.updated_date,
      metadata: {
        industry: data.industry,
        complexity: data.complexity,
        status: data.status
      }
    };
  }

  /**
   * Add skill to various indexes for fast lookup
   */
  private addSkillToIndexes(skill: RepositorySkill): void {
    // Add to main map
    this.skills.set(skill.id, skill);

    // Index by industry
    if (!this.skillsByIndustry.has(skill.industry)) {
      this.skillsByIndustry.set(skill.industry, new Set());
    }
    this.skillsByIndustry.get(skill.industry)!.add(skill.id);

    // Index by category
    if (!this.skillsByCategory.has(skill.category)) {
      this.skillsByCategory.set(skill.category, new Set());
    }
    this.skillsByCategory.get(skill.category)!.add(skill.id);

    // Index by evolution level
    if (skill.evolutionLevel) {
      if (!this.skillsByLevel.has(skill.evolutionLevel)) {
        this.skillsByLevel.set(skill.evolutionLevel, new Set());
      }
      this.skillsByLevel.get(skill.evolutionLevel)!.add(skill.id);
    }
  }

  /**
   * Get skill by ID
   */
  async getSkillById(id: string): Promise<RepositorySkill | null> {
    await this.ensureLoaded();
    return this.skills.get(id) || null;
  }

  /**
   * Get all skills
   */
  async getAllSkills(): Promise<RepositorySkill[]> {
    await this.ensureLoaded();
    return Array.from(this.skills.values());
  }

  /**
   * Get skills by industry
   */
  async getSkillsByIndustry(industry: string): Promise<RepositorySkill[]> {
    await this.ensureLoaded();
    const skillIds = this.skillsByIndustry.get(industry);
    if (!skillIds) return [];
    
    return Array.from(skillIds)
      .map(id => this.skills.get(id))
      .filter(skill => skill !== undefined) as RepositorySkill[];
  }

  /**
   * Get skills by category
   */
  async getSkillsByCategory(category: string): Promise<RepositorySkill[]> {
    await this.ensureLoaded();
    const skillIds = this.skillsByCategory.get(category);
    if (!skillIds) return [];
    
    return Array.from(skillIds)
      .map(id => this.skills.get(id))
      .filter(skill => skill !== undefined) as RepositorySkill[];
  }

  /**
   * Get skills by evolution level
   */
  async getSkillsByEvolutionLevel(level: number): Promise<RepositorySkill[]> {
    await this.ensureLoaded();
    const skillIds = this.skillsByLevel.get(level);
    if (!skillIds) return [];
    
    return Array.from(skillIds)
      .map(id => this.skills.get(id))
      .filter(skill => skill !== undefined) as RepositorySkill[];
  }

  /**
   * Search skills by criteria
   */
  async searchSkills(criteria: SkillSearchCriteria): Promise<RepositorySkill[]> {
    await this.ensureLoaded();
    let results = Array.from(this.skills.values());

    // Filter by industry
    if (criteria.industry) {
      results = results.filter(skill => skill.industry === criteria.industry);
    }

    // Filter by category
    if (criteria.category) {
      results = results.filter(skill => skill.category === criteria.category);
    }

    // Filter by evolution level
    if (criteria.evolutionLevel !== undefined) {
      results = results.filter(skill => skill.evolutionLevel === criteria.evolutionLevel);
    }

    // Filter by complexity
    if (criteria.complexity) {
      results = results.filter(skill => skill.complexity === criteria.complexity);
    }

    // Filter by status
    if (criteria.status) {
      results = results.filter(skill => skill.status === criteria.status);
    }

    // Filter by tags
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(skill => 
        skill.tags && criteria.tags!.some(tag => skill.tags!.includes(tag))
      );
    }

    // Text search in name and description
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      results = results.filter(skill =>
        skill.name.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query)
      );
    }

    return results;
  }

  /**
   * Filter skills with advanced options
   */
  async filterSkills(options: SkillFilterOptions): Promise<{
    skills: RepositorySkill[];
    pagination?: PaginationInfo;
  }> {
    await this.ensureLoaded();
    let results = Array.from(this.skills.values());

    // Apply filters
    if (options.filters) {
      for (const filter of options.filters) {
        results = this.applyFilter(results, filter);
      }
    }

    // Apply sorting
    if (options.sort) {
      results = this.applySorting(results, options.sort);
    }

    // Apply pagination
    let paginationInfo: PaginationInfo | undefined;
    if (options.pagination) {
      const { page, limit } = options.pagination;
      const total = results.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const end = start + limit;

      results = results.slice(start, end);
      
      paginationInfo = {
        page,
        limit,
        total,
        totalPages
      };
    }

    return {
      skills: results,
      pagination: paginationInfo
    };
  }

  /**
   * Apply single filter condition
   */
  private applyFilter(
    skills: RepositorySkill[], 
    filter: FilterCondition<RepositorySkill>
  ): RepositorySkill[] {
    const { field, operator, value } = filter;

    return skills.filter(skill => {
      const fieldValue = skill[field as keyof RepositorySkill];

      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'notEquals':
          return fieldValue !== value;
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
        case 'startsWith':
          return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());
        case 'endsWith':
          return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());
        case 'gt':
          return Number(fieldValue) > Number(value);
        case 'gte':
          return Number(fieldValue) >= Number(value);
        case 'lt':
          return Number(fieldValue) < Number(value);
        case 'lte':
          return Number(fieldValue) <= Number(value);
        case 'in':
          return Array.isArray(value) && value.includes(fieldValue);
        case 'notIn':
          return Array.isArray(value) && !value.includes(fieldValue);
        default:
          return true;
      }
    });
  }

  /**
   * Apply sorting to results
   */
  private applySorting(
    skills: RepositorySkill[], 
    sort: SortInfo<keyof RepositorySkill>
  ): RepositorySkill[] {
    return skills.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sort.direction === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Get skill statistics
   */
  async getStatistics(): Promise<{
    totalSkills: number;
    byIndustry: Record<string, number>;
    byCategory: Record<string, number>;
    byEvolutionLevel: Record<number, number>;
    byComplexity: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    await this.ensureLoaded();
    
    const skills = Array.from(this.skills.values());
    
    // Count by industry
    const byIndustry: Record<string, number> = {};
    for (const [industry, skillIds] of this.skillsByIndustry) {
      byIndustry[industry] = skillIds.size;
    }

    // Count by category
    const byCategory: Record<string, number> = {};
    for (const [category, skillIds] of this.skillsByCategory) {
      byCategory[category] = skillIds.size;
    }

    // Count by evolution level
    const byEvolutionLevel: Record<number, number> = {};
    for (const [level, skillIds] of this.skillsByLevel) {
      byEvolutionLevel[level] = skillIds.size;
    }

    // Count by complexity
    const byComplexity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0
    };
    skills.forEach(skill => {
      if (skill.complexity) {
        byComplexity[skill.complexity]++;
      }
    });

    // Count by status
    const byStatus: Record<string, number> = {
      active: 0,
      inactive: 0,
      deprecated: 0
    };
    skills.forEach(skill => {
      if (skill.status) {
        byStatus[skill.status]++;
      }
    });

    return {
      totalSkills: skills.length,
      byIndustry,
      byCategory,
      byEvolutionLevel,
      byComplexity,
      byStatus
    };
  }

  /**
   * Get available filters
   */
  async getAvailableFilters(): Promise<{
    industries: string[];
    categories: string[];
    evolutionLevels: number[];
    complexities: string[];
    statuses: string[];
    tags: string[];
  }> {
    await this.ensureLoaded();
    
    const skills = Array.from(this.skills.values());
    const tags = new Set<string>();
    const complexities = new Set<string>();
    const statuses = new Set<string>();

    skills.forEach(skill => {
      if (skill.tags) {
        skill.tags.forEach(tag => tags.add(tag));
      }
      if (skill.complexity) {
        complexities.add(skill.complexity);
      }
      if (skill.status) {
        statuses.add(skill.status);
      }
    });

    return {
      industries: Array.from(this.skillsByIndustry.keys()).sort(),
      categories: Array.from(this.skillsByCategory.keys()).sort(),
      evolutionLevels: Array.from(this.skillsByLevel.keys()).sort((a, b) => a - b),
      complexities: Array.from(complexities).sort(),
      statuses: Array.from(statuses).sort(),
      tags: Array.from(tags).sort()
    };
  }

  /**
   * Get related skills
   */
  async getRelatedSkills(skillId: string, limit: number = 5): Promise<RepositorySkill[]> {
    await this.ensureLoaded();
    
    const skill = this.skills.get(skillId);
    if (!skill) return [];

    const relatedScores = new Map<string, number>();

    // Score other skills based on similarity
    for (const [otherId, otherSkill] of this.skills) {
      if (otherId === skillId) continue;

      let score = 0;

      // Same industry
      if (otherSkill.industry === skill.industry) score += 3;

      // Same category
      if (otherSkill.category === skill.category) score += 2;

      // Similar evolution level
      if (otherSkill.evolutionLevel && skill.evolutionLevel) {
        const levelDiff = Math.abs(otherSkill.evolutionLevel - skill.evolutionLevel);
        score += (3 - levelDiff);
      }

      // Overlapping tags
      if (skill.tags && otherSkill.tags) {
        const overlap = skill.tags.filter(tag => otherSkill.tags!.includes(tag)).length;
        score += overlap;
      }

      if (score > 0) {
        relatedScores.set(otherId, score);
      }
    }

    // Sort by score and return top N
    const sortedRelated = Array.from(relatedScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => this.skills.get(id))
      .filter(skill => skill !== undefined) as RepositorySkill[];

    return sortedRelated;
  }

  /**
   * Ensure skills are loaded before operations
   */
  private async ensureLoaded(): Promise<void> {
    if (!this.isLoaded) {
      await this.loadSkills();
    }
  }

  /**
   * Get skill index summary
   */
  async getSkillIndexSummary(): Promise<any> {
    await this.ensureLoaded();
    return this.skillIndex;
  }

  /**
   * Export skills to JSON
   */
  async exportToJSON(): Promise<string> {
    await this.ensureLoaded();
    const skills = Array.from(this.skills.values());
    return JSON.stringify(skills, null, 2);
  }

  /**
   * Clear repository cache
   */
  clearCache(): void {
    this.skills.clear();
    this.skillsByIndustry.clear();
    this.skillsByCategory.clear();
    this.skillsByLevel.clear();
    this.skillIndex = null;
    this.isLoaded = false;
  }
}

// Export default instance
export default new SkillRepository();