import { afterEach, describe, expect, test, vi } from 'vitest';
import { handleError, resolvePath, verifyDirectoryDoesNotExist } from '../../src/utils/common';

const { existsSyncMock, consolaErrorMock } = vi.hoisted(() => ({
  existsSyncMock: vi.fn(),
  consolaErrorMock: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: existsSyncMock,
}));

vi.mock('consola', () => ({
  default: {
    error: consolaErrorMock,
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
      expect(consolaErrorMock).toHaveBeenCalledTimes(1);
      expect(consolaErrorMock).toHaveBeenCalledWith(error.toString());
    });
  });

  describe('verifyDirectoryDoesNotExist', () => {
    test('exits process when directory exists', () => {
      existsSyncMock.mockReturnValue(true);

      const testPath = 'test/path';

      expect(() => verifyDirectoryDoesNotExist(testPath)).toThrow('process.exit unexpectedly called with "1"');
      expect(consolaErrorMock).toHaveBeenCalledTimes(1);

      // Verify the error message contains the expected text, ignoring color formatting
      const errorMessage = consolaErrorMock.mock.calls[0][0];
      expect(errorMessage).toContain('The directory');
      expect(errorMessage).toContain(testPath);
      expect(errorMessage).toContain('already exists. Please choose a different directory.');
    });

    test('does nothing when directory does not exist', () => {
      existsSyncMock.mockReturnValue(false);

      const testPath = 'test/path';

      expect(() => verifyDirectoryDoesNotExist(testPath)).not.toThrow();
      expect(consolaErrorMock).not.toHaveBeenCalled();
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
