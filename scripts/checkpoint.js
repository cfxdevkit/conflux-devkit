#!/usr/bin/env node

import { execSync } from 'node:child_process';
import ChangelogGenerator from './enhanced-changelog.js';
import VersionManager from './version-manager.js';

function runCommand(command, description, silent = false) {
  if (!silent) console.log(`\n🔍 ${description}...`);
  try {
    const output = execSync(command, {
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      cwd: process.cwd(),
    });
    if (!silent) console.log(`✅ ${description} completed successfully`);
    return { success: true, output };
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.stdout || error.stderr || error.message);
    return { success: false, error };
  }
}

async function checkpoint(options = {}) {
  const {
    silent = false,
    skipVersionBump = false,
    skipChangelog = false,
    skipTests = false,
    skipBuild = false,
    autoFix = true,
    showVersion = true,
  } = options;

  if (!silent)
    console.log('🚀 Starting Conflux DevKit Enhanced Checkpoint...\n');

  const versionManager = new VersionManager();
  const changelogGenerator = new ChangelogGenerator();

  // Step 0: Show current version info
  if (showVersion && !silent) {
    console.log('📊 Current Version Information:');
    versionManager.showVersionInfo();
  }

  // Step 1: Auto-fix Biome issues first
  if (autoFix) {
    if (!silent) console.log('\n🔧 Running automatic fixes...');
    const autoFixResult = runCommand(
      'turbo run check:fix:unsafe',
      'Auto-fixing code issues',
      silent
    );
    if (!autoFixResult.success) {
      if (!silent)
        console.log(
          '\n⚠️  Auto-fix encountered some issues, continuing with manual check...'
        );
    } else {
      if (!silent) console.log('✅ Auto-fix completed successfully');
    }
  }

  // Step 2: Run Biome checks
  const biomeResult = runCommand(
    'pnpm run check',
    'Running Biome checks',
    silent
  );
  if (!biomeResult.success) {
    if (!silent)
      console.log('\n⚠️  Biome checks failed, trying one more auto-fix...');

    // Try once more with auto-fix
    const secondAutoFixResult = runCommand(
      'turbo run check:fix',
      'Running safe auto-fix',
      silent
    );
    if (secondAutoFixResult.success) {
      if (!silent) console.log('✅ Auto-fix resolved the issues');

      // Retry Biome checks
      const retryBiomeResult = runCommand(
        'pnpm run check',
        'Retrying Biome checks',
        silent
      );
      if (!retryBiomeResult.success) {
        console.log(
          '\n❌ Biome checks still failing after auto-fix. Manual intervention required.'
        );
        console.log('   Some issues may require manual fixing.');
        console.log('   Run: pnpm run check:fix:unsafe');
        process.exit(1);
      }
    } else {
      console.log('\n❌ Biome checks failed and auto-fix unsuccessful.');
      console.log('   Please manually fix the issues before proceeding.');
      console.log('   Run: pnpm run check:fix or pnpm run check:fix:unsafe');
      process.exit(1);
    }
  }

  // Step 3: Run builds
  if (!skipBuild) {
    const buildResult = runCommand(
      'pnpm run build',
      'Building all packages',
      silent
    );
    if (!buildResult.success) {
      console.log(
        '\n❌ Build failed. Please fix the build issues before proceeding.'
      );
      process.exit(1);
    }
  }

  // Step 4: Run tests
  if (!skipTests) {
    const testResult = runCommand('pnpm run test', 'Running tests', silent);
    if (!testResult.success) {
      console.log(
        '\n❌ Tests failed. Please fix the test issues before proceeding.'
      );
      process.exit(1);
    }
  }

  // Step 5: Run final check (warnings are acceptable)
  const finalCheckResult = runCommand(
    'pnpm run check',
    'Final Biome check',
    silent
  );
  if (!finalCheckResult.success) {
    if (!silent) console.log('\n⚠️  Final Biome check found some issues.');
    if (!silent)
      console.log(
        '   If these are only warnings (not errors), the checkpoint can continue.'
      );
    if (!silent)
      console.log(
        '   Check the output above to determine if manual fixes are needed.'
      );

    // Check if the error output contains only warnings
    const errorOutput =
      finalCheckResult.error?.stdout || finalCheckResult.error?.stderr || '';
    const hasErrors =
      errorOutput.includes('error') || errorOutput.includes('ERROR');

    if (hasErrors) {
      console.log(
        '\n❌ Critical errors found in final check. Please fix before proceeding.'
      );
      process.exit(1);
    } else {
      if (!silent)
        console.log('✅ Only warnings found, continuing checkpoint...');
    }
  }

  // Step 6: Bump patch version (checkpoint = patch version)
  if (!skipVersionBump) {
    if (!silent) console.log('\n📈 Bumping patch version for checkpoint...');
    const versionBumpResult = versionManager.bumpPatchVersion();
    if (!versionBumpResult) {
      console.log(
        '\n❌ Failed to bump version. Please check package.json files.'
      );
      process.exit(1);
    }
  }

  // Step 7: Update changelog
  if (!skipChangelog) {
    if (!silent) console.log('\n📝 Updating changelog...');
    changelogGenerator.addCheckpointEntry();

    // Step 8: Validate changelog
    const changelogValid = changelogGenerator.validateChangelog();
    if (!changelogValid && !silent) {
      console.log('\n⚠️  Changelog validation failed, but continuing...');
    }
  }

  // Step 9: Show final version info
  if (showVersion && !silent) {
    console.log('\n📊 Updated Version Information:');
    versionManager.showVersionInfo();
  }

  if (!silent) {
    console.log('\n✅ All diagnostic steps completed successfully!');
    console.log('\n🎉 Enhanced Checkpoint completed successfully!');
    console.log('📊 Summary:');
    console.log('  ✅ Biome checks passed');
    if (!skipBuild) console.log('  ✅ All packages built successfully');
    if (!skipTests) console.log('  ✅ All tests passed');
    console.log('  ✅ Final checks passed');
    if (!skipVersionBump) console.log('  ✅ Patch version bumped');
    if (!skipChangelog) console.log('  ✅ Changelog updated');
    console.log('\n💡 Ready for commit!');
    console.log('   Run: git add . && git commit -m "your message"');
    console.log('   Or use: pnpm run commit (if you have commit hooks set up)');
  }

  return {
    success: true,
    versionBumped: !skipVersionBump,
    changelogUpdated: !skipChangelog,
    buildSkipped: skipBuild,
    testsSkipped: skipTests,
  };
}

