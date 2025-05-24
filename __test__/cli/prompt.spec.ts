import { describe, expect, test, vi } from 'vitest';
import {
  createProjectDirectoryPromptConfig,
  getProjectDirectory,
  promptForProjectDirectory,
  validateDirectoryArg,
} from '../../src/cli/prompts';

const { promptMock } = vi.hoisted(() => ({
  promptMock: vi.fn(),
}));

vi.mock('consola', () => ({
  default: {
    prompt: promptMock,
  },
}));

describe('src/cli/prompts.ts', () => {
  describe('validateDirectoryArg', () => {
    test('returns success for valid directory argument', () => {
      const result = validateDirectoryArg('my-project');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('my-project');
      }
    });

    test('trims whitespace from directory argument', () => {
      const result = validateDirectoryArg('  my-project  ');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('my-project');
      }
    });

    test('returns error for empty directory argument', () => {
      const result = validateDirectoryArg('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('empty');
      }
    });

    test('returns error for whitespace-only directory argument', () => {
      const result = validateDirectoryArg('   ');

      expect(result.success).toBe(false);
    });
  });

  describe('createProjectDirectoryPromptConfig', () => {
    test('creates correct prompt configuration', () => {
      const config = createProjectDirectoryPromptConfig();

      expect(config).toEqual({
        placeholder: './my-project',
        type: 'text',
        default: './my-project',
        cancel: 'reject',
      });
    });
  });

  describe('promptForProjectDirectory', () => {
    test('returns success result for valid prompt response', async () => {
      promptMock.mockResolvedValue('my-project');

      const result = await promptForProjectDirectory();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('my-project');
      }
      expect(promptMock).toHaveBeenCalledWith(
        'Where would you like to create your project?',
        expect.objectContaining({
          type: 'text',
          placeholder: './my-project',
        }),
      );
    });

    test('returns error result for prompt cancellation', async () => {
      promptMock.mockRejectedValue(new Error('Prompt cancelled'));

      const result = await promptForProjectDirectory();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('cancelled');
      }
    });
  });

  describe('getProjectDirectory', () => {
    test('should return provided directory name', async () => {
      const result = await getProjectDirectory('my-project');
      expect(result).toBe('my-project');
    });

    test('should prompt for directory name if not provided', async () => {
      promptMock.mockResolvedValue('my-project');

      const result = await getProjectDirectory('');

      expect(result).toBe('my-project');
      expect(promptMock).toHaveBeenCalledWith('Where would you like to create your project?', {
        placeholder: './my-project',
        type: 'text',
        default: './my-project',
        cancel: 'reject',
      });
    });

    test('should exit process on prompt rejection', async () => {
      promptMock.mockRejectedValue(new Error('Prompt rejected'));

      await expect(getProjectDirectory('')).rejects.toThrow('process.exit unexpectedly called with "1"');
    });
  });
});
