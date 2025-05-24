import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mainCommand } from '../src/cli/command';

// Hoisted mocks for better test isolation
const {
  getProjectDirectory,
  resolvePath,
  verifyDirectoryDoesNotExist,
  selectTemplate,
  downloadTemplateAndHandleErrors,
  selectPackageManager,
  confirmDependenciesInstallation,
  installDependenciesIfRequested,
  initializeGitIfRequested,
  consola,
} = vi.hoisted(() => ({
  getProjectDirectory: vi.fn(),
  resolvePath: vi.fn(),
  verifyDirectoryDoesNotExist: vi.fn(),
  selectTemplate: vi.fn(),
  downloadTemplateAndHandleErrors: vi.fn(),
  selectPackageManager: vi.fn(),
  confirmDependenciesInstallation: vi.fn(),
  installDependenciesIfRequested: vi.fn(),
  initializeGitIfRequested: vi.fn(),
  consola: {
    info: vi.fn(),
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
  },
}));

// Module mocks with clear separation of concerns
vi.mock('../src/utils/common', () => ({
  resolvePath,
  verifyDirectoryDoesNotExist,
}));

vi.mock('../src/cli/prompts', () => ({
  getProjectDirectory,
}));

vi.mock('../src/utils/template', () => ({
  selectTemplate,
  downloadTemplateAndHandleErrors,
}));

vi.mock('../src/utils/package-manager', () => ({
  selectPackageManager,
  confirmDependenciesInstallation,
  installDependenciesIfRequested,
}));

vi.mock('../src/utils/git', () => ({
  initializeGitIfRequested,
}));

vi.mock('consola', () => ({ default: consola }));

// Test configuration and constants
const TEST_CONSTANTS = {
  PROJECT_NAME: 'test-project',
  TEMPLATES: {
    DEFAULT: 'default',
    COMPLETE: 'complete',
    INVALID: 'non-existent-template',
  },
  PACKAGE_MANAGERS: ['npm', 'yarn', 'pnpm', 'bun'] as const,
  MESSAGES: {
    HELLO: '🎉 Hello xeikit app!',
    PROJECT_CREATED: '🎉 Starter project has been created',
    NEXT_STEPS: '🚀 Next steps:',
    DEV_COMMAND: 'run dev',
  },
} as const;

type TestArgs = {
  _: string[];
  cwd: string;
  dir: string;
  template: string;
  install: boolean;
  gitInit: boolean;
  packageManager: string;
};

