# Contributing to Conflux DevKit

<!--
Copyright 2025 Conflux DevKit Team

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

We welcome contributions to Conflux DevKit! This document provides guidelines for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Coding Standards](#coding-standards)
- [License Requirements](#license-requirements)
- [Testing](#testing)
- [Documentation](#documentation)

## 🤝 Code of Conduct

This project adheres to the Contributor Covenant code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/conflux-devkit.git
   cd conflux-devkit
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/cfxdevkit/conflux-devkit.git
   ```

## 🛠️ Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development environment
pnpm dev
```

### Project Structure

```
conflux-devkit/
├── packages/
│   ├── node/           # Core library and node management
│   ├── backend/        # REST API and WebSocket services
│   └── frontend/       # React frontend application
├── contracts/          # Smart contract development
├── scripts/           # Build and utility scripts
└── shared/            # Shared configuration and types
```

## 🔄 Contributing Process

### 1. Create an Issue

Before starting work, please:
- Search existing issues to avoid duplicates
- Create a new issue describing the feature or bug
- Wait for maintainer feedback before starting work on large features

### 2. Create a Feature Branch

```bash
# Update your fork
git fetch upstream
git checkout main
git merge upstream/main

# Create a feature branch
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes

- Follow the coding standards outlined below
- Add appropriate tests for your changes
- Update documentation as needed
- Ensure all existing tests pass

### 4. Commit Your Changes

Use conventional commit messages:

```bash
git commit -m "feat: add new contract deployment feature"
git commit -m "fix: resolve WebSocket connection issue"
git commit -m "docs: update API documentation"
```

Commit types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub with:
- Clear title and description
- Reference to related issues
- Screenshots/demos for UI changes
- List of breaking changes (if any)

## 📝 Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing code style and formatting
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer functional programming patterns where appropriate

### Code Quality

Before submitting, ensure your code passes:

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Formatting
pnpm format

# All checks
pnpm check
```

### File Organization

- Keep files focused and single-purpose
- Use barrel exports (index.ts) for clean imports
- Follow existing naming conventions
- Place types in appropriate `.types.ts` files

## ⚖️ License Requirements

### License Headers

All new source files must include the Apache 2.0 license header:

```typescript
/*
 * Copyright 2025 Conflux DevKit Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
```

### Contributor License Agreement

By contributing to this project, you:
- Grant the Conflux DevKit Team a perpetual, worldwide license to use your contributions
- Confirm that you have the right to grant this license
- Agree that your contributions will be licensed under Apache 2.0

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test --filter=@conflux-devkit/node

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Writing Tests

- Write unit tests for all new functionality
- Use descriptive test names
- Follow the existing test structure
- Mock external dependencies appropriately
- Aim for high test coverage on critical paths

### Test Structure

```typescript
describe('FeatureName', () => {
  describe('when condition', () => {
    it('should behave correctly', () => {
      // Arrange
      const input = createTestInput();
      
      // Act
      const result = performAction(input);
      
      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

## 📖 Documentation

### Code Documentation

- Use JSDoc for public APIs
- Include examples in documentation
- Document complex algorithms and business logic
- Keep documentation up-to-date with code changes

### README Updates

When adding new features:
- Update relevant README files
- Add usage examples
- Update API documentation
- Consider adding to the main project README

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the bug
3. **Expected behavior** vs actual behavior
4. **Environment details** (OS, Node version, etc.)
5. **Console logs** or error messages
6. **Screenshots** if applicable

## 💡 Feature Requests

When requesting features:

1. **Describe the problem** you're trying to solve
2. **Propose a solution** or approach
3. **Consider alternatives** you've evaluated
4. **Provide use cases** and examples
5. **Discuss breaking changes** if applicable

## 🏷️ Release Process

The project follows semantic versioning (SemVer):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

Releases are handled by maintainers and include:
- Automated changelog generation
- Version bumping across all packages
- Git tagging and GitHub releases
- npm package publishing

## 📞 Getting Help

- **GitHub Discussions**: For questions and general discussion
- **GitHub Issues**: For bug reports and feature requests
- **Discord/Telegram**: Community chat (links in README)

## 🙏 Recognition

Contributors are recognized in:
- GitHub contributor graphs
- Release changelogs
- Project documentation
- Community acknowledgments

Thank you for contributing to Conflux DevKit! Your efforts help build better developer tools for the Conflux ecosystem.

---

**Conflux DevKit Team**