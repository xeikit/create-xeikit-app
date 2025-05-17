import consola, { type SelectPromptOptions } from 'consola';
import { type PackageManagerName, installDependencies } from 'nypm';
import { handleError } from './common';
import { PACKAGE_MANAGER_OPTIONS } from './constants';

export const detectCurrentPackageManager = (): PackageManagerName | undefined => {
  const userAgent = process.env.npm_config_user_agent;
  if (!userAgent) {
    return undefined;
  }
  const [name] = userAgent.split('/');
  return PACKAGE_MANAGER_OPTIONS.includes(name as PackageManagerName) ? (name as PackageManagerName) : undefined;
};

export const selectPackageManager = async (packageManagerArg?: string): Promise<PackageManagerName> => {
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

export const confirmDependenciesInstallation = async (install: boolean) => {
  const shouldInstall = await consola
    .prompt('Do you want to install dependencies?', {
      type: 'confirm',
      initial: install,
      cancel: 'reject',
    })
    .catch(() => process.exit(1));
  if (typeof shouldInstall !== 'boolean') {
    consola.error('Please specify whether to install dependencies.');
    process.exit(1);
  }
  return shouldInstall;
};

export const installDependenciesIfRequested = async (
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
