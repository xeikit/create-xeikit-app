import { describe, expect, test, vi } from 'vitest';
import { getProjectDirectory } from '../../src/cli/prompts';

const { promptMock } = vi.hoisted(() => ({
  promptMock: vi.fn(),
}));

vi.mock('consola', () => ({
  default: {
    prompt: promptMock,
  },
}));

describe('src/cli/command.ts', () => {
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
