# Publishing @conflux-devkit/node

## Pre-publishing Checklist

✅ Package.json configured with proper exports and publishConfig
✅ README.md created
✅ Build process working correctly
✅ Both ESM and CJS imports tested successfully

## Publishing Steps

### 1. Build the package
```bash
pnpm build
```

### 2. Test locally (optional)
```bash
npm pack --dry-run
```

### 3. Login to npm (first time only)
```bash
npm login
```

### 4. Publish to npm
```bash
npm publish
```

### 5. Verify publication
```bash
npm view @conflux-devkit/node
```

## Version Management

Current version: 0.2.0

To bump version:
```bash
npm version patch  # 0.2.1
npm version minor  # 0.3.0
npm version major  # 1.0.0
```

## Package Structure

The published package includes:
- `dist/` - Built JavaScript and TypeScript definitions
- `README.md` - Package documentation
- `package.json` - Package metadata

## Usage in External Projects

After publishing, users can install and use:

```bash
npm install @conflux-devkit/node
```

```typescript
import { DevKit, CoreClient, EspaceClient } from '@conflux-devkit/node';
```