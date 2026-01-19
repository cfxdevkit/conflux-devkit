import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { DevKitProvider } from '../providers/DevKitProvider.js';
import { useBalance } from './useBalance.js';

describe('useBalance', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DevKitProvider apiUrl="http://localhost:3000" network="local">
      {children}
    </DevKitProvider>
  );

  it('fetches the mock balance when enabled', async () => {
    const { result } = renderHook(
      () =>
        useBalance({
          address: '0x123',
          chain: 'evm',
        }),
      { wrapper }
    );

    await waitFor(() => result.current.balance !== undefined);

    expect(result.current.balance).toBe('1000000000000000000');
    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.balance).toBe('1000000000000000000');
  });

  it('stays idle when disabled or missing address', () => {
    const { result } = renderHook(
      () =>
        useBalance({
          chain: 'evm',
          enabled: false,
        }),
      { wrapper }
    );

    expect(result.current.balance).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});
