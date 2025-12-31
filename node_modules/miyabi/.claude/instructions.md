# Claude Code Instructions for Miyabi CLI

**CRITICAL: This file defines how Claude Code should interact with Miyabi CLI.**

**Target Audience**: Claude Code (AI coding agent)
**Human Visibility**: Users see Claude Code's output, NOT Miyabi's raw output
**Version**: Optimized for Miyabi v0.8.7+

---

## Core Principles

When executing Miyabi commands, Claude Code **MUST**:

1. **Always use `--json` flag** - Machine-readable output for parsing
2. **Always use `--yes` flag** - Skip interactive prompts (non-interactive mode)
3. **Always check exit codes** - Validate success before parsing output
4. **Always parse JSON first** - Extract structured data, then summarize
5. **Communicate concisely** - 2-3 sentences max per command result
6. **Never use emojis** - Technical, professional output only
7. **Report errors immediately** - Error-first communication

---

## Environment Setup (Required)

### Step 1: Set GITHUB_TOKEN

**ALWAYS verify GITHUB_TOKEN before executing any miyabi command.**

```bash
# Check if token exists (DO THIS FIRST)
echo "GITHUB_TOKEN: ${GITHUB_TOKEN:+SET}"

# If not set, request user to set it
export GITHUB_TOKEN=ghp_xxx
```

### Step 2: Set Miyabi Environment Variables (Recommended)

```bash
# Force JSON mode (prevents human-friendly output)
export MIYABI_JSON=1

# Force non-interactive mode (skip all prompts)
export MIYABI_AUTO_YES=1

# Optional: Enable verbose logging
export MIYABI_VERBOSE=1
```

**Claude Code Output Style:**
```
Setting up Miyabi environment...

Verifying GITHUB_TOKEN: SET
Configuring JSON mode: MIYABI_JSON=1
Configuring non-interactive mode: MIYABI_AUTO_YES=1

Environment ready for Miyabi execution.
```

---

## Command Execution Patterns

### Pattern 1: Check Project Status

**Workflow:**
```bash
miyabi status --json
```

**Claude Code Decision Tree:**
```typescript
const result = JSON.parse(stdout);

if (exitCode !== 0) {
  // Handle error (see Error Recovery section)
}

if (result.success) {
  const { issues, summary } = result.data;

  // Decision logic:
  if (issues.byState.pending > 0) {
    // Action: Run IssueAgent to analyze pending issues
  }
  if (issues.byState.implementing > 0) {
    // Action: Run ReviewAgent to check quality
  }
  if (summary.blocked > 0) {
    // Action: Alert user - human intervention needed
  }
}
```

**Claude Code Output Style:**
```
Checking project status...

Command: `miyabi status --json`
Exit: 0

Repository: owner/repo-name
Open Issues: 15 (3 pending, 4 implementing, 1 reviewing)
Active Agents: 7
Blocked Issues: 0

Next Action: Running IssueAgent for 3 pending issues.
```

### Pattern 2: Run IssueAgent (SDK Integrated)

**Workflow:**
```bash
# Auto-detects repository from git remote (v0.8.7+)
miyabi agent run issue --issue=123 --json
```

**Key Features in v0.8.7:**
- ✅ miyabi-agent-sdk integrated (uses real SDK)
- ✅ Auto repository detection (no GITHUB_OWNER/GITHUB_REPO needed)
- ✅ Uses Claude Code CLI (free, no ANTHROPIC_API_KEY required)

**Claude Code Output Style:**
```
Analyzing Issue #123 with IssueAgent...

Command: `miyabi agent run issue --issue=123 --json`
Exit: 0

Agent: IssueAgent
Status: Success
Duration: 1247ms
Repository: Auto-detected from git remote (owner/repo)

Labels Applied:
- type:bug
- priority:P1-High
- severity:Sev.2-High

Recommended Next Step: Assign to CodeGenAgent for implementation.
```

### Pattern 3: List Available Agents

**Workflow:**
```bash
miyabi agent list --json
```

**Claude Code Output Style:**
```
Available Agents:

1. coordinator - Task orchestration, DAG decomposition
2. codegen - AI-driven code generation (Claude Sonnet 4)
3. review - Code quality assessment (80+ score required)
4. issue - Issue analysis, auto-labeling (SDK integrated ✓)
5. pr - Pull Request automation (Conventional Commits)
6. deploy - CI/CD deployment (Firebase/Vercel)
7. mizusumashi - Super App Designer (YAML generation)

Currently Integrated with SDK: issue
Pending SDK Integration: codegen, review, pr, coordinator, deploy
```

