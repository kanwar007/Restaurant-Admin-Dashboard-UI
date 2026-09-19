#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const children = [
  spawn(npm, ['start'], { cwd: join(root, 'mock-api'), stdio: 'inherit', shell: process.platform === 'win32' }),
  spawn(npm, ['run', 'dev'], { cwd: join(root, 'web'), stdio: 'inherit', shell: process.platform === 'win32' }),
];

const shutdown = () => children.forEach((child) => child.kill('SIGTERM'));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

children.forEach((child) =>
  child.on('exit', (code) => {
    shutdown();
    process.exit(code ?? 0);
  }),
);
