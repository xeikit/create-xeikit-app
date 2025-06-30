# Changelog


## v1.2.1

[compare changes](https://github.com/xeikit/create-xeikit-app/compare/v1.2.0...v1.2.1)

### ✨ Enhancements

- Add TanStack Start template option to TEMPLATE_OPTIONS ([aff715e](https://github.com/xeikit/create-xeikit-app/commit/aff715e))

### 📝 Documentation

- Update template URL in README for clarity ([#16](https://github.com/xeikit/create-xeikit-app/pull/16))
- Update section title from "Usage" to "Quick Start" for clarity ([70cea96](https://github.com/xeikit/create-xeikit-app/commit/70cea96))
- Add comprehensive release process documentation ([44456e2](https://github.com/xeikit/create-xeikit-app/commit/44456e2))

### 🤖 CI

- Implement enhanced multi-stage release script ([#13](https://github.com/xeikit/create-xeikit-app/pull/13))

### 🎨 Improvements

- Ensure default release type is 'patch' and simplify changelog generation ([badba32](https://github.com/xeikit/create-xeikit-app/commit/badba32))

### ❤️ Contributors

- XeicuLy ([@XeicuLy](https://github.com/XeicuLy))

## v1.2.0

[compare changes](https://github.com/xeikit/create-xeikit-app/compare/v1.1.0...v1.2.0)

### ✨ Enhancements

- Change DEFAULT_REGISTRY URL to point to the official xeikit starter templates repository ([4b6e739](https://github.com/xeikit/create-xeikit-app/commit/4b6e739))

### 🔧 Chore

- Update release script to include testing before publishing ([63438c2](https://github.com/xeikit/create-xeikit-app/commit/63438c2))

### ❤️ Contributors

- XeicuLy ([@XeicuLy](https://github.com/XeicuLy))

## v1.1.0

[compare changes](https://github.com/xeikit/create-xeikit-app/compare/v1.0.0...v1.1.0)

### ✨ Enhancements

- Add react-router template option ([c6e6b1f](https://github.com/xeikit/create-xeikit-app/commit/c6e6b1f))

### ♻️ Refactors

- Refactor project creation workflow with Result type for error handling ([66fe5b4](https://github.com/xeikit/create-xeikit-app/commit/66fe5b4))
- Update import paths to use alias and enhance project structure ([dfa3cf2](https://github.com/xeikit/create-xeikit-app/commit/dfa3cf2))
- Update import paths to use relative paths for better module resolution ([a57ae46](https://github.com/xeikit/create-xeikit-app/commit/a57ae46))

### 📝 Documentation

- Enhance documentation across CLI and utility functions ([2248581](https://github.com/xeikit/create-xeikit-app/commit/2248581))

### 🔧 Chore

- Change the formatter for JSON and JSONC to Prettier ([#3](https://github.com/xeikit/create-xeikit-app/pull/3))
- Update changelog types for consistency and clarity ([#4](https://github.com/xeikit/create-xeikit-app/pull/4))
- Add commitlint package ([1aff0ae](https://github.com/xeikit/create-xeikit-app/commit/1aff0ae))
- Add commitlint configuration and hook for commit message linting ([fd18959](https://github.com/xeikit/create-xeikit-app/commit/fd18959))
- Add vitest package and config file ([68aef76](https://github.com/xeikit/create-xeikit-app/commit/68aef76))

### ✅ Tests

- Add unit tests for mainCommand in command.spec.ts ([c6bbd8e](https://github.com/xeikit/create-xeikit-app/commit/c6bbd8e))
- Add e2e tests for mainCommand functionality ([9699eae](https://github.com/xeikit/create-xeikit-app/commit/9699eae))
- Add unit tests for main entry point in index.ts ([0e187f4](https://github.com/xeikit/create-xeikit-app/commit/0e187f4))
- Add unit tests for getProjectDirectory function in prompt.spec.ts ([c14988b](https://github.com/xeikit/create-xeikit-app/commit/c14988b))
- Add unit tests for utility functions in common.spec.ts ([641755a](https://github.com/xeikit/create-xeikit-app/commit/641755a))
- Add unit tests for initializeGitIfRequested function in git.spec.ts ([6a8df67](https://github.com/xeikit/create-xeikit-app/commit/6a8df67))
- Add unit tests for package manager utility functions in package-manager.spec.ts ([3378202](https://github.com/xeikit/create-xeikit-app/commit/3378202))
- Add unit tests for template utility functions in template.spec.ts ([0b794be](https://github.com/xeikit/create-xeikit-app/commit/0b794be))
- Improve error handling tests by using dedicated consolaErrorMock ([161907c](https://github.com/xeikit/create-xeikit-app/commit/161907c))
- Enhance consola log check for package manager install command handling ([5415128](https://github.com/xeikit/create-xeikit-app/commit/5415128))

### 🤖 CI

- Add CI test execution step and update test script for coverage ([06899d4](https://github.com/xeikit/create-xeikit-app/commit/06899d4))

### 🎨 Improvements

- Correct alias path in vitest configuration ([87db2d0](https://github.com/xeikit/create-xeikit-app/commit/87db2d0))

### ❤️ Contributors

- XeicuLy ([@XeicuLy](https://github.com/XeicuLy))

