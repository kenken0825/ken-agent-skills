# Skilldex Orchestrator Usage Guide

A comprehensive guide to using the Skilldex Orchestrator system for autonomous skill development and evolution.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [CLI Commands](#cli-commands)
5. [Core Concepts](#core-concepts)
6. [Common Workflows](#common-workflows)
7. [Agent System](#agent-system)
8. [Configuration](#configuration)
9. [Examples](#examples)
10. [Troubleshooting](#troubleshooting)

## Overview

The Skilldex Orchestrator is an autonomous skill development framework that leverages AI agents to:

- **Discover** business pain points and opportunities
- **Abstract** specific problems into reusable patterns
- **Recommend** relevant skills from the skill pool
- **Evolve** skills through real-world usage
- **Package** skills for distribution

The system follows a Pokemon-style evolution model where skills grow from Level 1 (individual use) to Level 4 (universal tools).

## Installation

### Prerequisites

- Node.js 18+ and npm 9+
- GitHub account with personal access token
- Anthropic API key (optional, for manual execution)
- macOS/Linux/Windows with WSL

### Basic Installation

```bash
# Clone the repository
git clone https://github.com/kenken0825/ken-agent-skills.git
cd ken-agent-skills

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your GitHub token
```

### Verify Installation

```bash
# Check TypeScript compilation
npm run typecheck

# Run basic tests
npm test

# Check CLI availability
npm run skilldex -- --help
```

## Quick Start

### 1. Simple Skill Discovery

```bash
# Analyze a company website for skill opportunities
npm run skilldex discover --url https://example.com

# Analyze from hearing notes
npm run skilldex discover --notes "Client wants to automate monthly reports"
```

### 2. Autonomous Agent Execution

```bash
# Create an issue for autonomous processing
gh issue create --title "Implement skill: Monthly Report Generator" \
  --body "Create a skill that automates monthly report generation" \
  --label "🤖agent-execute"

# Or trigger manually
gh workflow run autonomous-agent.yml \
  -f issue_number=123 \
  -f task_type=add-feature \
  -f execution_mode=auto
```

## CLI Commands

### Basic Commands

```bash
# Main orchestrator command
npm run skilldex <command> [options]

# Available commands:
discover    # Discover skill opportunities
recommend   # Get skill recommendations
evolve      # Check skill evolution status
package     # Package skills for GitHub
```

### Discover Command

```bash
npm run skilldex discover [options]

Options:
  --url <url>         Company URL to analyze
  --notes <text>      Hearing notes or requirements
  --mode <mode>       Input mode (client_urls|hearing_notes|hybrid)
  --output <file>     Output file path (default: ./output/discovery.json)
  
Examples:
  # Analyze a single URL
  npm run skilldex discover --url https://company.com
  
  # Analyze multiple URLs
  npm run skilldex discover --url https://company.com --url https://company.jp
  
  # Hybrid mode with URL and notes
  npm run skilldex discover --mode hybrid --url https://company.com \
    --notes "They need invoice automation"
```

### Recommend Command

```bash
npm run skilldex recommend [options]

Options:
  --pain <pattern>    Pain pattern to address
  --industry <name>   Target industry
  --role <name>       Target job role
  --max <number>      Maximum recommendations (default: 10)
  
Examples:
  # Get recommendations for specific pain point
  npm run skilldex recommend --pain "manual data entry" --industry IT
  
  # Role-specific recommendations
  npm run skilldex recommend --role "tax consultant" --max 5
```

### Evolve Command

```bash
npm run skilldex evolve [options]

Options:
  --skill <id>        Skill ID to check
  --check-all         Check all skills
  --update            Update evolution status
  
Examples:
  # Check specific skill evolution
  npm run skilldex evolve --skill monthly-report-generator
  
  # Check and update all skills
  npm run skilldex evolve --check-all --update
```

### Package Command

```bash
npm run skilldex package [options]

Options:
  --skill <id>        Skill ID to package
  --version <ver>     Version number
  --output <dir>      Output directory
  
Examples:
  # Package a single skill
  npm run skilldex package --skill invoice-automation --version 1.0.0
  
  # Package with custom output
  npm run skilldex package --skill tax-calculator \
    --output ./exports/skills
```

## Core Concepts

### Skill Evolution Levels

Skills evolve through four distinct levels:

#### Level 1: Individual Optimization (個別最適)
- **Status**: [■□□□]
- **Definition**: Proven helpful for one specific user/case
- **Requirements**: 
  - Hearing conducted
  - Effectiveness confirmed (1 case)
- **Example**: Custom Excel macro for a specific company

#### Level 2: Reproducibility Confirmed (業種特化)
- **Status**: [■■□□]
- **Definition**: Pattern confirmed across same industry
- **Requirements**:
  - 2-3 implementations in same industry
  - Clear triggers identified
- **Example**: Invoice automation for IT companies

#### Level 3: Structure Extracted (職種共通)
- **Status**: [■■■□]
- **Definition**: Works across industries for same role
- **Requirements**:
  - Different industries × same role success
  - Generalized workflow
- **Example**: Monthly report generator for any accountant

#### Level 4: Universal Skill (OS級)
- **Status**: [■■■■]
- **Definition**: Context-free tool
- **Requirements**:
  - 5+ industries × 5+ roles
  - Abstract pain pattern
- **Example**: Universal data cleanser

### Input Modes

1. **client_urls**: Analyze company websites/landing pages
2. **hearing_notes**: Process consultation notes
3. **hybrid**: Combine URLs and notes for comprehensive analysis

### Progressive Disclosure

The system reveals information in stages:

1. **Discovery**: Basic skill info (name, description, triggers)
2. **Loading**: Full skill documentation as needed
3. **Execution**: Scripts and implementations on demand

## Common Workflows

### Workflow 1: New Client Onboarding

```bash
# Step 1: Initial discovery
npm run skilldex discover --mode hybrid \
  --url https://client-website.com \
  --notes "Initial consultation notes from meeting"

# Step 2: Review recommendations
npm run skilldex recommend --industry "retail" --role "manager"

# Step 3: Implement top skill
gh issue create --title "Implement: Inventory Management Automation" \
  --body "Based on discovery results" \
  --label "🤖agent-execute"

# Step 4: Package for deployment
npm run skilldex package --skill inventory-automation
```

### Workflow 2: Skill Evolution Tracking

```bash
# Check current evolution status
npm run skilldex evolve --check-all

# Identify skills ready for evolution
npm run skilldex evolve --skill monthly-report --update

# Generate evolution report
npm run skilldex report --type evolution --output ./reports/
```

### Workflow 3: Batch Skill Creation

```bash
# Prepare skill requests CSV
echo "skill_name,description,industry,role" > skill_requests.csv
echo "invoice-generator,Automate invoice creation,IT,accountant" >> skill_requests.csv

# Process batch
npm run skilldex batch --input skill_requests.csv

# Monitor progress
npm run watch:issue --issue 123
```

## Agent System

### Available Agents

1. **Win Point Hunter Agent**
   - Discovers business value and success patterns
   - Analyzes company websites and documentation
   - Extracts win indicators

2. **Pain Abstractor Agent**
   - Abstracts specific problems to patterns
   - Identifies cross-industry applicability
   - Maps pain points to solutions

3. **Skill Recommender Agent**
   - Matches pain patterns to existing skills
   - Scores and ranks recommendations
   - Provides implementation guidance

4. **Skill Evolution Judge Agent**
   - Evaluates skill maturity level
   - Identifies evolution requirements
   - Tracks implementation success

5. **GitHub Packager Agent**
   - Creates standardized skill packages
   - Generates documentation
   - Prepares GitHub-ready folders

### Agent Communication

Agents communicate through a standardized message format:

```typescript
interface AgentMessage {
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification';
  payload: any;
  timestamp: Date;
}
```

## Configuration

### Environment Variables

```bash
# .env file
GITHUB_TOKEN=ghp_xxxxxxxxxxxx        # Required for GitHub operations
ANTHROPIC_API_KEY=sk-ant-xxxx        # Optional for manual execution
MIYABI_CONFIG_PATH=./.miyabi.yml     # Miyabi framework config
LOG_LEVEL=info                        # Logging level (debug|info|warn|error)
OUTPUT_DIR=./output                   # Default output directory
```

### Miyabi Configuration

```yaml
# .miyabi.yml
version: 1.0.0
agent:
  model: claude-3-opus-20240229
  temperature: 0.7
  max_tokens: 4000

execution:
  timeout: 600
  retries: 3
  
features:
  auto_commit: true
  auto_pr: true
  progressive_disclosure: true
```

### Orchestrator Configuration

```typescript
// orchestrator.config.ts
export const orchestratorConfig = {
  agents: {
    winPointHunter: {
      timeout: 300000,
      maxRetries: 2
    },
    painAbstractor: {
      minConfidence: 0.7
    },
    skillRecommender: {
      maxRecommendations: 10,
      minScore: 0.6
    }
  },
  pipeline: {
    progressiveDisclosure: true,
    autoPackage: false
  }
};
```

## Examples

### Example 1: Analyzing an IT Company

```bash
# Initial discovery
npm run skilldex discover \
  --url https://it-company.com \
  --notes "They spend 10 hours monthly on invoice processing"

# Output snippet:
{
  "companyProfile": {
    "name": "IT Solutions Inc",
    "industry": "IT",
    "size": "medium",
    "painPoints": ["manual invoice processing", "repetitive reports"]
  },
  "recommendations": [
    {
      "skill": "invoice-automation",
      "score": 0.95,
      "reason": "Direct match for invoice processing pain"
    }
  ]
}
```

### Example 2: Evolving a Skill

```bash
# Check evolution status
npm run skilldex evolve --skill monthly-report-generator

# Output:
{
  "skill": "monthly-report-generator",
  "currentLevel": 2,
  "levelName": "Reproducibility Confirmed",
  "progress": "[■■□□]",
  "nextRequirements": [
    "Implement in 2 more industries",
    "Document cross-industry patterns",
    "Standardize configuration format"
  ]
}
```

### Example 3: Batch Processing

```javascript
// batch-process.js
const { SkilldexOrchestrator } = require('ken-agent-skills');

async function processBatch() {
  const orchestrator = new SkilldexOrchestrator();
  
  const companies = [
    { url: 'https://company1.com', notes: 'Needs automation' },
    { url: 'https://company2.com', notes: 'Manual processes' }
  ];
  
  for (const company of companies) {
    const result = await orchestrator.execute({
      mode: 'hybrid',
      data: company,
      options: {
        autoPackage: true,
        maxRecommendations: 5
      }
    });
    
    console.log(`Processed ${company.url}:`, result.recommendations);
  }
}

processBatch();
```

## Troubleshooting

### Common Issues

#### 1. GitHub Authentication Failed

```bash
Error: GitHub token is invalid or expired
```

**Solution:**
```bash
# Regenerate token at https://github.com/settings/tokens
export GITHUB_TOKEN=ghp_newtoken
# Or update .env file
```

#### 2. Agent Execution Timeout

```bash
Error: Agent execution timed out after 600s
```

**Solution:**
```bash
# Increase timeout in workflow
gh workflow run autonomous-agent.yml -f timeout=1200

# Or update config
echo "execution.timeout=1200" >> .miyabi.yml
```

#### 3. Skill Not Found

```bash
Error: Skill 'custom-skill' not found in repository
```

**Solution:**
```bash
# Refresh skill index
npm run skilldex index --refresh

# Check skill location
find ./skills -name "*custom-skill*"
```

#### 4. Evolution Requirements Not Met

```bash
Warning: Skill cannot evolve - missing evidence
```

**Solution:**
```bash
# Add implementation evidence
npm run skilldex evolve --skill my-skill --add-evidence \
  --industry "retail" --role "manager" --success-rate 0.9
```

### Debug Mode

Enable detailed logging:

```bash
# Set debug environment
export LOG_LEVEL=debug

# Run with verbose output
npm run skilldex discover --url https://example.com --verbose

# Check logs
tail -f ./logs/skilldex-debug.log
```

### Getting Help

1. Check the specification: `Docs/skilldex-orchestrator-spec.md`
2. View examples: `./examples/` directory
3. Create an issue: https://github.com/kenken0825/ken-agent-skills/issues
4. Community Discord: (Coming soon)

## Best Practices

1. **Start Small**: Begin with simple, well-defined pain points
2. **Document Everything**: Clear documentation accelerates evolution
3. **Test Incrementally**: Verify each evolution level before proceeding
4. **Share Success**: Contribute successful patterns back to the community
5. **Monitor Performance**: Track skill effectiveness metrics

## Next Steps

- Explore existing skills in `./skills/` directory
- Try the example workflows with your own data
- Contribute new skills or improvements
- Join the community discussions

---

For more technical details, see the [Architecture Documentation](./architecture.md) and [API Reference](./api-reference.md).