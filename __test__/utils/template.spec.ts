import consola from 'consola';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { DEFAULT_REGISTRY, TEMPLATE_OPTIONS } from '@/utils/constants';
import {
  downloadTemplateAndHandleErrors,
  downloadTemplateWithResult,
  promptForTemplate,
  selectTemplate,
  validateTemplateArg,
  validateTemplatePromptResult,
} from '@/utils/template';

const { promptMock, downloadTemplateMock } = vi.hoisted(() => ({
  promptMock: vi.fn(),
  downloadTemplateMock: vi.fn(),
}));

vi.mock('consola', () => ({
  default: {
    prompt: promptMock,
    error: vi.fn(),
  },
}));

vi.mock('giget', () => ({
  downloadTemplate: downloadTemplateMock,
}));

describe('src/utils/template.ts', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('validateTemplateArg', () => {
    test('returns success for valid template argument', () => {
      const result = validateTemplateArg('test-template');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test-template');
      }
    });

    test('returns error for empty template argument', () => {
      const result = validateTemplateArg('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('empty');
      }
    });

    test('returns error for undefined template argument', () => {
      const result = validateTemplateArg(undefined);

      expect(result.success).toBe(false);
    });
  });

  describe('validateTemplatePromptResult', () => {
    test('returns success for valid string template', () => {
      const result = validateTemplatePromptResult('nuxt4');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('nuxt4');
      }
    });

    test('returns error for non-string template', () => {
      const result = validateTemplatePromptResult(123);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Please specify a template name');
      }
    });
  });

  describe('promptForTemplate', () => {
    test('returns success result for valid prompt response', async () => {
      promptMock.mockResolvedValue('nuxt4');

      const result = await promptForTemplate();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('nuxt4');
      }
      expect(promptMock).toHaveBeenCalledWith('Choose a template', {
        type: 'select',
        options: TEMPLATE_OPTIONS,
        cancel: 'reject',
      });
    });

    test('returns error result for prompt cancellation', async () => {
      promptMock.mockRejectedValue(new Error('Prompt cancelled'));

      const result = await promptForTemplate();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('cancelled');
      }
    });
  });

  describe('downloadTemplateWithResult', () => {
    test('returns success result for successful download', async () => {
      const mockResult = { dir: '/download/path', source: 'test-template' };
      downloadTemplateMock.mockResolvedValue(mockResult);

      const result = await downloadTemplateWithResult('test-template', '/download/path');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResult);
      }
      expect(downloadTemplateMock).toHaveBeenCalledWith('test-template', {
        dir: '/download/path',
        registry: DEFAULT_REGISTRY,
      });
    });

    test('returns error result for download failure', async () => {
      const mockError = new Error('Download error');
      downloadTemplateMock.mockRejectedValue(mockError);

      const result = await downloadTemplateWithResult('test-template', '/download/path');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Download error');
      }
    });
  });

  describe('selectTemplate', () => {
    test('returns provided template argument', async () => {
      const result = await selectTemplate('test-template');

      expect(result).toBe('test-template');
      expect(consola.prompt).not.toHaveBeenCalled();
    });

    test('prompts for template when no argument provided', async () => {
      promptMock.mockResolvedValue('nuxt4');

      const result = await selectTemplate();

      expect(result).toBe('nuxt4');
      expect(consola.prompt).toHaveBeenCalledTimes(1);
      expect(consola.prompt).toHaveBeenCalledWith('Choose a template', {
        type: 'select',
        options: TEMPLATE_OPTIONS,
        cancel: 'reject',
      });
    });

    test('exits when prompt is cancelled', async () => {
      promptMock.mockRejectedValue(new Error('Prompt cancelled'));

      await expect(async () => await selectTemplate()).rejects.toThrow('process.exit unexpectedly called with "1"');
    });

    test('exits when template is invalid', async () => {
      promptMock.mockResolvedValue(undefined);

      await expect(async () => await selectTemplate()).rejects.toThrow('process.exit unexpectedly called with "1"');
      expect(consola.error).toHaveBeenCalledTimes(1);
      expect(consola.error).toHaveBeenCalledWith('Please specify a template name.');
    });
  });

  describe('downloadTemplateAndHandleErrors', () => {
    test('downloads template successfully', async () => {
      const mockResult = { dir: '/download/path', source: 'test-template' };
      downloadTemplateMock.mockResolvedValue(mockResult);

      const result = await downloadTemplateAndHandleErrors('test-template', '/download/path');

      expect(result).toEqual(mockResult);
      expect(downloadTemplateMock).toHaveBeenCalledTimes(1);
      expect(downloadTemplateMock).toHaveBeenCalledWith('test-template', {
        dir: '/download/path',
        registry: DEFAULT_REGISTRY,
      });
    });

    test('handles download error', async () => {
      const mockError = new Error('Download error');
      downloadTemplateMock.mockRejectedValue(mockError);

      await expect(
        async () => await downloadTemplateAndHandleErrors('test-template', '/download/path'),
      ).rejects.toThrow('process.exit unexpectedly called with "1"');
      expect(consola.error).toHaveBeenCalledTimes(1);
      expect(consola.error).toHaveBeenCalledWith(mockError.toString());
    });
  });
});
