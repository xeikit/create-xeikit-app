import type { TemplateOptions } from '../types/cli';

/**
 * Default registry URL for downloading project templates.
 * Points to the official xeikit starter templates repository.
 */
export const DEFAULT_REGISTRY = 'https://raw.githubusercontent.com/xeikit/starter-templates/main/templates' as const;

/**
 * Default template name used when no template is specified.
 * Falls back to the Nuxt3 template for new projects.
 */
export const DEFAULT_TEMPLATE_NAME = 'nuxt3' as const;

/**
 * Supported package managers for dependency installation.
 * Maps each package manager name to undefined for type checking purposes.
 */
export const PACKAGE_MANAGERS = {
  npm: undefined,
  yarn: undefined,
  pnpm: undefined,
  bun: undefined,
  deno: undefined,
} as const;

/**
 * Array of available package manager names.
 * Extracted from the PACKAGE_MANAGERS object keys for use in prompts and validation.
 */
export const PACKAGE_MANAGER_OPTIONS = Object.keys(PACKAGE_MANAGERS) as Array<keyof typeof PACKAGE_MANAGERS>;

/**
 * Available project templates with user-friendly labels.
 * Each template option contains a display label and corresponding value for template selection.
 */
export const TEMPLATE_OPTIONS = [
  { label: 'Nuxt3', value: 'nuxt3' },
  { label: 'React Router (framework)', value: 'react-router' },
  { label: 'TanStack Start (Beta)', value: 'tanstack-start' },
] satisfies TemplateOptions[];
