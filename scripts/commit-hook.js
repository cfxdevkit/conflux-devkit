#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import ChangelogGenerator from './enhanced-changelog.js';
import VersionManager from './version-manager.js';

/**
 * Commit Hook for Conflux DevKit
 * Automatically bumps minor version and updates changelog on commit
 */

class CommitHook {
  constructor() {
    this.versionManager = new VersionManager();
    this.changelogGenerator = new ChangelogGenerator();
  }

  runCommand(command, description) {
    console.log(`\n🔍 ${description}...`);
    try {
      const output = execSync(command, {
        stdio: 'pipe',
        encoding: 'utf8',
        cwd: process.cwd(),
      });
      console.log(`✅ ${description} completed successfully`);
      return { success: true, output };
    } catch (error) {
      console.error(`❌ ${description} failed:`);
      console.error(error.stdout || error.stderr || error.message);
      return { success: false, error };
    }
  }

  getStagedFiles() {
    try {
      const output = execSync('git diff --cached --name-only', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      return output.trim().split('\n').filter(file => file);
    } catch (error) {
      console.warn('⚠️  Could not get staged files:', error.message);
      return [];
    }
  }

  hasSignificantChanges() {
    const stagedFiles = this.getStagedFiles();
    
    // Check if there are changes to source files (not just docs or config)
    const significantFiles = stagedFiles.filter(file => 
      file.includes('src/') || 
      file.includes('packages/') ||
      file.includes('package.json') ||
      file.includes('tsconfig') ||
      file.includes('vite.config') ||
      file.includes('turbo.json')
    );
    
    return significantFiles.length > 0;
  }

  getCommitMessage() {
    try {
      // Get the commit message from the commit-msg hook
      const messageFile = process.argv[2];
      if (messageFile) {
        return readFileSync(messageFile, 'utf8').trim();
      }
      
      // Fallback to last commit message
      return execSync('git log -1 --pretty=format:"%s"', { 
        encoding: 'utf8',
        cwd: process.cwd()
      }).trim();
    } catch (error) {
      console.warn('⚠️  Could not get commit message:', error.message);
      return '';
    }
  }

  shouldBumpVersion(commitMessage) {
    const message = commitMessage.toLowerCase();
    
    // Skip version bump for certain commit types
    const skipPatterns = [
      'chore:',
      'docs:',
      'ci:',
      'build:',
      'test:',
      'wip:',
      'work in progress',
      'draft:',
      'temp:',
      'temporary'
    ];
    
    const shouldSkip = skipPatterns.some(pattern => message.includes(pattern));
    
    if (shouldSkip) {
      console.log('⏭️  Skipping version bump (chore/docs/ci commit)');
      return false;
    }
    
    return true;
  }

  async preCommit(options = {}) {
    const { silent = false, force = false } = options;
    
    if (!silent) console.log('🚀 Conflux DevKit Pre-Commit Hook\n');
    
    // Check if there are significant changes
    if (!this.hasSignificantChanges() && !force) {
      if (!silent) console.log('⏭️  No significant changes detected, skipping version bump');
      return { success: true, skipped: true };
    }
    
    const commitMessage = this.getCommitMessage();
    
    if (!this.shouldBumpVersion(commitMessage) && !force) {
      return { success: true, skipped: true };
    }
    
    if (!silent) console.log('📈 Bumping minor version for commit...');
    const versionBumpResult = this.versionManager.bumpMinorVersion();
    
    if (!versionBumpResult) {
      console.log('❌ Failed to bump version');
      return { success: false, error: 'Version bump failed' };
    }
    
    if (!silent) console.log('📝 Updating changelog...');
    this.changelogGenerator.addEntry();
    
    // Stage the version changes
    if (!silent) console.log('📦 Staging version changes...');
    const stageResult = this.runCommand('git add package.json packages/*/package.json CHANGELOG.md', 'Staging version changes', silent);
    
    if (!stageResult.success) {
      if (!silent) console.log('⚠️  Failed to stage version changes, but continuing...');
    }
    
    return { success: true, versionBumped: true };
  }

  async postCommit(options = {}) {
    const { silent = false } = options;
    
    if (!silent) console.log('🚀 Conflux DevKit Post-Commit Hook\n');
    
    // Show updated version info
    if (!silent) {
      console.log('📊 Updated Version Information:');
      this.versionManager.showVersionInfo();
    }
    
    const versionInfo = this.versionManager.showVersionInfo(true);
    
    if (!silent) console.log('✅ Post-commit hook completed');
    
    return { success: true, versionInfo };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const hook = new CommitHook();
  
  // Parse options
  const options = {
    silent: args.includes('--silent') || args.includes('-s'),
    force: args.includes('--force') || args.includes('-f')
  };
  
  switch (command) {
    case 'pre-commit': {
      const preCommitResult = await hook.preCommit(options);
      if (options.silent) {
        console.log(JSON.stringify(preCommitResult));
      }
      process.exit(preCommitResult.success ? 0 : 1);
      break;
    } {
    case 'post-commit':
      const postCommitResult = await hook.postCommit(options);
      if (options.silent) {
        console.log(JSON.stringify(postCommitResult));
      }
    }
      break;
    case 'install':
      installGitHooks();
      break;
    case 'uninstall':
      uninstallGitHooks();
      break;
    case '--help':
    case 'help':
      console.log(`
Usage: node scripts/commit-hook.js [command] [options]

Commands:
  pre-commit    Run pre-commit hook (bump minor version)
  post-commit   Run post-commit hook (show version info)
  install       Install git hooks
  uninstall     Remove git hooks
  help          Show this help message

Options:
  --silent, -s  Run in silent mode (JSON output)
  --force, -f   Force version bump even for chore commits

Examples:
  node scripts/commit-hook.js pre-commit           # Run pre-commit hook
  node scripts/commit-hook.js pre-commit --silent  # Silent mode
  node scripts/commit-hook.js pre-commit --force   # Force version bump
  node scripts/commit-hook.js install              # Install git hooks
      `);
      break;
    default:
      console.log('Use --help for available commands');
      process.exit(1);
  }
}

function installGitHooks() {
  console.log('🔧 Installing Git Hooks...');
  
  try {
    // Create .git/hooks directory if it doesn't exist
    execSync('mkdir -p .git/hooks', { cwd: process.cwd() });
    
    // Create pre-commit hook
    const preCommitHook = `#!/bin/sh
node scripts/commit-hook.js pre-commit
`;
    execSync(`echo '${preCommitHook}' > .git/hooks/pre-commit`, { cwd: process.cwd() });
    execSync('chmod +x .git/hooks/pre-commit', { cwd: process.cwd() });
    
    // Create post-commit hook
    const postCommitHook = `#!/bin/sh
node scripts/commit-hook.js post-commit
`;
    execSync(`echo '${postCommitHook}' > .git/hooks/post-commit`, { cwd: process.cwd() });
    execSync('chmod +x .git/hooks/post-commit', { cwd: process.cwd() });
    
    console.log('✅ Git hooks installed successfully');
    console.log('   - pre-commit: Bumps minor version and updates changelog');
    console.log('   - post-commit: Shows version information');
  } catch (error) {
    console.error('❌ Failed to install git hooks:', error.message);
    process.exit(1);
  }
}

function uninstallGitHooks() {
  console.log('🗑️  Removing Git Hooks...');
  
  try {
    execSync('rm -f .git/hooks/pre-commit .git/hooks/post-commit', { cwd: process.cwd() });
    console.log('✅ Git hooks removed successfully');
  } catch (error) {
    console.error('❌ Failed to remove git hooks:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Commit hook failed:', error.message);
    process.exit(1);
  });
}

export default CommitHook;
