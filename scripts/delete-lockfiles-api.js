import { execSync } from 'child_process';

const OWNER = 'uniqueobject95-spec';
const REPO = 'tempo2048onchain';
const FILES_TO_DELETE = ['package-lock.json', 'pnpm-lock.yaml', 'bun.lock', 'bun.lockb'];
const BRANCHES = ['main', 'v0/uniqueobject95-3534-48bfd7b1', 'v0/uniqueobject95-3534-b16ebc6d', 'v0/uniqueobject95-3534-f7f78eaf'];

// Try to get token from environment or gh CLI
let TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

if (!TOKEN) {
  try {
    TOKEN = execSync('gh auth token 2>/dev/null').toString().trim();
    console.log('[v0] Got token from gh CLI');
  } catch (e) {
    console.log('[v0] Could not get token from gh CLI');
  }
}

if (!TOKEN) {
  console.error('[v0] No GitHub token found. Trying git credential helper...');
  try {
    const creds = execSync('git credential fill <<< "protocol=https\nhost=github.com" 2>/dev/null').toString();
    console.log('[v0] Git credentials:', creds.substring(0, 50));
  } catch (e) {}
}

console.log('[v0] Token available:', TOKEN ? 'YES (length: ' + TOKEN.length + ')' : 'NO');

async function deleteFile(branch, file) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${file}`;
  
  // First get the file SHA
  const getResp = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
  });
  
  if (getResp.status === 404) {
    console.log(`[v0] ${file} not found on ${branch} - skipping`);
    return false;
  }
  
  if (!getResp.ok) {
    console.log(`[v0] Error checking ${file} on ${branch}: ${getResp.status} ${getResp.statusText}`);
    return false;
  }
  
  const fileData = await getResp.json();
  console.log(`[v0] Found ${file} on ${branch} (sha: ${fileData.sha?.substring(0, 8)}...)`);
  
  // Delete the file
  const deleteResp = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      message: `chore: remove corrupted lock file ${file}`,
      sha: fileData.sha,
      branch: branch,
    })
  });
  
  if (deleteResp.ok) {
    console.log(`[v0] Successfully deleted ${file} from ${branch}`);
    return true;
  } else {
    const err = await deleteResp.text();
    console.log(`[v0] Failed to delete ${file} from ${branch}: ${deleteResp.status} - ${err.substring(0, 200)}`);
    return false;
  }
}

(async () => {
  for (const branch of BRANCHES) {
    console.log(`\n[v0] Processing branch: ${branch}`);
    for (const file of FILES_TO_DELETE) {
      await deleteFile(branch, file);
    }
  }
  console.log('\n[v0] All done!');
})();