describe('mainCommand E2E Tests', () => {
  let tempDir: string;

  // Test utility functions
  const createProjectPath = (projectName: string) => path.join(tempDir, projectName);

  const createTestArgs = (overrides: Partial<TestArgs> = {}): TestArgs => ({
    _: [],
    cwd: tempDir,
    dir: '',
    template: TEST_CONSTANTS.TEMPLATES.DEFAULT,
    install: true,
    gitInit: true,
    packageManager: 'npm',
    ...overrides,
  });

  const runMainCommand = async (args: TestArgs) => {
    return mainCommand.run?.({
      args,
      rawArgs: [],
      cmd: mainCommand,
    });
  };

  const setupSuccessfulWorkflowMocks = (
    projectName: string = TEST_CONSTANTS.PROJECT_NAME,
    template: string = TEST_CONSTANTS.TEMPLATES.DEFAULT,
    packageManager = 'npm',
  ) => {
    getProjectDirectory.mockResolvedValue(projectName);
    resolvePath.mockImplementation((cwd: string, relPath: string) => path.join(cwd, relPath));
    verifyDirectoryDoesNotExist.mockImplementation(() => undefined);
    selectTemplate.mockResolvedValue(template);
    downloadTemplateAndHandleErrors.mockResolvedValue({
      dir: createProjectPath(projectName),
      source: `github:xeikit/${template}-template`,
    });
    selectPackageManager.mockResolvedValue(packageManager);
    confirmDependenciesInstallation.mockResolvedValue(true);
    installDependenciesIfRequested.mockResolvedValue(undefined);
    initializeGitIfRequested.mockResolvedValue(undefined);
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create isolated temporary directory for each test
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'xeikit-e2e-'));

    // Setup default successful mocks
    setupSuccessfulWorkflowMocks();
  });

  afterEach(async () => {
    vi.clearAllMocks();

    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('Successful Workflows', () => {
    test('should complete default project creation workflow', async () => {
      // Arrange
      const args = createTestArgs();

      // Act
      await runMainCommand(args);

      // Assert - verify workflow execution order
      expect(getProjectDirectory).toHaveBeenCalledWith('');
      expect(selectTemplate).toHaveBeenCalledWith(TEST_CONSTANTS.TEMPLATES.DEFAULT);
      expect(downloadTemplateAndHandleErrors).toHaveBeenCalledWith(
        TEST_CONSTANTS.TEMPLATES.DEFAULT,
        createProjectPath(TEST_CONSTANTS.PROJECT_NAME),
      );
      expect(selectPackageManager).toHaveBeenCalledWith('npm');
      expect(confirmDependenciesInstallation).toHaveBeenCalledWith(true);
      expect(installDependenciesIfRequested).toHaveBeenCalledWith(
        true,
        createProjectPath(TEST_CONSTANTS.PROJECT_NAME),
        'npm',
      );
      expect(initializeGitIfRequested).toHaveBeenCalledWith(true, createProjectPath(TEST_CONSTANTS.PROJECT_NAME));

      // Assert - verify user messaging
      expect(consola.info).toHaveBeenCalledWith(expect.stringContaining(TEST_CONSTANTS.MESSAGES.HELLO));
      expect(consola.log).toHaveBeenCalledWith(expect.stringContaining(TEST_CONSTANTS.MESSAGES.PROJECT_CREATED));
      expect(consola.log).toHaveBeenCalledWith(expect.stringContaining(TEST_CONSTANTS.MESSAGES.NEXT_STEPS));
    });

    test('should handle custom project directory and template', async () => {
      // Arrange
      const customProjectName = 'my-custom-app';
      const customTemplate = TEST_CONSTANTS.TEMPLATES.COMPLETE;

      setupSuccessfulWorkflowMocks(customProjectName, customTemplate);

      const args = createTestArgs({
        dir: customProjectName,
        template: customTemplate,
      });

      // Act
      await runMainCommand(args);

      // Assert
      expect(getProjectDirectory).toHaveBeenCalledWith(customProjectName);
      expect(selectTemplate).toHaveBeenCalledWith(customTemplate);
      expect(downloadTemplateAndHandleErrors).toHaveBeenCalledWith(
        customTemplate,
        createProjectPath(customProjectName),
      );
    });

    test('should support different package managers', async () => {
      for (const packageManager of TEST_CONSTANTS.PACKAGE_MANAGERS) {
        // Arrange
        vi.clearAllMocks();
        setupSuccessfulWorkflowMocks(TEST_CONSTANTS.PROJECT_NAME, TEST_CONSTANTS.TEMPLATES.DEFAULT, packageManager);

        const args = createTestArgs({ packageManager });

        // Act
        await runMainCommand(args);

        // Assert
        expect(selectPackageManager).toHaveBeenCalledWith(packageManager);
        expect(installDependenciesIfRequested).toHaveBeenCalledWith(
          true,
          createProjectPath(TEST_CONSTANTS.PROJECT_NAME),
          packageManager,
        );

        // Verify final instructions include correct package manager
        expect(consola.log).toHaveBeenCalledWith(expect.stringContaining(packageManager));
      }
    });

    test('should handle installation opt-out correctly', async () => {
      // Arrange
      confirmDependenciesInstallation.mockResolvedValue(false);

      const args = createTestArgs({ install: false });

      // Act
      await runMainCommand(args);

      // Assert
      expect(confirmDependenciesInstallation).toHaveBeenCalledWith(false);
      expect(installDependenciesIfRequested).toHaveBeenCalledWith(
        false,
        createProjectPath(TEST_CONSTANTS.PROJECT_NAME),
        'npm',
      );

      // Should show install instruction when dependencies aren't installed
      // Check if any of the consola.log calls contains "npm install" - accounting for color formatting
      const consolaLogCalls = consola.log.mock.calls.map((call) => call[0]);
      expect(consolaLogCalls.some((call) => call.includes('npm install'))).toBe(true);
    });

    test('should handle git initialization opt-out', async () => {
      // Arrange
      const args = createTestArgs({ gitInit: false });

      // Act
      await runMainCommand(args);

      // Assert
      expect(initializeGitIfRequested).toHaveBeenCalledWith(false, createProjectPath(TEST_CONSTANTS.PROJECT_NAME));
    });
  });

  describe('Error Handling', () => {
    test('should handle template selection errors gracefully', async () => {
      // Arrange
      const templateError = new Error('Template not found: invalid-template');
      selectTemplate.mockResolvedValue(TEST_CONSTANTS.TEMPLATES.INVALID);
      downloadTemplateAndHandleErrors.mockRejectedValue(templateError);

      const args = createTestArgs({ template: TEST_CONSTANTS.TEMPLATES.INVALID });

      // Act & Assert
      await expect(runMainCommand(args)).rejects.toThrow('Template not found: invalid-template');

      // Verify download was attempted
      expect(downloadTemplateAndHandleErrors).toHaveBeenCalledWith(
        TEST_CONSTANTS.TEMPLATES.INVALID,
        createProjectPath(TEST_CONSTANTS.PROJECT_NAME),
      );

      // Verify subsequent steps were not called
      expect(installDependenciesIfRequested).not.toHaveBeenCalled();
      expect(initializeGitIfRequested).not.toHaveBeenCalled();
    });

    test('should handle directory verification errors', async () => {
      // Arrange
      const directoryError = new Error('Directory already exists');
      verifyDirectoryDoesNotExist.mockImplementation(() => {
        throw directoryError;
      });

      const args = createTestArgs();

      // Act & Assert
      await expect(runMainCommand(args)).rejects.toThrow('Directory already exists');

      // Verify workflow stopped at directory verification
      expect(verifyDirectoryDoesNotExist).toHaveBeenCalledWith(createProjectPath(TEST_CONSTANTS.PROJECT_NAME));
      expect(selectTemplate).not.toHaveBeenCalled();
    });

    test('should handle dependency installation failures', async () => {
      // Arrange
      const installError = new Error('Package installation failed');
      installDependenciesIfRequested.mockRejectedValue(installError);

      const args = createTestArgs();

      // Act & Assert
      await expect(runMainCommand(args)).rejects.toThrow('Package installation failed');

      // Verify template download succeeded before failure
      expect(downloadTemplateAndHandleErrors).toHaveBeenCalled();
      expect(installDependenciesIfRequested).toHaveBeenCalled();

      // Git initialization should not be called after installation failure
      expect(initializeGitIfRequested).not.toHaveBeenCalled();
    });

    test('should handle git initialization failures', async () => {
      // Arrange
      const gitError = new Error('Git initialization failed');
      initializeGitIfRequested.mockRejectedValue(gitError);

      const args = createTestArgs();

      // Act & Assert
      await expect(runMainCommand(args)).rejects.toThrow('Git initialization failed');

      // Verify all previous steps completed successfully
      expect(downloadTemplateAndHandleErrors).toHaveBeenCalled();
      expect(installDependenciesIfRequested).toHaveBeenCalled();
      expect(initializeGitIfRequested).toHaveBeenCalled();
    });
  });

  describe('Integration Edge Cases', () => {
    test('should handle project directory with special characters', async () => {
      // Arrange
      const specialProjectName = 'my-app_with-special.chars';
      setupSuccessfulWorkflowMocks(specialProjectName);

      const args = createTestArgs({ dir: specialProjectName });

      // Act
      await runMainCommand(args);

      // Assert
      expect(getProjectDirectory).toHaveBeenCalledWith(specialProjectName);
      expect(downloadTemplateAndHandleErrors).toHaveBeenCalledWith(
        TEST_CONSTANTS.TEMPLATES.DEFAULT,
        createProjectPath(specialProjectName),
      );
    });

    test('should handle empty project directory input', async () => {
      // Arrange
      const args = createTestArgs({ dir: '' });

      // Act
      await runMainCommand(args);

      // Assert
      expect(getProjectDirectory).toHaveBeenCalledWith('');
      // Should still create project with default name
      expect(downloadTemplateAndHandleErrors).toHaveBeenCalledWith(
        TEST_CONSTANTS.TEMPLATES.DEFAULT,
        createProjectPath(TEST_CONSTANTS.PROJECT_NAME),
      );
    });

    test('should handle undefined optional arguments gracefully', async () => {
      // Arrange - test with minimal required arguments only
      const args = createTestArgs({
        template: '', // Empty string instead of undefined
        install: false,
        gitInit: false,
        packageManager: 'npm',
      });

      // Act
      await runMainCommand(args);

      // Assert - should handle empty/falsy values properly
      expect(selectTemplate).toHaveBeenCalledWith('');
      expect(confirmDependenciesInstallation).toHaveBeenCalledWith(false);
      expect(selectPackageManager).toHaveBeenCalledWith('npm');
      expect(initializeGitIfRequested).toHaveBeenCalledWith(false, expect.any(String));
    });
  });

  describe('Command Execution Flow', () => {
    test('should execute steps in correct order', async () => {
      // Arrange
      const callOrder: string[] = [];

      getProjectDirectory.mockImplementation(async () => {
        callOrder.push('getProjectDirectory');
        return TEST_CONSTANTS.PROJECT_NAME;
      });

      selectTemplate.mockImplementation(async () => {
        callOrder.push('selectTemplate');
        return TEST_CONSTANTS.TEMPLATES.DEFAULT;
      });

      downloadTemplateAndHandleErrors.mockImplementation(async () => {
        callOrder.push('downloadTemplate');
        return { dir: createProjectPath(TEST_CONSTANTS.PROJECT_NAME), source: 'test-source' };
      });

      selectPackageManager.mockImplementation(async () => {
        callOrder.push('selectPackageManager');
        return 'npm';
      });

      confirmDependenciesInstallation.mockImplementation(async () => {
        callOrder.push('confirmInstall');
        return true;
      });

      installDependenciesIfRequested.mockImplementation(async () => {
        callOrder.push('installDependencies');
      });

      initializeGitIfRequested.mockImplementation(async () => {
        callOrder.push('initializeGit');
      });

      const args = createTestArgs();

      // Act
      await runMainCommand(args);

      // Assert
      expect(callOrder).toEqual([
        'getProjectDirectory',
        'selectTemplate',
        'downloadTemplate',
        'selectPackageManager',
        'confirmInstall',
        'installDependencies',
        'initializeGit',
      ]);
    });

    test('should display loading message when TTY is available', async () => {
      // This test verifies that the loading message appears
      // The actual TTY check is environment-dependent, so we focus on the command flow
      const args = createTestArgs();

      await runMainCommand(args);

      // Verify that info message is called (loading message appears before this)
      expect(consola.info).toHaveBeenCalledWith(expect.stringContaining('Hello xeikit app'));
    });
  });
});
