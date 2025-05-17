import consola from 'consola';
import { type DownloadTemplateResult, downloadTemplate } from 'giget';
import { handleError } from './common';
import { DEFAULT_REGISTRY, DEFAULT_TEMPLATE_NAME, TEMPLATE_OPTIONS } from './constants';

export const selectTemplate = async (templateArg?: string): Promise<string> => {
  if (templateArg) {
    return templateArg;
  }

  const template = await consola
    .prompt('Choose a template', { type: 'select', options: TEMPLATE_OPTIONS, cancel: 'reject' })
    .catch(() => process.exit(1));

  if (typeof template !== 'string') {
    consola.error('Please specify a template name.');
    process.exit(1);
  }

  return template || DEFAULT_TEMPLATE_NAME;
};

export const downloadTemplateAndHandleErrors = async (
  templateName: string,
  downloadPath: string,
): Promise<DownloadTemplateResult> => {
  try {
    return await downloadTemplate(templateName, { dir: downloadPath, registry: DEFAULT_REGISTRY });
  } catch (error) {
    return handleError(error as Error);
  }
};
