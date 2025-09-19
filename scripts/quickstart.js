#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PACKAGES_DIR = 'packages';
const CHANGELOG_FILE = 'CHANGELOG.md';

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

function getPackageInfo(packageName) {
  const packagePath = join(PACKAGES_DIR, packageName, 'package.json');
  
  if (!existsSync(packagePath)) {
    return null;
  }
  
  try {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description || 'No description available',
      scripts: packageJson.scripts || {},
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
      keywords: packageJson.keywords || [],
      author: packageJson.author || 'Unknown',
      license: packageJson.license || 'MIT'
    };
  } catch (error) {
    console.error(`❌ Failed to read package.json for ${packageName}:`, error.message);
    return null;
  }
}

function getTypeReferences(packageName) {
  const distPath = join(PACKAGES_DIR, packageName, 'dist');
  
  if (!existsSync(distPath)) {
    return 'No type definitions available (run build first)';
  }
  
  try {
    // Find all .d.ts files in the dist directory
    const findDtsFiles = (dir) => {
      const files = [];
      const items = readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = join(dir, item.name);
        if (item.isDirectory()) {
          files.push(...findDtsFiles(fullPath));
        } else if (item.name.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
      return files;
    };
    
    const dtsFiles = findDtsFiles(distPath);
    
    if (dtsFiles.length === 0) {
      return 'No type definitions available (run build first)';
    }
    
    const exports = [];
    
    // Process each .d.ts file
    for (const filePath of dtsFiles) {
      try {
        const typesContent = readFileSync(filePath, 'utf8');
        const fileExports = typesContent.match(/export\s+(interface|type|class|function|const)\s+(\w+)/g) || [];
        exports.push(...fileExports);
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }
    
    if (exports.length === 0) {
      return 'No type definitions available (run build first)';
    }
    
    // Remove duplicates and show first 10
    const uniqueExports = [...new Set(exports)];
    return uniqueExports.slice(0, 10).join('\n  '); // Show first 10 exports
  } catch (error) {
    return 'Error reading type definitions';
  }
}

function getRecentChangelog() {
  if (!existsSync(CHANGELOG_FILE)) {
    return 'No changelog available';
  }
  
  try {
    const changelogContent = readFileSync(CHANGELOG_FILE, 'utf8');
    const lines = changelogContent.split('\n');
    const firstEntry = lines.slice(0, 20).join('\n'); // First 20 lines
    return firstEntry;
  } catch (error) {
    return 'Error reading changelog';
  }
}

function formatScripts(scripts) {
  if (Object.keys(scripts).length === 0) {
    return 'No scripts available';
  }
  
  return Object.entries(scripts)
    .map(([name, command]) => `  ${name.padEnd(15)} ${command}`)
    .join('\n');
}

function formatDependencies(deps) {
  if (Object.keys(deps).length === 0) {
    return 'None';
  }
  
  return Object.entries(deps)
    .slice(0, 5) // Show first 5 dependencies
    .map(([name, version]) => `  ${name}@${version}`)
    .join('\n');
}

function displayPackageInfo(packageName) {
  const info = getPackageInfo(packageName);
  
  if (!info) {
    console.log(`❌ Package ${packageName} not found or invalid`);
    return;
  }
  
  console.log(`\n📦 Package: ${info.name}`);
  console.log('=' .repeat(60));
  console.log(`Version: ${info.version}`);
  console.log(`Description: ${info.description}`);
  console.log(`Author: ${info.author}`);
  console.log(`License: ${info.license}`);
  
  if (info.keywords.length > 0) {
    console.log(`Keywords: ${info.keywords.join(', ')}`);
  }
  
  console.log('\n🔧 Available Scripts:');
  console.log(formatScripts(info.scripts));
  
  console.log('\n📚 Dependencies:');
  console.log(formatDependencies(info.dependencies));
  
  console.log('\n🔧 Dev Dependencies:');
  console.log(formatDependencies(info.devDependencies));
  
  console.log('\n📝 Type References:');
  console.log(getTypeReferences(packageName));
  
  console.log('\n' + '=' .repeat(60));
}

function displayAllPackages() {
  console.log('🚀 Conflux DevKit Quickstart Guide\n');
  
  // Get all packages
  const packages = readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => !name.startsWith('.')); // Exclude hidden directories
  
  console.log(`📦 Found ${packages.length} packages:\n`);
  
  packages.forEach(packageName => {
    displayPackageInfo(packageName);
  });
  
  // Show recent changelog
  console.log('\n📋 Recent Changelog:');
  console.log('=' .repeat(60));
  console.log(getRecentChangelog());
  
  // Show workspace commands
  console.log('\n🛠️  Workspace Commands:');
  console.log('=' .repeat(60));
  console.log(`
  build              Build all packages
  test               Run all tests
  type-check         Run type checking
  dev                Start development mode
  checkpoint         Run full validation checkpoint
  changelog add      Add changelog entry
  changelog show     Show changelog
  quickstart         Show this quickstart guide
  
  Package-specific commands:
  pnpm --filter @conflux-devkit/core build
  pnpm --filter @conflux-devkit/blockchain test
  pnpm --filter @conflux-devkit/api-server dev
  `);
}

function displaySpecificPackage(packageName) {
  console.log('🚀 Conflux DevKit Package Quickstart\n');
  displayPackageInfo(packageName);
}

function main() {
  const args = process.argv.slice(2);
  const packageName = args[0];
  
  if (packageName && packageName !== '--help' && packageName !== 'help') {
    displaySpecificPackage(packageName);
  } else if (packageName === '--help' || packageName === 'help') {
    console.log(`
Usage: pnpm quickstart [package-name]

Commands:
  quickstart                    Show quickstart for all packages
  quickstart <package-name>     Show quickstart for specific package
  quickstart help               Show this help message

Examples:
  pnpm quickstart                           # Show all packages
  pnpm quickstart core                      # Show core package info
  pnpm quickstart blockchain                # Show blockchain package info
  pnpm quickstart api-server                # Show api-server package info
    `);
  } else {
    displayAllPackages();
    
    // Show package relationship map after quickstart
    console.log('\n🏗️  Package Relationship Map:');
    console.log('=' .repeat(60));
    
    try {
      const packageMapOutput = execSync('pnpm package-map --layers', { 
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      console.log(packageMapOutput);
    } catch (error) {
      console.log('❌ Could not display package relationship map');
      console.log('   Run "pnpm package-map --layers" manually to see the map');
      console.log('   Error:', error.message);
    }
  }
}

main();
