#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CHANGELOG_FILE = 'CHANGELOG.md';
const PACKAGES_DIR = 'packages';

/**
 * Enhanced Changelog Generator for Conflux DevKit
 * Automatically generates changelog entries based on git commits and changes
 */

class ChangelogGenerator {
  constructor() {
    this.changelogPath = CHANGELOG_FILE;
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

  getCurrentVersion() {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      return packageJson.version;
    } catch (error) {
      console.error('❌ Failed to read package.json:', error.message);
      return '1.0.0';
    }
  }

  getGitCommitInfo(since = 'HEAD~1') {
    try {
      const commits = execSync(`git log ${since}..HEAD --pretty=format:"%h|%s|%ad|%an" --date=short`, { 
        encoding: 'utf8' 
      }).trim().split('\n').filter(line => line);
      
      return commits.map(commit => {
        const [hash, message, date, author] = commit.split('|');
        return { hash, message, date, author };
      });
    } catch (error) {
      console.warn('⚠️  Could not get git commit info:', error.message);
      return [];
    }
  }

  getPackageChanges(since = 'HEAD~1') {
    try {
      let changedFiles = [];
      
      // Try to get changes from last commit
      try {
        changedFiles = execSync(`git diff --name-only ${since}..HEAD`, { encoding: 'utf8' })
          .trim()
          .split('\n')
          .filter(file => file.includes('packages/'));
      } catch (error) {
        // If no previous commit, try to get uncommitted changes
        changedFiles = execSync('git diff --name-only', { encoding: 'utf8' })
          .trim()
          .split('\n')
          .filter(file => file.includes('packages/'));
      }
      
      const packageChanges = {};
      changedFiles.forEach(file => {
        const pathParts = file.split('/');
        const packagesIndex = pathParts.indexOf('packages');
        if (packagesIndex !== -1 && packagesIndex + 1 < pathParts.length) {
          const packageName = pathParts[packagesIndex + 1];
          if (!packageChanges[packageName]) {
            packageChanges[packageName] = [];
          }
          packageChanges[packageName].push(file);
        }
      });
      
      return packageChanges;
    } catch (error) {
      console.warn('⚠️  Could not get package changes:', error.message);
      return {};
    }
  }

  categorizeCommits(commits) {
    const categories = {
      features: [],
      fixes: [],
      breaking: [],
      docs: [],
      refactor: [],
      test: [],
      chore: [],
      other: []
    };

    commits.forEach(commit => {
      const message = commit.message.toLowerCase();
      
      if (message.includes('breaking:') || message.includes('!:')) {
        categories.breaking.push(commit);
      } else if (message.includes('feat:') || message.includes('feature:') || message.includes('add:')) {
        categories.features.push(commit);
      } else if (message.includes('fix:') || message.includes('bug:')) {
        categories.fixes.push(commit);
      } else if (message.includes('docs:') || message.includes('doc:')) {
        categories.docs.push(commit);
      } else if (message.includes('refactor:') || message.includes('refactor')) {
        categories.refactor.push(commit);
      } else if (message.includes('test:') || message.includes('tests:')) {
        categories.test.push(commit);
      } else if (message.includes('chore:') || message.includes('ci:') || message.includes('build:')) {
        categories.chore.push(commit);
      } else {
        categories.other.push(commit);
      }
    });

    return categories;
  }

  formatCommitList(commits, category) {
    if (commits.length === 0) return '';
    
    const categoryTitles = {
      features: '### ✨ Features',
      fixes: '### 🐛 Bug Fixes',
      breaking: '### 💥 Breaking Changes',
      docs: '### 📚 Documentation',
      refactor: '### 🔧 Refactoring',
      test: '### 🧪 Tests',
      chore: '### 🔨 Chores',
      other: '### 📝 Other Changes'
    };

    const title = categoryTitles[category] || `### ${category}`;
    const items = commits.map(commit => 
      `- ${commit.message} (${commit.hash})`
    ).join('\n');

    return `${title}\n${items}\n`;
  }

