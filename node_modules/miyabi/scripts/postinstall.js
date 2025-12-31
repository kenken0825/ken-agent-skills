#!/usr/bin/env node

/**
 * Post-install script for Miyabi
 *
 * Phase 3: Enhanced Postinstall (Progressive Onboarding System)
 * - Global config directory (~/.miyabi/)
 * - First-run detection
 * - Improved immediate value demonstration
 * - Integration with onboard and doctor commands
 */

import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Global config paths
const GLOBAL_CONFIG_DIR = path.join(homedir(), '.miyabi');
const FIRST_RUN_MARKER = path.join(GLOBAL_CONFIG_DIR, '.first-run');
const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, 'config.json');

// Colors fallback for older terminals
const colors = {
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

/**
 * Check if we're in a user project (not in Miyabi's own node_modules)
 * Cross-platform: handles both Unix and Windows paths
 */
function isUserProject() {
  // Normalize path to use forward slashes for consistent checking
  const cwd = process.cwd().replace(/\\/g, '/').toLowerCase();

  // Skip if we're inside Miyabi's own directory
  if (cwd.includes('/miyabi/') || cwd.includes('/autonomous-operations/')) {
    return false;
  }

  // Skip if we're in the global npm directory (Unix or Windows)
  if (cwd.includes('/.npm/') ||
      cwd.includes('/lib/node_modules/') ||
      cwd.includes('/node_modules/miyabi') ||
      cwd.includes('/appdata/roaming/npm/') ||
      cwd.includes('/appdata/local/npm/')) {
    return false;
  }

  return true;
}

/**
 * Initialize global config directory
 */
function initGlobalConfig() {
  if (!fs.existsSync(GLOBAL_CONFIG_DIR)) {
    fs.mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true, mode: 0o755 });
  }
}

/**
 * Check if this is a truly first-time install (global)
 */
function isGlobalFirstRun() {
  return !fs.existsSync(FIRST_RUN_MARKER);
}

/**
 * Mark global first run as complete
 */
