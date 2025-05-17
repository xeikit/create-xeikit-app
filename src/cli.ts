import { existsSync } from 'node:fs';
import { type ArgDef, runMain as _runMain, defineCommand } from 'citty';
import consola, { type SelectPromptOptions } from 'consola';
import { colors } from 'consola/utils';
import { type DownloadTemplateResult, downloadTemplate } from 'giget';
import { type PackageManagerName, installDependencies } from 'nypm';
import { relative, resolve } from 'pathe';
import { hasTTY } from 'std-env';
import { x } from 'tinyexec';
import { description, name, version } from '../package.json';

const DEFAULT_REGISTRY = 'https://raw.githubusercontent.com/xeikit/starter/templates/templates' as const;
const DEFAULT_TEMPLATE_NAME = 'nuxt3' as const;
const PACKAGE_MANAGERS: Record<PackageManagerName, undefined> = {
  npm: undefined,
  yarn: undefined,
  pnpm: undefined,
  bun: undefined,
  deno: undefined,
};
const PACKAGE_MANAGER_OPTIONS = Object.keys(PACKAGE_MANAGERS) as PackageManagerName[];

const detectCurrentPackageManager = (): PackageManagerName | undefined => {
  const userAgent = process.env.npm_config_user_agent;
  if (!userAgent) {
    return undefined;
  }
  const [name] = userAgent.split('/');
  return PACKAGE_MANAGER_OPTIONS.includes(name as PackageManagerName) ? (name as PackageManagerName) : undefined;
};

const handleError = (error: Error): never => {
  consola.error(error.toString());
  process.exit(1);
};

const mainCommand = defineCommand({
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

    const projectDir = await getProjectDirectory(args.dir);

    const cwd = resolve(args.cwd);
    const templateDownloadPath = resolve(cwd, projectDir);
    consola.info(
      `Creating a new project in ${colors.cyan(relative(cwd, templateDownloadPath) || templateDownloadPath)}.`,
    );

    verifyDirectoryDoesNotExist(templateDownloadPath);

    const templateName = await selectTemplate(args.template);

    const template = await downloadTemplateAndHandleErrors(templateName, templateDownloadPath);

    const selectedPackageManager = await selectPackageManager(args.packageManager);

    await installDependenciesIfRequested(args.install, template.dir, selectedPackageManager);

    await initializeGitIfRequested(args.gitInit, template.dir);

    consola.log(`\n✨ Starter project has been created with the \`${template.source}\` template.`);
  },
});

const getProjectDirectory = async (dirArg: string): Promise<string> => {
  if (dirArg !== '') {
    return dirArg;
  }

  return consola
    .prompt('Where would you like to create your project?', {
      placeholder: './my-project',
      type: 'text',
      default: './my-project',
      cancel: 'reject',
    })
    .catch(() => process.exit(1));
};

const verifyDirectoryDoesNotExist = (path: string): void => {
  if (existsSync(path)) {
    consola.error(
      `The directory ${colors.cyan(relative(process.cwd(), path) || path)} already exists. Please choose a different directory.`,
    );
    process.exit(1);
  }
};

const selectTemplate = async (templateArg?: string): Promise<string> => {
  if (templateArg) {
    return templateArg;
  }

  const template = await consola
    .prompt('Choose a template', {
      type: 'select',
      options: [{ label: 'Nuxt3', value: 'nuxt3' }],
      cancel: 'reject',
    })
    .catch(() => process.exit(1));

  if (typeof template !== 'string') {
    consola.error('Please specify a template name.');
    process.exit(1);
  }

  return template || DEFAULT_TEMPLATE_NAME;
};

const downloadTemplateAndHandleErrors = async (
  templateName: string,
  downloadPath: string,
): Promise<DownloadTemplateResult> => {
  try {
    return await downloadTemplate(templateName, {
      dir: downloadPath,
      registry: DEFAULT_REGISTRY,
    });
  } catch (error) {
    return handleError(error as Error);
  }
};

const selectPackageManager = async (packageManagerArg?: string): Promise<PackageManagerName> => {
  const currentPackageManager = detectCurrentPackageManager();

  if (packageManagerArg && PACKAGE_MANAGER_OPTIONS.includes(packageManagerArg as PackageManagerName)) {
    return packageManagerArg as PackageManagerName;
  }

  const packageManagerSelectOptions = PACKAGE_MANAGER_OPTIONS.map(
    (packageManager) =>
      ({
        label: packageManager,
        value: packageManager,
        hint: currentPackageManager === packageManager ? 'current' : undefined,
      }) satisfies SelectPromptOptions['options'][number],
  );

  return consola
    .prompt('Which package manager would you like to use?', {
      type: 'select',
      options: packageManagerSelectOptions,
      initial: currentPackageManager,
      cancel: 'reject',
    })
    .catch(() => process.exit(1));
};

const installDependenciesIfRequested = async (
  shouldInstall: boolean | undefined,
  dir: string,
  packageManager: PackageManagerName,
): Promise<void> => {
  if (shouldInstall === false) {
    consola.info('Skipping dependency installation.');
    return;
  }

  consola.start('Installing dependencies...');

  try {
    await installDependencies({
      cwd: dir,
      packageManager: {
        name: packageManager,
        command: packageManager,
      },
    });
    consola.success('Installation completed.');
  } catch (error) {
    handleError(error as Error);
  }
};

const initializeGitIfRequested = async (shouldInitParam: boolean | undefined, dir: string): Promise<void> => {
  const shouldInit =
    shouldInitParam === undefined
      ? await consola
          .prompt('Initialize git repository?', {
            type: 'confirm',
            cancel: 'reject',
          })
          .catch(() => process.exit(1))
      : shouldInitParam;

  if (shouldInit) {
    consola.info('Initializing git repository...\n');

    try {
      await x('git', ['init', dir], {
        throwOnError: true,
        nodeOptions: {
          stdio: 'inherit',
        },
      });
    } catch (err) {
      consola.warn(`Failed to initialize git repository: ${err}`);
    }
  }
};

export const runMain = () => _runMain(mainCommand);
