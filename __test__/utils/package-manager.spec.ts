import { isErr, isOk } from '@/types/result';
import {
  confirmDependenciesInstallation,
  createInstallationConfig,
  createPackageManagerSelectOptions,
  detectCurrentPackageManager,
  installDependenciesIfRequested,
  installDependenciesWithResult,
  parsePackageManagerFromUserAgent,
  selectPackageManager,
  validateInstallationPromptResult,
  validatePackageManagerArg,
} from '@/utils/package-manager';
import consola from 'consola';
import { installDependencies } from 'nypm';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { promptMock, installDependenciesMock } = vi.hoisted(() => ({
  promptMock: vi.fn(),
  installDependenciesMock: vi.fn(),
}));

vi.mock('consola', () => ({
  default: {
    info: vi.fn(),
    start: vi.fn(),
    prompt: promptMock,
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('nypm', () => ({
  installDependencies: installDependenciesMock,
}));

vi.mock('@/utils/common', () => ({
  handleError: vi.fn((error) => {
    throw error;
  }),
}));

const DEFAULT_USER_AGENT = 'pnpm/10.11.0 npm/? node/v22.15.1 darwin arm64';

describe('src/utils/package-manager.ts', () => {
  beforeEach(() => {
    process.env.npm_config_user_agent = DEFAULT_USER_AGENT;
    vi.clearAllMocks();
  });

  describe('detectCurrentPackageManager', () => {
    test('returns undefined if no user agent is set', () => {
      process.env.npm_config_user_agent = undefined;
      expect(detectCurrentPackageManager()).toBe(undefined);
    });

    test('detects npm from user agent', () => {
      process.env.npm_config_user_agent = 'npm/10.9.2';
      expect(detectCurrentPackageManager()).toBe('npm');
    });

    test('detects yarn from user agent', () => {
      process.env.npm_config_user_agent = 'yarn/1.22.19';
      expect(detectCurrentPackageManager()).toBe('yarn');
    });

    test('detects pnpm from user agent', () => {
      process.env.npm_config_user_agent = 'pnpm/10.11.0';
      expect(detectCurrentPackageManager()).toBe('pnpm');
    });

    test('detects bun from user agent', () => {
      process.env.npm_config_user_agent = 'bun/1.2.14';
      expect(detectCurrentPackageManager()).toBe('bun');
    });

    test('detects deno from user agent', () => {
      process.env.npm_config_user_agent = 'deno/2.3.3';
      expect(detectCurrentPackageManager()).toBe('deno');
    });

    test('returns undefined for unknown package manager', () => {
      process.env.npm_config_user_agent = 'unknown/1.0.0';
      expect(detectCurrentPackageManager()).toBe(undefined);
    });
  });

  describe('confirmDependenciesInstallation', () => {
    test('return true when user confirms', async () => {
      promptMock.mockResolvedValue(true);

      const result = await confirmDependenciesInstallation(true);

      expect(result).toBe(true);
    });

    test('exits on prompt rejection', async () => {
      promptMock.mockRejectedValue(new Error('Prompt cancelled'));

      await expect(confirmDependenciesInstallation(true)).rejects.toThrow('process.exit unexpectedly called with "1"');
    });

    test('returns false when user declines', async () => {
      promptMock.mockResolvedValue(false);

      const result = await confirmDependenciesInstallation(false);

      expect(result).toBe(false);
      expect(promptMock).toHaveBeenCalledWith(
        'Do you want to install dependencies?',
        expect.objectContaining({
          initial: false,
        }),
      );
    });

    test('exits when prompt returns non-boolean value', async () => {
      promptMock.mockResolvedValue('invalid response');

      await expect(confirmDependenciesInstallation(true)).rejects.toThrow('process.exit unexpectedly called with "1"');
      expect(consola.error).toHaveBeenCalledWith('Please specify whether to install dependencies.');
    });
  });

  describe('installDependenciesIfRequested', () => {
    test('skips installation when shouldInstall is false', async () => {
      await installDependenciesIfRequested(false, 'test/path', 'npm');

      expect(consola.info).toHaveBeenCalledWith('Skipping dependency installation.');
      expect(installDependencies).not.toHaveBeenCalled();
    });

    test('installs dependencies when requested', async () => {
      await installDependenciesIfRequested(true, 'test/path', 'pnpm');

      expect(consola.start).toHaveBeenCalledWith('Installing dependencies...');
      expect(installDependencies).toHaveBeenCalledTimes(1);
      expect(installDependencies).toHaveBeenCalledWith({
        cwd: 'test/path',
        packageManager: {
          command: 'pnpm',
          name: 'pnpm',
        },
      });
      expect(consola.success).toHaveBeenCalledWith('Installation completed.');
    });
  });

  describe('selectPackageManager', () => {
    test('returns package manager from argument if valid', async () => {
      const result = await selectPackageManager('pnpm');

      expect(result).toBe('pnpm');
      expect(promptMock).not.toHaveBeenCalled();
    });

    test('prompts for package manager when argument is no provided', async () => {
      process.env.npm_config_user_agent = 'pnpm/10.11.0';
      promptMock.mockResolvedValue('npm');

      const result = await selectPackageManager();

      expect(result).toBe('npm');
      expect(promptMock).toHaveBeenCalledWith(
        'Which package manager would you like to use?',
        expect.objectContaining({
          type: 'select',
          initial: 'pnpm',
        }),
      );
    });

    test('uses initial value as current package manager', async () => {
      process.env.npm_config_user_agent = 'npm/10.9.0';
      promptMock.mockResolvedValue('yarn');

      await selectPackageManager();

      expect(promptMock).toHaveBeenCalledWith(
        'Which package manager would you like to use?',
        expect.objectContaining({
          initial: 'npm',
        }),
      );
    });

    test('exits when prompt is cancelled', async () => {
      promptMock.mockRejectedValue(new Error('Prompt cancelled'));

      await expect(selectPackageManager()).rejects.toThrow('process.exit unexpectedly called with "1"');
    });
  });

  describe('parsePackageManagerFromUserAgent', () => {
    test('parses npm from user agent string', () => {
      expect(parsePackageManagerFromUserAgent('npm/10.9.2')).toBe('npm');
    });

    test('parses yarn from user agent string', () => {
      expect(parsePackageManagerFromUserAgent('yarn/1.22.19')).toBe('yarn');
    });

    test('parses pnpm from user agent string', () => {
      expect(parsePackageManagerFromUserAgent('pnpm/10.11.0')).toBe('pnpm');
    });

    test('parses bun from user agent string', () => {
      expect(parsePackageManagerFromUserAgent('bun/1.2.14')).toBe('bun');
    });

    test('parses deno from user agent string', () => {
      expect(parsePackageManagerFromUserAgent('deno/2.3.3')).toBe('deno');
    });

    test('returns undefined for unknown package manager', () => {
      expect(parsePackageManagerFromUserAgent('unknown/1.0.0')).toBe(undefined);
    });
  });

  describe('validatePackageManagerArg', () => {
    test('returns error for empty argument', () => {
      const result = validatePackageManagerArg();
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('Package manager argument is empty');
      }
    });

    test('returns error for invalid package manager', () => {
      const result = validatePackageManagerArg('invalid');
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('Invalid package manager: invalid');
      }
    });

    test('returns success for valid package manager', () => {
      const result = validatePackageManagerArg('npm');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe('npm');
      }
    });
  });

  describe('createPackageManagerSelectOptions', () => {
    test('creates options without current package manager', () => {
      const options = createPackageManagerSelectOptions();
      expect(options).toHaveLength(5);
      expect(options[0]).toEqual({ label: 'npm', value: 'npm', hint: undefined });
    });

    test('creates options with current package manager hint', () => {
      const options = createPackageManagerSelectOptions('pnpm');
      const pnpmOption = options.find((option) => typeof option === 'object' && option.value === 'pnpm');
      expect(pnpmOption && typeof pnpmOption === 'object' ? pnpmOption.hint : undefined).toBe('current');
    });
  });

  describe('validateInstallationPromptResult', () => {
    test('returns success for boolean true', () => {
      const result = validateInstallationPromptResult(true);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(true);
      }
    });

    test('returns success for boolean false', () => {
      const result = validateInstallationPromptResult(false);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(false);
      }
    });

    test('returns error for non-boolean value', () => {
      const result = validateInstallationPromptResult('yes');
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('Please specify whether to install dependencies.');
      }
    });
  });

  describe('createInstallationConfig', () => {
    test('creates correct installation configuration', () => {
      const config = createInstallationConfig('/test/dir', 'npm');
      expect(config).toEqual({
        cwd: '/test/dir',
        packageManager: {
          name: 'npm',
          command: 'npm',
        },
      });
    });
  });

  describe('installDependenciesWithResult', () => {
    test('returns success on successful installation', async () => {
      installDependenciesMock.mockResolvedValue(undefined);

      const result = await installDependenciesWithResult('/test/dir', 'npm');
      expect(isOk(result)).toBe(true);
    });

    test('returns error on installation failure', async () => {
      const error = new Error('Installation failed');
      installDependenciesMock.mockRejectedValue(error);

      const result = await installDependenciesWithResult('/test/dir', 'npm');
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe(error);
      }
    });
  });
});
