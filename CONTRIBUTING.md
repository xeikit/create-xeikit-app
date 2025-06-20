# Contributing to create-xeikit-app

Thank you for your interest in contributing to create-xeikit-app! This document provides guidelines and information for contributors.

## 📋 Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/xeikit/create-xeikit-app.git
   cd create-xeikit-app
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Run development build**

   ```bash
   pnpm dev
   ```

4. **Test your changes**
   ```bash
   pnpm test
   ```

## 🔄 Release Process

We use a multi-stage release process with comprehensive safety checks to ensure reliable releases.

### Release Workflow

#### 1. Pre-release Preparation

- Ensure all changes are committed and pushed
- Verify you're on the `main` branch
- Run tests locally: `pnpm test`
- Check for any outstanding issues

#### 2. Choose Release Type

**Dry Run (Recommended First)**

```bash
pnpm release:dry
```

This will show you exactly what would happen without making any changes.

**Standard Release**

```bash
pnpm release:enhanced
```

Interactive release with all safety checks.

**Quick Release**

```bash
pnpm release:quick [release-type]
```

For urgent fixes, skips user confirmations.

#### 3. Release Types

- `patch`: Bug fixes (1.0.0 → 1.0.1)
- `minor`: New features (1.0.0 → 1.1.0)
- `major`: Breaking changes (1.0.0 → 2.0.0)
- `prerelease`: Pre-release version (1.0.0 → 1.0.1-0)

### Advanced Release Options

#### Skip Specific Steps

```bash
# Skip tests (not recommended)
node scripts/release.mjs --skip-tests

# Skip linting
node scripts/release.mjs --skip-lint

# Skip build
node scripts/release.mjs --skip-build
```

#### Combine Options

```bash
# Dry run with specific release type
node scripts/release.mjs --dry-run minor

# Quick patch release
node scripts/release.mjs --quick patch
```

### Release Checklist

Before releasing, make sure:

- [ ] All tests pass (`pnpm test:ci`)
- [ ] Code is properly linted (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] CHANGELOG.md is up to date
- [ ] Version number is appropriate for the changes
- [ ] No uncommitted changes
- [ ] On main/master branch

### Troubleshooting Releases

#### Common Issues

**"Working directory is not clean"**

- Commit or stash your changes
- Or use `--force` flag (not recommended)

**"Not on main branch"**

- Switch to main: `git checkout main`
- Or continue anyway (for hotfixes)

**"Tests failing"**

- Fix the failing tests
- Or use `--skip-tests` (not recommended)

**"Build failed"**

- Check build errors and fix them
- Ensure all dependencies are installed

#### Recovery from Failed Release

If a release fails partway through:

1. Check what stage failed from the error message
2. Fix the underlying issue
3. Run a dry run to verify: `pnpm release:dry`
4. Continue with the release

### Manual Release Steps

If you need to perform a manual release:

```bash
# 1. Lint and fix issues
pnpm lint:fix

# 2. Run tests
pnpm test:ci

# 3. Build the project
pnpm build

# 4. Generate changelog and version
changelogen --release --push

# 5. Publish to npm
pnpm publish
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in CI mode
pnpm test:ci

# Run tests with UI
pnpm test:ui
```

### Test Structure

- Unit tests: `__test__/`
- E2E tests: `__e2e__/`
- Coverage reports: `coverage/`

## 📝 Code Quality

### Linting and Formatting

We use Biome and Prettier for code quality:

```bash
# Check code quality
pnpm lint

# Auto-fix issues
pnpm lint:fix

# Run individual tools
pnpm biome
pnpm prettier
pnpm typecheck
```

### Pre-commit Hooks

Husky runs automatically before commits to ensure code quality.

## 🚀 Deployment

Releases are published to npm automatically after running the release script. The process includes:

1. Version bump in `package.json`
2. Changelog generation
3. Git tag creation
4. npm package publication

## 📄 Documentation

When making changes, please update:

- README.md for user-facing changes
- This CONTRIBUTING.md for development changes
- Code comments for complex logic
- Type definitions for API changes

## 🆘 Getting Help

If you need help:

1. Check existing issues on GitHub
2. Create a new issue with detailed information
3. Join our community discussions

## 📞 Contact

- GitHub: [@xeikit](https://github.com/xeikit)
- Issues: [GitHub Issues](https://github.com/xeikit/create-xeikit-app/issues)

---

Thank you for contributing! 🎉
