<div align="center">

# 🌸 Miyabi (雅)

**一つのコマンドで全てが完結する自律型開発フレームワーク**

[![npm version](https://img.shields.io/npm/v/miyabi.svg?style=for-the-badge&color=ff69b4)](https://www.npmjs.com/package/miyabi)
[![npm downloads](https://img.shields.io/npm/dm/miyabi.svg?style=for-the-badge&color=ff69b4)](https://www.npmjs.com/package/miyabi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=for-the-badge&logo=node.js)](https://nodejs.org)

[![GitHub stars](https://img.shields.io/github/stars/ShunsukeHayashi/Miyabi?style=social)](https://github.com/ShunsukeHayashi/Miyabi/stargazers)
[![Twitter Follow](https://img.shields.io/twitter/follow/miyabi_dev?style=social)](https://twitter.com/miyabi_dev)

**Zero-learning-cost CLI for autonomous AI development**

Designed for both humans and AI agents (Claude Code, Devin, etc.)

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [💡 Features](#-features) • [🤖 For AI Agents](#-ai-agent-integration)

</div>

---

## ✨ What is Miyabi?

**Miyabi** (雅 - Japanese for "elegance") transforms your development workflow with **one command**.

```bash
npx miyabi init my-project
```

**That's it.** No configuration files. No complex setup. Just pure elegance.

### 🎬 See it in Action

<div align="center">

**Before Miyabi:**
```
❌ Manual repo setup
❌ Configure labels
❌ Setup workflows
❌ Create project boards
❌ Write documentation
❌ Configure CI/CD
⏰ Time: 2-3 hours
```

**With Miyabi:**
```bash
npx miyabi init my-project
✓ Repository created
✓ 53 labels configured
✓ 12 workflows deployed
✓ Projects V2 linked
✓ Documentation generated
✓ CI/CD ready
⏰ Time: 2 minutes
```

</div>

### 🌟 Key Highlights

<table>
<tr>
<td width="33%" align="center">
<h3>🚀 Lightning Fast</h3>
<p>Full project setup in <strong>under 2 minutes</strong></p>
</td>
<td width="33%" align="center">
<h3>🤖 AI-Native</h3>
<p>Built for <strong>Claude Code</strong> & autonomous agents</p>
</td>
<td width="33%" align="center">
<h3>🌸 Zero Config</h3>
<p>No learning curve. <strong>Just works™</strong></p>
</td>
</tr>
<tr>
<td width="33%" align="center">
<h3>🔄 State Machine</h3>
<p><strong>53 labels</strong> orchestrate your workflow</p>
</td>
<td width="33%" align="center">
<h3>⚡ Auto-Deploy</h3>
<p><strong>12+ workflows</strong> handle everything</p>
</td>
<td width="33%" align="center">
<h3>🌍 i18n Ready</h3>
<p>Full <strong>Japanese</strong> & English support</p>
</td>
</tr>
</table>

---

## 🚀 Quick Start

> **📝 Note:** Miyabi is currently optimized for **TypeScript/Node.js** projects. For other languages (Python, Go, Rust, etc.), see [Language & Framework Support](#-language--framework-support) below for adaptation instructions.

### For Humans 👨‍💻

#### Interactive Mode (Easiest)

```bash
npx miyabi
```

Then select from the menu:
- 🌸 **First-Time Setup** (onboarding wizard)
- 🆕 **Create New Project**
- 📦 **Add to Existing Project**
- 📊 **Check Status**
- 🩺 **Health Check** (diagnostics)

#### One-Command Execution (NEW! v0.15.0+)

```bash
# Magic command - interactive wizard
npx miyabi run

# Quick shortcuts
npx miyabi fix 123          # Fix issue #123
npx miyabi build 456        # Build feature for issue #456
npx miyabi ship             # Deploy with approval gates
```

**Features:**
- TUI Dashboard with real-time progress
- Human-in-the-loop approval gates for critical actions
- One command replaces complex agent orchestration

#### Direct Commands

```bash
# First-time setup wizard
npx miyabi onboard

# Health check & diagnostics
npx miyabi doctor

# Create new project
npx miyabi init my-awesome-project

# Add to existing project
cd existing-project
npx miyabi install

# Check agent status
npx miyabi status --watch
```

### For AI Agents (Claude Code, Devin) 🤖

**v0.5.0+** Auto-detects Claude Code and shows CLI commands:

```bash
npx miyabi
# → 💡 Claude Code環境が検出されました
#   利用可能なコマンド:
#     npx miyabi init <project-name>
#     npx miyabi install
#     npx miyabi status
```

**Direct usage:**

```bash
# Create project with all options
npx miyabi init my-project --private

# Install to existing repo
npx miyabi install

# Get status
npx miyabi status

# Configure
npx miyabi config
```

---

## 🌸 プログラムが苦手な方へ

<div align="center">

### 👉 3ステップで完全自動セットアップ

</div>

**プログラミングの知識がなくても大丈夫！** Claude Codeが全部やってくれます。

#### ステップ1: Claude Codeをインストール

- [VS Code拡張機能](https://marketplace.visualstudio.com/items?itemName=Anthropic.claude-code)
- または [claude.ai/code](https://claude.ai/code)

#### ステップ2: 魔法の言葉を入力

```
/setup-miyabi

Miyabiをセットアップしてください
```

#### ステップ3: AIの質問に答えるだけ！

あとは全部自動です 🎉

<div align="center">

📖 **詳細ガイド**: [プログラムが苦手な方向け完全ガイド](./FOR_NON_PROGRAMMERS.md)

画面のスクリーンショット付き・所要時間: 約10分

</div>

---

## 💡 Features

### 🎯 Core Features

<details open>
<summary><strong>One-Command Setup</strong> - Everything in one command</summary>

```bash
npx miyabi init my-project
```

What happens:
- ✅ GitHub repository created
- ✅ 53 labels configured (state machine)
- ✅ 12+ GitHub Actions deployed
- ✅ GitHub Projects V2 linked
- ✅ Local npm project initialized
- ✅ `.claude/` directory with 6 AI agents
- ✅ Welcome issue created
- ✅ Documentation generated

**Time: ~2 minutes**
</details>

<details>
<summary><strong>Label-Based State Machine</strong> - Orchestrate your workflow</summary>

### 53 Labels Across 10 Categories

**States** (7 labels):
- `📥 state:pending` → `🔍 state:analyzing` → `🏗️ state:implementing` → `👀 state:reviewing` → `✅ state:done`

**Types** (10 labels):
- `🐛 type:bug` `✨ type:feature` `📚 type:docs` `♻️ type:refactor` `🧪 type:test`

**Priority** (4 labels):
- `📊 priority:P0-Critical` `⚠️ priority:P1-High` `📊 priority:P2-Medium` `📊 priority:P3-Low`

**Agents** (6 labels):
- `🤖 agent:coordinator` `🤖 agent:codegen` `🤖 agent:review` `🤖 agent:issue` `🤖 agent:pr` `🤖 agent:deploy`

**Phase** (8 labels):
- `🎯 phase:planning` `🏗️ phase:development` `🧪 phase:testing` `🚀 phase:deployment`

[View all 53 labels →](./templates/labels.yml)
</details>

<details>
<summary><strong>GitHub Actions Workflows</strong> - Complete automation</summary>

### 12+ Workflows Included

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Autonomous Agent** | Issue opened | Auto-analyze & implement |
| **Auto-Label** | Issue/PR opened | Intelligent labeling |
| **State Machine** | Label changed | State transitions |
| **Auto-Review** | PR opened | Code review |
| **Deploy Pages** | Push to main | Docs deployment |
| **Economic Circuit Breaker** | High API usage | Cost control |
| **Weekly KPI Report** | Schedule | Progress tracking |
| **Webhook Router** | All events | Event routing |

[View all workflows →](./templates/workflows/)
</details>

<details>
<summary><strong>Claude Code Integration</strong> - AI-first development</summary>

### Full `.claude/` Directory Deployment

**6 AI Agents:**
- `CoordinatorAgent` - Task orchestration
- `CodeGenAgent` - Code generation
- `ReviewAgent` - Quality assurance
- `IssueAgent` - Issue management
- `PRAgent` - Pull request automation
- `DeploymentAgent` - CI/CD

**7 Custom Commands:**
- `/agent-run` - Run autonomous agent
- `/create-issue` - Smart issue creation
- `/deploy` - Deploy to production
- `/generate-docs` - Auto documentation
- `/security-scan` - Security audit
- `/test` - Run test suite
- `/verify` - System health check

**MCP Servers:**
- `github-enhanced.js` - Enhanced GitHub integration
- `ide-integration.js` - IDE bridging
- `project-context.js` - Project awareness

[Learn more about Claude Code →](https://claude.ai/code)
</details>

### 🎨 User Experience

<table>
<tr>
<td width="50%">

**For Humans:**
- ✨ Interactive menus
- 🇯🇵 Full Japanese support
- 📊 Beautiful status displays
- 🎯 Guided setup wizard
- ❓ Contextual help

</td>
<td width="50%">

**For AI Agents:**
- 🤖 Non-interactive mode
- 📋 JSON output
- 🔧 Programmatic API
- 🌐 Environment variables
- 📖 Full context in README

</td>
</tr>
</table>

---

## 🌍 Language & Framework Support

### Current Implementation (v0.13.0)

**Primary Support: TypeScript/Node.js**

Miyabi's GitHub Actions and workflows are currently optimized for:
- **Language**: TypeScript, JavaScript
- **Runtime**: Node.js ≥18
- **Package Manager**: npm
- **Testing**: Vitest
- **Build Tools**: tsc, esbuild

**Workflows affected:**
- `autonomous-agent.yml` - Uses `npm run typecheck`, `npm run agents:parallel:exec`
- `deploy-pages.yml` - Node.js app deployment
- `weekly-report.yml` - TypeScript/Node.js implementation
- `weekly-kpi-report.yml` - TypeScript/Node.js KPI reporting

### Multi-Language Roadmap

**Phase 1 (Current)**: TypeScript/Node.js optimized templates
**Phase 2 (v0.14+)**: Language-agnostic workflow templates
**Phase 3 (2026+)**: Fully autonomous language detection

### Adapting for Other Languages/Frameworks

**You can easily adapt Miyabi for your stack using Claude Code:**

<details>
<summary><strong>Example: Python + FastAPI</strong></summary>

```bash
# 1. Install Miyabi (creates TypeScript templates)
npx miyabi install

# 2. Ask Claude Code to adapt
# In Claude Code, run:
```

**Prompt for Claude Code:**
```
.claude/commands と .claude/agents について、
元の指示の意図を変えずに、Python と FastAPI 用に書き換えてください。

以下を変更:
- npm → pip/poetry
- TypeScript → Python
- Vitest → pytest
- tsc → mypy
- Node.js → Python 3.11+

ワークフローファイルも同様に書き換えてください。
```

**Result:** All workflows adapted for Python!
</details>

<details>
<summary><strong>Example: Go + Gin</strong></summary>

**Prompt for Claude Code:**
```
.claude/commands と .claude/agents について、
Go言語とGinフレームワーク用に書き換えてください。

以下を変更:
- npm → go mod
- TypeScript → Go
- Vitest → go test
- tsc → go build
- Node.js → Go 1.21+

ワークフローファイルも同様に書き換えてください。
```
</details>

<details>
<summary><strong>Example: Rust + Actix</strong></summary>

**Prompt for Claude Code:**
```
.claude/commands と .claude/agents について、
Rust言語とActixフレームワーク用に書き換えてください。

以下を変更:
- npm → cargo
- TypeScript → Rust
- Vitest → cargo test
- tsc → cargo build
- Node.js → Rust 1.70+

ワークフローファイルも同様に書き換えてください。
```
</details>

### Supported Stacks (with adaptation)

| Language | Framework | Package Manager | Testing | Status |
|----------|-----------|----------------|---------|--------|
| TypeScript | Express/Next.js | npm/yarn/pnpm | Vitest | ✅ Native |
| JavaScript | React/Vue | npm/yarn/pnpm | Jest | ✅ Native |
| Python | FastAPI/Django | pip/poetry | pytest | 🔄 Adapt |
| Go | Gin/Echo | go mod | go test | 🔄 Adapt |
| Rust | Actix/Rocket | cargo | cargo test | 🔄 Adapt |
| Ruby | Rails/Sinatra | bundler | rspec | 🔄 Adapt |
| Java | Spring Boot | maven/gradle | junit | 🔄 Adapt |
| C# | .NET | nuget | xunit | 🔄 Adapt |

**Legend:**
- ✅ Native: Works out-of-the-box
- 🔄 Adapt: Use Claude Code to adapt workflows

### Best Practices for Adaptation

1. **Keep workflow intentions intact** - Don't change what workflows do, only how they do it
2. **Preserve label system** - The 53-label system is language-agnostic
3. **Maintain agent roles** - CoordinatorAgent, CodeGenAgent, etc. work with any language
4. **Update documentation** - Document your language-specific setup

### Contributing Multi-Language Templates

We welcome contributions for other languages! See:
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution guidelines
- [docs/MULTI_LANGUAGE_GUIDE.md](../../docs/MULTI_LANGUAGE_GUIDE.md) - Template creation guide

---

## 📊 Commands Reference

### `init <project-name>`

Create a new project with full automation.

```bash
# Interactive
npx miyabi init my-project

# With options
npx miyabi init my-project --private

# Skip npm install
npx miyabi init my-project --skip-install
```

**Options:**
- `-p, --private` - Create private repository
- `--skip-install` - Skip npm install step

**What it creates:**
```
my-project/
├── .github/
│   ├── workflows/        # 12+ GitHub Actions
│   └── labels.yml        # 53 labels
├── .claude/
│   ├── agents/           # 6 AI agents
│   ├── commands/         # 7 custom commands
│   ├── hooks/            # Command hooks
│   └── mcp-servers/      # 3 MCP servers
├── src/
├── package.json
└── README.md
```

---

### `install`

Add Miyabi to an existing project.

```bash
# Interactive
npx miyabi install

# Dry run (preview changes)
npx miyabi install --dry-run

# Non-interactive mode (CI/CD, Termux, SSH)
npx miyabi install --non-interactive
npx miyabi install --yes
```

**Options:**
- `--dry-run` - Preview changes without making them
- `--non-interactive` - Skip all prompts (auto-approve)
- `-y, --yes` - Auto-approve all prompts

**What it does:**
- ✅ Analyzes existing structure
- ✅ Merges labels (non-destructive)
- ✅ Auto-labels existing issues
- ✅ Deploys missing workflows
- ✅ Links to Projects V2
- ✅ Creates `.claude/` directory

**Smart merge:**
- Existing labels are preserved
- Workflows skip if already exist
- Issues are auto-labeled intelligently

---

### `status`

Check agent activity and project status.

```bash
# One-time check
npx miyabi status

# Watch mode (auto-refresh every 10s)
npx miyabi status --watch
```

**Output:**

```
┌──────────────┬────────┬─────────────┬──────────────┐
│ Agent        │ Status │ Task        │ Last Update  │
├──────────────┼────────┼─────────────┼──────────────┤
│ Coordinator  │ ✅ Active │ #123      │ 2 mins ago   │
│ CodeGen      │ 💤 Idle  │ -         │ -            │
│ Review       │ ✅ Active │ #124      │ 30 secs ago  │
│ Issue        │ ✅ Active │ #125      │ 1 min ago    │
│ PR           │ 💤 Idle  │ -         │ -            │
│ Deploy       │ ✅ Active │ main      │ 5 mins ago   │
└──────────────┴────────┴─────────────┴──────────────┘

📊 Summary:
  ✅ 4 agents active
  💤 2 agents idle
  📥 12 pending issues
  🚀 3 in progress
```

---

### `docs`

Generate documentation from code.

```bash
# Interactive
npx miyabi docs

# Direct
npx miyabi docs --input ./src --output ./docs/API.md

# Watch mode
npx miyabi docs --watch

# Include training materials
npx miyabi docs --training
```

**Generates:**
- API documentation
- Type definitions
- Usage examples
- Training materials (optional)

---

### `config`

Manage Miyabi configuration.

```bash
# Interactive wizard
npx miyabi config

# Show current config
npx miyabi config --show

# Reset to defaults
npx miyabi config --reset
```

**Configuration file** (`.miyabi.yml`):

```yaml
github:
  defaultPrivate: true
  token: ghp_xxxxx        # Or use GITHUB_TOKEN env var

project:
  defaultLanguage: typescript
  defaultFramework: react
  gitignoreTemplate: Node
  licenseTemplate: mit

workflows:
  autoLabel: true
  autoReview: true
  autoSync: true

cli:
  language: ja            # ja or en
  theme: default
  verboseErrors: true
```

---

### `setup`

Interactive setup guide for beginners.

```bash
# Interactive mode
npx miyabi setup

# Non-interactive mode
npx miyabi setup --non-interactive

# Skip specific steps
npx miyabi setup --skip-token --skip-config
```

**Options:**
- `--non-interactive` - Skip all prompts
- `-y, --yes` - Auto-approve all prompts
- `--skip-token` - Skip token setup
- `--skip-config` - Skip configuration

**Guides through:**
1. ✅ Environment check (Node.js, Git, gh CLI)
2. ✅ GitHub authentication
3. ✅ Token creation
4. ✅ Configuration
5. ✅ First project creation

---

### `onboard`

Comprehensive first-run wizard for new users.

```bash
# Interactive onboarding
npx miyabi onboard

# Skip optional features
npx miyabi onboard --skip-demo --skip-tour
```

**Options:**
- `--skip-demo` - Skip demo project creation
- `--skip-tour` - Skip feature tour
- `--non-interactive` - Exit (requires interactive mode)
- `-y, --yes` - Same as --non-interactive

**What it does:**
1. ✅ Welcome & introduction
2. ✅ System health check (calls `doctor`)
3. ✅ 30-second "What is Miyabi?" overview
4. ✅ Demo project creation (optional)
5. ✅ Interactive feature tour
6. ✅ Quick commands reference
7. ✅ Resource links

**Perfect for:**
- 🆕 First-time Miyabi users
- 📚 Learning the system
- 🎓 Understanding capabilities
- 🚀 Quick start

---

### `doctor`

System health check and diagnostics.

```bash
# Basic health check
npx miyabi doctor

# Detailed diagnostics
npx miyabi doctor --verbose

# JSON output (for AI agents)
npx miyabi doctor --json
```

**Health Checks Performed:**

| Check | Description | Fix Suggestions |
|-------|-------------|-----------------|
| **Node.js** | Version ≥18.0.0 | Upgrade Node.js |
| **Git** | Installation & version | Install Git |
| **GitHub CLI** | `gh` authentication | Run `gh auth login` |
| **GITHUB_TOKEN** | Token format validation | Set env var or use gh CLI |
| **Token Permissions** | Required scopes check | Add `repo`, `workflow`, `project` |
| **Network** | GitHub API connectivity | Check internet connection |
| **Repository** | Git repo detection | Initialize git repo |
| **.miyabi.yml** | Config file validation | Fix YAML syntax |
| **Claude Code** | Environment detection | N/A (informational) |

**Output Example:**

```
🩺 Miyabi Health Check

  ✓ Node.js: v20.10.0 (OK)
  ✓ Git: git version 2.42.0 (OK)
  ✓ GitHub CLI: gh version 2.40.0 (Authenticated)
  ✓ GITHUB_TOKEN: Valid token format
  ⚠ Token Permissions: Missing recommended scopes: project
    💡 Add recommended scopes for full functionality: https://github.com/settings/tokens
  ✓ Network Connectivity: GitHub API accessible
  ✓ Repository: Git repository detected
  ✓ Claude Code: Standard terminal

Summary:
  ✓ 7 checks passed
  ⚠ 1 warnings
  8 total checks

⚠ Overall: Issues detected (but not critical)

Next Steps:
  1. Review the suggestions above to fix issues
  2. Run this command again to verify fixes
  3. For help: https://github.com/ShunsukeHayashi/Miyabi/issues
```

**JSON Mode:**

```bash
npx miyabi doctor --json
```

```json
{
  "checks": [
    {
      "name": "Node.js",
      "status": "pass",
      "message": "v20.10.0 (OK)",
      "details": "Node.js v20.10.0 meets minimum requirement (≥18)"
    },
    ...
  ],
  "summary": {
    "passed": 7,
    "warned": 1,
    "failed": 0,
    "total": 8
  },
  "overallStatus": "issues"
}
```

**Exit Codes:**
- `0` - Healthy or minor issues
- `1` - Critical issues found

---

## 🤖 AI Agent Integration

### Claude Code Auto-Detection (v0.5.0+)

Miyabi automatically detects Claude Code environment and provides CLI-friendly output:

```bash
$ npx miyabi

✨ Miyabi
一つのコマンドで全てが完結する自律型開発フレームワーク

💡 Claude Code環境が検出されました

利用可能なコマンド:
  npx miyabi init <project-name>  - 新規プロジェクト作成
  npx miyabi install            - 既存プロジェクトに追加
  npx miyabi status             - ステータス確認
  npx miyabi docs               - ドキュメント生成
  npx miyabi config             - 設定管理
  npx miyabi setup              - セットアップガイド

詳細: npx miyabi --help
```

**Detection logic:**
- `CLAUDE_CODE=true`
- `ANTHROPIC_CLI=true`
- `TERM_PROGRAM=Claude`
- `ANTHROPIC_API_KEY` is set

### Programmatic API

```typescript
import { init, install, status, config } from 'miyabi';

// Initialize new project
await init('my-project', {
  private: true,
  skipInstall: false,
});

// Install to existing project
await install({
  dryRun: false,
});

// Get status
const statusData = await status({ watch: false });
console.log(statusData);

// Configure
await config({
  githubToken: process.env.GITHUB_TOKEN,
  language: 'ja',
});
```

### Environment Variables

```bash
# GitHub token (required)
export GITHUB_TOKEN=ghp_your_token_here

# Anthropic API key (for AI features)
export ANTHROPIC_API_KEY=sk-ant-xxx

# Webhook secret (for webhook router)
export WEBHOOK_SECRET=your_secret

# Non-interactive mode (auto-approve prompts)
export MIYABI_AUTO_APPROVE=true

# CI environment (auto-detected)
export CI=true
```

**Non-Interactive Mode:**

Miyabi automatically detects non-interactive environments:
- `MIYABI_AUTO_APPROVE=true` - Explicit non-interactive mode
- `CI=true` - CI/CD environments (GitHub Actions, GitLab CI, etc.)
- Non-TTY terminals - Pipes, redirects, SSH without PTY

**Usage in CI/CD:**
```yaml
# GitHub Actions example
- name: Install Miyabi
  run: npx miyabi install --non-interactive
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Usage in Termux (Android):**
```bash
# Termux automatically uses non-interactive mode
export MIYABI_AUTO_APPROVE=true
npx miyabi install
```

---

## 🔧 Configuration

### Priority Order

1. **Command-line flags** (highest priority)
   ```bash
   npx miyabi config --token=ghp_xxx
   ```

2. **Environment variables**
   ```bash
   export GITHUB_TOKEN=ghp_xxx
   ```

3. **Config file** (`.miyabi.yml`)
   ```yaml
   github:
     token: ghp_xxx
   ```

4. **Default values** (lowest priority)

### Configuration File

```yaml
github:
  token: ghp_xxxxx              # GitHub Personal Access Token
  defaultPrivate: true          # Create private repos by default
  defaultOrg: my-org            # Default organization

project:
  defaultLanguage: typescript   # typescript, javascript, python, go, rust
  defaultFramework: react       # react, vue, angular, next, express
  gitignoreTemplate: Node       # Node, Python, Go, Rust, Java, etc.
  licenseTemplate: mit          # mit, apache-2.0, gpl-3.0, etc.

workflows:
  autoLabel: true               # Auto-label new issues
  autoReview: true              # Auto-review PRs
  autoSync: true                # Auto-sync to Projects

cli:
  language: ja                  # ja (日本語) or en (English)
  theme: default                # default, minimal, colorful
  verboseErrors: true           # Show detailed error messages
```

---

## 📋 Requirements

<table>
<tr>
<td width="20%" align="center">

**Node.js**

≥ 18.0.0

<img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?logo=node.js" />

</td>
<td width="20%" align="center">

**Git**

Latest

<img src="https://img.shields.io/badge/git-required-orange?logo=git" />

</td>
<td width="20%" align="center">

**GitHub CLI**

Latest

<img src="https://img.shields.io/badge/gh-cli-blue?logo=github" />

</td>
<td width="20%" align="center">

**GitHub**

Account

<img src="https://img.shields.io/badge/github-account-black?logo=github" />

</td>
<td width="20%" align="center">

**Token**

PAT

<img src="https://img.shields.io/badge/token-PAT-red?logo=github" />

</td>
</tr>
</table>

### Installation

```bash
# Check requirements
node --version    # Should be >= 18.0.0
git --version     # Any recent version
gh --version      # Latest stable

# Install miyabi (no installation needed for npx)
npx miyabi@latest

# Or install globally
npm install -g miyabi
```

### GitHub Authentication

**Recommended: Use GitHub CLI (automatic)**

```bash
# Authenticate once
gh auth login

# Miyabi will automatically use gh CLI token
npx miyabi install
# ✅ GitHub authentication complete (via gh CLI)
```

**Alternative: Personal Access Token**

If you prefer manual token management, create at: https://github.com/settings/tokens/new

**Required scopes:**
- ✅ `repo` - Full repository access
- ✅ `workflow` - Update workflows
- ✅ `write:packages` - Publish packages
- ✅ `delete:packages` - Manage packages
- ✅ `admin:org` - Organization management (for org repos)
- ✅ `project` - Projects V2 access

**Token Priority:**
1. **gh CLI** (automatic, recommended) - `gh auth login`
2. **GITHUB_TOKEN** environment variable - `export GITHUB_TOKEN=ghp_xxx`
3. **.env file** - Local development
4. **OAuth flow** - Interactive fallback

---

## 🐛 Troubleshooting

<details>
<summary><strong>GITHUB_TOKEN not found</strong></summary>

**Error:**
```
❌ GITHUB_TOKEN not found in environment

💡 対処法:
  1. 環境変数 GITHUB_TOKEN を設定してください
  2. `export GITHUB_TOKEN=ghp_your_token`
  3. もしくは miyabi config を実行して設定してください
```

**Solution:**

**Option 1: Use GitHub CLI (Recommended)**
```bash
# One-time setup
gh auth login

# Miyabi will automatically use gh CLI token
npx miyabi install
```

**Option 2: Environment variable**
```bash
export GITHUB_TOKEN=ghp_your_token_here
npx miyabi init my-project
```

**Option 3: .env file (local development only)**
```bash
echo "GITHUB_TOKEN=ghp_your_token" > .env
npx miyabi install
```

⚠️ **Security Warning:**
- Only use `.env` for local development
- Always add `.env` to `.gitignore`
- Never commit `.env` to version control
- See [SECURITY.md](../../SECURITY.md) for best practices

**Option 4: Config file**
```bash
npx miyabi config
# → Follow prompts to set token
```
</details>

<details>
<summary><strong>Repository already exists</strong></summary>

**Error:**
```
❌ repository creation failed: リポジトリ名 "my-project" は既に存在しています

💡 解決策:
  1. 別の名前を試してください: npx miyabi init my-project-2
  2. または、既存リポジトリを削除: gh repo delete my-project --yes
  3. GitHub で確認: https://github.com/settings/repositories
```

**Solution:**

Option 1: Different name
```bash
npx miyabi init my-project-new
```

Option 2: Delete existing (⚠️ careful!)
```bash
gh repo delete my-project --yes
npx miyabi init my-project
```

Option 3: Install to existing
```bash
gh repo clone my-project
cd my-project
npx miyabi install
```
</details>

<details>
<summary><strong>Rate limit exceeded</strong></summary>

**Error:**
```
❌ GitHub API rate limit exceeded
```

**Solution:**

Check rate limit:
```bash
gh api rate_limit
```

Wait or use authenticated token:
```bash
export GITHUB_TOKEN=ghp_your_token
```

Rate limits:
- **Unauthenticated**: 60 requests/hour
- **Authenticated**: 5,000 requests/hour
</details>

<details>
<summary><strong>Templates directory not found</strong></summary>

**Error:**
```
❌ Claude template directory not found: /path/to/templates/claude-code
```

**Solution:**

Reinstall miyabi:
```bash
npm uninstall -g miyabi
npm cache clean --force
npx miyabi@latest init my-project
```

Or use local installation:
```bash
git clone https://github.com/ShunsukeHayashi/Miyabi.git
cd Miyabi/packages/cli
npm install
npm run build
npm link
miyabi init my-project
```
</details>

<details>
<summary><strong>Claude Code not detected</strong></summary>

**Issue:** Running in Claude Code but interactive mode appears

**Solution:**

Manually set environment:
```bash
export CLAUDE_CODE=true
npx miyabi
```

Or use direct commands:
```bash
npx miyabi init my-project
npx miyabi status
```
</details>

<details>
<summary><strong>`npx miyabi-agent-sdk` エラー</strong></summary>

**エラー:**
```
npm error code ETARGET
npm error notarget No matching version found for miyabi-agent-sdk@*
```

**原因:**
`miyabi-agent-sdk` はライブラリであり、CLIツールではありません。
`npx miyabi-agent-sdk` のように実行することはできません。

**正しい使い方:**

**Option 1: Miyabi CLI を使用（推奨）**
```bash
# Miyabi CLI から Agent を実行
npx miyabi agent run codegen --issue=123
npx miyabi agent run review --pr=456 --issue=123
npx miyabi agent run pr --issue=123
```

**Option 2: プログラムから直接使用**
```typescript
// package.json
{
  "dependencies": {
    "miyabi-agent-sdk": "^0.1.0-alpha.2"
  }
}

// your-code.ts
import { CodeGenAgent } from 'miyabi-agent-sdk';

const agent = new CodeGenAgent({
  githubToken: process.env.GITHUB_TOKEN,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

const result = await agent.generate({
  issueNumber: 123,
  repository: 'my-repo',
  owner: 'my-org',
});
```

**詳細:**
- `miyabi` - CLIツール（`npx miyabi`で実行）
- `miyabi-agent-sdk` - ライブラリ（`import`で使用）
</details>

---

## 📚 Documentation

### Core Docs

- 📖 [Getting Started Guide](./SETUP_GUIDE.md) - Step-by-step setup
- 🌸 [For Non-Programmers](./FOR_NON_PROGRAMMERS.md) - Complete beginner guide
- 📦 [Install to Existing Project](./INSTALL_TO_EXISTING_PROJECT.md) - Migration guide
- 🧪 [Edge Case Tests](./EDGE_CASE_TESTS.md) - Testing scenarios

### Agent Docs

- 🤖 [Agent Operations Manual](../../docs/AGENT_OPERATIONS_MANUAL.md) - Agent system
- 🔄 [Webhook Event Bus](../../docs/WEBHOOK_EVENT_BUS.md) - Event routing
- 📋 [Testing Guide](../../docs/TESTING_GUIDE.md) - Test strategies

### API Reference

- 📝 [API Documentation](./docs/API.md) - Full API reference
- 🔧 [Configuration Schema](./docs/CONFIG.md) - Config options
- 🏷️ [Label Reference](./templates/labels.yml) - All 53 labels

---

## 🔗 Links

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/ShunsukeHayashi/Miyabi)
[![npm](https://img.shields.io/badge/npm-Package-red?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/miyabi)
[![Issues](https://img.shields.io/badge/Issues-Report-orange?style=for-the-badge&logo=github)](https://github.com/ShunsukeHayashi/Miyabi/issues)
[![Discussions](https://img.shields.io/badge/Discussions-Chat-blue?style=for-the-badge&logo=github)](https://github.com/ShunsukeHayashi/Miyabi/discussions)

</div>

---

## 🙏 Acknowledgments

Built with love using:

<table>
<tr>
<td align="center">
<img src="https://img.shields.io/badge/Commander.js-CLI-green?logo=terminal" /><br/>
<sub>CLI framework</sub>
</td>
<td align="center">
<img src="https://img.shields.io/badge/Inquirer.js-Prompts-blue?logo=terminal" /><br/>
<sub>Interactive prompts</sub>
</td>
<td align="center">
<img src="https://img.shields.io/badge/Chalk-Colors-pink?logo=terminal" /><br/>
<sub>Terminal styling</sub>
</td>
<td align="center">
<img src="https://img.shields.io/badge/Octokit-GitHub-black?logo=github" /><br/>
<sub>GitHub API client</sub>
</td>
</tr>
<tr>
<td align="center">
<img src="https://img.shields.io/badge/Anthropic-AI-purple?logo=anthropic" /><br/>
<sub>Claude integration</sub>
</td>
<td align="center">
<img src="https://img.shields.io/badge/TypeScript-Type%20Safety-blue?logo=typescript" /><br/>
<sub>Type-safe development</sub>
</td>
<td align="center">
<img src="https://img.shields.io/badge/Vitest-Testing-yellow?logo=vitest" /><br/>
<sub>Fast unit tests</sub>
</td>
<td align="center">
<img src="https://img.shields.io/badge/ESM-Modules-orange?logo=javascript" /><br/>
<sub>Modern JS</sub>
</td>
</tr>
</table>

---

## 📄 License

<div align="center">

**MIT** © [Shunsuke Hayashi](https://github.com/ShunsukeHayashi)

Open source with ❤️ from Tokyo 🗼

---

<sub>**Note for AI Agents:** This README contains full context. All features are documented above. Start by reading the [AI Agent Integration](#-ai-agent-integration) section.</sub>

<sub>🌸 Made with elegance and precision • [Report Issues](https://github.com/ShunsukeHayashi/Miyabi/issues) • [Contribute](https://github.com/ShunsukeHayashi/Miyabi/pulls)</sub>

</div>
