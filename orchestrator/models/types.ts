/**
 * Orchestrator Core - 型定義
 */

import { WinPointHunterConfig, WinPointInput, WinPointOutput } from '../../agents/win-point-hunter/models/types';
import { PainAbstractorConfig, PainAbstractorInput, PainAbstractorOutput } from '../../agents/pain-abstractor/models/types';
import { SkillRecommenderConfig, SkillRecommenderInput, SkillRecommenderOutput } from '../../agents/skill-recommender/models/types';
import { SkillEvolutionJudgeConfig, SkillEvolutionJudgeInput, SkillEvolutionJudgeOutput } from '../../agents/skill-evolution-judge/models/types';
import { GitHubPackagerConfig, GitHubPackagerInput, GitHubPackagerOutput } from '../../agents/github-packager/models/types';

/**
 * オーケストレーター設定
 */
export interface OrchestratorConfig {
  debug?: boolean;
  timeout?: number;
  retryAttempts?: number;
  agents?: {
    winPointHunter?: WinPointHunterConfig;
    painAbstractor?: PainAbstractorConfig;
    skillRecommender?: SkillRecommenderConfig;
    skillEvolutionJudge?: SkillEvolutionJudgeConfig;
    githubPackager?: GitHubPackagerConfig;
  };
}

/**
 * ワークフロー状態
 */
export interface WorkflowState {
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

/**
 * パイプラインステージ
 */
export interface PipelineStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  error?: Error;
  result?: any;
}

/**
 * 実行結果
 */
export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: Error;
  duration?: number;
}

/**
 * エージェント間メッセージ
 */
export interface AgentMessage {
  from: string;
  to: string;
  type: 'request' | 'response' | 'error' | 'info';
  payload: any;
  timestamp: Date;
}

/**
 * エージェントタイプ
 */
export type AgentType = 
  | 'win-point-hunter'
  | 'pain-abstractor'
  | 'skill-recommender'
  | 'skill-evolution-judge'
  | 'github-packager';

/**
 * パイプラインイベント
 */
export interface PipelineEvent {
  type: 'start' | 'complete' | 'error' | 'stage_start' | 'stage_complete' | 'stage_error';
  stage?: string;
  data?: any;
  error?: Error;
  timestamp: Date;
}

/**
 * オーケストレーターコマンド
 */
export interface OrchestratorCommand {
  name: 'INTAKE' | 'DISCOVER' | 'RANK' | 'EVOLVE' | 'PACKAGE';
  data?: any;
}

/**
 * コマンド実行結果
 */
export interface CommandResult {
  command: string;
  success: boolean;
  data?: any;
  error?: Error;
  executionTime: number;
}