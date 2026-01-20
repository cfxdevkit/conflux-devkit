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

/**
 * CLI Display Utilities
 *
 * Helpers for formatting tables, lists, and data displays.
 */

import Table from 'cli-table3';
import { chalk } from './logger.js';

export interface TableOptions {
  head: string[];
  colWidths?: number[];
}

/**
 * Create a styled table for CLI output
 */
export function createTable(options: TableOptions): Table.Table {
  const tableConfig: Table.TableConstructorOptions = {
    head: options.head.map((h) => chalk.cyan(h)),
    style: {
      head: [],
      border: [],
    },
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
  };

  // Only add colWidths if explicitly provided
  if (options.colWidths) {
    tableConfig.colWidths = options.colWidths;
  }

  return new Table(tableConfig);
}

/**
 * Format an address for display (truncate middle)
 */
export function formatAddress(
  address: string,
  prefixLen = 10,
  suffixLen = 6
): string {
  if (address.length <= prefixLen + suffixLen + 3) {
    return address;
  }
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format a status indicator
 */
export function formatStatus(isActive: boolean): string {
  return isActive ? chalk.green('●') : chalk.dim('○');
}

/**
 * Format boolean as Yes/No
 */
export function formatBool(value: boolean): string {
  return value ? chalk.green('Yes') : chalk.dim('No');
}
