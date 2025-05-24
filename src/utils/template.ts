import consola from 'consola';
import { type DownloadTemplateResult, downloadTemplate } from 'giget';
import type { Result } from '../types/result';
import { Err, Ok, isOk } from '../types/result';
import { handleError } from './common';
import { DEFAULT_REGISTRY, DEFAULT_TEMPLATE_NAME, TEMPLATE_OPTIONS } from './constants';

/**
 * Pure function to validate template name
 */
export const validateTemplateArg = (templateArg?: string): Result<string, string> => {
  if (!templateArg || templateArg.trim() === '') {
    return Err('Template argument is empty or undefined');
  }
  return Ok(templateArg);
};

/**
 * Pure function to validate template prompt result
 */
export const validateTemplatePromptResult = (template: unknown): Result<string, string> => {
  if (typeof template !== 'string') {
    return Err('Please specify a template name.');
  }
  return Ok(template || DEFAULT_TEMPLATE_NAME);
};

/**
 * Async function to prompt for template selection
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
 * Functional template selection with fallback chain
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
 * Functional template download with Result type
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
 * Backward compatible template download function
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
