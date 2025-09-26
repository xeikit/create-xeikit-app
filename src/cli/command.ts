import { type ArgDef, defineCommand } from 'citty';
import consola from 'consola';
import { colors } from 'consola/utils';
import { relative } from 'pathe';
import { hasTTY } from 'std-env';
import { description, name, version } from '../../package.json';
import type { Result } from '../types/result';
import { Err, Ok } from '../types/result';
import { resolvePath, verifyDirectoryDoesNotExist } from '../utils/common';
import { initializeGitIfRequested } from '../utils/git';
import {
  confirmDependenciesInstallation,
  installDependenciesIfRequested,
  selectPackageManager,
} from '../utils/package-manager';
import { downloadTemplateAndHandleErrors, selectTemplate } from '../utils/template';
import { getProjectDirectory } from './prompts';

/**
 * Configuration interface for project creation.
 * Contains all the paths and settings needed to create a new project.
 */
interface ProjectConfig {
  readonly projectDir: string;
  readonly templateDownloadPath: string;
  readonly cwd: string;
}

/**
 * Creates a project configuration object with resolved paths.
 * This pure function calculates all the necessary paths for project creation
 * based on the current working directory and target project directory.
 *
 * @param cwd - The current working directory
 * @param projectDir - The target project directory name
 * @returns A configuration object with resolved absolute paths
 *
 * @example
 * ```typescript
 * const config = createProjectConfig("/Users/john", "my-app");
 * // Returns: {
 * //   projectDir: "my-app",
 * //   templateDownloadPath: "/Users/john/my-app",
 * //   cwd: "/Users/john"
 * // }
 * ```
 */
export const createProjectConfig = (cwd: string, projectDir: string): ProjectConfig => ({
  projectDir,
  templateDownloadPath: resolvePath(cwd, projectDir),
  cwd: resolvePath(cwd, ''),
});

/**
 * Displays project creation information to the user.
 * Shows a friendly message indicating where the new project will be created,
 * using relative paths when possible for better readability.
 *
 * @param config - The project configuration containing path information
 *
 * @example
 * ```typescript
 * const config = createProjectConfig("/Users/john", "my-app");
 * displayProjectCreationInfo(config);
 * // Logs: "Creating a new project in my-app."
 * ```
 */
export const displayProjectCreationInfo = (config: ProjectConfig): void => {
  const relativePath = relative(config.cwd, config.templateDownloadPath) || config.templateDownloadPath;
  consola.info(`Creating a new project in ${colors.cyan(relativePath)}.`);
};

/**
 * Creates instruction messages for the user after successful project creation.
 * This pure function generates all the text and commands the user needs to start working
 * with their new project, including conditional installation commands.
 *
 * @param projectDir - The name of the created project directory
 * @param shouldInstall - Whether dependencies were installed automatically
 * @param selectedPackageManager - The package manager chosen by the user
 * @param templateSource - The template that was used for project creation
 * @returns Object containing all instruction messages and commands
 *
 * @example
 * ```typescript
 * const instructions = createFinalInstructions("my-app", false, "npm", "nuxt4");
 * console.log(instructions.successMessage); // "🎉 Starter project has been created..."
 * console.log(instructions.installCommand); // "npm install"
 * ```
 */
export const createFinalInstructions = (
  projectDir: string,
  shouldInstall: boolean,
  selectedPackageManager: string,
  templateSource: string,
) => ({
  successMessage: `\n🎉 Starter project has been created with the \`${templateSource}\` template.`,
  nextStepsTitle: '\n🚀 Next steps:\n',
  changeDirectory: `cd ${colors.cyan(projectDir)}`,
  installCommand: !shouldInstall ? `${colors.cyan(selectedPackageManager)} install` : null,
  devCommand: `${colors.cyan(selectedPackageManager)} run dev`,
  happyCoding: `\n🎮 Happy coding! ${colors.dim('(Press Ctrl+C to stop the dev server)')}`,
});

/**
 * Displays the final instructions to the user after successful project creation.
 * Shows next steps including directory change, dependency installation (if needed),
 * and development server startup commands.
 *
 * @param projectDir - The name of the created project directory
 * @param shouldInstall - Whether dependencies were installed automatically
 * @param selectedPackageManager - The package manager chosen by the user
 * @param templateSource - The template that was used for project creation
 *
 * @example
 * ```typescript
 * displayFinalInstructions("my-app", false, "npm", "nuxt4");
 * // Logs success message and next steps including "npm install" command
 * ```
 */
