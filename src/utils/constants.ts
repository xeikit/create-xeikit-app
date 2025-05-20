import type { TemplateOptions } from '../types/cli';

export const DEFAULT_REGISTRY = 'https://raw.githubusercontent.com/xeikit/starter/templates/templates' as const;
export const DEFAULT_TEMPLATE_NAME = 'nuxt3' as const;
export const PACKAGE_MANAGERS = {
  npm: undefined,
  yarn: undefined,
  pnpm: undefined,
  bun: undefined,
  deno: undefined,
} as const;
export const PACKAGE_MANAGER_OPTIONS = Object.keys(PACKAGE_MANAGERS) as Array<keyof typeof PACKAGE_MANAGERS>;
export const TEMPLATE_OPTIONS = [
  { label: 'Nuxt3', value: 'nuxt3' },
  { label: 'React Router (framework)', value: 'react-router' },
] satisfies TemplateOptions[];
