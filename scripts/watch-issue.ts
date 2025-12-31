#!/usr/bin/env node
/**
 * Issue Watcher with Notifications
 * Issueに関連するワークフローを監視して通知
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { monitorWorkflow } from './workflow-notifier';

const execAsync = promisify(exec);

async function watchIssue(issueNumber: string) {
  console.log(`👀 Watching issue #${issueNumber} for workflow activity...`);
  
  // 最新のワークフロー実行を取得
  const getLatestRun = async () => {
    try {
      const { stdout } = await execAsync(
        `gh run list --workflow=autonomous-agent.yml --limit 5 --json databaseId,status,displayTitle | jq '.[] | select(.displayTitle | contains("#${issueNumber}")) | .databaseId' | head -1`
      );
      
      return stdout.trim();
    } catch (error) {
      return null;
    }
  };
  
  let lastRunId = '';
  
  // 定期的にチェック
  setInterval(async () => {
    const runId = await getLatestRun();
    
    if (runId && runId !== lastRunId) {
      lastRunId = runId;
      console.log(`🎯 New workflow detected: ${runId}`);
      
      // 新しいワークフローを監視
      monitorWorkflow(runId, issueNumber).catch(console.error);
    }
  }, 5000); // 5秒ごとにチェック
}

// CLIとして実行
if (require.main === module) {
  const issueNumber = process.argv[2];
  
  if (!issueNumber) {
    console.log('Usage: watch-issue.ts <issueNumber>');
    console.log('Example: watch-issue.ts 5');
    process.exit(1);
  }
  
  watchIssue(issueNumber).catch(console.error);
}