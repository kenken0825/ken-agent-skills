#!/usr/bin/env node
import { writeFileSync } from 'fs';
import { join } from 'path';

console.log("Generating dashboard data...");

// Create dashboard data
const data = {
  timestamp: new Date().toISOString(),
  metrics: {
    issues: 0,
    prs: 0,
    agents: 6
  }
};

// Write to docs directory
const outputPath = join(process.cwd(), 'docs', 'dashboard-data.json');
writeFileSync(outputPath, JSON.stringify(data, null, 2));

console.log(`Dashboard data generated at: ${outputPath}`);
console.log(JSON.stringify(data, null, 2));
process.exit(0);