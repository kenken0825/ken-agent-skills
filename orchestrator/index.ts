/**
 * Skilldex Orchestrator Core
 * 5つのエージェント間の調整・連携を行い、ワークフローパイプラインを管理
 */

import { EventEmitter } from 'events';
import { 
  OrchestratorConfig,
  WorkflowState,
  PipelineStage,
  ExecutionResult,
  AgentMessage
} from './models/types';

// エージェントのインポート
import { WinPointHunterAgent } from '../agents/win-point-hunter';
import { PainAbstractorAgent } from '../agents/pain-abstractor';
import { SkillRecommenderAgent } from '../agents/skill-recommender';
import { SkillEvolutionJudgeAgent } from '../agents/skill-evolution-judge';
import { GitHubPackagerAgent } from '../agents/github-packager';

export interface SkilldexOrchestratorInput {
  mode: 'client_urls' | 'hearing_notes' | 'hybrid';
  data: {
    urls?: string[];
    notes?: string;
  };
  options?: {
    maxRecommendations?: number;
    autoPackage?: boolean;
    progressiveDisclosure?: boolean;
  };
}

export interface SkilldexOrchestratorOutput {
  status: 'success' | 'partial' | 'failed';
  results: {
    companyProfile?: any;
    painPatterns?: any[];
    recommendations?: any[];
    packages?: any[];
  };
  errors?: string[];
  executionTime: number;
  pipeline: PipelineStage[];
}

export class SkilldexOrchestrator extends EventEmitter {
  private agents: {
    winPointHunter: WinPointHunterAgent;
    painAbstractor: PainAbstractorAgent;
    skillRecommender: SkillRecommenderAgent;
    skillEvolutionJudge: SkillEvolutionJudgeAgent;
    githubPackager: GitHubPackagerAgent;
  };

  private state: WorkflowState;
  private pipeline: PipelineStage[];

  constructor(private config: OrchestratorConfig = {}) {
    super();
    
    // エージェントの初期化
    this.agents = {
      winPointHunter: new WinPointHunterAgent(config.agents?.winPointHunter),
      painAbstractor: new PainAbstractorAgent(config.agents?.painAbstractor),
      skillRecommender: new SkillRecommenderAgent(config.agents?.skillRecommender),
      skillEvolutionJudge: new SkillEvolutionJudgeAgent(config.agents?.skillEvolutionJudge),
      githubPackager: new GitHubPackagerAgent(config.agents?.githubPackager)
    };

    // 初期状態の設定
    this.state = {
      currentStage: 'idle',
      progress: 0,
      data: {}
    };

    // パイプラインの定義
    this.pipeline = [
      { id: 'input-intake', name: 'Input Intake', status: 'pending' },
      { id: 'company-extraction', name: 'Company/Context Extraction', status: 'pending' },
      { id: 'industry-mapping', name: 'Industry/Role Mapping', status: 'pending' },
      { id: 'pain-recognition', name: 'Pain Pattern Recognition', status: 'pending' },
      { id: 'skill-suggestion', name: 'Skill Coverage Suggestion', status: 'pending' },
      { id: 'ranking', name: 'Ranking & Recommendation', status: 'pending' },
      { id: 'packaging', name: 'Packaging for GitHub Pool', status: 'pending' }
    ];
  }

