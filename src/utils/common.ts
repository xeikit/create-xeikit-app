import { existsSync } from 'node:fs';
import consola from 'consola';
import { colors } from 'consola/utils';
import { relative, resolve } from 'pathe';
import type { Result } from '../types/result';
import { Err, Ok } from '../types/result';

/**
 * Pure function to create error message
 */
export const createDirectoryExistsMessage = (path: string): string => {
  const relativePath = relative(process.cwd(), path) || path;
  return `The directory ${colors.cyan(relativePath)} already exists. Please choose a different directory.`;
};

/**
 * Pure function to check if directory exists
 */
export const checkDirectoryExists = (path: string): boolean => existsSync(path);

/**
 * Functional error handler - returns never for backward compatibility
 */
export const handleError = (error: Error): never => {
  consola.error(error.toString());
  process.exit(1);
};

/**
 * Functional version of directory validation
 */
export const validateDirectoryDoesNotExist = (path: string): Result<string, string> => {
  return checkDirectoryExists(path) ? Err(createDirectoryExistsMessage(path)) : Ok(path);
};

/**
 * Side-effect version for backward compatibility
 */
export const verifyDirectoryDoesNotExist = (path: string): void => {
  const result = validateDirectoryDoesNotExist(path);
  if (!result.success) {
    consola.error(result.error);
    process.exit(1);
  }
};

/**
 * Pure function for path resolution
 */
export const resolvePath = (cwd: string, dir: string): string => {
  return resolve(cwd, dir);
};
