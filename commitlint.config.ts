import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['gitmoji'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'perf', 'update', 'fix', 'hotfix', 'refactor', 'delete', 'type', 'docs', 'test', 'chore', 'ci'],
    ],
  },
};

export default config;
