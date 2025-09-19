#!/usr/bin/env node

import { execSync } from 'node:child_process';
import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

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

function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

async function checkpoint() {
  console.log('🚀 Starting Conflux DevKit Checkpoint...\n');

  // Step 0: Auto-fix Biome issues first
  console.log('🔧 Running automatic fixes...');
  const autoFixResult = runCommand('turbo run check:fix:unsafe', 'Auto-fixing code issues');
  if (!autoFixResult.success) {
    console.log('\n⚠️  Auto-fix encountered some issues, continuing with manual check...');
  } else {
    console.log('✅ Auto-fix completed successfully');
  }

  // Step 1: Run Biome checks
  const biomeResult = runCommand('pnpm run check', 'Running Biome checks');
  if (!biomeResult.success) {
    console.log('\n⚠️  Biome checks failed, trying one more auto-fix...');

    // Try once more with auto-fix
    const secondAutoFixResult = runCommand('turbo run check:fix', 'Running safe auto-fix');
    if (secondAutoFixResult.success) {
      console.log('✅ Auto-fix resolved the issues');

      // Retry Biome checks
      const retryBiomeResult = runCommand('pnpm run check', 'Retrying Biome checks');
      if (!retryBiomeResult.success) {
        console.log('\n❌ Biome checks still failing after auto-fix. Manual intervention required.');
        console.log('   Some issues may require manual fixing.');
        console.log('   Run: pnpm run check:fix:unsafe');
        rl.close();
        process.exit(1);
      }
    } else {
      console.log('\n❌ Biome checks failed and auto-fix unsuccessful.');
      console.log('   Please manually fix the issues before proceeding.');
      console.log('   Run: pnpm run check:fix or pnpm run check:fix:unsafe');
      rl.close();
      process.exit(1);
    }
  }

  // Step 2: Run builds
  const buildResult = runCommand('pnpm run build', 'Building all packages');
  if (!buildResult.success) {
    console.log(
      '\n❌ Build failed. Please fix the build issues before proceeding.'
    );
    rl.close();
    process.exit(1);
  }

  // Step 3: Run tests
  const testResult = runCommand('pnpm run test', 'Running tests');
  if (!testResult.success) {
    console.log(
      '\n❌ Tests failed. Please fix the test issues before proceeding.'
    );
    rl.close();
    process.exit(1);
  }

  // Step 4: Run final check (warnings are acceptable)
  const finalCheckResult = runCommand('pnpm run check', 'Final Biome check');
  if (!finalCheckResult.success) {
    console.log('\n⚠️  Final Biome check found some issues.');
    console.log('   If these are only warnings (not errors), the checkpoint can continue.');
    console.log('   Check the output above to determine if manual fixes are needed.');

    // Check if the error output contains only warnings
    const errorOutput = finalCheckResult.error?.stdout || finalCheckResult.error?.stderr || '';
    const hasErrors = errorOutput.includes('error') || errorOutput.includes('ERROR');

    if (hasErrors) {
      console.log('\n❌ Critical errors found in final check. Please fix before proceeding.');
      rl.close();
      process.exit(1);
    } else {
      console.log('✅ Only warnings found, continuing checkpoint...');
    }
  }

  // Step 5: Validate changelog
  const changelogResult = runCommand(
    'pnpm changelog show',
    'Checking changelog status'
  );
  if (!changelogResult.success) {
    console.log(
      '\n❌ Changelog check failed. Please ensure changelog is accessible.'
    );
    rl.close();
    process.exit(1);
  }

  // Check if changelog has recent entries (within last 7 days)
  try {
    const changelogContent = changelogResult.output;
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    // Look for recent changelog entries - check for any date pattern in the last 7 days
    const datePattern = /\d{4}-\d{2}-\d{2}/g;
    const dates = changelogContent.match(datePattern) || [];

    let hasRecentEntry = false;
    for (const date of dates) {
      const entryDate = new Date(date);
      if (entryDate >= sevenDaysAgo && entryDate <= today) {
        hasRecentEntry = true;
        break;
      }
    }

    // Also check for today's date specifically
    if (!hasRecentEntry) {
      hasRecentEntry =
        changelogContent.includes(todayStr) ||
        changelogContent.includes(sevenDaysAgoStr);
    }

    if (!hasRecentEntry) {
      console.log('\n⚠️  Warning: No recent changelog entries found.');
      console.log('   Consider running: pnpm changelog add');
      console.log('   This will not fail the checkpoint but is recommended.');
    } else {
      console.log('✅ Recent changelog entries found');
    }
  } catch (error) {
    console.log('\n⚠️  Warning: Could not validate changelog dates.');
    console.log(
      '   This will not fail the checkpoint but consider running: pnpm changelog add'
    );
  }

  console.log('\n✅ All diagnostic steps completed successfully!');
  console.log('\n🎉 Checkpoint completed successfully!');
  console.log('📊 Summary:');
  console.log('  ✅ Biome checks passed');
  console.log('  ✅ All packages built successfully');
  console.log('  ✅ All tests passed');
  console.log('  ✅ Final checks passed');
  console.log('  ✅ Changelog validation completed');
  console.log('\n💡 Ready for manual commit!');
  console.log('   Run: git add . && git commit -m "your message"');

  rl.close();
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Checkpoint interrupted by user');
  rl.close();
  process.exit(0);
});

checkpoint().catch(error => {
  console.error('\n💥 Checkpoint failed with error:', error.message);
  rl.close();
  process.exit(1);
});
