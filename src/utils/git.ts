import consola from 'consola';
import { x } from 'tinyexec';
import type { Result } from '../types/result';
import { Err, Ok, isOk } from '../types/result';

/**
 * Pure function to validate git initialization parameter
 */
export const validateGitInitParam = (shouldInitParam?: boolean): Result<boolean, string> => {
  if (shouldInitParam === undefined) {
    return Err('Git initialization parameter is undefined');
  }
  return Ok(shouldInitParam);
};

/**
 * Async function to prompt for git initialization
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
 * Functional git initialization decision with fallback chain
 */
export const determineGitInitialization = async (shouldInitParam?: boolean): Promise<Result<boolean, Error>> => {
  const paramValidation = validateGitInitParam(shouldInitParam);

  if (isOk(paramValidation)) {
    return Ok(paramValidation.data);
  }

  return await promptForGitInitialization();
};

/**
 * Pure function to create git init command arguments
 */
export const createGitInitArgs = (dir: string): string[] => ['init', dir];

/**
 * Async function to execute git initialization
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
 * Functional git initialization with proper error handling
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
