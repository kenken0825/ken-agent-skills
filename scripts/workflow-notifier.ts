#!/usr/bin/env node
/**
 * GitHub Workflow Notifier
 * ワークフローの開始・終了を音声で通知
 */

import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

// macOS用の音声通知
const speak = async (message: string) => {
  if (process.platform === 'darwin') {
    await execAsync(`say "${message}"`);
  }
};

// macOS用のサウンド再生
const playSound = async (soundName: string) => {
  if (process.platform === 'darwin') {
    // システムサウンドを再生
    await execAsync(`afplay /System/Library/Sounds/${soundName}.aiff`);
  }
};

// デスクトップ通知
const notify = async (title: string, message: string) => {
  if (process.platform === 'darwin') {
    await execAsync(`osascript -e 'display notification "${message}" with title "${title}"'`);
  }
};

// ワークフロー監視
export async function monitorWorkflow(runId: string, issueNumber: string) {
  console.log(`🔍 Monitoring workflow run ${runId} for issue #${issueNumber}`);
  
  let previousStatus = '';
  const checkInterval = 10000; // 10秒ごとにチェック

  const checkStatus = async () => {
    try {
      const { stdout } = await execAsync(
        `gh run view ${runId} --json status,conclusion --jq '.status + "|" + .conclusion'`
      );
      
      const [status, conclusion] = stdout.trim().split('|');
      
      // ステータス変更を検出
      if (status !== previousStatus) {
        previousStatus = status;
        
        if (status === 'in_progress') {
          // 開始通知
          await Promise.all([
            playSound('Glass'),
            speak(`Issue ${issueNumber}の自動実装が開始されました`),
            notify('🚀 Miyabi Started', `Issue #${issueNumber}の自動実装が開始されました`)
          ]);
        }
      }
      
      // 完了を検出
      if (status === 'completed') {
        if (conclusion === 'success') {
          // 成功通知
          await Promise.all([
            playSound('Hero'),
            speak(`Issue ${issueNumber}の自動実装が成功しました`),
            notify('✅ Miyabi Success', `Issue #${issueNumber}の自動実装が完了しました`)
          ]);
        } else if (conclusion === 'failure') {
          // 失敗通知
          await Promise.all([
            playSound('Basso'),
            speak(`Issue ${issueNumber}の自動実装が失敗しました`),
            notify('❌ Miyabi Failed', `Issue #${issueNumber}の自動実装に失敗しました`)
          ]);
        }
        
        // 監視終了
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking workflow status:', error);
      return false;
    }
  };

  // 定期的にステータスをチェック
  while (true) {
    const completed = await checkStatus();
    if (completed) break;
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
}

// CLIとして実行
if (require.main === module) {
  const [runId, issueNumber] = process.argv.slice(2);
  
  if (!runId || !issueNumber) {
    console.log('Usage: workflow-notifier.ts <runId> <issueNumber>');
    process.exit(1);
  }
  
  monitorWorkflow(runId, issueNumber).catch(console.error);
}