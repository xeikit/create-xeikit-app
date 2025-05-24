import consola from 'consola';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { handleError, resolvePath, verifyDirectoryDoesNotExist } from '../../src/utils/common';

const { existsSyncMock } = vi.hoisted(() => ({
  existsSyncMock: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: existsSyncMock,
}));

vi.mock('consola', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('src/utils/common.ts', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleError', () => {
    test('logs error and exits process', () => {
      const error = new Error('Test error');

      expect(() => handleError(error)).toThrow('process.exit unexpectedly called with "1"');
      expect(consola.error).toHaveBeenCalledTimes(1);
      expect(consola.error).toHaveBeenCalledWith(error.toString());
    });
  });

  describe('verifyDirectoryDoesNotExist', () => {
    test('exists process when directory exists', () => {
      existsSyncMock.mockReturnValue(true);

      const testPath = 'test/path';

      expect(() => verifyDirectoryDoesNotExist(testPath)).toThrow('process.exit unexpectedly called with "1"');
      expect(consola.error).toHaveBeenCalledTimes(1);
      expect(consola.error).toHaveBeenCalledWith(
        `The directory ${testPath} already exists. Please choose a different directory.`,
      );
    });

    test('does noting when directory does not exist', () => {
      existsSyncMock.mockReturnValue(false);

      const testPath = 'test/path';

      expect(() => verifyDirectoryDoesNotExist(testPath)).not.toThrow();
      expect(consola.error).not.toHaveBeenCalled();
    });
  });

  describe('resolvePath', () => {
    test('resolves path correctly', () => {
      const cwd = '/current/working/directory';
      const dir = 'subdirectory';
      const result = resolvePath(cwd, dir);

      expect(result).toBe(`${cwd}/${dir}`);
    });
  });
});
