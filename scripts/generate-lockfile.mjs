import { execSync } from 'child_process';
import { unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';

const projectDir = '/vercel/share/v0-project';
const lockfilePath = resolve(projectDir, 'package-lock.json');

try {
  // Remove corrupted lockfile if it exists
  if (existsSync(lockfilePath)) {
    unlinkSync(lockfilePath);
    console.log('[v0] Removed corrupted package-lock.json');
  }

  // Generate fresh lockfile with legacy peer deps support
  console.log('[v0] Generating fresh package-lock.json...');
  execSync('npm install --legacy-peer-deps --save', {
    cwd: projectDir,
    stdio: 'inherit'
  });
  
  console.log('[v0] Successfully generated fresh package-lock.json');
} catch (error) {
  console.error('[v0] Error generating lockfile:', error.message);
  process.exit(1);
}
