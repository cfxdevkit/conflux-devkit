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

import { Alert, Anchor } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface TestMnemonicWarningProps {
  onConfigureClick: () => void;
}

export function TestMnemonicWarning({ onConfigureClick }: TestMnemonicWarningProps) {
  return (
    <Alert
      icon={<IconAlertTriangle size={16} />}
      color="yellow"
      variant="light"
      styles={{
        root: {
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          borderRadius: 0,
          zIndex: 100,
        },
      }}
    >
      ⚠️ <strong>Test Mnemonic Active</strong> - You are using the default test mnemonic. This is insecure for production.{' '}
      <Anchor component="button" onClick={onConfigureClick} fw={600}>
        Configure Wallet →
      </Anchor>
    </Alert>
  );
}
