#!/usr/bin/env node

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const PACKAGES_DIR = 'packages';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
};

// Check if terminal supports colors
const supportsColor = process.stdout.isTTY && process.env.TERM !== 'dumb';

function colorize(text, color) {
  if (!supportsColor) return text;
  return `${colors[color]}${text}${colors.reset}`;
}

function createTable(data, headers, options = {}) {
  const { maxWidth = 80, padding = 1 } = options;

  // Handle empty data
  if (data.length === 0) {
    const emptyRow = headers.map(() => '');
    data = [emptyRow];
  }

  // Calculate column widths more carefully
  const colWidths = headers.map((header, index) => {
    const headerStr = String(header);
    const maxDataWidth = Math.max(
      ...data.map(row => {
        const cellStr = String(row[index] || '');
        // Remove ANSI color codes for width calculation
        const cleanStr = cellStr.replace(/\x1b\[[0-9;]*m/g, '');
        return cleanStr.length;
      })
    );
    const headerWidth = headerStr.length;
    const calculatedWidth = Math.max(maxDataWidth, headerWidth);
    const maxAllowed = Math.max(8, Math.floor(maxWidth / headers.length));
    return Math.min(calculatedWidth, maxAllowed);
  });

  // Ensure minimum column width
  const minWidth = 8;
  colWidths.forEach((width, index) => {
    colWidths[index] = Math.max(width, minWidth);
  });

  // Create separator line
  const separator = colWidths
    .map(width => '─'.repeat(Math.max(1, width + padding * 2)))
    .join('┼');
  const topBorder = '┌' + separator.replace(/┼/g, '┬') + '┐';
  const bottomBorder = '└' + separator.replace(/┼/g, '┴') + '┘';
  const middleBorder = '├' + separator + '┤';

  // Create header
  const headerRow = headers
    .map((header, index) => {
      const headerStr = String(header);
      const padded = headerStr.padEnd(colWidths[index]);
      return ' '.repeat(padding) + padded + ' '.repeat(padding);
    })
    .join('│');

  // Create data rows
  const dataRows = data.map(row => {
    return row
      .map((cell, index) => {
        const cellStr = String(cell || '');
        // Remove ANSI color codes for truncation calculation
        const cleanStr = cellStr.replace(/\x1b\[[0-9;]*m/g, '');
        let truncated = cellStr;

        if (cleanStr.length > colWidths[index]) {
          // Find where to truncate while preserving color codes
          let visibleLength = 0;
          let truncateIndex = 0;

          for (let i = 0; i < cellStr.length; i++) {
            if (cellStr[i] === '\x1b') {
              // Skip ANSI escape sequence
              while (i < cellStr.length && cellStr[i] !== 'm') {
                i++;
              }
              continue;
            }
            visibleLength++;
            if (visibleLength > colWidths[index] - 3) {
              truncateIndex = i;
              break;
            }
          }

          if (truncateIndex > 0) {
            truncated = cellStr.substring(0, truncateIndex) + '...';
          }
        }

        const padded = truncated.padEnd(
          colWidths[index] + (cellStr.length - cleanStr.length)
        );
        return ' '.repeat(padding) + padded + ' '.repeat(padding);
      })
      .join('│');
  });

  return [
    topBorder,
    '│' + headerRow + '│',
    middleBorder,
    ...dataRows.map(row => '│' + row + '│'),
    bottomBorder,
  ];
}

function createProgressBar(current, total, width = 40) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  return `[${bar}] ${percentage}%`;
}

function runCommand(command, description) {
  try {
    const output = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
      cwd: process.cwd(),
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function getPackageInfo(packageName) {
  const packagePath = join(PACKAGES_DIR, packageName, 'package.json');

  if (!existsSync(packagePath)) {
    return null;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description || 'No description available',
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
      peerDependencies: packageJson.peerDependencies || {},
      keywords: packageJson.keywords || [],
      author: packageJson.author || 'Unknown',
      license: packageJson.license || 'MIT',
    };
  } catch (error) {
    console.error(
      `❌ Failed to read package.json for ${packageName}:`,
      error.message
    );
    return null;
  }
}

function getTypeExports(packageName) {
  const distPath = join(PACKAGES_DIR, packageName, 'dist');

  if (!existsSync(distPath)) {
    return { available: false, exports: [] };
  }

  try {
    // Find all .d.ts files in the dist directory
    const findDtsFiles = dir => {
      const files = [];
      const items = readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = join(dir, item.name);
        if (item.isDirectory()) {
          files.push(...findDtsFiles(fullPath));
        } else if (item.name.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
      return files;
    };

    const dtsFiles = findDtsFiles(distPath);

    if (dtsFiles.length === 0) {
      return { available: false, exports: [] };
    }

    const exports = [];

    // Process each .d.ts file
    for (const filePath of dtsFiles) {
      try {
        const typesContent = readFileSync(filePath, 'utf8');

        // Extract interface definitions
        const interfaces =
          typesContent.match(/export\s+interface\s+(\w+)/g) || [];
        interfaces.forEach(iface => {
          const name = iface.replace('export interface ', '');
          exports.push({ type: 'interface', name });
        });

        // Extract type definitions
        const types = typesContent.match(/export\s+type\s+(\w+)/g) || [];
        types.forEach(type => {
          const name = type.replace('export type ', '');
          exports.push({ type: 'type', name });
        });

        // Extract class definitions
        const classes = typesContent.match(/export\s+class\s+(\w+)/g) || [];
        classes.forEach(cls => {
          const name = cls.replace('export class ', '');
          exports.push({ type: 'class', name });
        });

        // Extract function definitions
        const functions =
          typesContent.match(/export\s+function\s+(\w+)/g) || [];
        functions.forEach(func => {
          const name = func.replace('export function ', '');
          exports.push({ type: 'function', name });
        });

        // Extract const definitions
        const constants = typesContent.match(/export\s+const\s+(\w+)/g) || [];
        constants.forEach(constant => {
          const name = constant.replace('export const ', '');
          exports.push({ type: 'const', name });
        });

        // Extract re-exported items (export { name } or export { name as alias })
        const reExports =
          typesContent.match(/export\s*\{\s*([^}]+)\s*\}/g) || [];
        reExports.forEach(reExport => {
          const content = reExport.replace(/export\s*\{\s*|\s*\}/g, '');
          const items = content.split(',').map(item => item.trim());
          items.forEach(item => {
            const name = item.split(/\s+as\s+/)[0].trim();
            if (name) {
              exports.push({ type: 'export', name });
            }
          });
        });
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    // Remove duplicates
    const uniqueExports = exports.filter(
      (exp, index, self) =>
        index ===
        self.findIndex(e => e.name === exp.name && e.type === exp.type)
    );

    return { available: true, exports: uniqueExports };
  } catch (error) {
    return { available: false, exports: [] };
  }
}

function getPackageDependencies(packageInfo) {
  const deps = {
    internal: [],
    external: [],
    dev: [],
  };

  // Internal dependencies (workspace packages)
  Object.entries(packageInfo.dependencies).forEach(([name, version]) => {
    if (name.startsWith('@conflux-devkit/')) {
      deps.internal.push({ name, version });
    } else {
      deps.external.push({ name, version });
    }
  });

  // Dev dependencies
  Object.entries(packageInfo.devDependencies).forEach(([name, version]) => {
    deps.dev.push({ name, version });
  });

  return deps;
}

function generateAsciiDiagram(packages) {
  const diagram = [];

  // Header with colors
  diagram.push(
    colorize(
      '┌─────────────────────────────────────────────────────────────────────────────────┐',
      'cyan'
    )
  );
  diagram.push(
    colorize(
      '│                    Conflux DevKit Package Relationship Map                     │',
      'cyan'
    )
  );
  diagram.push(
    colorize(
      '└─────────────────────────────────────────────────────────────────────────────────┘',
      'cyan'
    )
  );
  diagram.push('');

  // Core packages (foundation)
  const corePackages = packages.filter(
    pkg =>
      pkg.name.includes('core') ||
      pkg.name.includes('blockchain') ||
      pkg.name.includes('state')
  );

  diagram.push(colorize('🏗️  FOUNDATION LAYER', 'yellow'));
  const foundationData = corePackages.map(pkg => {
    const deps = getPackageDependencies(pkg);
    const internalDeps = deps.internal
      .map(dep => dep.name.split('/')[1])
      .join(', ');
    return [
      colorize(pkg.name.split('/')[1], 'green'),
      colorize(`v${pkg.version}`, 'blue'),
      internalDeps || 'none',
    ];
  });

  const foundationTable = createTable(
    foundationData,
    ['Package', 'Version', 'Dependencies'],
    { maxWidth: 100 }
  );
  diagram.push(...foundationTable);
  diagram.push('');

  // Node packages
  const nodePackages = packages.filter(
    pkg => pkg.name.includes('node') || pkg.name.includes('api-server')
  );

  diagram.push(colorize('🖥️  NODE LAYER', 'blue'));
  const nodeData = nodePackages.map(pkg => {
    const deps = getPackageDependencies(pkg);
    const internalDeps = deps.internal
      .map(dep => dep.name.split('/')[1])
      .join(', ');
    return [
      colorize(pkg.name.split('/')[1], 'green'),
      colorize(`v${pkg.version}`, 'blue'),
      internalDeps || 'none',
    ];
  });

  const nodeTable = createTable(
    nodeData,
    ['Package', 'Version', 'Dependencies'],
    { maxWidth: 100 }
  );
  diagram.push(...nodeTable);
  diagram.push('');

  // UI packages
  const uiPackages = packages.filter(
    pkg => pkg.name.includes('ui-') || pkg.name.includes('showcase')
  );

  diagram.push(colorize('🎨 UI LAYER', 'magenta'));
  const uiData = uiPackages.map(pkg => {
    const deps = getPackageDependencies(pkg);
    const internalDeps = deps.internal
      .map(dep => dep.name.split('/')[1])
      .join(', ');
    return [
      colorize(pkg.name.split('/')[1], 'green'),
      colorize(`v${pkg.version}`, 'blue'),
      internalDeps || 'none',
    ];
  });

  const uiTable = createTable(uiData, ['Package', 'Version', 'Dependencies'], {
    maxWidth: 100,
  });
  diagram.push(...uiTable);
  diagram.push('');

  // Dependency flow diagram with colors
  diagram.push(colorize('🔄 DEPENDENCY FLOW', 'cyan'));
  diagram.push('');

  // Create a cleaner, more aligned diagram with exact spacing
  const createFlowLine = content => {
    const cleanContent = content.replace(/\x1b\[[0-9;]*m/g, '');
    const contentLength = cleanContent.length;
    const paddingNeeded = 77 - contentLength; // 77 = 79 - 2 (for the │ characters)
    return '│' + content + ' '.repeat(paddingNeeded) + '│';
  };

  diagram.push(
    '┌─────────────────────────────────────────────────────────────────────────────────┐'
  );
  diagram.push(createFlowLine(''));
  diagram.push(createFlowLine('  ' + colorize('core', 'green') + ' ──┐'));
  diagram.push(
    createFlowLine('      ├──► ' + colorize('blockchain', 'green') + ' ──┐')
  );
  diagram.push(
    createFlowLine(
      '      └──► ' +
        colorize('state', 'green') +
        ' ───────┼──► ' +
        colorize('node', 'blue') +
        ' ──┐'
    )
  );
  diagram.push(
    createFlowLine(
      '                    │           ├──► ' +
        colorize('api-server', 'blue') +
        ' ──┐'
    )
  );
  diagram.push(
    createFlowLine(
      '                    │           └──► ' +
        colorize('showcase-webapp', 'magenta') +
        ' ────┼──► ' +
        colorize('ui-components', 'magenta')
    )
  );
  diagram.push(
    createFlowLine('                    │                             │')
  );
  diagram.push(
    createFlowLine(
      '                    └──► ' +
        colorize('ui-primitives', 'magenta') +
        ' ──────────┼──► ' +
        colorize('ui-components', 'magenta')
    )
  );
  diagram.push(
    createFlowLine('                                                      │')
  );
  diagram.push(createFlowLine(''));
  diagram.push(
    '└─────────────────────────────────────────────────────────────────────────────────┘'
  );
  diagram.push('');

  return diagram.join('\n');
}

function generateTypeMap(packages) {
  const typeMap = [];

  typeMap.push(colorize('📝 TYPE EXPORTS MAP', 'cyan'));

  // Create type data for table
  const typeData = packages.map(pkg => {
    // Use the actual directory name instead of package name
    const packageDir = pkg.name.split('/')[1];
    const actualDir = packageDir === 'node' ? 'devkit-node' : packageDir;
    const typeInfo = getTypeExports(actualDir);
    const shortName = packageDir;

    if (typeInfo.available && typeInfo.exports.length > 0) {
      // Group by type
      const byType = typeInfo.exports.reduce((acc, exp) => {
        if (!acc[exp.type]) acc[exp.type] = [];
        acc[exp.type].push(exp.name);
        return acc;
      }, {});

      const typeSummary = Object.entries(byType)
        .map(([type, names]) => `${type.toUpperCase()}: ${names.length}`)
        .join(', ');

      return [
        colorize(shortName, 'green'),
        colorize(typeInfo.exports.length.toString(), 'blue'),
        typeSummary || 'No types',
      ];
    } else {
      return [
        colorize(shortName, 'red'),
        colorize('0', 'red'),
        colorize('Not available (run build first)', 'dim'),
      ];
    }
  });

  const typeTable = createTable(typeData, ['Package', 'Total', 'Breakdown'], {
    maxWidth: 120,
  });
  typeMap.push(...typeTable);
  typeMap.push('');

  // Detailed type breakdown
  typeMap.push(colorize('📋 DETAILED TYPE BREAKDOWN', 'yellow'));
  packages.forEach(pkg => {
    // Use the actual directory name instead of package name
    const packageDir = pkg.name.split('/')[1];
    const actualDir = packageDir === 'node' ? 'devkit-node' : packageDir;
    const typeInfo = getTypeExports(actualDir);
    const shortName = packageDir;

    if (typeInfo.available && typeInfo.exports.length > 0) {
      typeMap.push(colorize(`\n${shortName}:`, 'green'));

      // Group by type
      const byType = typeInfo.exports.reduce((acc, exp) => {
        if (!acc[exp.type]) acc[exp.type] = [];
        acc[exp.type].push(exp.name);
        return acc;
      }, {});

      Object.entries(byType).forEach(([type, names]) => {
        const typeLabel = colorize(type.toUpperCase(), 'blue');
        const namesList = names.slice(0, 8).join(', '); // Show first 8
        const more =
          names.length > 8
            ? colorize(` (+${names.length - 8} more)`, 'dim')
            : '';
        typeMap.push(`  ${typeLabel}: ${namesList}${more}`);
      });
    }
  });

  return typeMap.join('\n');
}

function generateDependencyMatrix(packages) {
  const matrix = [];

  matrix.push(colorize('🔗 DEPENDENCY MATRIX', 'cyan'));

  // Create matrix data
  const shortNames = packages.map(pkg => pkg.name.split('/')[1]);
  const matrixData = packages.map(pkg => {
    const shortName = pkg.name.split('/')[1];
    const deps = getPackageDependencies(pkg);
    const internalDeps = deps.internal.map(dep => dep.name.split('/')[1]);

    const row = [colorize(shortName, 'green')];
    shortNames.forEach(targetName => {
      if (targetName === shortName) {
        row.push(colorize('self', 'yellow'));
      } else if (internalDeps.includes(targetName)) {
        row.push(colorize('✓', 'green'));
      } else {
        row.push(' ');
      }
    });

    return row;
  });

  const headers = ['Package', ...shortNames];
  const matrixTable = createTable(matrixData, headers, { maxWidth: 150 });
  matrix.push(...matrixTable);
  matrix.push('');
  matrix.push(
    colorize('Legend:', 'yellow') +
      ' ' +
      colorize('✓', 'green') +
      ' = depends on, ' +
      colorize('self', 'yellow') +
      ' = self-reference, blank = no dependency'
  );

  return matrix.join('\n');
}

function displayHelp() {
  console.log(
    colorize('🚀 Conflux DevKit Package Relationship Mapper', 'bright')
  );
  console.log('');
  console.log(colorize('Usage:', 'yellow') + ' pnpm package-map [options]');
  console.log('');
  console.log(colorize('Options:', 'yellow'));
  console.log('  --help, -h           Show this help message');
  console.log('  --types, -t          Show only type exports mapping');
  console.log('  --deps, -d           Show only dependency matrix');
  console.log('  --layers, -l         Show only package layers');
  console.log('  --summary, -s        Show only summary statistics');
  console.log('  --no-color           Disable colored output');
  console.log('  --filter <name>      Filter packages by name pattern');
  console.log('');
  console.log(colorize('Features:', 'yellow'));
  console.log('  • ASCII diagram of package relationships');
  console.log('  • Type exports mapping for each package');
  console.log('  • Dependency matrix showing inter-package connections');
  console.log('  • Detailed package information with statistics');
  console.log('  • Visual representation of the monorepo structure');
  console.log('  • Color-coded output for better readability');
  console.log('');
  console.log(colorize('Examples:', 'yellow'));
  console.log('  pnpm package-map                    # Show complete map');
  console.log('  pnpm package-map --types            # Show only type exports');
  console.log('  pnpm package-map --deps             # Show only dependencies');
  console.log(
    '  pnpm package-map --filter core      # Show only core-related packages'
  );
  console.log('  pnpm package-map --no-color         # Disable colors');
}

function displayPackageMap(options = {}) {
  const {
    showTypes = true,
    showDeps = true,
    showLayers = true,
    showSummary = true,
    filter = null,
  } = options;

  console.log(
    colorize('🚀 Conflux DevKit Package Relationship Mapper', 'bright')
  );
  console.log('');

  // Show progress
  process.stdout.write(colorize('📦 Scanning packages...', 'yellow'));

  // Get all packages
  let packages = readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => !name.startsWith('.')) // Exclude hidden directories
    .map(name => getPackageInfo(name))
    .filter(info => info !== null);

  // Apply filter if specified
  if (filter) {
    packages = packages.filter(
      pkg =>
        pkg.name.toLowerCase().includes(filter.toLowerCase()) ||
        pkg.description.toLowerCase().includes(filter.toLowerCase())
    );
  }

  console.log(colorize(` ✅ Found ${packages.length} packages`, 'green'));
  console.log('');

  // Generate and display ASCII diagram
  if (showLayers) {
    process.stdout.write(
      colorize('🏗️  Generating package relationships...', 'yellow')
    );
    console.log(colorize(' ✅', 'green'));
    console.log(generateAsciiDiagram(packages));
    console.log('');
  }

  // Generate and display type map
  if (showTypes) {
    process.stdout.write(colorize('📝 Analyzing type exports...', 'yellow'));
    console.log(colorize(' ✅', 'green'));
    console.log(generateTypeMap(packages));
    console.log('');
  }

  // Generate and display dependency matrix
  if (showDeps) {
    process.stdout.write(
      colorize('🔗 Building dependency matrix...', 'yellow')
    );
    console.log(colorize(' ✅', 'green'));
    console.log(generateDependencyMatrix(packages));
    console.log('');
  }

  // Package details with better formatting
  if (showSummary) {
    console.log(colorize('📋 PACKAGE DETAILS', 'cyan'));

    const packageDetails = packages.map(pkg => {
      const deps = getPackageDependencies(pkg);
      const typeInfo = getTypeExports(pkg.name.split('/')[1]);

      return [
        colorize(pkg.name.split('/')[1], 'green'),
        colorize(`v${pkg.version}`, 'blue'),
        colorize(pkg.license, 'yellow'),
        deps.internal.length.toString(),
        deps.external.length.toString(),
        deps.dev.length.toString(),
        typeInfo.available
          ? typeInfo.exports.length.toString()
          : colorize('N/A', 'red'),
      ];
    });

    const detailsTable = createTable(
      packageDetails,
      ['Package', 'Version', 'License', 'Internal', 'External', 'Dev', 'Types'],
      { maxWidth: 150 }
    );
    console.log(detailsTable.join('\n'));
    console.log('');

    // Summary statistics
    const totalTypes = packages.reduce((sum, pkg) => {
      const typeInfo = getTypeExports(pkg.name.split('/')[1]);
      return sum + (typeInfo.available ? typeInfo.exports.length : 0);
    }, 0);

    const totalDeps = packages.reduce((sum, pkg) => {
      const deps = getPackageDependencies(pkg);
      return (
        sum + deps.internal.length + deps.external.length + deps.dev.length
      );
    }, 0);

    console.log(colorize('📊 SUMMARY STATISTICS', 'cyan'));

    // Create summary table
    const summaryData = [
      [`Total Packages: ${colorize(packages.length.toString(), 'green')}`],
      [`Total Type Exports: ${colorize(totalTypes.toString(), 'blue')}`],
      [`Total Dependencies: ${colorize(totalDeps.toString(), 'yellow')}`],
    ];

    const summaryTable = createTable(summaryData, ['Metric'], { maxWidth: 60 });
    console.log(summaryTable.join('\n'));
  }
}

function main() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const options = {
    showTypes: true,
    showDeps: true,
    showLayers: true,
    showSummary: true,
    filter: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        displayHelp();
        return;
      case '--types':
      case '-t':
        options.showTypes = true;
        options.showDeps = false;
        options.showLayers = false;
        options.showSummary = false;
        break;
      case '--deps':
      case '-d':
        options.showTypes = false;
        options.showDeps = true;
        options.showLayers = false;
        options.showSummary = false;
        break;
      case '--layers':
      case '-l':
        options.showTypes = false;
        options.showDeps = false;
        options.showLayers = true;
        options.showSummary = false;
        break;
      case '--summary':
      case '-s':
        options.showTypes = false;
        options.showDeps = false;
        options.showLayers = false;
        options.showSummary = true;
        break;
      case '--no-color':
        // Disable colors by overriding the colorize function
        global.colorize = text => text;
        break;
      case '--filter':
        options.filter = args[i + 1];
        i++; // Skip next argument as it's the filter value
        break;
      default:
        if (arg.startsWith('--filter=')) {
          options.filter = arg.split('=')[1];
        }
        break;
    }
  }

  displayPackageMap(options);
}

main();
