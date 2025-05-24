import { runMain as _runMain } from 'citty';
import { mainCommand } from './command';

/**
 * Initializes and runs the main command-line interface.
 * This function sets up the CLI using the citty framework and executes the main command.
 * It serves as the entry point for the command-line application.
 */
export const runMain = () => _runMain(mainCommand);
