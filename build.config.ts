import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index.ts'],
  declaration: true,
  clean: true,
  rollup: { emitCJS: true, cjsBridge: true, esbuild: { minify: true } },
});
