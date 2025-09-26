import consola from 'consola';
import { type DownloadTemplateResult, downloadTemplate } from 'giget';
import type { Result } from '../types/result';
import { Err, Ok, isOk } from '../types/result';
import { handleError } from './common';
import { DEFAULT_REGISTRY, DEFAULT_TEMPLATE_NAME, TEMPLATE_OPTIONS } from './constants';

/**
 * Validates a template argument to ensure it's not empty or undefined.
 * This is a pure function that performs input validation without side effects.
 *
 * @param templateArg - The template argument to validate (can be undefined)
 * @returns A Result containing the template name if valid, or an error message
 *
 * @example
 * ```typescript
 * const valid = validateTemplateArg("nuxt4");
 * // Returns: Ok("nuxt4")
 *
 * const invalid = validateTemplateArg("");
 * // Returns: Err("Template argument is empty or undefined")
 * ```
 */
export const validateTemplateArg = (templateArg?: string): Result<string, string> => {
  if (!templateArg || templateArg.trim() === '') {
    return Err('Template argument is empty or undefined');
  }
  return Ok(templateArg);
};

/**
 * Validates the result from a template selection prompt.
 * Ensures the user provided a valid string response and falls back to default if needed.
 *
 * @param template - The raw response from the user prompt (can be any type)
 * @returns A Result containing a valid template name or an error message
 *
 * @example
 * ```typescript
 * const valid = validateTemplatePromptResult("react-router");
 * // Returns: Ok("react-router")
 *
 * const fallback = validateTemplatePromptResult("");
 * // Returns: Ok("nuxt4") - falls back to default
 *
 * const invalid = validateTemplatePromptResult(null);
 * // Returns: Err("Please specify a template name.")
 * ```
 */
export const validateTemplatePromptResult = (template: unknown): Result<string, string> => {
  if (typeof template !== 'string') {
    return Err('Please specify a template name.');
  }
  return Ok(template || DEFAULT_TEMPLATE_NAME);
};

/**
 * Prompts the user to select a template from available options.
 * Displays a select menu with predefined template choices and handles user cancellation.
 *
 * @returns A Promise that resolves to a Result containing the selected template or an error
 *
 * @example
 * ```typescript
 * const result = await promptForTemplate();
 * if (isOk(result)) {
 *   console.log(`User selected: ${result.data}`);
 * } else {
 *   console.error('User cancelled template selection');
 * }
 * ```
 */
export const promptForTemplate = async (): Promise<Result<string, Error>> => {
  try {
    const template = await consola.prompt('Choose a template', {
      type: 'select',
      options: TEMPLATE_OPTIONS,
      cancel: 'reject',
    });
    const validationResult = validateTemplatePromptResult(template);
    if (isOk(validationResult)) {
      return validationResult;
    }
    return Err(new Error(validationResult.error));
  } catch (error) {
    return Err(error instanceof Error ? error : new Error('Template selection cancelled'));
  }
};

/**
 * Selects a template using a fallback chain strategy.
 * First validates the provided template argument. If invalid, prompts the user for selection.
 * Ensures the application always gets a valid template choice.
 *
 * @param templateArg - The template argument from command line (optional)
 * @returns A Promise that resolves to a valid template name
 *
 * @example
 * ```typescript
 * // With valid argument
 * const template1 = await selectTemplate("nuxt4");
 * // Returns: "nuxt4"
 *
 * // With invalid argument (will prompt user)
 * const template2 = await selectTemplate("");
 * // Returns: user's selection from prompt
 * ```
 */
export const selectTemplate = async (templateArg?: string): Promise<string> => {
  const argValidation = validateTemplateArg(templateArg);

  if (isOk(argValidation)) {
    return argValidation.data;
  }

  const promptResult = await promptForTemplate();

  if (isOk(promptResult)) {
    return promptResult.data;
  }

  // Handle error case - exit for backward compatibility
  consola.error(promptResult.error.message || 'Template selection cancelled');
  process.exit(1);
};

/**
 * Downloads a template from the registry to a specified directory.
 * Uses the giget library to fetch templates and returns a Result for functional error handling.
 *
 * @param templateName - The name of the template to download
 * @param downloadPath - The local path where the template should be downloaded
 * @returns A Promise that resolves to a Result containing download info or an error
 *
 * @example
 * ```typescript
 * const result = await downloadTemplateWithResult("nuxt4", "./my-project");
 * if (isOk(result)) {
 *   console.log(`Downloaded to: ${result.data.dir}`);
 * } else {
 *   console.error('Download failed:', result.error.message);
 * }
 * ```
 */
export const downloadTemplateWithResult = async (
  templateName: string,
  downloadPath: string,
): Promise<Result<DownloadTemplateResult, Error>> => {
  try {
    const result = await downloadTemplate(templateName, {
      dir: downloadPath,
      registry: DEFAULT_REGISTRY,
    });
    return Ok(result);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error('Template download failed'));
  }
};

/**
 * Downloads a template and handles errors by exiting the process.
 * This is a backward-compatible wrapper around downloadTemplateWithResult.
 * If download fails, it logs the error and exits the application.
 *
 * @param templateName - The name of the template to download
 * @param downloadPath - The local path where the template should be downloaded
 * @returns A Promise that resolves to download result (never returns on error)
 *
 * @example
 * ```typescript
 * const result = await downloadTemplateAndHandleErrors("nuxt4", "./my-project");
 * console.log(`Template downloaded to: ${result.dir}`);
 * // If download fails, this line won't execute (process exits)
 * ```
 */
export const downloadTemplateAndHandleErrors = async (
  templateName: string,
  downloadPath: string,
): Promise<DownloadTemplateResult> => {
  const result = await downloadTemplateWithResult(templateName, downloadPath);

  if (isOk(result)) {
    return result.data;
  }

  return handleError(result.error);
};
