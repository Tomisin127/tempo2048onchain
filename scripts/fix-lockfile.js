import { execSync } from 'child_process';

const REPO = 'uniqueobject95-spec/tempo2048onchain';
const BRANCH = 'main';
const FILE = 'package-lock.json';

function run(cmd) {
  try {
    const result = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    console.log('[v0] Command succeeded:', cmd);
    console.log('[v0] Output:', result.trim());
    return result.trim();
  } catch (e) {
    console.log('[v0] Command output:', e.stdout?.trim());
    console.log('[v0] Command stderr:', e.stderr?.trim());
    console.log('[v0] Exit code:', e.status);
    return null;
  }
}

// Check if package-lock.json exists on GitHub main branch
console.log('[v0] Checking if package-lock.json exists on GitHub...');
const exists = run(`gh api repos/${REPO}/contents/${FILE}?ref=${BRANCH} --jq '.name' 2>/dev/null`);

if (!exists || exists.includes('Not Found') || exists.includes('404')) {
  console.log('[v0] package-lock.json does NOT exist on main branch - nothing to delete');
} else {
  console.log('[v0] Found package-lock.json on main branch, deleting...');
  // Get the SHA of the file (required for deletion)
  const sha = run(`gh api repos/${REPO}/contents/${FILE}?ref=${BRANCH} --jq '.sha'`);
  console.log('[v0] File SHA:', sha);

  if (sha && !sha.includes('null')) {
    // Delete the file using GitHub API
    const deleteResult = run(`gh api --method DELETE repos/${REPO}/contents/${FILE} -f message="Remove corrupted package-lock.json" -f sha=${sha} -f branch=${BRANCH}`);
    if (deleteResult !== null) {
      console.log('[v0] Successfully deleted package-lock.json from GitHub main branch!');
    } else {
      console.log('[v0] Failed to delete - trying alternate branch...');
      // Also try the v0 branch
      const sha2 = run(`gh api repos/${REPO}/contents/${FILE}?ref=v0/uniqueobject95-3534-b16ebc6d --jq '.sha'`);
      if (sha2 && !sha2.includes('null') && !sha2.includes('Not Found')) {
        run(`gh api --method DELETE repos/${REPO}/contents/${FILE} -f message="Remove corrupted package-lock.json" -f sha=${sha2} -f branch=v0/uniqueobject95-3534-b16ebc6d`);
        console.log('[v0] Deleted from v0 branch');
      }
    }
  }
}

// List all files in root to confirm state
console.log('[v0] Listing root files on main branch...');
run(`gh api repos/${REPO}/contents?ref=${BRANCH} --jq '.[].name'`);
