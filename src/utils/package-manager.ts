import type { Result } from '@/types/result';
import { Err, Ok, isOk } from '@/types/result';
import { handleError } from '@/utils/common';
import { PACKAGE_MANAGER_OPTIONS } from '@/utils/constants';
import consola, { type SelectPromptOptions } from 'consola';
import { type PackageManagerName, installDependencies } from 'nypm';

/**
 * Extracts the package manager name from a user agent string.
 * User agent strings typically come from npm_config_user_agent environment variable.
 * This is a pure function that parses the string format "packagemanager/version".
 *
 * @param userAgent - The user agent string to parse (e.g., "npm/8.1.0 node/v16.14.0")
 * @returns The package manager name if valid, undefined otherwise
 *
 * @example
 * ```typescript
 * const npm = parsePackageManagerFromUserAgent("npm/8.1.0 node/v16.14.0");
 * // Returns: "npm"
 *
 * const yarn = parsePackageManagerFromUserAgent("yarn/1.22.19 npm/? node/v16.14.0");
 * // Returns: "yarn"
 *
 * const invalid = parsePackageManagerFromUserAgent("unknown/1.0.0");
 * // Returns: undefined
 * ```
 */
export const parsePackageManagerFromUserAgent = (userAgent: string): PackageManagerName | undefined => {
  const [name] = userAgent.split('/');
  return PACKAGE_MANAGER_OPTIONS.includes(name as PackageManagerName) ? (name as PackageManagerName) : undefined;
};

/**
 * Detects the currently running package manager from environment variables.
 * Checks the npm_config_user_agent environment variable to determine which package manager is in use.
 * This is useful for providing better defaults in prompts.
 *
 * @returns The detected package manager name, or undefined if not detectable
 *
 * @example
 * ```typescript
 * // When running with: npm run create-app
 * const current = detectCurrentPackageManager();
 * // Returns: "npm"
 *
 * // When running with: yarn create-app
 * const current = detectCurrentPackageManager();
 * // Returns: "yarn"
 *
 * // When run directly (not through a package manager)
 * const current = detectCurrentPackageManager();
 * // Returns: undefined
 * ```
 */
export const detectCurrentPackageManager = (): PackageManagerName | undefined => {
  const userAgent = process.env.npm_config_user_agent;
  return userAgent ? parsePackageManagerFromUserAgent(userAgent) : undefined;
};

/**
 * Validates a package manager argument against the list of supported package managers.
 * Ensures that only valid package managers are accepted, providing clear error messages for invalid ones.
 *
 * @param packageManagerArg - The package manager name to validate (optional)
 * @returns A Result containing the validated package manager or an error message
 *
 * @example
 * ```typescript
 * const valid = validatePackageManagerArg("npm");
 * // Returns: Ok("npm")
 *
 * const invalid = validatePackageManagerArg("invalid-pm");
 * // Returns: Err("Invalid package manager: invalid-pm")
 *
 * const empty = validatePackageManagerArg("");
 * // Returns: Err("Package manager argument is empty")
 * ```
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
 * Creates select options for the package manager prompt.
 * Generates option objects with labels and hints, highlighting the current package manager if detected.
 * This makes the user interface more informative by showing which package manager is currently active.
 *
 * @param currentPackageManager - The currently detected package manager (optional)
 * @returns Array of select option objects for use in consola prompts
 *
 * @example
 * ```typescript
 * const options = createPackageManagerSelectOptions("npm");
 * // Returns: [
 * //   { label: "npm", value: "npm", hint: "current" },
 * //   { label: "yarn", value: "yarn", hint: undefined },
 * //   { label: "pnpm", value: "pnpm", hint: undefined },
 * //   ...
 * // ]
 * ```
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
 * Prompts the user to select a package manager from available options.
 * Displays a select menu with all supported package managers, highlighting the current one if detected.
 * Handles user cancellation gracefully by returning an error Result.
 *
 * @param currentPackageManager - The currently detected package manager to highlight (optional)
 * @returns A Promise that resolves to a Result containing the selected package manager or an error
 *
 * @example
 * ```typescript
 * const result = await promptForPackageManager("npm");
 * if (isOk(result)) {
 *   console.log(`User selected: ${result.data}`);
 * } else {
 *   console.error('User cancelled package manager selection');
 * }
 * ```
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
 * Selects a package manager using a fallback chain strategy.
 * First validates the provided package manager argument. If invalid, detects the current package manager
 * and prompts the user for selection with intelligent defaults.
 *
 * @param packageManagerArg - The package manager argument from command line (optional)
 * @returns A Promise that resolves to a valid package manager name
 *
 * @example
 * ```typescript
 * // With valid argument
 * const pm1 = await selectPackageManager("yarn");
 * // Returns: "yarn"
 *
 * // With invalid argument (will detect current and prompt)
 * const pm2 = await selectPackageManager("invalid");
 * // Returns: user's selection from prompt (with current PM highlighted)
 * ```
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
 * Validates the result from a dependencies installation prompt.
 * Ensures the user provided a valid boolean response for the installation question.
 *
 * @param shouldInstall - The raw response from the user prompt (can be any type)
 * @returns A Result containing a boolean value or an error message
 *
 * @example
 * ```typescript
 * const valid = validateInstallationPromptResult(true);
 * // Returns: Ok(true)
 *
 * const invalid = validateInstallationPromptResult("maybe");
 * // Returns: Err("Please specify whether to install dependencies.")
 * ```
 */
