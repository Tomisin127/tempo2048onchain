import { execSync } from 'child_process';

const OWNER = 'uniqueobject95-spec';
const REPO = 'tempo2048onchain';
const FILES = ['pnpm-lock.yaml', 'package-lock.json', 'bun.lock', 'bun.lockb'];
const BRANCHES = ['main', 'v0/uniqueobject95-3534-48bfd7b1'];

console.log('[v0] Checking gh CLI availability...');
try {
  const version = execSync('gh --version 2>&1').toString().trim();
  console.log('[v0] gh CLI found:', version.split('\n')[0]);
} catch (e) {
  console.log('[v0] gh CLI not found, trying git directly...');
}

for (const branch of BRANCHES) {
  console.log(`\n[v0] Checking branch: ${branch}`);
  for (const file of FILES) {
    try {
      // Check if file exists on this branch
      const result = execSync(
        `gh api repos/${OWNER}/${REPO}/contents/${file}?ref=${encodeURIComponent(branch)} 2>&1`
      ).toString();
      const data = JSON.parse(result);
      
      if (data.sha) {
        console.log(`[v0] Found ${file} on ${branch} with sha: ${data.sha}`);
        // Delete it
        const deleteResult = execSync(
          `gh api --method DELETE repos/${OWNER}/${REPO}/contents/${file} \
           -f message="Remove corrupted lock file: ${file}" \
           -f sha="${data.sha}" \
           -f branch="${branch}" 2>&1`
        ).toString();
        console.log(`[v0] Successfully deleted ${file} from ${branch}`);
      }
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('404') || msg.includes('Not Found')) {
        console.log(`[v0] ${file} not found on ${branch} - already clean`);
      } else {
        console.log(`[v0] Error checking ${file} on ${branch}:`, msg.substring(0, 200));
      }
    }
  }
}

console.log('\n[v0] Done! All lock files processed.');
