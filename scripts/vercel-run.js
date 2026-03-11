#!/usr/bin/env node

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const projectConfigPath = path.resolve(process.cwd(), 'frontend/.vercel/project.json');
const nextEnv = { ...process.env };

if ((!nextEnv.VERCEL_ORG_ID || !nextEnv.VERCEL_PROJECT_ID) && fs.existsSync(projectConfigPath)) {
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
  nextEnv.VERCEL_ORG_ID = nextEnv.VERCEL_ORG_ID || projectConfig.orgId;
  nextEnv.VERCEL_PROJECT_ID = nextEnv.VERCEL_PROJECT_ID || projectConfig.projectId;
}

const child = spawn('npx', ['vercel@latest', ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: nextEnv,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
