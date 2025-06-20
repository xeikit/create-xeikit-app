#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { consola } from 'consola';
import { x } from 'tinyexec';

// Configuration
const PACKAGE_PATH = resolve(process.cwd(), 'package.json');
const RELEASE_TYPES = ['patch', 'minor', 'major', 'prerelease'];

// Environment detection
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d');
const isQuickRelease = args.includes('--quick') || args.includes('-q') || isCI;
const skipTests = args.includes('--skip-tests');
const skipLint = args.includes('--skip-lint');
const skipBuild = args.includes('--skip-build');
const skipValidation = args.includes('--skip-validation');
const releaseType = args.find((arg) => RELEASE_TYPES.includes(arg));

// Utility functions
function getPackageInfo() {
  try {
    const pkg = JSON.parse(readFileSync(PACKAGE_PATH, 'utf8'));
    return {
      name: pkg.name,
      version: pkg.version,
      private: pkg.private,
    };
  } catch (error) {
    consola.error('Failed to read package.json:', error.message);
    process.exit(1);
  }
}

async function checkGitStatus() {
  try {
    const { stdout: status } = await x('git', ['status', '--porcelain'], {
      nodeOptions: { stdio: 'pipe' },
    });

    if (status.trim()) {
      consola.warn('Working directory is not clean:');
      console.log(status);

      if (!isDryRun && !isCI) {
        const shouldContinue = await consola.prompt('Continue anyway?', { type: 'confirm' });
        if (!shouldContinue) {
          consola.info('Release aborted by user');
          process.exit(0);
        }
      } else if (isCI) {
        consola.info('CI environment detected - continuing with unclean working directory');
      }
    }
  } catch (error) {
    consola.warn('Could not check git status:', error.message);
  }
}

async function checkCurrentBranch() {
  try {
    const { stdout: branch } = await x('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      nodeOptions: { stdio: 'pipe' },
    });

    const currentBranch = branch.trim();
    if (currentBranch !== 'main' && currentBranch !== 'master') {
      consola.warn(`Current branch is '${currentBranch}', not 'main' or 'master'`);

      if (!isDryRun && !isCI) {
        const shouldContinue = await consola.prompt('Continue anyway?', { type: 'confirm' });
        if (!shouldContinue) {
          consola.info('Release aborted by user');
          process.exit(0);
        }
      } else if (isCI) {
        consola.info('CI environment detected - continuing with non-main branch');
      }
    }
  } catch (error) {
    consola.warn('Could not check current branch:', error.message);
  }
}

async function runCommand(command, args = [], options = {}) {
  const commandStr = `${command} ${args.join(' ')}`;

  if (isDryRun) {
    consola.info(`[DRY RUN] Would run: ${commandStr}`);
    return;
  }

  consola.start(`Running: ${commandStr}`);

  try {
    await x(command, args, {
      nodeOptions: { stdio: 'inherit' },
      throwOnError: true,
      ...options,
    });
    consola.success(`Completed: ${commandStr}`);
  } catch (error) {
    consola.error(`Failed: ${commandStr}`);
    throw error;
  }
}

async function runTests() {
  if (skipTests) {
    consola.info('Skipping tests (--skip-tests flag)');
    return;
  }

  consola.box('Running Tests');
  await runCommand('pnpm', ['test:ci']);
}

async function runLinting() {
  if (skipLint) {
    consola.info('Skipping linting (--skip-lint flag)');
    return;
  }

  consola.box('Running Linting');
  await runCommand('pnpm', ['lint:fix']);
}

async function buildProject() {
  if (skipBuild) {
    consola.info('Skipping build (--skip-build flag)');
    return;
  }

  consola.box('Building Project');
  await runCommand('pnpm', ['build']);
}

async function generateChangelog() {
  consola.box('Generating Changelog');

  const changelogArgs = [];

  // Add release type if specified
  if (releaseType) {
    changelogArgs.push(`--${releaseType}`);
  }

  // Add release flag (includes bump and git operations)
  changelogArgs.push('--release');

  // Add push flag only for non-dry-run
  if (!isDryRun) {
    changelogArgs.push('--push');
  }

  await runCommand('changelogen', changelogArgs);
}

async function publishPackage() {
  const pkg = getPackageInfo();

  if (pkg.private) {
    consola.info('Package is private, skipping publish');
    return;
  }

  consola.box('Publishing Package');

  const publishArgs = ['publish'];
  if (isDryRun) {
    publishArgs.push('--dry-run');
  }

  await runCommand('pnpm', publishArgs);
}

async function showReleaseSummary() {
  const pkg = getPackageInfo();

  consola.box('Release Summary');
  console.log(`Package: ${pkg.name}`);
  console.log(`Version: ${pkg.version}`);
  console.log(`Environment: ${isCI ? 'CI' : 'Local'}`);
  console.log(`Dry Run: ${isDryRun ? 'Yes' : 'No'}`);
  console.log(`Quick Release: ${isQuickRelease ? 'Yes' : 'No'}`);
  console.log(`Skip Tests: ${skipTests ? 'Yes' : 'No'}`);
  console.log(`Skip Lint: ${skipLint ? 'Yes' : 'No'}`);
  console.log(`Skip Build: ${skipBuild ? 'Yes' : 'No'}`);
  console.log(`Skip Validation: ${skipValidation ? 'Yes' : 'No'}`);

  if (releaseType) {
    console.log(`Release Type: ${releaseType}`);
  }
}