---

## Output Style Guidelines

### ✅ DO: Concise Technical Summary

**Format:**
```
[Action description in 1 line]

Command: `miyabi [command] --json`
Exit: [code]

[Key Data Points - 3-5 bullet points max]

Next Action: [What Claude Code will do next]
```

**Example:**
```
Executed status check for autonomous-operations repository.

Command: `miyabi status --json`
Exit: 0

Open Issues: 15
Pending Analysis: 3 issues require IssueAgent
Implementing: 4 issues in progress
Active Agents: 7

Next Action: Running IssueAgent for pending issues.
```

### ❌ DON'T: Verbose Explanations

**Bad Example:**
```
Hey! I'm going to check the status of your project now! This is so exciting! 🎉🚀

Let me tell you about Miyabi first. Miyabi is a beautiful autonomous development framework that combines AI agents with organizational design principles. It has 7 different types of agents, each with specific responsibilities. The CoordinatorAgent handles task orchestration, the CodeGenAgent generates code using Claude Sonnet 4...

[300 more lines of explanation]

Oh by the way, you have 15 open issues! Let me explain what each state means in detail...
```

### ❌ DON'T: Emoji Overload

**Bad Example:**
```
🤖✨ Running Miyabi Status Check! 🚀

Status: 📊
Issues: 📝 15 total! 😮
Pending: 📥 3 issues waiting! ⏳
Implementing: 🏗️ 4 in progress! ⚡
Reviewing: 👀 1 needs review! 🔍

Next: 🤖 Running IssueAgent! 🎯✨🔥
```

### ❌ DON'T: Assume Success Without Checking

**Bad Example:**
```
I ran miyabi status and everything looks great!

[Claude Code didn't check exit code or parse JSON]
```

---

## Error Recovery Patterns

### Exit Code Error Handling

```typescript
// ALWAYS check exit code first
if (exitCode !== 0) {
  const error = JSON.parse(stderr);

  switch (exitCode) {
    case 2: // CONFIG_ERROR
      if (error.error.code === 'MISSING_GITHUB_TOKEN') {
        // Recovery: Prompt user to set GITHUB_TOKEN
        console.log('Error: GITHUB_TOKEN not set');
        console.log('Action Required: export GITHUB_TOKEN=ghp_xxx');
        return;
      }
      break;

    case 3: // VALIDATION_ERROR
      if (error.error.code === 'NO_GIT_REPOSITORY') {
        // Recovery: Inform user this must be run in git repo
        console.log('Error: Not a git repository');
        console.log('Action Required: Run inside a git repository with GitHub remote');
        return;
      }
      break;

    case 5: // AUTH_ERROR
      // Fatal: Invalid token
      console.log('Error: GitHub authentication failed');
      console.log('Action Required: Check GITHUB_TOKEN validity');
      return;

    default:
      // Report error with suggestion
      console.log(`Error: ${error.error.code}`);
      console.log(`Message: ${error.error.message}`);
      if (error.error.suggestion) {
        console.log(`Suggestion: ${error.error.suggestion}`);
      }
  }
}
```

**Claude Code Output Style for Errors:**
```
Error executing miyabi command.

Command: `miyabi status --json`
Exit: 2 (CONFIG_ERROR)

Error: MISSING_GITHUB_TOKEN
Message: GITHUB_TOKEN not found in environment

Action Required: Set GITHUB_TOKEN environment variable
Command: export GITHUB_TOKEN=ghp_xxx

Waiting for user to resolve before continuing.
```

---

## Real-World Use Cases

### Use Case 1: Analyze and Label New Issue

**Scenario:** User created Issue #456, needs analysis and labeling

**Claude Code Workflow:**
```bash
# Step 1: Check if we're in correct repo
miyabi status --json

# Step 2: Run IssueAgent with SDK (auto-detects repo)
miyabi agent run issue --issue=456 --json

# Step 3: Parse result and report
```

**Claude Code Output:**
```
Analyzing new Issue #456...

Command: `miyabi agent run issue --issue=456 --json`
Exit: 0

Analysis Complete:
- Type: feature
- Priority: P2-Medium
- Complexity: Medium (estimated 3-5 days)
- Labels Applied: type:feature, priority:P2-Medium

Recommendation: Issue ready for CoordinatorAgent to create implementation plan.
```

