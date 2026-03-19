import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function deleteCorruptedLockfile() {
  try {
    console.log('Deleting corrupted package-lock.json from GitHub...');
    
    // Configure git
    await execAsync('git config --global --add safe.directory /vercel/share/v0-project');
    console.log('Git configured');
    
    // Fetch main branch
    await execAsync('git fetch origin main');
    console.log('Fetched main branch');
    
    // Switch to main
    await execAsync('git checkout main');
    console.log('Switched to main branch');
    
    // Delete the corrupted lock file
    await execAsync('rm -f package-lock.json');
    console.log('Deleted package-lock.json');
    
    // Commit and push
    await execAsync('git add -A');
    try {
      await execAsync('git commit -m "Remove corrupted package-lock.json"');
    } catch (e) {
      console.log('No changes to commit');
    }
    
    await execAsync('git push origin main');
    console.log('✓ Successfully deleted package-lock.json from GitHub main branch');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

deleteCorruptedLockfile();
