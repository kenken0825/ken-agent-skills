# Miyabi CLI - Claude Code Context

**Version**: 0.18.0

**This file is optimized for AI coding agents (Claude Code).**
Human users should refer to README.md instead.

---

## Quick Reference for AI Agents

### Critical Rules

1. **ALWAYS use `--json` flag** - Parse structured output, never scrape text
2. **ALWAYS use `--yes` flag** - Skip interactive prompts automatically
3. **ALWAYS check exit codes** - 0=success, 1-5=specific errors
4. **NEVER execute without GITHUB_TOKEN** - Set `export GITHUB_TOKEN=ghp_xxx` first

### Environment Setup (Required)

```bash
export GITHUB_TOKEN=ghp_xxx          # Required for all commands
export MIYABI_JSON=1                 # Force JSON output
export MIYABI_AUTO_YES=1             # Force non-interactive mode
export MIYABI_VERBOSE=1              # Enable verbose logging (optional)
```

### Exit Codes

| Code | Name | Description |
|------|------|-------------|
| 0 | SUCCESS | Command completed successfully |
| 1 | GENERAL_ERROR | Unknown error |
| 2 | CONFIG_ERROR | Missing GITHUB_TOKEN or invalid config |
| 3 | VALIDATION_ERROR | Invalid arguments, directory exists |
| 4 | NETWORK_ERROR | GitHub API unreachable |
| 5 | AUTH_ERROR | Authentication failed, invalid token |

---

## Complete Command Reference

### 1. `miyabi status` - Check Project Status

```bash
miyabi status --json
miyabi status --watch --json    # Auto-refresh every 5s
```

**JSON Response:**
```json
{
  "success": true,
  "data": {
    "repository": { "owner": "user", "name": "repo", "url": "https://..." },
    "issues": {
      "total": 15,
      "byState": { "pending": 3, "analyzing": 2, "implementing": 4, "reviewing": 3, "done": 3 }
    },
    "pullRequests": [{ "number": 123, "title": "...", "state": "open" }],
    "summary": { "totalOpen": 15, "activeAgents": 7, "blocked": 0 }
  },
  "timestamp": "2025-12-19T00:00:00Z"
}
```

**Decision Tree:**
- `data.issues.byState.pending > 0` → Run IssueAgent to analyze
- `data.issues.byState.implementing > 0` → Run ReviewAgent to check
- `data.summary.blocked > 0` → Alert human intervention needed

---

### 2. `miyabi init` - Create New Project

```bash
miyabi init my-project --json --yes
miyabi init my-project --private --json --yes    # Private repo
miyabi init my-project --skip-install --json     # Skip npm install
```

**Options:**
- `--private` - Create private repository
- `--skip-install` - Skip npm install after clone
- `--yes` - Auto-confirm all prompts

**JSON Response:**
```json
{
  "success": true,
  "data": {
    "projectName": "my-project",
    "repository": { "owner": "user", "name": "my-project", "url": "https://..." },
    "labelsCreated": 53,
    "workflowsDeployed": 26,
    "projectsV2Created": true,
    "localPath": "/path/to/my-project"
  }
}
```

**What it does:**
1. GitHub OAuth authentication (Device Flow)
2. Create GitHub repository
3. Setup 53 labels
4. Deploy 26 GitHub Actions
5. Create Projects V2
6. Clone locally
7. Install dependencies
8. Create Welcome Issue

---

### 3. `miyabi install` - Add to Existing Project

```bash
miyabi install --json --yes --non-interactive
miyabi install --dry-run --json    # Preview only
```

**Options:**
- `--dry-run` - Preview changes without applying
- `--non-interactive` - Skip all prompts
- `--yes` - Auto-confirm

**JSON Response:**
```json
{
  "success": true,
  "data": {
    "labelsAdded": 53,
    "workflowsDeployed": 26,
    "claudeConfigDeployed": true,
    "projectCreated": true
  }
}
```

---

### 4. `miyabi doctor` - System Health Check

```bash
miyabi doctor --json
miyabi doctor --verbose --json    # Detailed diagnostics
```

**JSON Response:**
```json
{
  "success": true,
  "data": {
    "checks": {
      "git": { "status": "pass", "version": "2.40.0" },
      "node": { "status": "pass", "version": "20.10.0" },
      "npm": { "status": "pass", "version": "10.2.0" },
      "github": { "status": "pass", "authenticated": true },
      "repository": { "status": "pass", "isGitRepo": true },
      "miyabiConfig": { "status": "pass", "hasClaudeDir": true }
    },
    "summary": { "passed": 6, "failed": 0, "warnings": 0 }
  }
}
```

**Decision Tree:**
- `data.checks.github.status === "fail"` → Run `miyabi auth login`
- `data.checks.miyabiConfig.status === "fail"` → Run `miyabi install`
- `data.summary.failed > 0` → Fix issues before proceeding