  /**
   * オーケストレーション実行
   */
  async execute(input: SkilldexOrchestratorInput): Promise<SkilldexOrchestratorOutput> {
    const startTime = Date.now();
    const results: any = {};
    const errors: string[] = [];

    try {
      // パイプライン実行開始
      this.emit('pipeline:start', { input });
      
      // 1. Input Intake
      await this.executeStage('input-intake', async () => {
        this.validateInput(input);
        this.state.data.input = input;
      });

      // 2. Company/Context Extraction
      await this.executeStage('company-extraction', async () => {
        const winPointResult = await this.agents.winPointHunter.execute({
          clientUrls: input.data.urls,
          hearingNotes: input.data.notes,
          hybridMode: input.mode === 'hybrid'
        });
        
        results.companyProfile = winPointResult.companyInfo;
        this.state.data.winIndicators = winPointResult.winIndicators;
      });

      // 3. Industry/Role Mapping
      await this.executeStage('industry-mapping', async () => {
        // Win Point Hunterの結果から業界・職種情報を抽出
        this.state.data.industryRole = {
          industry: results.companyProfile.industry,
          roles: ['general'] // TODO: より詳細な職種推定
        };
      });

      // 4. Pain Pattern Recognition
      await this.executeStage('pain-recognition', async () => {
        const painResult = await this.agents.painAbstractor.execute({
          consultationNotes: input.data.notes || '',
          contextInfo: {
            industry: this.state.data.industryRole.industry,
            companySize: results.companyProfile.size
          }
        });
        
        results.painPatterns = painResult.painPatterns;
        this.state.data.painPatterns = painResult.painPatterns;
      });

      // 5. Skill Coverage Suggestion
      await this.executeStage('skill-suggestion', async () => {
        const recommendResult = await this.agents.skillRecommender.execute({
          painPatterns: this.state.data.painPatterns,
          context: {
            industry: this.state.data.industryRole.industry,
            roles: this.state.data.industryRole.roles,
            companySize: results.companyProfile.size
          }
        });
        
        results.recommendations = recommendResult.recommendations;
        this.state.data.recommendations = recommendResult.recommendations;
      });

      // 6. Ranking & Recommendation
      await this.executeStage('ranking', async () => {
        // スキル推薦エージェントが既にランキングを生成しているため、
        // ここでは進化レベル判定を追加
        for (const recommendation of results.recommendations || []) {
          const evolutionResult = await this.agents.skillEvolutionJudge.execute({
            skill: recommendation.skill,
            evidence: {
              implementations: recommendation.skill.implementations || 1,
              industries: [this.state.data.industryRole.industry],
              roles: this.state.data.industryRole.roles,
              successRate: 0.85 // デフォルト値
            }
          });
          
          recommendation.evolutionLevel = evolutionResult.currentLevel;
          recommendation.evolutionPath = evolutionResult.evolutionPath;
        }
      });

      // 7. Packaging for GitHub Pool
      if (input.options?.autoPackage && results.recommendations?.length > 0) {
        await this.executeStage('packaging', async () => {
          results.packages = [];
          
          // Top 3のスキルをパッケージ化
          const topSkills = results.recommendations.slice(0, 3);
          for (const recommendation of topSkills) {
            const packageResult = await this.agents.githubPackager.execute({
              skill: recommendation.skill,
              metadata: {
                author: 'Skilldex Orchestrator',
                version: '1.0.0',
                createdAt: new Date(),
                tags: ['auto-generated', this.state.data.industryRole.industry]
              }
            });
            
            results.packages.push(packageResult);
          }
        });
      } else {
        this.updateStageStatus('packaging', 'skipped');
      }

      // 完了
      this.emit('pipeline:complete', { results });
      
      return {
        status: 'success',
        results,
        errors,
        executionTime: Date.now() - startTime,
        pipeline: this.pipeline
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      this.emit('pipeline:error', { error });
      
      return {
        status: 'failed',
        results,
        errors,
        executionTime: Date.now() - startTime,
        pipeline: this.pipeline
      };
    }
  }

  /**
   * ステージの実行
   */
  private async executeStage(stageId: string, handler: () => Promise<void>): Promise<void> {
    this.updateStageStatus(stageId, 'running');
    this.emit('stage:start', { stageId });

    try {
      await handler();
      this.updateStageStatus(stageId, 'completed');
      this.emit('stage:complete', { stageId });
    } catch (error) {
      this.updateStageStatus(stageId, 'failed');
      this.emit('stage:error', { stageId, error });
      throw error;
    }
  }

  /**
   * ステージステータスの更新
   */
  private updateStageStatus(stageId: string, status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped') {
    const stage = this.pipeline.find(s => s.id === stageId);
    if (stage) {
      stage.status = status;
      this.updateProgress();
    }
  }

  /**
   * 進捗の更新
   */
  private updateProgress() {
    const completedStages = this.pipeline.filter(s => 
      s.status === 'completed' || s.status === 'skipped'
    ).length;
    this.state.progress = (completedStages / this.pipeline.length) * 100;
    this.emit('progress:update', { progress: this.state.progress });
  }

  /**
   * 入力の検証
   */
  private validateInput(input: SkilldexOrchestratorInput) {
    if (!input.mode) {
      throw new Error('Input mode is required');
    }
    
    if (input.mode === 'client_urls' && (!input.data.urls || input.data.urls.length === 0)) {
      throw new Error('URLs are required for client_urls mode');
    }
    
    if (input.mode === 'hearing_notes' && !input.data.notes) {
      throw new Error('Notes are required for hearing_notes mode');
    }
    
    if (input.mode === 'hybrid' && !input.data.urls && !input.data.notes) {
      throw new Error('Either URLs or notes are required for hybrid mode');
    }
  }

  /**
   * クイックコマンドの実行
   */
  async executeCommand(command: string, data?: any): Promise<any> {
    switch (command.toUpperCase()) {
      case 'INTAKE':
        return this.commandIntake(data);
      case 'DISCOVER':
        return this.commandDiscover();
      case 'RANK':
        return this.commandRank();
      case 'EVOLVE':
        return this.commandEvolve();
      case 'PACKAGE':
        return this.commandPackage();
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  /**
   * INTAKEコマンド
   */
  private async commandIntake(data: any): Promise<any> {
    // 入力を受け取り、初期分析を実行
    const result = await this.agents.winPointHunter.execute({
      clientUrls: data.urls,
      hearingNotes: data.notes
    });
    
    this.state.data.companyProfile = result.companyInfo;
    this.state.data.winIndicators = result.winIndicators;
    
    return {
      company: result.companyInfo,
      winPoints: result.winIndicators
    };
  }

  /**
   * DISCOVERコマンド
   */
  private async commandDiscover(): Promise<any> {
    if (!this.state.data.companyProfile) {
      throw new Error('Run INTAKE command first');
    }
    
    const result = await this.agents.painAbstractor.execute({
      consultationNotes: this.state.data.input?.data.notes || '',
      contextInfo: this.state.data.companyProfile
    });
    
    this.state.data.painPatterns = result.painPatterns;
    
    return {
      painPatterns: result.painPatterns,
      crossApplicability: result.crossApplicability
    };
  }

  /**
   * RANKコマンド
   */
  private async commandRank(): Promise<any> {
    if (!this.state.data.painPatterns) {
      throw new Error('Run DISCOVER command first');
    }
    
    const result = await this.agents.skillRecommender.execute({
      painPatterns: this.state.data.painPatterns,
      context: {
        industry: this.state.data.companyProfile?.industry || 'general',
        roles: ['general']
      }
    });
    
    this.state.data.recommendations = result.recommendations;
    
    return {
      recommendations: result.recommendations,
      coverage: result.coverageAnalysis
    };
  }

  /**
   * EVOLVEコマンド
   */
  private async commandEvolve(): Promise<any> {
    if (!this.state.data.recommendations) {
      throw new Error('Run RANK command first');
    }
    
    const topSkill = this.state.data.recommendations[0];
    if (!topSkill) {
      throw new Error('No skills to evaluate');
    }
    
    return await this.agents.skillEvolutionJudge.execute({
      skill: topSkill.skill,
      evidence: {
        implementations: 1,
        industries: [this.state.data.companyProfile?.industry || 'general'],
        roles: ['general']
      }
    });
  }

  /**
   * PACKAGEコマンド
   */
  private async commandPackage(): Promise<any> {
    if (!this.state.data.recommendations) {
      throw new Error('Run RANK command first');
    }
    
    const topSkill = this.state.data.recommendations[0];
    if (!topSkill) {
      throw new Error('No skills to package');
    }
    
    return await this.agents.githubPackager.execute({
      skill: topSkill.skill,
      metadata: {
        author: 'Skilldex Orchestrator',
        version: '1.0.0',
        createdAt: new Date()
      }
    });
  }
}