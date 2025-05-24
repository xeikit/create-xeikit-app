import consola from 'consola';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { TEMPLATE_OPTIONS } from '../../src/utils/constants';
import { DEFAULT_REGISTRY } from '../../src/utils/constants';
import { downloadTemplateAndHandleErrors, selectTemplate } from '../../src/utils/template';

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

  describe('selectTemplate', () => {
    test('returns provided template argument', async () => {
      const result = await selectTemplate('test-template');

      expect(result).toBe('test-template');
      expect(consola.prompt).not.toHaveBeenCalled();
    });

    test('prompts for template when no argument provided', async () => {
      promptMock.mockResolvedValue('nuxt3');

      const result = await selectTemplate();

      expect(result).toBe('nuxt3');
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
