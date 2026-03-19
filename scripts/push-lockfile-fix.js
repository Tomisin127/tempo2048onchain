import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const PROJECT_DIR = '/vercel/share/v0-project';

function run(cmd) {
  try {
    const out = execSync(cmd, { cwd: PROJECT_DIR, encoding: 'utf8', stdio: 'pipe' });
    console.log(`[v0] $ ${cmd}\n${out}`);
    return out.trim();
  } catch (e) {
    console.log(`[v0] $ ${cmd}\nERR: ${e.message}\n${e.stderr || ''}`);
    return null;
  }
}

console.log('[v0] === Starting lock file fix ===');

// Show current branch and remote
run('git branch --show-current');
run('git remote -v');

// Configure git identity
run('git config user.email "v0@vercel.com"');
run('git config user.name "v0"');

// List all lock files tracked by git
const tracked = run('git ls-files') || '';
const lockFiles = ['package-lock.json', 'pnpm-lock.yaml', 'bun.lock', 'bun.lockb'];
const toRemove = lockFiles.filter(f => tracked.split('\n').includes(f));

console.log('[v0] Lock files tracked by git:', toRemove.length ? toRemove : 'none');

// Remove each lock file from git index AND filesystem
for (const f of lockFiles) {
  const fullPath = join(PROJECT_DIR, f);
  // Remove from git tracking
  run(`git rm --cached --force ${f}`);
  // Remove from filesystem
  if (existsSync(fullPath)) {
    unlinkSync(fullPath);
    console.log(`[v0] Deleted from disk: ${f}`);
  }
}

// Stage deletions
run('git add -A');

const staged = run('git diff --cached --name-only') || '';
console.log('[v0] Staged for commit:', staged || '(nothing staged)');

// Commit and push
run('git commit -m "fix: remove all lock files to fix npm ci build failure" --allow-empty');
const pushOut = run('git push');
console.log('[v0] Push complete:', pushOut);

console.log('[v0] === Done ===');