### Use Case 2: Autonomous Issue Processing Pipeline

**Scenario:** Process all pending issues automatically

**Claude Code Workflow:**
```bash
# Step 1: Get pending issues
miyabi status --json
# Parse: result.data.issues.byState.pending

# Step 2: For each pending issue, run IssueAgent
for issue in pending_issues:
  miyabi agent run issue --issue=$issue --json

# Step 3: Summarize results
```

**Claude Code Output:**
```
Processing 3 pending issues...

Issue #123: Analyzed, labeled as bug/P1-High - Ready for CodeGenAgent
Issue #124: Analyzed, labeled as feature/P2-Medium - Ready for planning
Issue #125: Analyzed, labeled as docs/P3-Low - Assigned to documentation team

Pipeline Complete: 3 issues analyzed and labeled.
Next Action: Awaiting user decision on which issue to implement first.
```

### Use Case 3: Verify Repository Setup

**Scenario:** User runs miyabi in new repository

**Claude Code Workflow:**
```bash
# Step 1: Check git repository
miyabi status --json

# If exit code 3 (NO_GIT_REPOSITORY):
# - Inform user about requirement
# - Suggest: git init && git remote add origin ...
```

**Claude Code Output:**
```
Verifying repository setup...

Command: `miyabi status --json`
Exit: 3 (VALIDATION_ERROR)

Error: NO_GIT_REPOSITORY
Not a git repository or no origin remote found

Action Required:
1. Initialize git: git init
2. Add GitHub remote: git remote add origin https://github.com/owner/repo.git

Miyabi requires a GitHub repository with remote configured for auto-detection.
```

---

## Agent Execution Workflow (Complete)

### Full Pipeline: Issue → Code → PR → Deploy

```bash
# 1. Check status
miyabi status --json

# 2. Analyze issue (SDK integrated)
miyabi agent run issue --issue=123 --json

# 3. Generate code (pending SDK integration)
miyabi agent run codegen --issue=123 --json

# 4. Review code quality (pending SDK integration)
miyabi agent run review --issue=123 --json

# 5. Create Pull Request (pending SDK integration)
miyabi agent run pr --issue=123 --json

# 6. Deploy to staging (pending SDK integration)
miyabi agent run deploy --issue=123 --json
```

**Claude Code Output for Pipeline:**
```
Starting autonomous issue processing pipeline for Issue #123...

Step 1/6: Status Check
Command: `miyabi status --json`
Exit: 0
Repository verified: owner/repo

Step 2/6: Issue Analysis (IssueAgent SDK)
Command: `miyabi agent run issue --issue=123 --json`
Exit: 0
Labels applied: bug, P1-High, Sev.2-High

Step 3/6: Code Generation (CodeGenAgent)
Status: Skipped - SDK integration pending
Reason: codegen agent not yet integrated with miyabi-agent-sdk

Pipeline Status: 2/6 steps completed
Next Steps: Awaiting SDK integration for codegen, review, pr, deploy agents
```

---

## Exit Code Reference

```
0 = SUCCESS               ✓ Command succeeded
1 = GENERAL_ERROR         ✗ Unknown error (check error.message)
2 = CONFIG_ERROR          ✗ Missing GITHUB_TOKEN or invalid config
3 = VALIDATION_ERROR      ✗ Invalid arguments, not in git repo
4 = NETWORK_ERROR         ✗ GitHub API unreachable
5 = AUTH_ERROR            ✗ Authentication failed, invalid token
```

**Always report exit code in output:**
```
Command: `miyabi status --json`
Exit: 0 (SUCCESS)
```

---

## JSON Response Schema

### Success Response

```typescript
interface AgentSuccessOutput<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string; // ISO 8601
}
```

### Error Response

```typescript
interface AgentErrorOutput {
  success: false;
  error: {
    code: string;           // "MISSING_GITHUB_TOKEN"
    message: string;        // Human-readable message
    recoverable: boolean;   // Can user fix this?
    suggestion?: string;    // How to fix
    details?: any;          // Additional context
  };
  timestamp: string;
}
```

### Status Response

