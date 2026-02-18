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
 * Test Contracts
 *
 * Re-exports from @conflux-devkit/contracts/templates for backward compatibility.
 */

// Re-export everything from contracts package templates
export {
  getSimpleStorageContract,
  getTestTokenContract,
  SIMPLE_STORAGE_SOURCE,
  TEST_CONTRACTS,
  TEST_TOKEN_SOURCE,
  type TestContractName,
} from '@conflux-devkit/contracts/templates';

// Re-export CompilationOutput type for backward compatibility
export type { CompilationOutput } from '@conflux-devkit/contracts/compiler';
