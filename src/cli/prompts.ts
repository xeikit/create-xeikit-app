import consola from 'consola';
import type { Result } from '../types/result';
import { Err, Ok, isOk } from '../types/result';

/**
 * Pure function to validate directory argument
 */
export const validateDirectoryArg = (dirArg: string): Result<string, string> => {
  if (!dirArg || dirArg.trim() === '') {
    return Err('Directory argument is empty');
  }
  return Ok(dirArg.trim());
};

/**
 * Pure function to create project directory prompt configuration
 */
export const createProjectDirectoryPromptConfig = () => ({
  placeholder: './my-project',
  type: 'text' as const,
  default: './my-project',
  cancel: 'reject' as const,
});

/**
 * Async function to prompt for project directory
 */
export const promptForProjectDirectory = async (): Promise<Result<string, Error>> => {
  try {
    const result = await consola.prompt(
      'Where would you like to create your project?',
      createProjectDirectoryPromptConfig(),
    );
    return Ok(result as string);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error('Project directory prompt cancelled'));
  }
};

/**
 * Functional project directory selection with fallback chain
 */
export const getProjectDirectory = async (dirArg: string): Promise<string> => {
  const argValidation = validateDirectoryArg(dirArg);

  if (isOk(argValidation)) {
    return argValidation.data;
  }

  const promptResult = await promptForProjectDirectory();

  if (isOk(promptResult)) {
    return promptResult.data;
  }

  // Handle error case - exit for backward compatibility
  process.exit(1);
};
