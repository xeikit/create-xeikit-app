import consola from 'consola';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { initializeGitIfRequested } from '../../src/utils/git';

const { promptMock, xMock } = vi.hoisted(() => ({
  promptMock: vi.fn(),
  xMock: vi.fn(),
}));

vi.mock('consola', () => ({
  default: {
    prompt: promptMock,
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('tinyexec', () => ({
  x: xMock,
}));

describe('src/utils/git.ts', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeGitIfRequested', () => {
    test('initializes git when shouldInitParam is true', async () => {
      xMock.mockResolvedValue(undefined);

      await initializeGitIfRequested(true, '/test/dir');

      expect(consola.prompt).not.toHaveBeenCalled();
      expect(consola.info).toHaveBeenCalledWith('Initializing git repository...\n');
      expect(xMock).toHaveBeenCalledTimes(1);
      expect(xMock).toHaveBeenCalledWith('git', ['init', '/test/dir'], {
        throwOnError: true,
        nodeOptions: { stdio: 'inherit' },
      });
    });

    test('does not initialize git when shouldInitParam is false', async () => {
      await initializeGitIfRequested(false, '/test/dir');

      expect(consola.prompt).not.toHaveBeenCalled();
      expect(consola.info).not.toHaveBeenCalled();
      expect(xMock).not.toHaveBeenCalled();
    });

    test('prompts user when shouldInitParam is undefined and user confirms', async () => {
      promptMock.mockResolvedValue(true);
      xMock.mockResolvedValue(undefined);

      await initializeGitIfRequested(undefined, '/test/dir');

      expect(consola.prompt).toHaveBeenCalledTimes(1);
      expect(consola.prompt).toHaveBeenCalledWith('Initialize git repository?', {
        type: 'confirm',
        cancel: 'reject',
      });
      expect(consola.info).toHaveBeenCalledWith('Initializing git repository...\n');
      expect(xMock).toHaveBeenCalledTimes(1);
      expect(xMock).toHaveBeenCalledWith('git', ['init', '/test/dir'], {
        throwOnError: true,
        nodeOptions: { stdio: 'inherit' },
      });
    });

    test('prompts user when shouldInitParam is undefined and user declines', async () => {
      promptMock.mockResolvedValue(false);

      await initializeGitIfRequested(undefined, '/test/dir');

      expect(consola.prompt).toHaveBeenCalledTimes(1);
      expect(consola.prompt).toHaveBeenCalledWith('Initialize git repository?', {
        type: 'confirm',
        cancel: 'reject',
      });
      expect(consola.info).not.toHaveBeenCalled();
      expect(xMock).not.toHaveBeenCalled();
    });

    test('exits when prompt is cancelled', async () => {
      promptMock.mockRejectedValue(new Error('Prompt cancelled'));

      await expect(async () => await initializeGitIfRequested(undefined, '/test/dir')).rejects.toThrow(
        'process.exit unexpectedly called with "1"',
      );
    });

    test('warns when git initialization fails', async () => {
      const mockError = new Error('Git command failed');
      xMock.mockRejectedValue(mockError);

      await initializeGitIfRequested(true, '/test/dir');

      expect(consola.info).toHaveBeenCalledWith('Initializing git repository...\n');
      expect(xMock).toHaveBeenCalledTimes(1);
      expect(consola.warn).toHaveBeenCalledTimes(1);
      expect(consola.warn).toHaveBeenCalledWith(`Failed to initialize git repository: ${mockError}`);
    });
  });
});
