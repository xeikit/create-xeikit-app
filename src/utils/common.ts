import { existsSync } from 'node:fs';
import consola from 'consola';
import { colors } from 'consola/utils';
import { relative, resolve } from 'pathe';
import type { Result } from '../types/result';
import { Err, Ok } from '../types/result';

/**
 * Creates a user-friendly error message when a directory already exists.
 * Converts absolute paths to relative paths for better readability in error messages.
 *
 * @param path - The absolute path of the existing directory
 * @returns A formatted error message with colored directory name
 *
 * @example
 * ```typescript
 * const message = createDirectoryExistsMessage("/Users/john/projects/my-app");
 * // Returns: "The directory my-app already exists. Please choose a different directory."
 * ```
 */
export const createDirectoryExistsMessage = (path: string): string => {
  const relativePath = relative(process.cwd(), path) || path;
  return `The directory ${colors.cyan(relativePath)} already exists. Please choose a different directory.`;
};

/**
 * Checks if a directory exists at the specified path.
 * This is a pure function wrapper around Node.js's existsSync for better testability.
 *
 * @param path - The file system path to check
 * @returns True if the directory exists, false otherwise
 *
 * @example
 * ```typescript
 * const exists = checkDirectoryExists("./my-project");
 * if (exists) {
 *   console.log("Directory already exists!");
 * }
 * ```
 */
export const checkDirectoryExists = (path: string): boolean => existsSync(path);

/**
 * Handles application errors by logging them and exiting the process.
 * This function never returns (indicated by the 'never' return type).
 * Used as a centralized error handler throughout the application.
 *
 * @param error - The error to handle and log
 * @returns Never returns (exits the process)
 *
 * @example
 * ```typescript
 * try {
 *   riskyOperation();
 * } catch (error) {
 *   handleError(error); // Logs error and exits
 * }
 * ```
 */
export const handleError = (error: Error): never => {
  consola.error(error.toString());
  process.exit(1);
};

/**
 * Validates that a directory does not already exist at the specified path.
 * Returns a Result type to allow for functional error handling without side effects.
 *
 * @param path - The directory path to validate
 * @returns A Result containing the path if valid, or an error message if the directory exists
 *
 * @example
 * ```typescript
 * const result = validateDirectoryDoesNotExist("./new-project");
 * if (isOk(result)) {
 *   console.log("Directory is available:", result.data);
 * } else {
 *   console.error("Directory exists:", result.error);
 * }
 * ```
 */
export const validateDirectoryDoesNotExist = (path: string): Result<string, string> => {
  return checkDirectoryExists(path) ? Err(createDirectoryExistsMessage(path)) : Ok(path);
};

/**
 * Verifies that a directory does not exist, exiting the process if it does.
 * This is a side-effect version of validateDirectoryDoesNotExist for backward compatibility.
 * Logs an error and exits if the directory already exists.
 *
 * @param path - The directory path to verify
 *
 * @example
 * ```typescript
 * verifyDirectoryDoesNotExist("./my-project");
 * // If directory exists: logs error and exits process
 * // If directory doesn't exist: continues execution
 * ```
 */
export const verifyDirectoryDoesNotExist = (path: string): void => {
  const result = validateDirectoryDoesNotExist(path);
  if (!result.success) {
    consola.error(result.error);
    process.exit(1);
  }
};

/**
 * Resolves a relative directory path against a base current working directory.
 * This is a pure function wrapper around Node.js path resolution for better testability.
 *
 * @param cwd - The current working directory (base path)
 * @param dir - The directory path to resolve (can be relative or absolute)
 * @returns The resolved absolute path
 *
 * @example
 * ```typescript
 * const resolved = resolvePath("/Users/john", "./my-project");
 * // Returns: "/Users/john/my-project"
 *
 * const absolute = resolvePath("/Users/john", "/tmp/other-project");
 * // Returns: "/tmp/other-project"
 * ```
 */
export const resolvePath = (cwd: string, dir: string): string => {
  return resolve(cwd, dir);
};
