import consola from 'consola';
import { x } from 'tinyexec';

export const initializeGitIfRequested = async (shouldInitParam: boolean | undefined, dir: string): Promise<void> => {
  const shouldInit =
    shouldInitParam === undefined
      ? await consola
          .prompt('Initialize git repository?', { type: 'confirm', cancel: 'reject' })
          .catch(() => process.exit(1))
      : shouldInitParam;

  if (shouldInit) {
    consola.info('Initializing git repository...\n');

    try {
      await x('git', ['init', dir], {
        throwOnError: true,
        nodeOptions: { stdio: 'inherit' },
      });
    } catch (err) {
      consola.warn(`Failed to initialize git repository: ${err}`);
    }
  }
};