```typescript
interface StatusData {
  repository: {
    owner: string;
    name: string;
    url: string;
  };
  issues: {
    total: number;
    byState: {
      pending: number;
      analyzing: number;
      implementing: number;
      reviewing: number;
      blocked: number;
      paused: number;
    };
  };
  pullRequests: Array<{
    number: number;
    title: string;
    url: string;
    createdAt: string;
  }>;
  summary: {
    totalOpen: number;
    activeAgents: number;
    blocked: number;
  };
}
```

---

## Communication Style Rules

### Rule 1: Be Concise (2-3 Sentences Max)

**Good:**
```
Executed status check. Found 15 open issues with 3 pending analysis. Running IssueAgent next.
```

**Bad:**
```
I've executed the status check command and it was successful! The results show that there are 15 open issues in total. Out of these 15 issues, 3 of them are in the pending state which means they haven't been analyzed yet. So I think the next step would be to run the IssueAgent to analyze these pending issues. Does that sound good to you?
```

### Rule 2: No Emojis

**Good:**
```
Status: 15 open issues, 3 pending analysis
```

**Bad:**
```
Status: 15 open issues 📝, 3 pending analysis ⏳✨
```

### Rule 3: Technical Focus (Exit Codes, Error Codes, Data)

**Good:**
```
Command: `miyabi status --json`
Exit: 0
Open Issues: 15
Pending: 3
```

**Bad:**
```
I ran the status command and everything looks great! There are some issues but that's okay!
```

### Rule 4: Action-Oriented (State Next Step)

**Good:**
```
Status check complete. 3 pending issues found. Running IssueAgent for analysis.
```

**Bad:**
```
Status check complete. There are 3 pending issues.
[Claude Code stops here without stating next action]
```

### Rule 5: Error-First (Report Errors Immediately)

**Good:**
```
Error: MISSING_GITHUB_TOKEN
GITHUB_TOKEN not found in environment.
Action Required: export GITHUB_TOKEN=ghp_xxx
```

**Bad:**
```
I tried to run the command but it didn't work. I think maybe there might be an issue with the token or something? Let me try a different approach...
```

---

## Quick Reference for Claude Code

### Before Every Miyabi Command:

```bash
# 1. Verify GITHUB_TOKEN exists
echo "GITHUB_TOKEN: ${GITHUB_TOKEN:+SET}"

# 2. Execute with --json and --yes
miyabi [command] --json --yes

# 3. Capture exit code
EXIT_CODE=$?

# 4. Check exit code BEFORE parsing
if [ $EXIT_CODE -eq 0 ]; then
  # Parse JSON output
else
  # Handle error with recovery pattern
fi
```

### Output Template:

```
[Action description - 1 line]

Command: `miyabi [command] --json`
Exit: [code]

[Key data - 3-5 points max]

Next Action: [What happens next]
```

### When to Use Which Agent:

- **issue**: New issue needs analysis/labeling (SDK integrated ✓)
- **codegen**: Issue needs code implementation (pending)
- **review**: Code needs quality check (pending)
- **pr**: Need to create Pull Request (pending)
- **deploy**: Need to deploy to staging/prod (pending)
- **coordinator**: Need to decompose complex task (pending)

### Environment Variables Checklist:

```bash
✓ GITHUB_TOKEN=ghp_xxx       # Required for all commands
✓ MIYABI_JSON=1              # Recommended for Claude Code
✓ MIYABI_AUTO_YES=1          # Recommended for non-interactive
□ MIYABI_VERBOSE=1           # Optional for debugging
□ ANTHROPIC_API_KEY=sk-ant-  # NOT needed (uses Claude Code CLI)
```

---

## Summary

**Claude Code MUST:**
- Use `--json` and `--yes` flags for all miyabi commands
- Check exit codes before parsing output
- Report concisely (2-3 sentences)
- Never use emojis in explanations
- State next action explicitly
- Report errors immediately with recovery steps

**Claude Code MUST NOT:**
- Assume success without checking exit code
- Use emojis or overly friendly language
- Provide verbose explanations by default
- Ignore error suggestions in JSON responses
- Execute without verifying GITHUB_TOKEN

**v0.8.7 Key Features:**
- ✅ IssueAgent SDK integration (miyabi-agent-sdk)
- ✅ Auto repository detection from git remote
- ✅ Uses Claude Code CLI (free, no API key needed)
- ⏳ Other agents pending SDK integration

---

**This instruction file is automatically loaded by Claude Code when executing miyabi commands.**
**Version: Optimized for Miyabi v0.8.7+ (December 2024)**