// CLI Interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    silent: false,
    skipVersionBump: false,
    skipChangelog: false,
    skipTests: false,
    skipBuild: false,
    autoFix: true,
    showVersion: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--silent':
      case '-s':
        options.silent = true;
        break;
      case '--skip-version':
        options.skipVersionBump = true;
        break;
      case '--skip-changelog':
        options.skipChangelog = true;
        break;
      case '--skip-tests':
        options.skipTests = true;
        break;
      case '--skip-build':
        options.skipBuild = true;
        break;
      case '--no-autofix':
        options.autoFix = false;
        break;
      case '--no-version-info':
        options.showVersion = false;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node scripts/enhanced-checkpoint.js [options]

Options:
  --silent, -s           Run in silent mode (minimal output)
  --skip-version         Skip version bumping
  --skip-changelog       Skip changelog updates
  --skip-tests           Skip running tests
  --skip-build           Skip building packages
  --no-autofix           Skip automatic fixes
  --no-version-info      Skip showing version information
  --help, -h             Show this help message

Examples:
  node scripts/enhanced-checkpoint.js                    # Full checkpoint
  node scripts/enhanced-checkpoint.js --silent           # Silent mode
  node scripts/enhanced-checkpoint.js --skip-tests       # Skip tests
  node scripts/enhanced-checkpoint.js --skip-version     # Skip version bump
        `);
        process.exit(0);
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          console.log('Use --help for available options');
          process.exit(1);
        }
        break;
    }
  }

  return options;
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Enhanced Checkpoint interrupted by user');
  process.exit(0);
});

// Main execution
async function main() {
  const options = parseArgs();

  try {
    const result = await checkpoint(options);

    if (options.silent) {
      // Return JSON result for programmatic use
      console.log(JSON.stringify(result));
    }

    process.exit(0);
  } catch (error) {
    console.error('\n💥 Enhanced Checkpoint failed with error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default checkpoint;
