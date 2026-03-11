#!/usr/bin/env node

const { spawn } = require('node:child_process');

const checks = [
  { name: 'format', command: 'npm', args: ['run', 'format:check'] },
  { name: 'lint', command: 'npm', args: ['run', 'lint'] },
  { name: 'test', command: 'npm', args: ['test'] },
  { name: 'build', command: 'npm', args: ['run', 'build'] },
];

const hasDisallowedOutput = (output) => {
  const lines = output.split(/\r?\n/);

  return lines.some((line) => {
    if (!line.trim()) {
      return false;
    }

    if (/max-warnings/i.test(line)) {
      return false;
    }

    return /\[warn\]|\bnpm warn\b|\bwarning\b|\bwarnings\b|\berror\b/i.test(line);
  });
};

const runCheck = (check) =>
  new Promise((resolve, reject) => {
    const child = spawn(check.command, check.args, {
      cwd: process.cwd(),
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      env: process.env,
    });

    let combinedOutput = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      process.stderr.write(text);
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${check.name} failed with exit code ${code}.`));
        return;
      }

      if (hasDisallowedOutput(combinedOutput)) {
        reject(new Error(`${check.name} emitted warnings or errors.`));
        return;
      }

      resolve();
    });
  });

const main = async () => {
  for (const check of checks) {
    process.stdout.write(`\n==> Running ${check.name}\n`);
    await runCheck(check);
  }

  process.stdout.write('\nAll quality checks passed with zero warnings and errors.\n');
};

main().catch((error) => {
  process.stderr.write(`\nVerification failed: ${error.message}\n`);
  process.exit(1);
});
