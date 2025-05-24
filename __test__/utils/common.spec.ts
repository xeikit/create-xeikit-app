import {
  checkDirectoryExists,
  createDirectoryExistsMessage,
  handleError,
  resolvePath,
  validateDirectoryDoesNotExist,
  verifyDirectoryDoesNotExist,
} from '@/utils/common';
import { afterEach, describe, expect, test, vi } from 'vitest';

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

  describe('createDirectoryExistsMessage', () => {
    test('creates correct error message with relative path', () => {
      const testPath = 'test/path';
      const result = createDirectoryExistsMessage(testPath);

      expect(result).toContain('The directory');
      expect(result).toContain(testPath);
      expect(result).toContain('already exists. Please choose a different directory.');
    });
  });

  describe('checkDirectoryExists', () => {
    test('returns true when directory exists', () => {
      existsSyncMock.mockReturnValue(true);

      const result = checkDirectoryExists('test/path');

      expect(result).toBe(true);
      expect(existsSyncMock).toHaveBeenCalledWith('test/path');
    });

    test('returns false when directory does not exist', () => {
      existsSyncMock.mockReturnValue(false);

      const result = checkDirectoryExists('test/path');

      expect(result).toBe(false);
      expect(existsSyncMock).toHaveBeenCalledWith('test/path');
    });
  });

  describe('validateDirectoryDoesNotExist', () => {
    test('returns error result when directory exists', () => {
      existsSyncMock.mockReturnValue(true);

      const testPath = 'test/path';
      const result = validateDirectoryDoesNotExist(testPath);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('already exists');
      }
    });

    test('returns success result when directory does not exist', () => {
      existsSyncMock.mockReturnValue(false);

      const testPath = 'test/path';
      const result = validateDirectoryDoesNotExist(testPath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(testPath);
      }
    });
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
      const errorMessage = consolaErrorMock.mock.calls[0]?.[0];
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