---

### 5. `miyabi agent` - Agent Management

```bash
# Run specific agent
miyabi agent run codegen --issue=123 --json
miyabi agent run review --issue=123 --json
miyabi agent run deploy --json

# List available agents
miyabi agent list --json

# Check agent status
miyabi agent status --json
```

**Available Agents:**
| Agent | Description | Use Case |
|-------|-------------|----------|
| `coordinator` | Task decomposition, DAG building | First step for complex issues |
| `codegen` | Code generation (Claude Sonnet 4) | Implementation |
| `review` | Code quality (80+ score required) | Before PR |
| `issue` | Issue analysis, labeling | New issues |
| `pr` | Pull Request creation | After review pass |
| `deploy` | CI/CD deployment | After PR merge |

**JSON Response (agent run):**
```json
{
  "success": true,
  "data": {
    "agentType": "codegen",
    "issueNumber": 123,
    "status": "completed",
    "prNumber": 456,
    "qualityScore": 85,
    "duration": 120000
  }
}
```

---

### 6. `miyabi run` - Unified Execution

```bash
miyabi run --json --yes
miyabi run --task codegen --issue 123 --json
miyabi run --task review --json
miyabi run --task deploy --json
```

**Tasks:**
- `codegen` - Generate code for issue
- `review` - Run code review
- `deploy` - Deploy to production
- `full-cycle` - Complete automation

---

### 7. `miyabi fix` / `build` / `ship` - Shortcuts

```bash
# Fix a bug (shortcut for run --task fix-bug)
miyabi fix 123 --json

# Build a feature (shortcut for run --task add-feature)
miyabi build 123 --json

# Deploy to production (shortcut for run --task deploy)
miyabi ship --json
```

---

### 8. `miyabi auto` - Full Automation Mode (Water Spider)

```bash
miyabi auto --json
miyabi auto --interval=10 --max-duration=60 --json
miyabi auto --dry-run --json    # Preview only
```

**Options:**
- `--interval <seconds>` - Check interval (default: 30)
- `--max-duration <minutes>` - Max runtime (default: 480)
- `--dry-run` - Preview without executing

**JSON Response:**
```json
{
  "success": true,
  "data": {
    "mode": "water-spider",
    "issuesProcessed": 5,
    "prsCreated": 3,
    "deploymentsCompleted": 2,
    "duration": 3600000
  }
}
```

---

### 9. `miyabi omega` - Autonomous Pipeline (Advanced)

```bash
miyabi omega --issue 123 --json
miyabi omega --phase codegen --json
miyabi omega --dry-run --json
```

**Options:**
- `--issue <number>` - Target issue
- `--phase <name>` - Specific phase (codegen, review, deploy)
- `--max-iterations <n>` - Max retry attempts
- `--dry-run` - Preview only

**JSON Response:**
```json
{
  "success": true,
  "data": {
    "formula": "I x W -> R",
    "issueNumber": 123,
    "iterations": 3,
    "result": "success",
    "prNumber": 456,
    "deploymentUrl": "https://..."
  }
}
```

---

### 10. `miyabi pipeline` - Command Composition

```bash
# Execute pipeline with operators
miyabi --json pipeline "/agent-run | /review | /deploy"

# Use preset pipelines
miyabi --json pipeline --preset full-cycle --issue 123
miyabi --json pipeline --preset quality-gate --dry-run

# List available presets
miyabi pipeline --list-presets
```

**Pipeline Operators:**
| Operator | Name | Description |
|----------|------|-------------|
| `\|` | Pipe | Sequential execution, pass context |
| `&&` | AND | Run next only if previous succeeds |
| `\|\|` | OR | Run next only if previous fails |
| `&` | Parallel | Run commands concurrently |

**Preset Pipelines:**
| Preset | Pipeline |
|--------|----------|
| `full-cycle` | `/agent-run \| /review \| /test \| /security-scan \| /deploy \| /verify` |
| `quick-deploy` | `/verify && /deploy` |
| `quality-gate` | `/review && /test && /security-scan` |
| `auto-fix` | `/review --auto-fix` |

**Options:**
- `--preset <name>` - Use preset pipeline
- `--issue <number>` - Process specific issue
- `--dry-run` - Preview without executing
- `--verbose` - Detailed output
- `--resume <id>` - Resume from checkpoint

**JSON Response:**
```json
{
  "pipelineId": "pipeline-xxx",
  "startedAt": "2025-12-19T00:00:00Z",
  "issueNumber": 123,
  "prNumber": 456,
  "qualityScore": 85,
  "testsPassed": true,
  "errors": [],
  "warnings": [],
  "currentStep": 5,
  "totalSteps": 5,
  "success": true,
  "checkpointCount": 5
}
```