export const displayFinalInstructions = (
  projectDir: string,
  shouldInstall: boolean,
  selectedPackageManager: string,
  templateSource: string,
): void => {
  const instructions = createFinalInstructions(projectDir, shouldInstall, selectedPackageManager, templateSource);

  consola.log(instructions.successMessage);
  consola.log(instructions.nextStepsTitle);
  consola.log(instructions.changeDirectory);

  if (instructions.installCommand) {
    consola.log(instructions.installCommand);
  }

  consola.log(instructions.devCommand);
  consola.log(instructions.happyCoding);
};

/**
 * Executes the complete project creation workflow.
 * This is the main orchestration function that coordinates all steps of project creation:
 * directory validation, template selection, download, dependency installation, and git setup.
 *
 * @param args - Configuration object containing all user preferences and settings
 * @returns A Promise that resolves to a Result indicating success or failure
 *
 * @example
 * ```typescript
 * const result = await executeProjectCreationWorkflow({
 *   cwd: process.cwd(),
 *   dir: "my-app",
 *   template: "nuxt4",
 *   install: true,
 *   gitInit: true,
 *   packageManager: "npm"
 * });
 *
 * if (isOk(result)) {
 *   console.log("Project created successfully!");
 * } else {
 *   console.error("Project creation failed:", result.error.message);
 * }
 * ```
 */
export const executeProjectCreationWorkflow = async (args: {
  readonly cwd: string;
  readonly dir: string;
  readonly template: string;
  readonly install: boolean;
  readonly gitInit: boolean;
  readonly packageManager: string;
}): Promise<Result<void, Error>> => {
  try {
    // Step 1: Get project directory
    const projectDir = await getProjectDirectory(args.dir);
    const config = createProjectConfig(args.cwd, projectDir);

    displayProjectCreationInfo(config);
    verifyDirectoryDoesNotExist(config.templateDownloadPath);

    // Step 2: Select and download template
    const templateName = await selectTemplate(args.template);
    const template = await downloadTemplateAndHandleErrors(templateName, config.templateDownloadPath);

    // Step 3: Package manager selection and installation
    const selectedPackageManager = await selectPackageManager(args.packageManager);
    const shouldInstall = await confirmDependenciesInstallation(args.install);
    await installDependenciesIfRequested(shouldInstall, template.dir, selectedPackageManager);

    // Step 4: Git initialization
    await initializeGitIfRequested(args.gitInit, template.dir);

    // Step 5: Display final instructions
    displayFinalInstructions(projectDir, shouldInstall, selectedPackageManager, template.source);

    return Ok(undefined);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error('Project creation workflow failed'));
  }
};

/**
 * Main CLI command definition for the xeikit app creation tool.
 * This command handles the complete project creation workflow from start to finish.
 * Supports various options for customizing the project setup process.
 *
 * @example
 * ```bash
 * # Create a project with prompts
 * create-xeikit-app
 *
 * # Create a project with specific template and skip installation
 * create-xeikit-app my-app --template 4 --no-install
 *
 * # Create a project with yarn and skip git initialization
 * create-xeikit-app my-app --package-manager yarn --no-git-init
 * ```
 */
export const mainCommand = defineCommand({
  meta: {
    name,
    version,
    description,
  },
  args: {
    cwd: {
      type: 'string',
      description: 'Specify the working directory',
      valueHint: 'directory',
      default: '.',
    },
    dir: {
      type: 'positional',
      description: 'Project directory',
      default: '',
    },
    template: {
      type: 'string',
      alias: 't',
      description: 'Template name',
    },
    install: {
      type: 'boolean',
      description: 'Install dependencies',
    },
    gitInit: {
      type: 'boolean',
      description: 'Initialize git repository',
    },
    packageManager: {
      type: 'string',
      description: 'Package manager choice (npm, pnpm, yarn, bun, deno)',
    },
  } as const satisfies Record<string, ArgDef>,
  run: async ({ args }) => {
    if (hasTTY) {
      process.stdout.write('Loading...\n');
    }

    consola.info(colors.bold('🎉 Hello xeikit app!'));

    const result = await executeProjectCreationWorkflow(args);

    // For backward compatibility, we handle errors by throwing
    if (!result.success) {
      throw result.error;
    }
  },
});
