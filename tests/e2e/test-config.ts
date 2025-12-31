/**
 * E2E Test Configuration
 * 
 * Configuration settings for end-to-end tests including
 * timeouts, retry settings, and environment variables.
 */

export const E2E_TEST_CONFIG = {
  // Timeouts
  timeouts: {
    default: 30000,        // 30 seconds
    pipeline: 60000,       // 60 seconds for full pipeline
    agent: 15000,          // 15 seconds per agent
    command: 10000,        // 10 seconds per command
    network: 5000,         // 5 seconds for network requests
  },

  // Retry settings
  retry: {
    attempts: 3,
    delay: 1000,           // 1 second between retries
    backoff: 2,            // Exponential backoff multiplier
  },

  // Test data directories
  paths: {
    testOutput: './test-output',
    mockData: './tests/e2e/mock-data',
    fixtures: './tests/e2e/fixtures',
    snapshots: './tests/e2e/__snapshots__',
  },

  // Feature flags for tests
  features: {
    useRealAPIs: false,         // Use mock APIs by default
    generateActualPackages: false, // Don't create actual files
    enableDebugLogging: true,   // Enable debug logs in tests
    capturePerformanceMetrics: true,
    validateOutputSchemas: true,
  },

  // Mock API endpoints
  mockEndpoints: {
    urlParser: 'http://localhost:3001/parse',
    aiAnalysis: 'http://localhost:3002/analyze',
    skillRepository: 'http://localhost:3003/skills',
  },

  // Test data limits
  limits: {
    maxRecommendations: 10,
    maxUrlDepth: 2,
    maxFileSize: 1024 * 1024,  // 1MB
    maxExecutionTime: 120000,   // 2 minutes
  },

  // Environment variables for tests
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    DISABLE_RATE_LIMITING: 'true',
    USE_MOCK_DATA: 'true',
  },

  // Agent-specific test configurations
  agents: {
    winPointHunter: {
      mockUrls: true,
      urlTimeout: 3000,
      maxRetries: 2,
    },
    painAbstractor: {
      minPatterns: 1,
      maxPatterns: 10,
      confidenceThreshold: 0.5,
    },
    skillRecommender: {
      minRecommendations: 1,
      maxRecommendations: 10,
      scoreThreshold: 0.3,
    },
    skillEvolutionJudge: {
      mockEvidence: true,
      defaultSuccessRate: 0.8,
    },
    githubPackager: {
      generateActualFiles: false,
      validateYAML: true,
      validateMarkdown: true,
    },
  },

  // Performance benchmarks
  benchmarks: {
    pipeline: {
      simple: 10000,      // Simple case should complete in 10s
      complex: 30000,     // Complex case should complete in 30s
      concurrent: 60000,  // Concurrent executions in 60s
    },
    agents: {
      winPointHunter: 5000,
      painAbstractor: 3000,
      skillRecommender: 5000,
      skillEvolutionJudge: 2000,
      githubPackager: 3000,
    },
  },

  // Test categories to run
  testSuites: {
    unit: false,           // Skip unit tests in E2E
    integration: true,
    e2e: true,
    performance: true,
    stress: false,         // Disabled by default
  },
};

/**
 * Get test configuration with overrides
 */
export function getTestConfig(overrides: Partial<typeof E2E_TEST_CONFIG> = {}) {
  return {
    ...E2E_TEST_CONFIG,
    ...overrides,
  };
}

/**
 * Configure test environment
 */
export function configureTestEnvironment(): void {
  // Set environment variables
  Object.entries(E2E_TEST_CONFIG.env).forEach(([key, value]) => {
    process.env[key] = value;
  });

  // Set global test timeout
  if (typeof jest !== 'undefined') {
    jest.setTimeout(E2E_TEST_CONFIG.timeouts.default);
  }

  // Configure console output
  if (E2E_TEST_CONFIG.features.enableDebugLogging) {
    console.log('[E2E] Debug logging enabled');
  } else {
    // Suppress console output
    global.console = {
      ...console,
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };
  }
}

/**
 * Performance thresholds for assertions
 */
export const PERFORMANCE_THRESHOLDS = {
  orchestrator: {
    initialization: 1000,    // 1 second
    pipelineStart: 500,      // 0.5 seconds
    stageTransition: 100,    // 0.1 seconds
  },
  agents: {
    initialization: 500,     // 0.5 seconds
    execution: 5000,         // 5 seconds average
    cleanup: 100,           // 0.1 seconds
  },
  memory: {
    baseline: 50 * 1024 * 1024,    // 50MB
    perAgent: 10 * 1024 * 1024,    // 10MB per agent
    maximum: 200 * 1024 * 1024,    // 200MB total
  },
};

/**
 * Validation schemas for test assertions
 */
export const VALIDATION_SCHEMAS = {
  companyProfile: {
    required: ['name', 'industry', 'description'],
    optional: ['size', 'values', 'services', 'url', 'location'],
    types: {
      name: 'string',
      industry: 'string',
      description: 'string',
      size: ['small', 'medium', 'large'],
      values: 'array',
      services: 'array',
    },
  },
  painPattern: {
    required: ['id', 'category', 'description', 'impact'],
    optional: ['frequency', 'affectedRoles', 'evidence'],
    types: {
      id: 'string',
      category: 'string',
      description: 'string',
      impact: ['low', 'medium', 'high'],
      frequency: 'string',
      affectedRoles: 'array',
    },
  },
  skillRecommendation: {
    required: ['skill', 'score', 'reasons'],
    optional: ['evolutionLevel', 'implementation'],
    types: {
      skill: 'object',
      score: 'number',
      reasons: 'array',
    },
  },
};