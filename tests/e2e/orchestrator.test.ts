/**
 * Skilldex Orchestrator End-to-End Integration Tests
 * 
 * This test suite validates the complete flow of the Skilldex Orchestrator
 * from URL/hearing input through skill recommendation and package generation.
 */

import { SkilldexOrchestrator, SkilldexOrchestratorInput, SkilldexOrchestratorOutput } from '../../orchestrator';
import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';

// Test timeout for E2E tests
jest.setTimeout(60000); // 60 seconds

describe('Skilldex Orchestrator E2E Tests', () => {
  let orchestrator: SkilldexOrchestrator;
  let testOutputDir: string;
  let eventLog: any[];

  beforeEach(() => {
    // Initialize orchestrator with test configuration
    orchestrator = new SkilldexOrchestrator({
      debug: true,
      timeout: 30000,
      retryAttempts: 2,
      agents: {
        winPointHunter: {
          debug: true,
          maxUrlDepth: 2
        },
        painAbstractor: {
          debug: true
        },
        skillRecommender: {
          debug: true,
          maxRecommendations: 10
        },
        skillEvolutionJudge: {
          debug: true
        },
        githubPackager: {
          debug: true,
          outputDir: './test-output'
        }
      }
    });

    // Set up event logging for debugging
    eventLog = [];
    setupEventLogging(orchestrator, eventLog);

    // Create test output directory
    testOutputDir = path.join(__dirname, '../../test-output');
    fs.ensureDirSync(testOutputDir);
  });

  afterEach(async () => {
    // Clean up test output
    if (await fs.pathExists(testOutputDir)) {
      await fs.remove(testOutputDir);
    }

    // Clear event listeners
    orchestrator.removeAllListeners();
  });

  describe('Complete Pipeline Flow', () => {
    test('should successfully process URL input through entire pipeline', async () => {
      // Arrange
      const input: SkilldexOrchestratorInput = {
        mode: 'client_urls',
        data: {
          urls: ['https://example-company.com']
        },
        options: {
          maxRecommendations: 5,
          autoPackage: true,
          progressiveDisclosure: true
        }
      };

      // Act
      const result = await orchestrator.execute(input);

      // Assert
      expect(result.status).toBe('success');
      expect(result.results).toBeDefined();
      expect(result.results.companyProfile).toBeDefined();
      expect(result.results.painPatterns).toBeInstanceOf(Array);
      expect(result.results.recommendations).toBeInstanceOf(Array);
      expect(result.results.recommendations.length).toBeGreaterThan(0);
      expect(result.results.recommendations.length).toBeLessThanOrEqual(5);

      // Verify pipeline stages
      expect(result.pipeline).toHaveLength(7);
      verifyPipelineCompletion(result.pipeline);

      // Verify event sequence
      verifyEventSequence(eventLog, [
        'pipeline:start',
        'stage:start',
        'stage:complete',
        'progress:update',
        'pipeline:complete'
      ]);
    });

    test('should successfully process hearing notes through entire pipeline', async () => {
      // Arrange
      const hearingNotes = `
        会社名: サンプル製造業株式会社
        業界: 製造業
        課題: 
        - 在庫管理が手動でミスが多い
        - 月次レポート作成に時間がかかる
        - 品質検査データの集計が大変
      `;

      const input: SkilldexOrchestratorInput = {
        mode: 'hearing_notes',
        data: {
          notes: hearingNotes
        },
        options: {
          maxRecommendations: 3,
          autoPackage: false
        }
      };

      // Act
      const result = await orchestrator.execute(input);

      // Assert
      expect(result.status).toBe('success');
      expect(result.results.companyProfile).toBeDefined();
      expect(result.results.companyProfile.industry).toBe('製造業');
      expect(result.results.painPatterns).toHaveLength(3);
      expect(result.results.recommendations).toBeDefined();
      expect(result.results.recommendations.length).toBeLessThanOrEqual(3);

      // Packaging should be skipped
      const packagingStage = result.pipeline.find(s => s.id === 'packaging');
      expect(packagingStage?.status).toBe('skipped');
    });

    test('should successfully process hybrid input mode', async () => {
      // Arrange
      const input: SkilldexOrchestratorInput = {
        mode: 'hybrid',
        data: {
          urls: ['https://example-company.com'],
          notes: '追加情報: AIを活用した効率化を検討中'
        },
        options: {
          maxRecommendations: 5,
          autoPackage: true
        }
      };

      // Act
      const result = await orchestrator.execute(input);

      // Assert
      expect(result.status).toBe('success');
      expect(result.results.companyProfile).toBeDefined();
      expect(result.results.recommendations).toBeDefined();
      
      // Verify both URL and notes were processed
      const winPointEvents = eventLog.filter(e => e.data?.stageId === 'company-extraction');
      expect(winPointEvents).toHaveLength(2); // start and complete
    });
  });

  describe('Error Handling', () => {
    test('should handle missing required input gracefully', async () => {
      // Arrange
      const input: SkilldexOrchestratorInput = {
        mode: 'client_urls',
        data: {
          urls: [] // Empty URLs
        }
      };

      // Act
      const result = await orchestrator.execute(input);

      // Assert
      expect(result.status).toBe('failed');
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('URLs are required');
    });

    test('should handle agent failures gracefully', async () => {
      // Arrange - Mock agent failure
      const input: SkilldexOrchestratorInput = {
        mode: 'hearing_notes',
        data: {
          notes: '' // Empty notes to trigger parsing error
        }
      };

      // Act
      const result = await orchestrator.execute(input);

      // Assert
      expect(result.status).toBe('failed');
      expect(result.errors).toBeDefined();
      expect(result.errors[0]).toContain('Notes are required');
      
      // Verify error events were emitted
      const errorEvents = eventLog.filter(e => e.type === 'pipeline:error');
      expect(errorEvents).toHaveLength(1);
    });

    test('should continue pipeline on non-critical failures', async () => {
      // Arrange
      const input: SkilldexOrchestratorInput = {
        mode: 'hearing_notes',
        data: {
          notes: '会社名: テスト会社\n業界: IT'
        },
        options: {
          autoPackage: true // This might fail if no skills are found
        }
      };

      // Act
      const result = await orchestrator.execute(input);

      // Assert
      // Even if packaging fails, earlier stages should complete
      expect(result.status).not.toBe('failed');
      expect(result.results.companyProfile).toBeDefined();
    });
  });

  describe('Quick Commands', () => {
    test('INTAKE command should process initial input', async () => {
      // Arrange
      const data = {
        urls: ['https://example.com'],
        notes: 'テスト会社の情報'
      };

      // Act
      const result = await orchestrator.executeCommand('INTAKE', data);

      // Assert
      expect(result).toBeDefined();
      expect(result.company).toBeDefined();
      expect(result.winPoints).toBeDefined();
    });

    test('DISCOVER command should find pain patterns', async () => {
      // Arrange - First run INTAKE
      await orchestrator.executeCommand('INTAKE', {
        urls: ['https://example.com'],
        notes: '在庫管理に課題あり'
      });

      // Act
      const result = await orchestrator.executeCommand('DISCOVER');

      // Assert
      expect(result).toBeDefined();
      expect(result.painPatterns).toBeInstanceOf(Array);
      expect(result.crossApplicability).toBeDefined();
    });

    test('RANK command should generate recommendations', async () => {
      // Arrange - Run INTAKE and DISCOVER first
      await orchestrator.executeCommand('INTAKE', {
        notes: '製造業、在庫管理課題'
      });
      await orchestrator.executeCommand('DISCOVER');

      // Act
      const result = await orchestrator.executeCommand('RANK');

      // Assert
      expect(result).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.coverage).toBeDefined();
    });

    test('EVOLVE command should evaluate skill evolution', async () => {
      // Arrange - Run full pipeline up to RANK
      await orchestrator.executeCommand('INTAKE', {
        notes: '製造業の在庫管理'
      });
      await orchestrator.executeCommand('DISCOVER');
      await orchestrator.executeCommand('RANK');

      // Act
      const result = await orchestrator.executeCommand('EVOLVE');

      // Assert
      expect(result).toBeDefined();
      expect(result.currentLevel).toBeDefined();
      expect(result.evolutionPath).toBeDefined();
    });

    test('PACKAGE command should create GitHub package', async () => {
      // Arrange - Run full pipeline up to RANK
      await orchestrator.executeCommand('INTAKE', {
        notes: 'テスト会社の課題'
      });
      await orchestrator.executeCommand('DISCOVER');
      await orchestrator.executeCommand('RANK');

      // Act
      const result = await orchestrator.executeCommand('PACKAGE');

      // Assert
      expect(result).toBeDefined();
      expect(result.files).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    test('commands should fail when prerequisites not met', async () => {
      // Act & Assert
      await expect(orchestrator.executeCommand('DISCOVER'))
        .rejects.toThrow('Run INTAKE command first');
      
      await expect(orchestrator.executeCommand('RANK'))
        .rejects.toThrow('Run DISCOVER command first');
      
      await expect(orchestrator.executeCommand('EVOLVE'))
        .rejects.toThrow('Run RANK command first');
      
      await expect(orchestrator.executeCommand('PACKAGE'))
        .rejects.toThrow('Run RANK command first');
    });
  });

  describe('Progress Tracking', () => {
    test('should emit progress updates throughout pipeline', async () => {
      // Arrange
      const input: SkilldexOrchestratorInput = {
        mode: 'hearing_notes',
        data: {
          notes: 'テスト会社の情報'
        }
      };

      const progressUpdates: number[] = [];
      orchestrator.on('progress:update', (event) => {
        progressUpdates.push(event.progress);
      });

      // Act
      await orchestrator.execute(input);

      // Assert
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
      
      // Verify progress increases monotonically
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i]).toBeGreaterThanOrEqual(progressUpdates[i - 1]);
      }
    });
  });

  describe('Package Generation', () => {
    test('should generate valid GitHub packages for top skills', async () => {
      // Arrange
      const input: SkilldexOrchestratorInput = {
        mode: 'hearing_notes',
        data: {
          notes: '製造業、品質管理の自動化が課題'
        },
        options: {
          autoPackage: true,
          maxRecommendations: 3
        }
      };

      // Act
      const result = await orchestrator.execute(input);

      // Assert
      expect(result.status).toBe('success');
      expect(result.results.packages).toBeDefined();
      expect(result.results.packages.length).toBeLessThanOrEqual(3);

      // Verify package structure
      for (const pkg of result.results.packages || []) {
        expect(pkg.files).toBeDefined();
        expect(pkg.files['SKILL.md']).toBeDefined();
        expect(pkg.files['skill.yaml']).toBeDefined();
        expect(pkg.files['README.md']).toBeDefined();
        expect(pkg.metadata.version).toBe('1.0.0');
        expect(pkg.metadata.author).toBe('Skilldex Orchestrator');
      }
    });
  });

  describe('Evolution Level Assessment', () => {
    test('should correctly assign evolution levels to skills', async () => {
      // Arrange
      const input: SkilldexOrchestratorInput = {
        mode: 'hearing_notes',
        data: {
          notes: '小売業、在庫管理システムの改善'
        },
        options: {
          maxRecommendations: 5
        }
      };

      // Act
      const result = await orchestrator.execute(input);

      // Assert
      expect(result.status).toBe('success');
      
      const recommendations = result.results.recommendations || [];
      expect(recommendations.length).toBeGreaterThan(0);

      // Verify evolution data
      for (const rec of recommendations) {
        expect(rec.evolutionLevel).toBeDefined();
        expect(rec.evolutionLevel.level).toBeGreaterThanOrEqual(1);
        expect(rec.evolutionLevel.level).toBeLessThanOrEqual(4);
        expect(rec.evolutionPath).toBeDefined();
        expect(rec.evolutionPath.nextConditions).toBeInstanceOf(Array);
      }
    });
  });

  describe('Performance Tests', () => {
    test('should complete simple pipeline within 10 seconds', async () => {
      // Arrange
      const input: SkilldexOrchestratorInput = {
        mode: 'hearing_notes',
        data: {
          notes: 'シンプルなテストケース'
        },
        options: {
          autoPackage: false
        }
      };

      // Act
      const startTime = Date.now();
      const result = await orchestrator.execute(input);
      const endTime = Date.now();

      // Assert
      expect(result.status).toBe('success');
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds
      expect(result.executionTime).toBeLessThan(10000);
    });

    test('should handle multiple concurrent executions', async () => {
      // Arrange
      const inputs: SkilldexOrchestratorInput[] = [
        {
          mode: 'hearing_notes',
          data: { notes: '会社A: 製造業' }
        },
        {
          mode: 'hearing_notes',
          data: { notes: '会社B: 小売業' }
        },
        {
          mode: 'hearing_notes',
          data: { notes: '会社C: IT業' }
        }
      ];

      // Act - Create separate orchestrators for concurrent execution
      const orchestrators = inputs.map(() => new SkilldexOrchestrator());
      const promises = inputs.map((input, i) => orchestrators[i].execute(input));
      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.status).toBe('success');
      });
    });
  });

  describe('Data Validation', () => {
    test('should validate and sanitize input data', async () => {
      // Arrange
      const input: SkilldexOrchestratorInput = {
        mode: 'hearing_notes',
        data: {
          notes: `
            <script>alert('XSS')</script>
            会社名: テスト会社
            業界: IT
          `
        }
      };

      // Act
      const result = await orchestrator.execute(input);

      // Assert
      expect(result.status).toBe('success');
      // Verify malicious content is not present in output
      const companyProfile = JSON.stringify(result.results.companyProfile);
      expect(companyProfile).not.toContain('<script>');
      expect(companyProfile).not.toContain('alert');
    });
  });

  describe('State Management', () => {
    test('should maintain state consistency across command executions', async () => {
      // Arrange & Act
      const intake1 = await orchestrator.executeCommand('INTAKE', {
        notes: '会社A情報'
      });
      
      const discover1 = await orchestrator.executeCommand('DISCOVER');
      
      // Execute INTAKE again with different data
      const intake2 = await orchestrator.executeCommand('INTAKE', {
        notes: '会社B情報'
      });
      
      // DISCOVER should now work with new data
      const discover2 = await orchestrator.executeCommand('DISCOVER');

      // Assert
      expect(intake1.company).not.toEqual(intake2.company);
      expect(discover1.painPatterns).not.toEqual(discover2.painPatterns);
    });
  });

  describe('Mock Data Testing', () => {
    test('should work with mock skill repository data', async () => {
      // Arrange
      const input: SkilldexOrchestratorInput = {
        mode: 'hearing_notes',
        data: {
          notes: '製造業、月次レポート作成が課題'
        }
      };

      // Act
      const result = await orchestrator.execute(input);

      // Assert
      expect(result.status).toBe('success');
      expect(result.results.recommendations).toBeDefined();
      
      // Verify mock skills are being recommended
      const recommendedSkills = result.results.recommendations?.map(r => r.skill.id);
      expect(recommendedSkills).toEqual(
        expect.arrayContaining(['manufacturing-monthly-report', 'it-monthly-report-generation'])
      );
    });
  });

  describe('Progressive Disclosure', () => {
    test('should respect progressive disclosure option', async () => {
      // Arrange
      const input: SkilldexOrchestratorInput = {
        mode: 'hearing_notes',
        data: {
          notes: 'テスト会社の課題'
        },
        options: {
          progressiveDisclosure: true
        }
      };

      // Act
      const result = await orchestrator.execute(input);

      // Assert
      expect(result.status).toBe('success');
      
      // With progressive disclosure, detailed skill content should not be loaded initially
      const recommendations = result.results.recommendations || [];
      recommendations.forEach(rec => {
        expect(rec.skill).toBeDefined();
        expect(rec.skill.id).toBeDefined();
        expect(rec.skill.name).toBeDefined();
        expect(rec.skill.description).toBeDefined();
        // Detailed content should be minimal
        expect(rec.skill.workflow).toBeUndefined();
      });
    });
  });
});

