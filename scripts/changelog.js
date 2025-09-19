#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CHANGELOG_FILE = 'CHANGELOG.md';
const PACKAGES_DIR = 'packages';

function runCommand(command, description) {
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

function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.error('❌ Failed to read package.json:', error.message);
    return '1.0.0';
  }
}

function getGitCommitInfo() {
  try {
    const lastCommit = execSync('git log -1 --pretty=format:"%h %s"', { encoding: 'utf8' }).trim();
    const commitDate = execSync('git log -1 --pretty=format:"%ad" --date=short', { encoding: 'utf8' }).trim();
    return { lastCommit, commitDate };
  } catch (error) {
    return { lastCommit: 'Unknown', commitDate: new Date().toISOString().split('T')[0] };
  }
}

function getPackageChanges() {
  try {
    // First try to get changes from last commit
    let changedFiles = [];
    try {
      changedFiles = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' })
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
    
    // If still no changes, try uncommitted changes
    if (changedFiles.length === 0) {
      changedFiles = execSync('git diff --name-only', { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(file => file.includes('packages/'));
    }
    
    const packageChanges = {};
    changedFiles.forEach(file => {
      // Extract package name from path like "devkit/packages/core/src/..."
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
    return {};
  }
}

function generateChangelogEntry() {
  const version = getCurrentVersion();
  const { lastCommit, commitDate } = getGitCommitInfo();
  const packageChanges = getPackageChanges();
  
  const entry = `## [${version}] - ${commitDate}

### Changes
- **Commit**: ${lastCommit}
- **Date**: ${commitDate}

### Package Changes
${Object.keys(packageChanges).length > 0 
  ? Object.entries(packageChanges).map(([pkg, files]) => 
      `- **${pkg}**: ${files.length} file(s) changed`
    ).join('\n')
  : '- No package-specific changes detected'
}

### Files Changed
${Object.keys(packageChanges).length > 0 
  ? Object.entries(packageChanges).map(([pkg, files]) => 
      `\n#### ${pkg}\n${files.map(file => `- ${file}`).join('\n')}`
    ).join('\n')
  : '- No changes detected'
}

---

`;
  
  return entry;
}

function updateChangelog() {
  const changelogPath = CHANGELOG_FILE;
  let existingContent = '';
  
  if (existsSync(changelogPath)) {
    existingContent = readFileSync(changelogPath, 'utf8');
  } else {
    existingContent = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

`;
  }
  
  const newEntry = generateChangelogEntry();
  
  // If changelog is empty or only has header, add the new entry
  if (existingContent.trim() === '' || existingContent.includes('---\n\n') && !existingContent.includes('## [')) {
    const updatedContent = existingContent.replace(
      /---\n\n$/,
      `---\n\n${newEntry}`
    );
    writeFileSync(changelogPath, updatedContent);
  } else {
    // Insert new entry after the header
    const updatedContent = existingContent.replace(
      /---\n\n/,
      `---\n\n${newEntry}`
    );
    writeFileSync(changelogPath, updatedContent);
  }
  
  console.log(`✅ Changelog updated: ${changelogPath}`);
}

function showChangelog() {
  const changelogPath = CHANGELOG_FILE;
  
  if (!existsSync(changelogPath)) {
    console.log('❌ No changelog found. Run with --add to create one.');
    return;
  }
  
  const content = readFileSync(changelogPath, 'utf8');
  console.log('\n📋 Current Changelog:');
  console.log('=' .repeat(50));
  console.log(content);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🚀 Conflux DevKit Changelog Tool\n');
  
  switch (command) {
    case '--add':
    case 'add':
      updateChangelog();
      break;
    case '--show':
    case 'show':
      showChangelog();
      break;
    case '--help':
    case 'help':
      console.log(`
Usage: pnpm changelog [command]

Commands:
  add, --add     Add a new changelog entry based on recent changes
  show, --show   Display the current changelog
  help, --help   Show this help message

Examples:
  pnpm changelog add     # Add new entry
  pnpm changelog show    # Show current changelog
      `);
      break;
    default:
      showChangelog();
      console.log('\n💡 Use "pnpm changelog add" to add a new entry');
      break;
  }
}

main();
