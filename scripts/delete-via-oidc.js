import { execSync } from 'child_process';

const REPO = 'uniqueobject95-spec/tempo2048onchain';
const BRANCH = 'main';
const FILE = 'package-lock.json';

console.log('[v0] Attempting to delete', FILE, 'from', REPO, 'branch:', BRANCH);

// Use gh CLI with the available OIDC token
try {
  // Check if gh is available and authenticated
  const authStatus = execSync('gh auth status 2>&1', { encoding: 'utf8' });
  console.log('[v0] gh auth status:', authStatus);
} catch (e) {
  console.log('[v0] gh auth status error:', e.message);
}

// Try using gh api directly to delete the file
try {
  // First get the file SHA (needed for deletion)
  const fileInfo = execSync(
    `gh api repos/${REPO}/contents/${FILE}?ref=${BRANCH} 2>&1`,
    { encoding: 'utf8' }
  );
  const parsed = JSON.parse(fileInfo);
  const sha = parsed.sha;
  console.log('[v0] File SHA:', sha);

  // Delete the file using gh api
  const result = execSync(
    `gh api --method DELETE repos/${REPO}/contents/${FILE} \
      -f message="Remove corrupted package-lock.json" \
      -f sha=${sha} \
      -f branch=${BRANCH} 2>&1`,
    { encoding: 'utf8' }
  );
  console.log('[v0] Delete result:', result);
  console.log('[v0] Successfully deleted package-lock.json from GitHub!');
} catch (e) {
  console.log('[v0] Error:', e.message);
  console.log('[v0] stdout:', e.stdout);
  console.log('[v0] stderr:', e.stderr);
}
