import { useState } from 'react';
import { DevKitApiService } from '../services/api';
import { useToast } from './Toast';
import type { AccountInfo, TransferRequest } from '../types/accounts';

interface WalletMethodsProps {
  account: AccountInfo;
  currentNetwork: 'local' | 'testnet' | 'mainnet';
}

export function WalletMethods({ account, currentNetwork }: WalletMethodsProps) {
  const [activeTab, setActiveTab] = useState<'transfer' | 'sign'>('transfer');
  const [transferForm, setTransferForm] = useState({
    recipient: '',
    amount: '',
    chain: 'core' as 'core' | 'evm'
  });
  const [signForm, setSignForm] = useState({
    message: '',
    chain: 'core' as 'core' | 'evm'
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transferForm.recipient || !transferForm.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Convert CFX to Drip (1 CFX = 10^18 Drip)
      const valueInDrip = (parseFloat(transferForm.amount) * Math.pow(10, 18)).toString();
      
      const transferRequest: TransferRequest = {
        accountIndex: account.index,
        to: transferForm.recipient,
        value: valueInDrip,
        chain: transferForm.chain
      };

      const result = await DevKitApiService.sendTransaction(transferRequest);
      
      toast.success(`Transaction sent! Hash: ${result.transactionHash.slice(0, 10)}...`);
      
      // Reset form
      setTransferForm({
        recipient: '',
        amount: '',
        chain: transferForm.chain
      });
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error('Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signForm.message) {
      toast.error('Please enter a message to sign');
      return;
    }

    setLoading(true);
    try {
      const signRequest = {
        accountIndex: account.index,
        message: signForm.message,
        chain: signForm.chain
      };

      const result = await DevKitApiService.signMessage(signRequest);
      
      toast.success(`Message signed successfully! Signature: ${result.signature.slice(0, 10)}...`);
      
      // Reset form
      setSignForm({
        message: '',
        chain: signForm.chain
      });
    } catch (error) {
      console.error('Sign message failed:', error);
      toast.error('Message signing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Wallet Operations - Account {account.index}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-gray-500">
            Network: {currentNetwork} • Chain: {transferForm.chain === 'core' ? 'Core Space' : 'eSpace'}
          </p>
          <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
            {currentNetwork === 'local' ? 'Local DevKit' : `DevKit API → ${currentNetwork}`}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            type="button"
            onClick={() => setActiveTab('transfer')}
            className={`py-2 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'transfer'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transfer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sign')}
            className={`py-2 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'sign'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sign Message
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'transfer' && (
          <form onSubmit={handleTransfer} className="space-y-4">
            {/* Chain Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chain
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={transferForm.chain === 'core'}
                    onChange={() => setTransferForm({ ...transferForm, chain: 'core' })}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Core Space</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={transferForm.chain === 'evm'}
                    onChange={() => setTransferForm({ ...transferForm, chain: 'evm' })}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">eSpace</span>
                </label>
              </div>
            </div>

            {/* Recipient Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={transferForm.recipient}
                onChange={(e) => setTransferForm({ ...transferForm, recipient: e.target.value })}
                placeholder={transferForm.chain === 'core' ? 'cfx:type.user:...' : '0x...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (CFX)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={transferForm.amount}
                onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                placeholder="0.000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !transferForm.recipient || !transferForm.amount}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send Transaction'
              )}
            </button>
          </form>
        )}

        {activeTab === 'sign' && (
          <form onSubmit={handleSignMessage} className="space-y-4">
            {/* Chain Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chain
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={signForm.chain === 'core'}
                    onChange={() => setSignForm({ ...signForm, chain: 'core' })}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Core Space</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={signForm.chain === 'evm'}
                    onChange={() => setSignForm({ ...signForm, chain: 'evm' })}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">eSpace</span>
                </label>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message to Sign
              </label>
              <textarea
                value={signForm.message}
                onChange={(e) => setSignForm({ ...signForm, message: e.target.value })}
                placeholder="Enter message to sign..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={!signForm.message}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}