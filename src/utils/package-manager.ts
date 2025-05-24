import consola, { type SelectPromptOptions } from 'consola';
import { type PackageManagerName, installDependencies } from 'nypm';
import type { Result } from '../types/result';
import { Err, Ok, isOk } from '../types/result';
import { handleError } from './common';
import { PACKAGE_MANAGER_OPTIONS } from './constants';

/**
 * Pure function to parse package manager from user agent string
 */
export const parsePackageManagerFromUserAgent = (userAgent: string): PackageManagerName | undefined => {
  const [name] = userAgent.split('/');
  return PACKAGE_MANAGER_OPTIONS.includes(name as PackageManagerName) ? (name as PackageManagerName) : undefined;
};

/**
 * Pure function to detect current package manager
 */
export const detectCurrentPackageManager = (): PackageManagerName | undefined => {
  const userAgent = process.env.npm_config_user_agent;
  return userAgent ? parsePackageManagerFromUserAgent(userAgent) : undefined;
};

/**
 * Pure function to validate package manager argument
 */
export const validatePackageManagerArg = (packageManagerArg?: string): Result<PackageManagerName, string> => {
  if (!packageManagerArg) {
    return Err('Package manager argument is empty');
  }

  if (!PACKAGE_MANAGER_OPTIONS.includes(packageManagerArg as PackageManagerName)) {
    return Err(`Invalid package manager: ${packageManagerArg}`);
  }

  return Ok(packageManagerArg as PackageManagerName);
};

/**
 * Pure function to create package manager select options
 */
export const createPackageManagerSelectOptions = (
  currentPackageManager?: PackageManagerName,
): SelectPromptOptions['options'] => {
  return PACKAGE_MANAGER_OPTIONS.map(
    (packageManager) =>
      ({
        label: packageManager,
        value: packageManager,
        hint: currentPackageManager === packageManager ? 'current' : undefined,
      }) satisfies SelectPromptOptions['options'][number],
  );
};

/**
 * Async function to prompt for package manager selection
 */
export const promptForPackageManager = async (
  currentPackageManager?: PackageManagerName,
): Promise<Result<PackageManagerName, Error>> => {
  try {
    const result = await consola.prompt('Which package manager would you like to use?', {
      type: 'select',
      options: createPackageManagerSelectOptions(currentPackageManager),
      initial: currentPackageManager,
      cancel: 'reject',
    });
    return Ok(result as PackageManagerName);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error('Package manager selection cancelled'));
  }
};

/**
 * Functional package manager selection with fallback chain
 */
export const selectPackageManager = async (packageManagerArg?: string): Promise<PackageManagerName> => {
  const argValidation = validatePackageManagerArg(packageManagerArg);

  if (isOk(argValidation)) {
    return argValidation.data;
  }

  const currentPackageManager = detectCurrentPackageManager();
  const promptResult = await promptForPackageManager(currentPackageManager);

  if (isOk(promptResult)) {
    return promptResult.data;
  }

  // Handle error case - exit for backward compatibility
  process.exit(1);
};

/**
 * Pure function to validate dependencies installation prompt result
 */
export const validateInstallationPromptResult = (shouldInstall: unknown): Result<boolean, string> => {
  if (typeof shouldInstall !== 'boolean') {
    return Err('Please specify whether to install dependencies.');
  }
  return Ok(shouldInstall);
};

/**
 * Async function to prompt for dependencies installation
 */
export const promptForDependenciesInstallation = async (initial: boolean): Promise<Result<boolean, Error>> => {
  try {
    const result = await consola.prompt('Do you want to install dependencies?', {
      type: 'confirm',
      initial,
      cancel: 'reject',
    });
    const validationResult = validateInstallationPromptResult(result);
    if (isOk(validationResult)) {
      return validationResult;
    }
    return Err(new Error(validationResult.error));
  } catch (error) {
    return Err(error instanceof Error ? error : new Error('Dependencies installation prompt cancelled'));
  }
};

/**
 * Functional dependencies installation confirmation
 */
export const confirmDependenciesInstallation = async (install: boolean): Promise<boolean> => {
  const promptResult = await promptForDependenciesInstallation(install);

  if (isOk(promptResult)) {
    return promptResult.data;
  }

  // Handle error case
  const errorMessage = promptResult.error instanceof Error ? promptResult.error.message : String(promptResult.error);
  if (errorMessage?.includes('Please specify')) {
    consola.error(errorMessage);
  }
  process.exit(1);
};

/**
 * Pure function to create installation configuration
 */
export const createInstallationConfig = (dir: string, packageManager: PackageManagerName) => ({
  cwd: dir,
  packageManager: {
    name: packageManager,
    command: packageManager,
  },
});

/**
 * Functional dependencies installation with Result type
 */
export const installDependenciesWithResult = async (
  dir: string,
  packageManager: PackageManagerName,
): Promise<Result<void, Error>> => {
  try {
    await installDependencies(createInstallationConfig(dir, packageManager));
    return Ok(undefined);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error('Dependencies installation failed'));
  }
};

/**
 * Conditional dependencies installation with proper side effect handling
 */
export const installDependenciesIfRequested = async (
  shouldInstall: boolean | undefined,
  dir: string,
  packageManager: PackageManagerName,
): Promise<void> => {
  if (shouldInstall === false) {
    consola.info('Skipping dependency installation.');
    return;
  }

  consola.start('Installing dependencies...');

  const result = await installDependenciesWithResult(dir, packageManager);

  if (isOk(result)) {
    consola.success('Installation completed.');
    return;
  }

  handleError(result.error);
};