  generateChangelogEntry(version, commits, packageChanges) {
    const today = new Date().toISOString().split('T')[0];
    const categorizedCommits = this.categorizeCommits(commits);
    
    let entry = `## [${version}] - ${today}\n\n`;
    
    // Add categorized changes
    const categories = ['breaking', 'features', 'fixes', 'refactor', 'docs', 'test', 'chore', 'other'];
    let hasChanges = false;
    
    categories.forEach(category => {
      const changes = this.formatCommitList(categorizedCommits[category], category);
      if (changes) {
        entry += changes;
        hasChanges = true;
      }
    });
    
    if (!hasChanges) {
      entry += '### 📝 Changes\n';
      entry += '- General improvements and updates\n';
    }
    
    // Add package changes summary
    if (Object.keys(packageChanges).length > 0) {
      entry += '\n### 📦 Package Changes\n';
      Object.entries(packageChanges).forEach(([pkg, files]) => {
        entry += `- **${pkg}**: ${files.length} file(s) changed\n`;
      });
    }
    
    // Add commit summary
    if (commits.length > 0) {
      entry += '\n### 📊 Commit Summary\n';
      entry += `- **Total commits**: ${commits.length}\n`;
      entry += `- **Contributors**: ${[...new Set(commits.map(c => c.author))].length}\n`;
    }
    
    entry += '\n---\n\n';
    
    return entry;
  }

  updateChangelog(version, commits, packageChanges) {
    let existingContent = '';
    
    if (existsSync(this.changelogPath)) {
      existingContent = readFileSync(this.changelogPath, 'utf8');
    } else {
      existingContent = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

`;
    }
    
    const newEntry = this.generateChangelogEntry(version, commits, packageChanges);
    
    // Insert new entry after the header
    const updatedContent = existingContent.replace(
      /---\n\n/,
      `---\n\n${newEntry}`
    );
    
    writeFileSync(this.changelogPath, updatedContent);
    console.log(`✅ Changelog updated: ${this.changelogPath}`);
  }

  showChangelog() {
    if (!existsSync(this.changelogPath)) {
      console.log('❌ No changelog found. Run with --add to create one.');
      return;
    }
    
    const content = readFileSync(this.changelogPath, 'utf8');
    console.log('\n📋 Current Changelog:');
    console.log('=' .repeat(50));
    console.log(content);
  }

  addEntry() {
    const version = this.getCurrentVersion();
    const commits = this.getGitCommitInfo();
    const packageChanges = this.getPackageChanges();
    
    console.log(`📝 Adding changelog entry for version ${version}...`);
    console.log(`📊 Found ${commits.length} commit(s) and ${Object.keys(packageChanges).length} package(s) changed`);
    
    this.updateChangelog(version, commits, packageChanges);
  }

  addCheckpointEntry() {
    const version = this.getCurrentVersion();
    const commits = this.getGitCommitInfo('HEAD~10'); // Last 10 commits for checkpoint
    const packageChanges = this.getPackageChanges('HEAD~10');
    
    console.log(`🔧 Adding checkpoint changelog entry for version ${version}...`);
    console.log(`📊 Found ${commits.length} commit(s) and ${Object.keys(packageChanges).length} package(s) changed`);
    
    this.updateChangelog(version, commits, packageChanges);
  }

  validateChangelog() {
    if (!existsSync(this.changelogPath)) {
      console.log('❌ No changelog found');
      return false;
    }
    
    const content = readFileSync(this.changelogPath, 'utf8');
    const today = new Date().toISOString().split('T')[0];
    const hasRecentEntry = content.includes(today) || content.includes('## [');
    
    if (!hasRecentEntry) {
      console.log('⚠️  No recent changelog entries found');
      return false;
    }
    
    console.log('✅ Changelog validation passed');
    return true;
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const generator = new ChangelogGenerator();
  
  console.log('🚀 Conflux DevKit Enhanced Changelog Generator\n');
  
  switch (command) {
    case '--add':
    case 'add':
      generator.addEntry();
      break;
    case '--checkpoint':
    case 'checkpoint':
      generator.addCheckpointEntry();
      break;
    case '--show':
    case 'show':
      generator.showChangelog();
      break;
    case '--validate':
    case 'validate':
      generator.validateChangelog();
      break;
    case '--help':
    case 'help':
      console.log(`
Usage: node scripts/enhanced-changelog.js [command]

Commands:
  add, --add           Add a new changelog entry based on recent changes
  checkpoint, --checkpoint  Add a checkpoint changelog entry (last 10 commits)
  show, --show         Display the current changelog
  validate, --validate Validate changelog has recent entries
  help, --help         Show this help message

Examples:
  node scripts/enhanced-changelog.js add        # Add new entry
  node scripts/enhanced-changelog.js checkpoint # Add checkpoint entry
  node scripts/enhanced-changelog.js show       # Show current changelog
  node scripts/enhanced-changelog.js validate   # Validate changelog
      `);
      break;
    default:
      generator.showChangelog();
      console.log('\n💡 Use "node scripts/enhanced-changelog.js add" to add a new entry');
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ChangelogGenerator;
