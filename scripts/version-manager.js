#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const PACKAGES_DIR = 'packages';

/**
 * Version Manager for Conflux DevKit
 * Handles automated versioning for patch, minor, and major versions
 */

class VersionManager {
  constructor() {
    this.rootPackagePath = 'package.json';
    this.packages = this.getPackagePaths();
  }

  getPackagePaths() {
    try {
      const packages = [];
      const packagesDir = PACKAGES_DIR;

      // Get all package.json files in packages directory
      const result = execSync(
        `find ${packagesDir} -name "package.json" -type f`,
        {
          encoding: 'utf8',
          cwd: process.cwd(),
        }
      );

      result
        .trim()
        .split('\n')
        .forEach((path) => {
          if (path) {
            packages.push(path);
          }
        });

      return packages;
    } catch (_error) {
      console.warn('⚠️  Could not find packages directory');
      return [];
    }
  }

  getCurrentVersion(packagePath = this.rootPackagePath) {
    try {
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      return packageJson.version;
    } catch (error) {
      console.error(`❌ Failed to read ${packagePath}:`, error.message);
      return '1.0.0';
    }
  }

  parseVersion(version) {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
      original: version,
    };
  }

  formatVersion(versionObj) {
    return `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`;
  }

  bumpVersion(version, type) {
    const parsed = this.parseVersion(version);

    switch (type) {
      case 'patch':
        parsed.patch += 1;
        break;
      case 'minor':
        parsed.minor += 1;
        parsed.patch = 0;
        break;
      case 'major':
        parsed.major += 1;
        parsed.minor = 0;
        parsed.patch = 0;
        break;
      default:
        throw new Error(`Invalid version type: ${type}`);
    }

    return this.formatVersion(parsed);
  }

  updatePackageVersion(packagePath, newVersion) {
    try {
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      const oldVersion = packageJson.version;
      packageJson.version = newVersion;

      writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

      console.log(`📦 ${packagePath}: ${oldVersion} → ${newVersion}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update ${packagePath}:`, error.message);
      return false;
    }
  }

  updateAllVersions(newVersion) {
    console.log(`🔄 Updating all package versions to ${newVersion}...`);

    // Update root package
    const rootSuccess = this.updatePackageVersion(
      this.rootPackagePath,
      newVersion
    );

    // Update all packages
    let packagesUpdated = 0;
    this.packages.forEach((packagePath) => {
      if (this.updatePackageVersion(packagePath, newVersion)) {
        packagesUpdated++;
      }
    });

    console.log(
      `✅ Updated ${packagesUpdated + (rootSuccess ? 1 : 0)} package(s)`
    );
    return rootSuccess && packagesUpdated > 0;
  }

  getVersionTypeFromCommit(commitMessage) {
    const message = commitMessage.toLowerCase();

    // Major version indicators
    if (
      message.includes('breaking:') ||
      message.includes('breaking change') ||
      message.includes('!:')
    ) {
      return 'major';
    }

    // Minor version indicators
    if (
      message.includes('feat:') ||
      message.includes('feature:') ||
      message.includes('add:') ||
      message.includes('new:')
    ) {
      return 'minor';
    }

    // Default to patch for fixes, docs, etc.
    return 'patch';
  }

  getLastCommitMessage() {
    try {
      return execSync('git log -1 --pretty=format:"%s"', {
        encoding: 'utf8',
        cwd: process.cwd(),
      }).trim();
    } catch (_error) {
      return '';
    }
  }

  bumpVersionForCommit() {
    const currentVersion = this.getCurrentVersion();
    const commitMessage = this.getLastCommitMessage();
    const versionType = this.getVersionTypeFromCommit(commitMessage);
    const newVersion = this.bumpVersion(currentVersion, versionType);

    console.log(
      `📈 Version bump: ${currentVersion} → ${newVersion} (${versionType})`
    );
    console.log(`📝 Commit: ${commitMessage}`);

    return this.updateAllVersions(newVersion);
  }

  bumpPatchVersion() {
    const currentVersion = this.getCurrentVersion();
    const newVersion = this.bumpVersion(currentVersion, 'patch');

    console.log(`🔧 Patch version bump: ${currentVersion} → ${newVersion}`);
    return this.updateAllVersions(newVersion);
  }

  bumpMinorVersion() {
    const currentVersion = this.getCurrentVersion();
    const newVersion = this.bumpVersion(currentVersion, 'minor');

    console.log(`✨ Minor version bump: ${currentVersion} → ${newVersion}`);
    return this.updateAllVersions(newVersion);
  }

  bumpMajorVersion() {
    const currentVersion = this.getCurrentVersion();
    const newVersion = this.bumpVersion(currentVersion, 'major');

    console.log(`🚀 Major version bump: ${currentVersion} → ${newVersion}`);
    return this.updateAllVersions(newVersion);
  }

  validateVersion(version) {
    const versionRegex = /^\d+\.\d+\.\d+$/;
    return versionRegex.test(version);
  }

  showVersionInfo(silent = false) {
    const rootVersion = this.getCurrentVersion();
    const info = {
      root: rootVersion,
      packages: this.packages.length,
      packageVersions: {},
    };

    if (this.packages.length > 0) {
      this.packages.forEach((packagePath) => {
        const version = this.getCurrentVersion(packagePath);
        const packageName = packagePath.split('/').slice(-2, -1)[0];
        info.packageVersions[packageName] = version;
      });
    }

    if (!silent) {
      console.log(`\n📊 Version Information:`);
      console.log(`   Root: ${rootVersion}`);
      console.log(`   Packages: ${this.packages.length}`);

      if (this.packages.length > 0) {
        console.log(`\n📦 Package Versions:`);
        Object.entries(info.packageVersions).forEach(([name, version]) => {
          console.log(`   ${name}: ${version}`);
        });
      }
    }

    return info;
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const versionManager = new VersionManager();

  console.log('🚀 Conflux DevKit Version Manager\n');

  switch (command) {
    case 'patch':
      versionManager.bumpPatchVersion();
      break;
    case 'minor':
      versionManager.bumpMinorVersion();
      break;
    case 'major':
      versionManager.bumpMajorVersion();
      break;
    case 'auto':
      versionManager.bumpVersionForCommit();
      break;
    case 'info':
    case 'show':
      versionManager.showVersionInfo();
      break;
    case '--help':
    case 'help':
      console.log(`
Usage: node scripts/version-manager.js [command]

Commands:
  patch        Bump patch version (1.0.0 → 1.0.1)
  minor        Bump minor version (1.0.0 → 1.1.0)
  major        Bump major version (1.0.0 → 2.0.0)
  auto         Auto-detect version type from commit message
  info, show   Show current version information
  help         Show this help message

Examples:
  node scripts/version-manager.js patch    # Bump patch version
  node scripts/version-manager.js auto     # Auto-detect from commit
  node scripts/version-manager.js info     # Show version info
      `);
      break;
    default:
      versionManager.showVersionInfo();
      console.log(
        '\n💡 Use "node scripts/version-manager.js help" for available commands'
      );
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default VersionManager;
