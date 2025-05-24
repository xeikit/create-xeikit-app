/**
 * Interface defining the structure of template options for the CLI.
 * Used to create select menus for template selection with user-friendly labels.
 *
 * @example
 * ```typescript
 * const option: TemplateOptions = {
 *   label: "React Router (framework)",
 *   value: "react-router"
 * };
 * ```
 */
export interface TemplateOptions {
  /** User-friendly display name shown in the selection menu */
  label: string;
  /** Internal value used for template identification and download */
  value: string;
}
