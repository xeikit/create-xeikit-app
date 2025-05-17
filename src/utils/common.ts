import { existsSync } from 'node:fs';
import consola from 'consola';
import { colors } from 'consola/utils';
import { relative, resolve } from 'pathe';

export const handleError = (error: Error): never => {
  consola.error(error.toString());
  process.exit(1);
};

export const verifyDirectoryDoesNotExist = (path: string): void => {
  if (existsSync(path)) {
    consola.error(
      `The directory ${colors.cyan(relative(process.cwd(), path) || path)} already exists. Please choose a different directory.`,
    );
    process.exit(1);
  }
};

export const resolvePath = (cwd: string, dir: string): string => {
  return resolve(cwd, dir);
};