export const validateInstallationPromptResult = (shouldInstall: unknown): Result<boolean, string> => {
  if (typeof shouldInstall !== 'boolean') {
    return Err('Please specify whether to install dependencies.');
  }
  return Ok(shouldInstall);
};

/**
 * Prompts the user to confirm whether they want to install project dependencies.
 * Displays a yes/no confirmation dialog with a default value provided.
 * Handles user cancellation gracefully by returning an error Result.
 *
 * @param initial - The default value for the confirmation prompt
 * @returns A Promise that resolves to a Result containing the user's choice or an error
 *
 * @example
 * ```typescript
 * const result = await promptForDependenciesInstallation(true);
 * if (isOk(result)) {
 *   console.log(`Install dependencies: ${result.data}`);
 * } else {
 *   console.error('User cancelled dependencies prompt');
 * }
 * ```
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
 * Confirms dependencies installation using a prompt if needed.
 * This function handles the user interaction flow for dependency installation confirmation.
 * If an error occurs during the prompt, it logs the error and exits the process.
 *
 * @param install - The initial preference for installing dependencies
 * @returns A Promise that resolves to the user's final decision
 *
 * @example
 * ```typescript
 * const shouldInstall = await confirmDependenciesInstallation(true);
 * if (shouldInstall) {
 *   console.log("User confirmed: will install dependencies");
 * } else {
 *   console.log("User declined: will skip dependency installation");
 * }
 * ```
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
 * Creates configuration object for package installation.
 * This pure function generates the configuration needed by the nypm library for dependency installation.
 *
 * @param dir - The directory where dependencies should be installed
 * @param packageManager - The package manager to use for installation
 * @returns Configuration object with directory and package manager settings
 *
 * @example
 * ```typescript
 * const config = createInstallationConfig("./my-project", "npm");
 * // Returns: {
 * //   cwd: "./my-project",
 * //   packageManager: { name: "npm", command: "npm" }
 * // }
 * ```
 */
export const createInstallationConfig = (dir: string, packageManager: PackageManagerName) => ({
  cwd: dir,
  packageManager: {
    name: packageManager,
    command: packageManager,
  },
});

/**
 * Installs project dependencies using the specified package manager.
 * Returns a Result type to allow for functional error handling without side effects.
 * Uses the nypm library internally to handle the actual installation process.
 *
 * @param dir - The directory where dependencies should be installed
 * @param packageManager - The package manager to use for installation
 * @returns A Promise that resolves to a Result indicating success or failure
 *
 * @example
 * ```typescript
 * const result = await installDependenciesWithResult("./my-project", "npm");
 * if (isOk(result)) {
 *   console.log("Dependencies installed successfully");
 * } else {
 *   console.error("Installation failed:", result.error.message);
 * }
 * ```
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
 * Conditionally installs dependencies based on user preference.
 * This function handles the complete installation workflow, including user feedback.
 * If installation is skipped or fails, it provides appropriate logging.
 *
 * @param shouldInstall - Whether dependencies should be installed (undefined means yes)
 * @param dir - The directory where dependencies should be installed
 * @param packageManager - The package manager to use for installation
 *
 * @example
 * ```typescript
 * // Install dependencies
 * await installDependenciesIfRequested(true, "./my-project", "npm");
 *
 * // Skip installation
 * await installDependenciesIfRequested(false, "./my-project", "npm");
 * // Logs: "Skipping dependency installation."
 * ```
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
