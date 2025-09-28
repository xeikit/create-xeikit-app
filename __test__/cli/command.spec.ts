import { describe, expect, test } from 'vitest';
import { mainCommand } from '@/cli/command';
import { description, name, version } from '../../package.json';

describe('src/cli/command.ts', () => {
  describe('mainCommand', () => {
    test('should have correct meta information', () => {
      expect(mainCommand?.meta).toEqual({
        name,
        version,
        description,
      });
      expect(mainCommand?.args).toEqual({
        cwd: expect.any(Object),
        dir: expect.any(Object),
        template: expect.any(Object),
        install: expect.any(Object),
        gitInit: expect.any(Object),
        packageManager: expect.any(Object),
      });
    });
  });
});