**Decision Tree:**
- `success === true` → Pipeline completed successfully
- `errors.length > 0` → Check `errors[].code` for failure reason
- `checkpointCount > 0` → Can resume with `--resume <checkpoint-id>`

---

### 11. `miyabi todos` - TODO Comment Detection

```bash
miyabi todos --json
miyabi todos --auto-issue --json    # Auto-create issues for TODOs
miyabi todos --dry-run --json       # Preview only
```

**JSON Response:**
```json
{
  "success": true,
  "data": {
    "todos": [
      { "file": "src/index.ts", "line": 42, "text": "TODO: Implement caching", "priority": "medium" }
    ],
    "issuesCreated": 3
  }
}
```

---

### 12. `miyabi dashboard` - Dashboard Management

```bash
miyabi dashboard status --json
miyabi dashboard refresh --json
miyabi dashboard open              # Opens browser
```

---

### 13. `miyabi auth` - Authentication

```bash
miyabi auth login --json           # GitHub OAuth login
miyabi auth logout --json          # Clear credentials
miyabi auth status --json          # Check auth status
```

**JSON Response (status):**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "user": "username",
    "scopes": ["repo", "workflow", "read:org"]
  }
}
```

---

### 14. `miyabi config` - Configuration

```bash
miyabi config --json               # Show all config
miyabi config --get token --json   # Get specific value
miyabi config --set key=value      # Set value
```

---

### 15. `miyabi docs` - Documentation Generation

```bash
miyabi docs --json
miyabi docs --input ./src --output ./docs/API.md --json
miyabi docs --training --json      # Include training materials
miyabi docs --watch --json         # Auto-regenerate on changes
```

---

### 16. `miyabi setup` - Setup Guide

```bash
miyabi setup --json --yes
miyabi setup --skip-token --json   # Skip token setup
miyabi setup --skip-config --json  # Skip config
```

---

### 17. `miyabi onboard` - First-time Setup Wizard

```bash
miyabi onboard --json --yes
miyabi onboard --skip-demo --json   # Skip demo project
miyabi onboard --skip-tour --json   # Skip feature tour
```

---

## Error Handling Pattern for AI Agents

```typescript
const result = await exec('miyabi status --json');
const exitCode = result.exitCode;
const parsed = JSON.parse(result.stdout);

if (exitCode !== 0) {
  switch (exitCode) {
    case 2: // CONFIG_ERROR
      await exec('miyabi auth login');
      return retry();
    case 5: // AUTH_ERROR
      throw new Error('GitHub authentication failed');
    default:
      throw new Error(`Command failed with exit code ${exitCode}`);
  }
}

if (!parsed.success) {
  console.error(`Error: ${parsed.error?.code}`);
  console.error(`Message: ${parsed.error?.message}`);
  if (parsed.error?.recoverable) {
    // Apply suggestion and retry
  } else {
    throw new Error(parsed.error?.message);
  }
}
```

---

## Recommended Workflow for AI Agents

```bash
# Step 1: Environment setup
export GITHUB_TOKEN=ghp_xxx
export MIYABI_JSON=1
export MIYABI_AUTO_YES=1

# Step 2: Health check
miyabi doctor --json

# Step 3: Check status
miyabi status --json

# Step 4: Execute based on status
# Option A: Run specific agent
miyabi agent run codegen --issue=123 --json

# Option B: Use pipeline for full automation
miyabi --json pipeline --preset full-cycle --issue 123

# Option C: Use omega for autonomous execution
miyabi omega --issue 123 --json
```

---

## Agent System (7 Types)

| Agent | Role | Trigger |
|-------|------|---------|
| CoordinatorAgent | Task decomposition, DAG building | Complex issues |
| IssueAgent | Issue analysis, 53-label classification | New issues |
| CodeGenAgent | Code generation (Claude Sonnet 4) | Implementation tasks |
| ReviewAgent | Code quality (100-point scoring, 80+ pass) | Before PR |
| TestAgent | Test execution, coverage reporting | Quality gate |
| PRAgent | Pull Request creation (Conventional Commits) | After review |
| DeploymentAgent | CI/CD, Firebase/Vercel deploy | After merge |

---

## GitHub OS Integration

Miyabi treats GitHub as an operating system:

- **Issues** → Task queue
- **Labels** → State machine (53 labels)
- **Projects V2** → Kanban board
- **Actions** → Execution engine
- **Webhooks** → Event bus
- **Pages** → Dashboard hosting
- **Discussions** → Message queue

---

## Version History

- **v0.18.0** - Pipeline command, command composition
- **v0.17.0** - Cross-platform support (Windows)
- **v0.16.0** - TUI Dashboard, Human-in-the-Loop, Steve Jobs UX

---

**Miyabi** - Beauty in Autonomous Development