function markGlobalFirstRunComplete() {
  initGlobalConfig();

  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  const config = {
    version: packageJson.version,
    installedAt: new Date().toISOString(),
    onboardingCompleted: false,
  };

  fs.writeFileSync(FIRST_RUN_MARKER, new Date().toISOString(), 'utf-8');
  fs.writeFileSync(GLOBAL_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Check if this is a fresh install in current project
 */
function isFreshInstall() {
  const markerPath = path.join(process.cwd(), '.miyabi-initialized');
  return !fs.existsSync(markerPath);
}

/**
 * Create initialization marker
 */
async function createMarker() {
  const markerPath = path.join(process.cwd(), '.miyabi-initialized');
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  fs.writeFileSync(
    markerPath,
    JSON.stringify({
      initializedAt: new Date().toISOString(),
      miyabiVersion: packageJson.version,
    }, null, 2),
    'utf-8'
  );
}

/**
 * Main initial sequence (Phase 3: Enhanced)
 */
async function runInitialSequence() {
  // Only run in user projects
  if (!isUserProject()) {
    return;
  }

  // Only run on fresh installs
  if (!isFreshInstall()) {
    return;
  }

  const isGlobalFirst = isGlobalFirstRun();

  console.log('\n' + colors.cyan(colors.bold('🌸 Miyabi インストール完了！')));
  console.log(colors.gray('初期セットアップを開始します...\n'));

  // Step 1: Initialize global config (if first time ever)
  if (isGlobalFirst) {
    initGlobalConfig();
    markGlobalFirstRunComplete();
    console.log(colors.green('✓ グローバル設定を初期化しました (~/.miyabi/)\n'));
  }

  // Step 2: Display welcome message
  displayWelcome();

  // Step 3: Check environment
  const envCheck = await checkEnvironment();
  displayEnvironmentStatus(envCheck);

  // Step 4: Create project marker to prevent re-running
  await createMarker();

  // Step 5: Display next steps
  displayNextSteps(envCheck);
}

/**
 * Display welcome message
 */
function displayWelcome() {
  console.log(colors.green('✓ Miyabi CLI がインストールされました\n'));

  console.log(colors.cyan('Miyabiとは？'));
  console.log(colors.gray('  一つのコマンドで全てが完結する自律型開発フレームワーク'));
  console.log(colors.gray('  7つのAI Agentが自動的にコードを書き、レビューし、デプロイします\n'));
}

/**
 * Check environment
 */
async function checkEnvironment() {
  const checks = {
    node: false,
    git: false,
    githubToken: false,
    hasPackageJson: false,
    hasGitRepo: false,
  };

  // Check Node.js version
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
  checks.node = nodeMajor >= 18;

  // Check if git is available (cross-platform)
  try {
    const { execSync } = await import('child_process');
    // Use shell: true for Windows compatibility
    execSync('git --version', { stdio: 'ignore', shell: true });
    checks.git = true;
  } catch (error) {
    checks.git = false;
  }

  // Check GITHUB_TOKEN
  checks.githubToken = !!process.env.GITHUB_TOKEN;

  // Check if package.json exists
  checks.hasPackageJson = fs.existsSync(path.join(process.cwd(), 'package.json'));

  // Check if .git directory exists
  checks.hasGitRepo = fs.existsSync(path.join(process.cwd(), '.git'));

  return checks;
}

/**
 * Display environment status
 */
function displayEnvironmentStatus(checks) {
  console.log(colors.cyan('環境チェック:'));

  if (checks.node) {
    console.log(colors.green('  ✓ Node.js ' + process.version + ' (OK)'));
  } else {
    console.log(colors.yellow('  ⚠ Node.js ' + process.version + ' (18以上を推奨)'));
  }

  if (checks.git) {
    console.log(colors.green('  ✓ Git インストール済み'));
  } else {
    console.log(colors.yellow('  ⚠ Git が見つかりません'));
  }

  if (checks.githubToken) {
    console.log(colors.green('  ✓ GITHUB_TOKEN 設定済み'));
  } else {
    console.log(colors.yellow('  ⚠ GITHUB_TOKEN 未設定'));
  }

  if (checks.hasGitRepo) {
    console.log(colors.green('  ✓ Gitリポジトリ検出'));
  }

  console.log('');
}

/**
 * Display next steps (Phase 3: Enhanced with onboard/doctor commands)
 */
function displayNextSteps(checks) {
  const isGlobalFirst = isGlobalFirstRun();

  console.log(colors.cyan(colors.bold('次のステップ:')));

  if (isGlobalFirst) {
    // Absolutely first time using Miyabi
    console.log(colors.green('\n🌸 初めての方へ - まずはこちら:'));
    console.log(colors.bold('   npx miyabi onboard'));
    console.log(colors.gray('   → 初回セットアップウィザード（5ステップ）\n'));

    console.log(colors.green('または、システムヘルスチェック:'));
    console.log(colors.gray('   npx miyabi doctor'));
    console.log(colors.gray('   → 環境チェック・診断（9項目）\n'));
  } else {
    // Already used Miyabi before
    console.log(colors.green('\n✓ Miyabiを既に使用されています'));
  }

  if (!checks.hasGitRepo && !checks.hasPackageJson) {
    // New project scenario
    console.log(colors.green('1️⃣  新しいプロジェクトを作成:'));
    console.log(colors.gray('   npx miyabi init my-project\n'));

    console.log(colors.green('2️⃣  または、既存プロジェクトにインストール:'));
    console.log(colors.gray('   cd my-existing-project'));
    console.log(colors.gray('   npx miyabi install\n'));
  } else {
    // Existing project scenario
    console.log(colors.green('1️⃣  Miyabiを既存プロジェクトに統合:'));
    console.log(colors.gray('   npx miyabi install\n'));

    console.log(colors.green('2️⃣  プロジェクト状態を確認:'));
    console.log(colors.gray('   npx miyabi status\n'));
  }

  console.log(colors.green('3️⃣  対話モードで実行:'));
  console.log(colors.gray('   npx miyabi\n'));

  if (!checks.githubToken) {
    console.log(colors.yellow('💡 GitHub Token設定方法:'));
    console.log(colors.gray('   export GITHUB_TOKEN=ghp_your_token_here'));
    console.log(colors.gray('   または、npx miyabi を実行して認証フローを開始\n'));
  }

  console.log(colors.cyan('📚 ドキュメント:'));
  console.log(colors.gray('   https://github.com/ShunsukeHayashi/Miyabi\n'));

  console.log(colors.gray('📝 Note: 現在TypeScript/Node.js最適化済み'));
  console.log(colors.gray('   他言語: https://github.com/ShunsukeHayashi/Miyabi#-language--framework-support\n'));

  console.log(colors.green('🌸 Miyabi - Beauty in Autonomous Development\n'));
}

// Run initial sequence
runInitialSequence().catch((error) => {
  console.error(colors.yellow('初期セットアップでエラーが発生しました:'), error.message);
  console.error(colors.gray('問題が続く場合は手動で実行してください: npx miyabi\n'));
});