/**
 * Helper function to set up event logging
 */
function setupEventLogging(orchestrator: EventEmitter, eventLog: any[]): void {
  const events = [
    'pipeline:start',
    'pipeline:complete',
    'pipeline:error',
    'stage:start',
    'stage:complete',
    'stage:error',
    'progress:update'
  ];

  events.forEach(event => {
    orchestrator.on(event, (data) => {
      eventLog.push({
        type: event,
        data,
        timestamp: new Date()
      });
    });
  });
}

/**
 * Helper function to verify pipeline completion
 */
function verifyPipelineCompletion(pipeline: any[]): void {
  const requiredStages = [
    'input-intake',
    'company-extraction',
    'industry-mapping',
    'pain-recognition',
    'skill-suggestion',
    'ranking'
  ];

  requiredStages.forEach(stageId => {
    const stage = pipeline.find(s => s.id === stageId);
    expect(stage).toBeDefined();
    expect(stage.status).toBe('completed');
  });
}

/**
 * Helper function to verify event sequence
 */
function verifyEventSequence(eventLog: any[], expectedTypes: string[]): void {
  const actualTypes = eventLog.map(e => e.type);
  
  expectedTypes.forEach(expectedType => {
    expect(actualTypes).toContain(expectedType);
  });
  
  // Verify pipeline:start comes before pipeline:complete
  const startIndex = actualTypes.indexOf('pipeline:start');
  const completeIndex = actualTypes.indexOf('pipeline:complete');
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(completeIndex).toBeGreaterThan(startIndex);
}