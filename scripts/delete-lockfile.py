#!/usr/bin/env python3
import subprocess
import sys

try:
    # Configure git
    subprocess.run(['git', 'config', '--global', 'user.email', 'v0@vercel.com'], check=True)
    subprocess.run(['git', 'config', '--global', 'user.name', 'v0'], check=True)
    
    # Clone the repo
    subprocess.run(['git', 'clone', 'https://github.com/uniqueobject95-spec/tempo2048onchain.git', '/tmp/tempo-repo'], check=True)
    
    # Change to repo directory
    import os
    os.chdir('/tmp/tempo-repo')
    
    # Check out main branch
    subprocess.run(['git', 'checkout', 'main'], check=True)
    
    # Delete package-lock.json if it exists
    if os.path.exists('package-lock.json'):
        subprocess.run(['git', 'rm', 'package-lock.json'], check=True)
        print("[v0] Deleted package-lock.json from git")
        
        # Commit and push
        subprocess.run(['git', 'commit', '-m', 'Delete corrupted package-lock.json - rebuild to regenerate'], check=True)
        subprocess.run(['git', 'push', 'origin', 'main'], check=True)
        print("[v0] Successfully pushed deletion to main branch")
    else:
        print("[v0] package-lock.json not found in main branch")
        
except Exception as e:
    print(f"[v0] Error: {e}")
    sys.exit(1)
