# Skilldex Orchestrator E2E Test Suite

This directory contains end-to-end integration tests for the Skilldex Orchestrator, validating the complete flow from input (URLs/hearing notes) through skill recommendation and package generation.

## Test Coverage

### 1. Complete Pipeline Flow
- **URL Input Processing**: Tests the full pipeline with company URLs
- **Hearing Notes Processing**: Tests the pipeline with consultation notes
- **Hybrid Mode**: Tests combined URL + notes input
- **Progressive Disclosure**: Tests minimal initial data loading

### 2. Error Handling
- **Input Validation**: Missing or invalid inputs
- **Agent Failures**: Graceful handling of agent errors
- **Partial Failures**: Pipeline continuation on non-critical errors

### 3. Quick Commands
- **INTAKE**: Initial data processing
- **DISCOVER**: Pain pattern extraction
- **RANK**: Skill recommendation
- **EVOLVE**: Evolution level assessment
- **PACKAGE**: GitHub package generation

### 4. State Management
- **Progress Tracking**: Real-time progress updates
- **State Consistency**: Consistent state across commands
- **Event Emissions**: Proper event sequence validation

### 5. Performance Tests
- **Execution Time**: Pipeline completion within limits
- **Concurrent Execution**: Multiple parallel orchestrations
- **Memory Usage**: Resource consumption tracking

### 6. Data Validation
- **Input Sanitization**: XSS and injection prevention
- **Schema Validation**: Output structure verification
- **Mock Data Integration**: Tests with predefined data

## Running the Tests

### Run all E2E tests:
```bash
npm test tests/e2e/orchestrator.test.ts
```

### Run specific test suites:
```bash
# Complete pipeline tests only
npm test tests/e2e/orchestrator.test.ts -- --testNamePattern="Complete Pipeline Flow"

# Performance tests only
npm test tests/e2e/orchestrator.test.ts -- --testNamePattern="Performance Tests"
```

### Run with coverage:
```bash
npm run test:coverage tests/e2e/orchestrator.test.ts
```

### Run in watch mode:
```bash
npm run test:watch tests/e2e/orchestrator.test.ts
```

## Test Configuration

The test suite uses configuration from `test-config.ts`:

- **Timeouts**: Configurable timeouts for different operations
- **Retry Logic**: Automatic retry with exponential backoff
- **Feature Flags**: Toggle real APIs, file generation, etc.
- **Performance Benchmarks**: Expected execution times

## Mock Data

Test helpers and mock data are provided in `test-helpers.ts`:

- **Mock Companies**: Pre-defined company profiles
- **Mock Win Indicators**: Sample success metrics
- **Mock Pain Patterns**: Common business challenges
- **Mock Skills**: Test skill recommendations

## Writing New Tests

### Basic Test Structure:
```typescript
test('should handle new scenario', async () => {
  // Arrange
  const input: SkilldexOrchestratorInput = {
    mode: 'hearing_notes',
    data: { notes: 'test data' }
  };

  // Act
  const result = await orchestrator.execute(input);

  // Assert
  expect(result.status).toBe('success');
  assertHelpers.assertValidCompanyProfile(result.results.companyProfile);
});
```

### Testing Events:
```typescript
test('should emit correct events', async () => {
  const events = [];
  orchestrator.on('stage:complete', (e) => events.push(e));
  
  await orchestrator.execute(input);
  
  expect(events).toHaveLength(7); // 7 pipeline stages
});
```

### Testing Performance:
```typescript
test('should complete within time limit', async () => {
  const tracker = new PerformanceTracker();
  
  tracker.mark('start');
  await orchestrator.execute(input);
  tracker.mark('end');
  
  const duration = tracker.measure('start', 'end');
  expect(duration).toBeLessThan(10000); // 10 seconds
});
```

## Debugging Tests

### Enable debug logging:
```typescript
const orchestrator = new SkilldexOrchestrator({
  debug: true,
  agents: {
    winPointHunter: { debug: true },
    // ... other agents
  }
});
```

### Inspect event logs:
```typescript
const eventLog = [];
setupEventLogging(orchestrator, eventLog);
// ... run test
console.log('Events:', eventLog);
```

### Check intermediate results:
```typescript
orchestrator.on('stage:complete', ({ stageId, data }) => {
  console.log(`Stage ${stageId} completed:`, data);
});
```

## Common Issues

### Test Timeouts
- Increase timeout in `jest.setTimeout()` or test config
- Check for hanging network requests or infinite loops

### Mock Data Not Found
- Ensure mock data files exist in the correct location
- Verify skill repository is properly initialized

### Flaky Tests
- Use `waitForEvent()` helper for async operations
- Ensure proper cleanup in `afterEach()`
- Check for race conditions in concurrent tests

## Continuous Integration

The E2E tests are designed to run in CI environments:

1. **Fast Execution**: Uses mocks by default
2. **Isolated**: No external dependencies required
3. **Deterministic**: Consistent results across runs
4. **Comprehensive**: Full coverage of critical paths

## Future Enhancements

1. **Visual Regression Tests**: Screenshot comparisons for generated documents
2. **Load Testing**: Stress test with high volumes
3. **Integration with Real Services**: Optional real API testing
4. **Mutation Testing**: Verify test effectiveness
5. **Contract Testing**: Validate agent interfaces