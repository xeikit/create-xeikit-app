# 🎉 create-xeikit-app

[![npm version][npm-version-src]][npm-version-href]

## 🚀 Quick Start

You can use [these templates](https://github.com/xeikit/starter-templates/tree/main/packages) to create a new project by running the following command:

```bash
npx create-xeikit-app
```

Follow the interactive prompts to select your preferred template and get coding immediately!

## ✨ Development

### Release Process

This project uses an enhanced multi-stage release process with comprehensive safety checks:

#### Available Release Commands

```bash
# Enhanced release with safety checks
pnpm release:enhanced

# Dry run (preview changes without publishing)
pnpm release:dry

# Quick release (skip confirmations)
pnpm release:quick

# Legacy release (simple one-stage process)
pnpm release
```

#### Release Options

```bash
# Perform a dry run
node scripts/release.mjs --dry-run

# Quick release with patch version
node scripts/release.mjs --quick patch

# Skip specific steps
node scripts/release.mjs --skip-tests --skip-lint

# Release types
node scripts/release.mjs [patch|minor|major|prerelease]
```

#### Release Stages

1. **Pre-release Checks**

   - Git status validation
   - Branch verification (main/master)
   - User confirmation

2. **Quality Assurance**

   - Linting (`pnpm lint:fix`)
   - Testing (`pnpm test:ci`)

3. **Build & Release**
   - Project build (`pnpm build`)
   - Changelog generation (`changelogen`)
   - Package publishing (`pnpm publish`)

#### Safety Features

- **Dry Run**: Preview all changes without making actual modifications
- **Git Validation**: Warns about uncommitted changes and non-main branches
- **User Confirmation**: Interactive prompts for critical steps
- **Error Handling**: Clear error messages and recovery suggestions
- **Quick Mode**: Skip confirmations for urgent releases

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

## 🔗 Related

- [starter-templates](https://github.com/xeikit/starter-templates) - Starter Templates

---

Made with ❤️ by the [xeikit](https://github.com/xeikit) team

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/create-xeikit-app?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/create-xeikit-app
