
import { AccountsWidget } from '../components/AccountsWidget';

interface AccountsProps {
  currentNetwork: 'local' | 'testnet' | 'mainnet';
}

export function Accounts({ currentNetwork }: AccountsProps) {
  return (
    <div className="space-y-6">
      <AccountsWidget currentNetwork={currentNetwork} />
    </div>
  );
}