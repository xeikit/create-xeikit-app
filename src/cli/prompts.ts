import type { Result } from '@/types/result';
import { Err, Ok, isOk } from '@/types/result';
import consola from 'consola';

/**
 * Validates a directory argument to ensure it's not empty or just whitespace.
 * This is a pure function that doesn't perform any side effects.
 *
 * @param dirArg - The directory argument to validate
 * @returns A Result containing the trimmed directory string or an error message
 *
 * @example
 * ```typescript
 * const valid = validateDirectoryArg("./my-project");
 * // Returns: Ok("./my-project")
 *
 * const invalid = validateDirectoryArg("   ");
 * // Returns: Err("Directory argument is empty")
 * ```
 */
export const validateDirectoryArg = (dirArg: string): Result<string, string> => {
  if (!dirArg || dirArg.trim() === '') {
    return Err('Directory argument is empty');
  }
  return Ok(dirArg.trim());
};

/**
 * Creates configuration object for the project directory prompt.
 * This is a pure function that returns the prompt settings used by consola.
 *
 * @returns Configuration object with placeholder, type, default value, and cancel behavior
 *
 * @example
 * ```typescript
 * const config = createProjectDirectoryPromptConfig();
 * // Returns: { placeholder: './my-project', type: 'text', default: './my-project', cancel: 'reject' }
 * ```
 */
export const createProjectDirectoryPromptConfig = () => ({
  placeholder: './my-project',
  type: 'text' as const,
  default: './my-project',
  cancel: 'reject' as const,
});

/**
 * Prompts the user to enter a project directory using an interactive text input.
 * Uses consola's prompt functionality to gather user input with a friendly interface.
 *
 * @returns A Promise that resolves to a Result containing the user's input or an error
 *
 * @example
 * ```typescript
 * const result = await promptForProjectDirectory();
 * if (isOk(result)) {
 *   console.log(`User chose: ${result.data}`);
 * } else {
 *   console.error('User cancelled or error occurred');
 * }
 * ```
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
 * Determines the project directory using a fallback chain strategy.
 * First tries to validate the provided directory argument. If that fails,
 * prompts the user for input. This ensures the application always gets a valid directory.
 *
 * @param dirArg - The directory argument from command line or user input
 * @returns A Promise that resolves to a valid directory string
 *
 * @example
 * ```typescript
 * // With valid argument
 * const dir1 = await getProjectDirectory("./my-app");
 * // Returns: "./my-app"
 *
 * // With empty argument (will prompt user)
 * const dir2 = await getProjectDirectory("");
 * // Returns: user's input from prompt
 * ```
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
