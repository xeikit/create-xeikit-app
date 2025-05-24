import { describe, expect, test } from 'vitest';
import { description, name, version } from '../../package.json';
import { mainCommand } from '../../src/cli/command';

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
