# Skilldex Orchestrator API Reference

## Table of Contents

1. [Overview](#overview)
2. [Core Classes](#core-classes)
   - [SkilldexOrchestrator](#skilldexorchestrator)
3. [Agent Interfaces](#agent-interfaces)
   - [WinPointHunterAgent](#winpointhunteragent)
   - [PainAbstractorAgent](#painabstractoragent)
   - [SkillRecommenderAgent](#skillrecommenderagent)
   - [SkillEvolutionJudgeAgent](#skillevolutionjudgeagent)
   - [GitHubPackagerAgent](#githubpackageragent)
4. [Type Definitions](#type-definitions)
5. [Event System](#event-system)
6. [Integration Guide](#integration-guide)
7. [Extension Points](#extension-points)

## Overview

The Skilldex Orchestrator is a comprehensive workflow management system that coordinates five specialized agents to analyze client needs, identify pain points, and recommend appropriate skills from a repository. This API reference provides detailed information for developers who want to integrate with or extend the orchestrator.

### Architecture

```
┌─────────────────────┐
│ SkilldexOrchestrator│
└──────────┬──────────┘
           │
    ┌──────┴──────┬───────────┬────────────┬─────────────┐
    │             │           │            │             │
┌───▼──────┐ ┌───▼──────┐ ┌──▼──────┐ ┌──▼──────┐ ┌───▼──────┐
│WinPoint  │ │Pain      │ │Skill    │ │Evolution│ │GitHub    │
│Hunter    │ │Abstractor│ │Recommender│ │Judge    │ │Packager  │
└──────────┘ └──────────┘ └─────────┘ └─────────┘ └──────────┘
```

## Core Classes

### SkilldexOrchestrator

The main orchestrator class that manages the workflow pipeline and coordinates agent interactions.

#### Constructor

```typescript
constructor(config?: OrchestratorConfig)
```

##### Parameters

- `config` (optional): Configuration options for the orchestrator

##### Configuration Options

```typescript
interface OrchestratorConfig {
  debug?: boolean;              // Enable debug logging
  timeout?: number;             // Global timeout in milliseconds
  retryAttempts?: number;       // Number of retry attempts on failure
  agents?: {
    winPointHunter?: WinPointHunterConfig;
    painAbstractor?: PainAbstractorConfig;
    skillRecommender?: SkillRecommenderConfig;
    skillEvolutionJudge?: SkillEvolutionJudgeConfig;
    githubPackager?: GitHubPackagerConfig;
  };
}
```

#### Methods

##### execute()

Main execution method that runs the complete orchestration pipeline.

```typescript
async execute(input: SkilldexOrchestratorInput): Promise<SkilldexOrchestratorOutput>
```

###### Parameters

```typescript
interface SkilldexOrchestratorInput {
  mode: 'client_urls' | 'hearing_notes' | 'hybrid';
  data: {
    urls?: string[];        // Client website URLs
    notes?: string;         // Hearing/consultation notes
  };
  options?: {
    maxRecommendations?: number;    // Max skills to recommend
    autoPackage?: boolean;          // Auto-package top skills
    progressiveDisclosure?: boolean; // Enable progressive UI
  };
}
```

###### Returns

```typescript
interface SkilldexOrchestratorOutput {
  status: 'success' | 'partial' | 'failed';
  results: {
    companyProfile?: CompanyInfo;
    painPatterns?: PainPattern[];
    recommendations?: SkillRecommendation[];
    packages?: PackageStructure[];
  };
  errors?: string[];
  executionTime: number;
  pipeline: PipelineStage[];
}
```

##### executeCommand()

Execute individual pipeline commands for fine-grained control.

```typescript
async executeCommand(command: string, data?: any): Promise<any>
```

###### Available Commands

- `INTAKE`: Process initial client data
- `DISCOVER`: Discover pain patterns
- `RANK`: Rank and recommend skills
- `EVOLVE`: Evaluate skill evolution
- `PACKAGE`: Package skills for GitHub

###### Example

```typescript
const orchestrator = new SkilldexOrchestrator();

// Execute INTAKE command
const intakeResult = await orchestrator.executeCommand('INTAKE', {
  urls: ['https://example.com'],
  notes: 'Client consultation notes...'
});

// Execute DISCOVER command
const painPatterns = await orchestrator.executeCommand('DISCOVER');
```

#### Events

The orchestrator extends EventEmitter and emits the following events:

- `pipeline:start` - Pipeline execution started
- `pipeline:complete` - Pipeline execution completed
- `pipeline:error` - Pipeline execution error
- `stage:start` - Individual stage started
- `stage:complete` - Individual stage completed
- `stage:error` - Individual stage error
- `progress:update` - Progress update

##### Event Listeners Example

```typescript
orchestrator.on('progress:update', ({ progress }) => {
  console.log(`Progress: ${progress}%`);
});

orchestrator.on('stage:complete', ({ stageId }) => {
  console.log(`Stage completed: ${stageId}`);
});
```

## Agent Interfaces

### WinPointHunterAgent

Extracts company information and win indicators from client URLs and hearing notes.

#### Input

```typescript
interface WinPointInput {
  clientUrls?: string[];
  hearingNotes?: string;
  hybridMode?: boolean;
}
```

#### Output

```typescript
interface WinPointOutput {
  companyInfo: CompanyInfo;
  winIndicators: WinIndicator[];
}
```

#### Key Types

```typescript
interface WinIndicator {
  id?: string;
  name: string;
  category: 'efficiency' | 'quality' | 'cost' | 'growth' | 'satisfaction';
  description: string;
  impact: number; // 0-100
  evidence?: string;
  crystallized?: boolean;
  context?: string;
}

interface CompanyInfo {
  name: string;
  industry: string;
  description: string;
  values: string[];
  services: string[];
  url?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  foundedYear?: number;
}
```

### PainAbstractorAgent

Identifies and abstracts pain patterns from consultation data.

#### Input

```typescript
interface PainAbstractorInput {
  consultationNotes: string;
  contextInfo?: {
    industry?: string;
    companySize?: string;
  };
}
```

#### Output

```typescript
interface PainAbstractorOutput {
  painPatterns: PainPattern[];
  crossApplicability: {
    industries: string[];
    roles: string[];
  };
}
```

#### Key Types

```typescript
interface PainPattern {
  id?: string;
  name: string;
  category: 'process' | 'communication' | 'technology' | 'resource' | 'compliance' | 'other';
  description: string;
  symptoms: string[];
  rootCause?: string;
  impact?: number; // 0-100
  occurrenceCount?: number;
  abstractionLevel?: AbstractionLevel;
  applicableIndustries?: string[];
  applicableRoles?: string[];
  variations?: string[];
  solutions?: string[];
}

type AbstractionLevel = 'individual' | 'department' | 'organization' | 'industry';
```

### SkillRecommenderAgent

Matches pain patterns with skills and provides ranked recommendations.

#### Input

```typescript
interface SkillRecommenderInput {
  painPatterns: PainPattern[];
  context: RecommendationContext;
  filters?: {
    categories?: string[];
    levels?: number[];
    industries?: string[];
  };
}

interface RecommendationContext {
  industry: string;
  roles: string[];
  companySize?: string;
  currentTools?: string[];
  budget?: 'low' | 'medium' | 'high';
  urgency?: 'low' | 'medium' | 'high';
}
```

#### Output

```typescript
interface SkillRecommenderOutput {
  recommendations: SkillRecommendation[];
  coverageAnalysis: {
    coveredPains: string[];
    uncoveredPains: string[];
    coverageRate: number;
  };
  metrics: {
    totalSkillsAnalyzed: number;
    processingTime: number;
  };
}
```

#### Key Types

```typescript
interface Skill {
  id?: string;
  name: string;
  description: string;
  category: string;
  targetIndustry?: string;
  targetRole?: string;
  triggers: string[];
  painPatterns?: string[];
  implementations?: number;
  successRate?: number;
  evolutionLevel?: number;
  assets?: {
    scripts?: string[];
    templates?: string[];
    documents?: string[];
  };
  metadata?: Record<string, any>;
}

interface SkillRecommendation {
  skill: Skill;
  score: number;
  rank?: number;
  metrics: ScoringMetrics;
  matchedPains: string[];
  reasons?: string[];
}

interface ScoringMetrics {
  fitIndustryRole: number;     // 0-1
  painImpact: number;          // 0-1
  adoptionCost: number;        // 0-1 (lower is better)
  reproducibility: number;      // 0-1
}
```

### SkillEvolutionJudgeAgent

Evaluates skill maturity and evolution level.

#### Input

```typescript
interface SkillEvolutionJudgeInput {
  skill: Skill;
  evidence: {
    implementations: number;
    industries: string[];
    roles: string[];
    successRate?: number;
    feedbacks?: string[];
  };
}
```

#### Output

```typescript
interface SkillEvolutionJudgeOutput {
  currentLevel: EvolutionLevel;
  levelDetails: {
    level: number;
    name: string;
    description: string;
    progressBar: string;
  };
  assessment: EvolutionAssessment;
  nextLevelCriteria: EvolutionCriteria;
  evolutionPath: string[];
  recommendations: string[];
}
```

#### Key Types

```typescript
interface EvolutionLevel {
  level: 1 | 2 | 3 | 4;
  name: string;
  description: string;
}

interface EvolutionAssessment {
  readyForNextLevel: boolean;
  readinessScore: number;
  strengths: string[];
  gaps: string[];
  progressMetrics: {
    implementationCount: number;
    industryDiversity: number;
    roleDiversity: number;
    successRate: number;
  };
}
```

#### Evolution Levels

1. **Individual Optimization** - Single-person implementation
2. **Reproducibility Confirmed** - Industry-specific pattern
3. **Structure Extracted** - Cross-industry role pattern
4. **Universal Skill** - Context-free tool

### GitHubPackagerAgent

Packages skills into standardized formats for GitHub repositories.

#### Input

```typescript
interface GitHubPackagerInput {
  skill: Skill;
  packageType?: 'basic' | 'advanced' | 'enterprise';
  template?: string;
  options?: {
    includeChangelog?: boolean;
    includeExamples?: boolean;
    language?: 'ja' | 'en';
  };
}
```

#### Output

```typescript
interface GitHubPackagerOutput {
  package: {
    structure: PackageStructure;
    mainFile: string;
    supportFiles: string[];
  };
  repository: {
    suggested: GitHubRepoConfig;
    structure: string;
  };
  artifacts: {
    'SKILL.md': string;
    'skill.yaml': string;
    'README.md': string;
    'CHANGELOG.md'?: string;
  };
  metrics: {
    filesGenerated: number;
    totalSize: number;
    generationTime: number;
  };
}
```

#### Key Types

```typescript
interface PackageStructure {
  type: PackageType;
  files: PackageFile[];
  directories: string[];
  metadata: PackageMetadata;
}

interface PackageFile {
  path: string;
  content: string;
  type: 'markdown' | 'yaml' | 'json' | 'script' | 'template';
  encoding?: string;
}

interface PackageMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  tags?: string[];
  created?: Date;
  updated?: Date;
}
```

## Type Definitions

### Pipeline Types

```typescript
interface PipelineStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  error?: Error;
  result?: any;
}

interface WorkflowState {
  currentStage: string;
  progress: number;
  startTime?: Date;
  endTime?: Date;
  data: {
    input?: any;
    companyProfile?: any;
    winIndicators?: any[];
    industryRole?: any;
    painPatterns?: any[];
    recommendations?: any[];
    evolutionResults?: any[];
    packages?: any[];
  };
  errors?: Error[];
}
```

### Common Types

```typescript
interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: Error;
  duration?: number;
}

interface AgentMessage {
  from: string;
  to: string;
  type: 'request' | 'response' | 'error' | 'info';
  payload: any;
  timestamp: Date;
}

type AgentType = 
  | 'win-point-hunter'
  | 'pain-abstractor'
  | 'skill-recommender'
  | 'skill-evolution-judge'
  | 'github-packager';
```

## Event System

### Event Types

```typescript
interface PipelineEvent {
  type: 'start' | 'complete' | 'error' | 'stage_start' | 'stage_complete' | 'stage_error';
  stage?: string;
  data?: any;
  error?: Error;
  timestamp: Date;
}
```

### Event Flow

1. `pipeline:start` - Emitted when orchestration begins
2. `stage:start` - Emitted for each pipeline stage
3. `progress:update` - Emitted on progress changes
4. `stage:complete` or `stage:error` - Stage completion
5. `pipeline:complete` or `pipeline:error` - Final status

## Integration Guide

### Basic Integration

```typescript
import { SkilldexOrchestrator } from '@skilldex/orchestrator';

// Initialize orchestrator
const orchestrator = new SkilldexOrchestrator({
  debug: true,
  timeout: 300000, // 5 minutes
  agents: {
    skillRecommender: {
      maxRecommendations: 10
    }
  }
});

// Set up event listeners
orchestrator.on('progress:update', ({ progress }) => {
  console.log(`Progress: ${progress}%`);
});

// Execute orchestration
const result = await orchestrator.execute({
  mode: 'hybrid',
  data: {
    urls: ['https://client.example.com'],
    notes: 'Client needs automation for invoice processing...'
  },
  options: {
    maxRecommendations: 5,
    autoPackage: true
  }
});

// Handle results
if (result.status === 'success') {
  console.log('Company:', result.results.companyProfile);
  console.log('Recommendations:', result.results.recommendations);
}
```

### Advanced Integration

```typescript
// Custom agent configuration
const orchestrator = new SkilldexOrchestrator({
  agents: {
    winPointHunter: {
      timeout: 30000,
      maxUrls: 5
    },
    painAbstractor: {
      minConfidence: 0.7,
      abstractionDepth: 3
    },
    skillRecommender: {
      maxRecommendations: 10,
      minScore: 0.6
    },
    skillEvolutionJudge: {
      strictMode: true,
      trackHistory: true
    },
    githubPackager: {
      defaultTemplate: 'enterprise',
      generateOptions: {
        includeChangelog: true,
        language: 'ja'
      }
    }
  }
});

// Use command-based execution for fine control
const intake = await orchestrator.executeCommand('INTAKE', {
  urls: ['https://example.com'],
  notes: 'Consultation notes...'
});

const patterns = await orchestrator.executeCommand('DISCOVER');
const recommendations = await orchestrator.executeCommand('RANK');

// Process specific recommendations
for (const recommendation of recommendations.recommendations) {
  const evolution = await orchestrator.executeCommand('EVOLVE');
  if (evolution.currentLevel.level >= 3) {
    const package = await orchestrator.executeCommand('PACKAGE');
    console.log('Generated package:', package);
  }
}
```

## Extension Points

### Custom Agent Implementation

To create a custom agent:

```typescript
interface CustomAgent {
  execute(input: CustomAgentInput): Promise<CustomAgentOutput>;
  validate?(input: CustomAgentInput): boolean;
  configure?(config: CustomAgentConfig): void;
}

class MyCustomAgent implements CustomAgent {
  constructor(private config: CustomAgentConfig) {}
  
  async execute(input: CustomAgentInput): Promise<CustomAgentOutput> {
    // Implementation
  }
}
```

### Custom Pipeline Stages

Extend the orchestrator to add custom stages:

```typescript
class ExtendedOrchestrator extends SkilldexOrchestrator {
  protected async executeCustomStage(stageId: string, handler: () => Promise<void>) {
    // Add custom stage logic
  }
  
  async execute(input: SkilldexOrchestratorInput): Promise<SkilldexOrchestratorOutput> {
    // Add custom stages to pipeline
    this.pipeline.push({
      id: 'custom-stage',
      name: 'Custom Processing',
      status: 'pending'
    });
    
    // Execute standard pipeline
    const result = await super.execute(input);
    
    // Execute custom stage
    await this.executeCustomStage('custom-stage', async () => {
      // Custom logic
    });
    
    return result;
  }
}
```

### Custom Scoring Algorithm

Implement custom scoring for skill recommendations:

```typescript
interface CustomScorer {
  calculateMetrics(
    skill: Skill, 
    matchedPains: PainPattern[], 
    context: RecommendationContext
  ): ScoringMetrics;
}

class IndustrySpecificScorer implements CustomScorer {
  calculateMetrics(skill, matchedPains, context): ScoringMetrics {
    // Custom scoring logic based on industry
    return {
      fitIndustryRole: this.calculateIndustryFit(skill, context),
      painImpact: this.calculatePainImpact(matchedPains),
      adoptionCost: this.calculateAdoptionCost(skill, context),
      reproducibility: this.calculateReproducibility(skill)
    };
  }
}
```

### Repository Integration

Connect to external skill repositories:

```typescript
interface SkillRepository {
  findAll(): Promise<Skill[]>;
  findById(id: string): Promise<Skill | null>;
  findByFilter(filter: SkillFilter): Promise<Skill[]>;
  search(query: string): Promise<Skill[]>;
  save(skill: Skill): Promise<Skill>;
}

class GitHubSkillRepository implements SkillRepository {
  constructor(private repoConfig: GitHubRepoConfig) {}
  
  async findAll(): Promise<Skill[]> {
    // Fetch skills from GitHub repository
  }
  
  // Implement other methods
}
```

## Error Handling

### Error Types

```typescript
class OrchestratorError extends Error {
  constructor(
    message: string,
    public code: string,
    public stage?: string,
    public details?: any
  ) {
    super(message);
  }
}

class AgentError extends OrchestratorError {
  constructor(
    message: string,
    public agent: AgentType,
    details?: any
  ) {
    super(message, `AGENT_${agent.toUpperCase()}_ERROR`, undefined, details);
  }
}

class ValidationError extends OrchestratorError {
  constructor(message: string, field: string, value?: any) {
    super(message, 'VALIDATION_ERROR', undefined, { field, value });
  }
}
```

### Error Handling Example

```typescript
try {
  const result = await orchestrator.execute(input);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.details);
  } else if (error instanceof AgentError) {
    console.error(`Agent ${error.agent} failed:`, error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Best Practices

### 1. Configuration Management

```typescript
// Use environment-specific configurations
const config: OrchestratorConfig = {
  debug: process.env.NODE_ENV === 'development',
  timeout: parseInt(process.env.ORCHESTRATOR_TIMEOUT || '300000'),
  agents: {
    skillRecommender: {
      maxRecommendations: parseInt(process.env.MAX_RECOMMENDATIONS || '10')
    }
  }
};
```

### 2. Error Recovery

```typescript
// Implement retry logic for transient failures
const retryWithBackoff = async (fn: Function, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

### 3. Performance Optimization

```typescript
// Use command-based execution for partial workflows
const recommendations = await orchestrator.executeCommand('RANK');

// Process only top recommendations
const topSkills = recommendations.recommendations.slice(0, 3);
for (const skill of topSkills) {
  // Process selected skills
}
```

### 4. Monitoring and Logging

```typescript
// Implement comprehensive logging
orchestrator.on('stage:start', ({ stageId }) => {
  logger.info(`Stage started: ${stageId}`);
});

orchestrator.on('stage:error', ({ stageId, error }) => {
  logger.error(`Stage failed: ${stageId}`, error);
});
```

## Version History

- **1.0.0** - Initial release with core orchestration functionality
- **1.1.0** - Added command-based execution and event system
- **1.2.0** - Enhanced error handling and retry mechanisms

## Support

For questions, issues, or contributions:
- GitHub Issues: [github.com/skilldex/orchestrator/issues](https://github.com/skilldex/orchestrator/issues)
- Documentation: [docs.skilldex.io](https://docs.skilldex.io)
- Email: support@skilldex.io