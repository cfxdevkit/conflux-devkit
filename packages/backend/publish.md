# Publishing @conflux-devkit/backend

## Pre-publishing Checklist

✅ Package.json configured with proper exports and publishConfig
✅ README.md created with comprehensive documentation
✅ Build process working correctly (ESM only)
✅ TypeScript definitions generated
✅ CLI binary configured
✅ External dependencies properly configured

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
npm view @conflux-devkit/backend
```

## Version Management

Current version: 2.0.0

To bump version:
```bash
npm version patch  # 2.0.1
npm version minor  # 2.1.0
npm version major  # 3.0.0
```

## Package Structure

The published package includes:
- `dist/` - Built JavaScript (ESM) and TypeScript definitions
- `README.md` - Package documentation
- `package.json` - Package metadata

## Usage in External Projects

After publishing, users can install and use:

### As a Library
```bash
npm install @conflux-devkit/backend
```

```typescript
import { BackendServer } from '@conflux-devkit/backend';
```

### As a CLI Tool
```bash
npm install -g @conflux-devkit/backend
conflux-devkit-backend
```

## Notes

- Package is ESM-only (no CommonJS)
- Requires Node.js 18+
- Dependencies like `@conflux-devkit/node`, `viem`, etc. are external
- Users must install required dependencies