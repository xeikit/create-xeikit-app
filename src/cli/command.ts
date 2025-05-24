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
 * Pure function to create project creation configuration
 */
interface ProjectConfig {
  readonly projectDir: string;
  readonly templateDownloadPath: string;
  readonly cwd: string;
}

/**
 * Pure function to create project paths
 */
export const createProjectConfig = (cwd: string, projectDir: string): ProjectConfig => ({
  projectDir,
  templateDownloadPath: resolvePath(cwd, projectDir),
  cwd: resolvePath(cwd, ''),
});

/**
 * Pure function to display project creation info
 */
export const displayProjectCreationInfo = (config: ProjectConfig): void => {
  const relativePath = relative(config.cwd, config.templateDownloadPath) || config.templateDownloadPath;
  consola.info(`Creating a new project in ${colors.cyan(relativePath)}.`);
};

/**
 * Pure function to create final instructions
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
 * Pure function to display final instructions
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
 * Async function to execute the project creation workflow
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
