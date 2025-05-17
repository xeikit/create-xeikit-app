import { type ArgDef, defineCommand } from 'citty';
import consola from 'consola';
import { colors } from 'consola/utils';
import { relative } from 'pathe';
import { hasTTY } from 'std-env';
import { description, name, version } from '../../package.json';
import { resolvePath, verifyDirectoryDoesNotExist } from '../utils/common';
import { initializeGitIfRequested } from '../utils/git';
import {
  confirmDependenciesInstallation,
  installDependenciesIfRequested,
  selectPackageManager,
} from '../utils/package-manager';
import { downloadTemplateAndHandleErrors, selectTemplate } from '../utils/template';
import { getProjectDirectory } from './prompts';

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

    const projectDir = await getProjectDirectory(args.dir);

    const cwd = resolvePath(args.cwd, '');
    const templateDownloadPath = resolvePath(cwd, projectDir);

    consola.info(
      `Creating a new project in ${colors.cyan(relative(cwd, templateDownloadPath) || templateDownloadPath)}.`,
    );

    verifyDirectoryDoesNotExist(templateDownloadPath);

    const templateName = await selectTemplate(args.template);

    const template = await downloadTemplateAndHandleErrors(templateName, templateDownloadPath);

    const selectedPackageManager = await selectPackageManager(args.packageManager);

    const shouldInstall = await confirmDependenciesInstallation(args.install);

    await installDependenciesIfRequested(shouldInstall, template.dir, selectedPackageManager);

    await initializeGitIfRequested(args.gitInit, template.dir);

    consola.log(`\n🎉 Starter project has been created with the \`${template.source}\` template.`);
    consola.log('\n🚀 Next steps:\n');
    consola.log(`cd ${colors.cyan(projectDir)}`);
    if (!shouldInstall) {
      consola.log(`${colors.cyan(selectedPackageManager)} install`);
    }
    consola.log(`${colors.cyan(selectedPackageManager)} run dev`);
    consola.log(`\n🎮 Happy coding! ${colors.dim('(Press Ctrl+C to stop the dev server)')}`);
  },
});
