import consola from 'consola';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { isErr, isOk } from '../../src/types/result';
import {
  createGitInitArgs,
  determineGitInitialization,
  executeGitInit,
  initializeGitIfRequested,
  promptForGitInitialization,
  validateGitInitParam,
} from '../../src/utils/git';

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

  describe('validateGitInitParam', () => {
    test('returns success for true parameter', () => {
      const result = validateGitInitParam(true);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(true);
      }
    });

    test('returns success for false parameter', () => {
      const result = validateGitInitParam(false);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(false);
      }
    });

    test('returns error for undefined parameter', () => {
      const result = validateGitInitParam(undefined);
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('Git initialization parameter is undefined');
      }
    });
  });

  describe('promptForGitInitialization', () => {
    test('returns confirmation result on success', async () => {
      promptMock.mockResolvedValue(true);

      const result = await promptForGitInitialization();
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(true);
      }
    });

    test('returns false when user declines', async () => {
      promptMock.mockResolvedValue(false);

      const result = await promptForGitInitialization();
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(false);
      }
    });

    test('returns error on prompt cancellation', async () => {
      promptMock.mockRejectedValue(new Error('Cancelled'));

      const result = await promptForGitInitialization();
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('Cancelled');
      }
    });
  });

  describe('determineGitInitialization', () => {
    test('returns parameter value when valid', async () => {
      const result = await determineGitInitialization(true);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(true);
      }
      expect(promptMock).not.toHaveBeenCalled();
    });

    test('prompts when parameter is undefined', async () => {
      promptMock.mockResolvedValue(false);

      const result = await determineGitInitialization(undefined);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(false);
      }
      expect(promptMock).toHaveBeenCalled();
    });
  });

  describe('createGitInitArgs', () => {
    test('creates correct git init arguments', () => {
      const args = createGitInitArgs('/test/dir');
      expect(args).toEqual(['init', '/test/dir']);
    });
  });

  describe('executeGitInit', () => {
    test('returns success on successful git init', async () => {
      xMock.mockResolvedValue(undefined);

      const result = await executeGitInit('/test/dir');
      expect(isOk(result)).toBe(true);
      expect(xMock).toHaveBeenCalledWith('git', ['init', '/test/dir'], {
        throwOnError: true,
        nodeOptions: { stdio: 'inherit' },
      });
    });

    test('returns error on git init failure', async () => {
      const error = new Error('Git init failed');
      xMock.mockRejectedValue(error);

      const result = await executeGitInit('/test/dir');
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('initializeGitIfRequested', () => {
    test('initializes git when shouldInitParam is true', async () => {
      xMock.mockResolvedValue(undefined);

      await initializeGitIfRequested(true, '/test/dir');

      expect(promptMock).not.toHaveBeenCalled();
      expect(consola.info).toHaveBeenCalledWith('Initializing git repository...\n');
      expect(xMock).toHaveBeenCalledTimes(1);
      expect(xMock).toHaveBeenCalledWith('git', ['init', '/test/dir'], {
        throwOnError: true,
        nodeOptions: { stdio: 'inherit' },
      });
    });

    test('does not initialize git when shouldInitParam is false', async () => {
      await initializeGitIfRequested(false, '/test/dir');

      expect(promptMock).not.toHaveBeenCalled();
      expect(consola.info).not.toHaveBeenCalled();
      expect(xMock).not.toHaveBeenCalled();
    });

    test('prompts user when shouldInitParam is undefined and user confirms', async () => {
      promptMock.mockResolvedValue(true);
      xMock.mockResolvedValue(undefined);

      await initializeGitIfRequested(undefined, '/test/dir');

      expect(promptMock).toHaveBeenCalledWith('Initialize git repository?', {
        type: 'confirm',
        cancel: 'reject',
      });
      expect(consola.info).toHaveBeenCalledWith('Initializing git repository...\n');
      expect(xMock).toHaveBeenCalledWith('git', ['init', '/test/dir'], {
        throwOnError: true,
        nodeOptions: { stdio: 'inherit' },
      });
    });

    test('prompts user when shouldInitParam is undefined and user declines', async () => {
      promptMock.mockResolvedValue(false);

      await initializeGitIfRequested(undefined, '/test/dir');

      expect(promptMock).toHaveBeenCalledWith('Initialize git repository?', {
        type: 'confirm',
        cancel: 'reject',
      });
      expect(consola.info).not.toHaveBeenCalled();
      expect(xMock).not.toHaveBeenCalled();
    });

    test('handles git initialization errors gracefully', async () => {
      const error = new Error('Git not found');
      xMock.mockRejectedValue(error);

      await initializeGitIfRequested(true, '/test/dir');

      expect(consola.warn).toHaveBeenCalledWith('Failed to initialize git repository: Git not found');
    });

    test('exits when prompt is cancelled', async () => {
      promptMock.mockRejectedValue(new Error('Prompt cancelled'));

      await expect(initializeGitIfRequested(undefined, '/test/dir')).rejects.toThrow(
        'process.exit unexpectedly called with "1"',
      );
    });
  });
});