async function confirmRelease() {
  if (isDryRun) {
    consola.info('This is a dry run - no actual changes will be made');
    return;
  }

  if (isQuickRelease) {
    consola.info('Quick release mode - skipping confirmation');
    return;
  }

  const shouldContinue = await consola.prompt('Continue with release?', { type: 'confirm' });
  if (!shouldContinue) {
    consola.info('Release aborted by user');
    process.exit(0);
  }
}

// Pre-release validation with dry run
async function validateRelease() {
  if (isDryRun) {
    // Already in dry run mode
    return;
  }

  if (isQuickRelease || skipValidation) {
    // Skip validation for quick releases or when explicitly skipped
    if (skipValidation) {
      consola.info('Skipping dry run validation (--skip-validation flag)');
    } else {
      consola.info('Quick release mode - skipping dry run validation');
    }
    return;
  }

  consola.box('Pre-release Validation');
  consola.info('Running dry run validation before actual release...');

  try {
    // Create a copy of current args but with dry run enabled
    const dryRunArgs = process.argv.slice(2).filter((arg) => arg !== '--quick' && arg !== '-q');
    if (!dryRunArgs.includes('--dry-run') && !dryRunArgs.includes('-d')) {
      dryRunArgs.push('--dry-run');
    }

    // Run dry run validation
    await x('node', [process.argv[1], ...dryRunArgs], {
      nodeOptions: { stdio: 'inherit' },
      throwOnError: true,
    });

    consola.success('✅ Dry run validation passed');

    // Ask for confirmation to proceed
    const shouldProceed = await consola.prompt('Dry run validation passed. Proceed with actual release?', {
      type: 'confirm',
    });

    if (!shouldProceed) {
      consola.info('Release aborted by user after dry run validation');
      process.exit(0);
    }
  } catch (error) {
    consola.error('❌ Dry run validation failed:', error.message);
    consola.error('Please fix the issues above before proceeding with the release');
    process.exit(1);
  }
}

// Quick validation function
async function quickValidation() {
  if (isDryRun || isQuickRelease) {
    return; // Skip validation for dry runs and quick releases
  }

  consola.box('Pre-release Quick Validation');

  try {
    // Test basic functionality with a simple dry run
    consola.start('Running quick validation...');

    await x('node', [process.argv[1], '--dry-run', '--quick', '--skip-validation', releaseType || 'patch'], {
      nodeOptions: { stdio: 'pipe' },
      throwOnError: true,
    });

    consola.success('✅ Quick validation passed');
  } catch (error) {
    consola.error('❌ Quick validation failed:', error.message);
    consola.error('Please fix the issues before proceeding with the release');

    const shouldContinue = await consola.prompt('Continue anyway? (Not recommended)', {
      type: 'confirm',
      initial: false,
    });

    if (!shouldContinue) {
      consola.info('Release aborted due to validation failure');
      process.exit(1);
    }
  }
}

// Main release function
async function release() {
  try {
    consola.info('🚀 Starting release process...');

    // Show release summary
    await showReleaseSummary();

    // Quick validation
    await quickValidation();

    // Pre-release validation (dry run)
    await validateRelease();

    // Pre-release checks
    consola.box('Pre-release Checks');
    await checkGitStatus();
    await checkCurrentBranch();

    // Confirm release
    await confirmRelease();

    // Release stages
    if (!isQuickRelease) {
      await runLinting();
      await runTests();
    }

    await buildProject();
    await generateChangelog();
    await publishPackage();

    // Success message
    if (isDryRun) {
      consola.success('✅ Dry run completed successfully!');
      consola.info('Run without --dry-run to perform actual release');
    } else {
      consola.success('✅ Release completed successfully!');
      const pkg = getPackageInfo();
      consola.info(`🎉 ${pkg.name}@${pkg.version} has been released!`);
    }
  } catch (error) {
    consola.error('❌ Release failed:', error.message);

    if (error.code === 'ENOENT') {
      consola.info('Make sure all required dependencies are installed');
    }

    process.exit(1);
  }
}

// Show help
function showHelp() {
  console.log(`
Usage: node scripts/release.mjs [options] [release-type]

Options:
  --dry-run, -d     Perform a dry run without making actual changes
  --quick, -q       Quick release (skip confirmation and some checks)
  --skip-tests      Skip running tests
  --skip-lint       Skip linting
  --skip-build      Skip building
  --skip-validation Skip dry run validation before release
  --help, -h        Show this help message

Release Types:
  patch             Patch release (1.0.0 -> 1.0.1)
  minor             Minor release (1.0.0 -> 1.1.0)
  major             Major release (1.0.0 -> 2.0.0)
  prerelease        Prerelease (1.0.0 -> 1.0.1-0)

Examples:
  node scripts/release.mjs --dry-run
  node scripts/release.mjs --quick patch
  node scripts/release.mjs minor --skip-tests
  node scripts/release.mjs --skip-validation patch
  `);
}

// Handle help flag
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run release
release();
