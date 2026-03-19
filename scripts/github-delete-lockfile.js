// Delete package-lock.json from GitHub using the REST API
// Uses the GITHUB_TOKEN that is automatically available in the sandbox

import { execSync } from 'child_process';

const OWNER = 'uniqueobject95-spec';
const REPO = 'tempo2048onchain';
const FILE_PATH = 'package-lock.json';
const BRANCH = 'v0/uniqueobject95-3534-48bfd7b1';

async function deleteFileFromGitHub() {
  try {
    // Get the GITHUB_TOKEN from environment
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.error('[v0] No GITHUB_TOKEN found in environment');
      // Try to list env vars to debug
      console.log('[v0] Available env keys:', Object.keys(process.env).filter(k => k.includes('GIT') || k.includes('TOKEN') || k.includes('AUTH')));
      return;
    }

    console.log('[v0] Got token, fetching file info from GitHub API...');

    // First get the file's SHA (required for deletion)
    const getResponse = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      }
    );

    if (getResponse.status === 404) {
      console.log('[v0] package-lock.json does not exist on main branch - nothing to delete!');
      return;
    }

    if (!getResponse.ok) {
      const text = await getResponse.text();
      console.error('[v0] Failed to get file info:', getResponse.status, text);
      return;
    }

    const fileInfo = await getResponse.json();
    console.log('[v0] Found package-lock.json with SHA:', fileInfo.sha);

    // Now delete the file
    const deleteResponse = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Remove corrupted package-lock.json',
          sha: fileInfo.sha,
          branch: BRANCH,
        })
      }
    );

    if (deleteResponse.ok) {
      console.log('[v0] Successfully deleted package-lock.json from GitHub main branch!');
    } else {
      const text = await deleteResponse.text();
      console.error('[v0] Failed to delete file:', deleteResponse.status, text);
    }
  } catch (err) {
    console.error('[v0] Error:', err.message);
  }
}

deleteFileFromGitHub();
