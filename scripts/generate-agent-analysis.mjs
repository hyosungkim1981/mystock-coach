#!/usr/bin/env node

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { generateAgentAnalysisResults } = require('../src/portfolio.js');

function printUsage() {
  process.stderr.write([
    'Usage:',
    '  node scripts/generate-agent-analysis.mjs <input.json> [output.json]',
    '',
    'Input JSON example:',
    '  { "runDate": "2026-07-23", "portfolio": [{ "name": "삼성전자", "currentPrice": 255000, "marketValue": 52622500, "profitRate": 276.79, "portfolioWeight": 40.53 }] }',
    '',
  ].join('\n'));
}

function readInput(filePath) {
  const fullPath = path.resolve(filePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function writeOutput(output, filePath) {
  const json = `${JSON.stringify(output, null, 2)}\n`;

  if (!filePath) {
    process.stdout.write(json);
    return;
  }

  fs.writeFileSync(path.resolve(filePath), json);
}

const [, , inputPath, outputPath] = process.argv;

if (!inputPath) {
  printUsage();
  process.exitCode = 1;
} else {
  try {
    writeOutput(generateAgentAnalysisResults(readInput(inputPath)), outputPath);
  } catch (error) {
    process.stderr.write(`agent analysis generation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
