import type { ChangelogConfig } from 'changelogen';

export default () =>
  ({
    types: {
      feat: { title: '✨ New Feature', semver: 'minor' },
      perf: { title: '⚡️ Performance Improvement', semver: 'patch' },
      improve: { title: '🎨 Code Structure/Logic Improvement', semver: 'patch' },
      update: { title: '🩹 Minor Fixes/Linter Warnings', semver: 'patch' },
      fix: { title: '🐛 Bug Fix', semver: 'patch' },
      hotfix: { title: '🚑 Critical Bug Fix', semver: 'patch' },
      typo: { title: '✏️ Typo Fix', semver: 'patch' },
      refactor: { title: '♻️ Refactoring', semver: 'patch' },
      delete: { title: '🔥 File/Code Deletion', semver: 'patch' },
      type: { title: '🏷️ Type Definition Addition/Update', semver: 'patch' },
      package: { title: '📦 Package Management', semver: 'patch' },
      docs: { title: '📝 Documentation/Comment Update' },
      test: { title: '✅ Test Related' },
      chore: { title: '🔧 Development Environment Setup' },
      ci: { title: '👷 CI Build/Update' },
    },
    templates: {
      commitMessage: ':bookmark: chore(release): v{{newVersion}}',
    },
  }) satisfies Partial<ChangelogConfig>;
