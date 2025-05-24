import { describe, expect, test } from 'vitest';

describe('src/cli/index.ts', () => {
  test('should export main entry point', async () => {
    const module = await import('../../src/cli/index');
    expect(module).toBeDefined();
  });
});
