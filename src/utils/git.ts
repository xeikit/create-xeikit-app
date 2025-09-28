import consola from 'consola';
import { x } from 'tinyexec';
import type { Result } from '../types/result';
import { Err, isOk, Ok } from '../types/result';

/**
 * Validates a git initialization parameter to ensure it's not undefined.
 * This pure function performs input validation for the git initialization workflow.
 *
 * @param shouldInitParam - The git initialization parameter to validate (optional)
 * @returns A Result containing the boolean value if valid, or an error message
 *
 * @example
 * ```typescript
 * const valid = validateGitInitParam(true);
 * // Returns: Ok(true)
 *
 * const invalid = validateGitInitParam(undefined);
 * // Returns: Err("Git initialization parameter is undefined")
 * ```
 */
export const validateGitInitParam = (shouldInitParam?: boolean): Result<boolean, string> => {
  if (shouldInitParam === undefined) {
    return Err('Git initialization parameter is undefined');
  }
  return Ok(shouldInitParam);
};

/**
 * Prompts the user to decide whether to initialize a git repository.
 * Displays a yes/no confirmation dialog to gather the user's preference.
 * Handles user cancellation gracefully by returning an error Result.
 *
 * @returns A Promise that resolves to a Result containing the user's decision or an error
 *
 * @example
 * ```typescript
 * const result = await promptForGitInitialization();
 * if (isOk(result)) {
 *   console.log(`Initialize git: ${result.data}`);
 * } else {
 *   console.error('User cancelled git initialization prompt');
 * }
 * ```
 */
export const promptForGitInitialization = async (): Promise<Result<boolean, Error>> => {
  try {
    const result = await consola.prompt('Initialize git repository?', {
      type: 'confirm',
      cancel: 'reject',
    });
    return Ok(result as boolean);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error('Git initialization prompt cancelled'));
  }
};

/**
 * Determines whether to initialize a git repository using a fallback chain.
 * First validates the provided parameter. If undefined, prompts the user for their preference.
 * This ensures the application can handle both programmatic and interactive scenarios.
 *
 * @param shouldInitParam - The git initialization preference (optional)
 * @returns A Promise that resolves to a Result containing the decision or an error
 *
 * @example
 * ```typescript
 * // With explicit preference
 * const result1 = await determineGitInitialization(true);
 * // Returns: Ok(true)
 *
 * // Without preference (will prompt user)
 * const result2 = await determineGitInitialization(undefined);
 * // Returns: user's choice from prompt
 * ```
 */
export const determineGitInitialization = async (shouldInitParam?: boolean): Promise<Result<boolean, Error>> => {
  const paramValidation = validateGitInitParam(shouldInitParam);

  if (isOk(paramValidation)) {
    return Ok(paramValidation.data);
  }

  return await promptForGitInitialization();
};

/**
 * Creates command line arguments for git init command.
 * This pure function generates the argument array needed to initialize a git repository.
 *
 * @param dir - The directory where the git repository should be initialized
 * @returns Array of command line arguments for git init
 *
 * @example
 * ```typescript
 * const args = createGitInitArgs("./my-project");
 * // Returns: ["init", "./my-project"]
 * ```
 */
export const createGitInitArgs = (dir: string): string[] => ['init', dir];

/**
 * Executes the git initialization command in the specified directory.
 * Uses the tinyexec library to run the git init command with proper error handling.
 * Returns a Result type to allow for functional error handling.
 *
 * @param dir - The directory where the git repository should be initialized
 * @returns A Promise that resolves to a Result indicating success or failure
 *
 * @example
 * ```typescript
 * const result = await executeGitInit("./my-project");
 * if (isOk(result)) {
 *   console.log("Git repository initialized successfully");
 * } else {
 *   console.error("Git init failed:", result.error.message);
 * }
 * ```
 */
export const executeGitInit = async (dir: string): Promise<Result<void, Error>> => {
  try {
    await x('git', createGitInitArgs(dir), {
      throwOnError: true,
      nodeOptions: { stdio: 'inherit' },
    });
    return Ok(undefined);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error('Git initialization failed'));
  }
};

/**
 * Conditionally initializes a git repository based on user preference.
 * This function handles the complete git initialization workflow, including user prompts,
 * command execution, and error reporting. If initialization fails, it logs a warning
 * but doesn't stop the application flow.
 *
 * @param shouldInitParam - Whether git should be initialized (undefined means prompt user)
 * @param dir - The directory where the git repository should be initialized
 *
 * @example
 * ```typescript
 * // Initialize git repository
 * await initializeGitIfRequested(true, "./my-project");
 *
 * // Skip git initialization
 * await initializeGitIfRequested(false, "./my-project");
 *
 * // Prompt user for decision
 * await initializeGitIfRequested(undefined, "./my-project");
 * ```
 */
export const initializeGitIfRequested = async (shouldInitParam: boolean | undefined, dir: string): Promise<void> => {
  const shouldInitResult = await determineGitInitialization(shouldInitParam);

  if (!isOk(shouldInitResult)) {
    // Handle prompt cancellation - exit for backward compatibility
    process.exit(1);
  }

  if (!shouldInitResult.data) {
    // User chose not to initialize git
    return;
  }

  consola.info('Initializing git repository...\n');

  const gitInitResult = await executeGitInit(dir);

  if (!isOk(gitInitResult)) {
    consola.warn(`Failed to initialize git repository: ${gitInitResult.error.message}`);
  }
};
