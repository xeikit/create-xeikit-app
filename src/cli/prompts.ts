import consola from 'consola';

export const getProjectDirectory = async (dirArg: string): Promise<string> => {
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
