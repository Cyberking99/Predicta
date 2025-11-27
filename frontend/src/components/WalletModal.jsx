import React, { useState } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { toast } from 'react-toastify';

export const WalletModal = ({ isOpen, onClose }) => {
  const { connectors, connect, isPending, error } = useConnect();
  const { isConnected } = useAccount();
  const [connectingConnector, setConnectingConnector] = useState(null);

  const handleConnect = async (connector) => {
    try {
      setConnectingConnector(connector.id);
      await connect({ connector });
      toast.success('Wallet connected successfully!');
      onClose();
    } catch (err) {
      console.error('Connection error:', err);
      toast.error(`Failed to connect: ${err?.message || 'Unknown error'}`);
    } finally {
      setConnectingConnector(null);
    }
  };

  // Close modal when wallet gets connected
  React.useEffect(() => {
    if (isConnected && isOpen) {
      onClose();
    }
  }, [isConnected, isOpen, onClose]);

  if (!isOpen) return null;

  const getConnectorIcon = (connectorName) => {
    switch (connectorName.toLowerCase()) {
      case 'metamask':
        return '🦊';
      case 'walletconnect':
        return '📱';
      case 'coinbase wallet':
        return '🔵';
      case 'injected':
        return '💼';
      default:
        return '🔗';
    }
  };

  const getConnectorDisplayName = (connector) => {
    if (connector.name === 'Injected') {
      return 'Browser Wallet';
    }
    return connector.name;
  };

  const getConnectorDescription = (connector) => {
    switch (connector.name.toLowerCase()) {
      case 'metamask':
        return 'Connect using MetaMask wallet';
      case 'walletconnect':
        return 'Scan with WalletConnect to connect';
      case 'coinbase wallet':
        return 'Connect using Coinbase Wallet';
      case 'injected':
        return 'Connect using browser wallet';
      default:
        return 'Connect using this wallet';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#01052D] rounded-2xl p-6 w-full max-w-md border-2 border-[#195281]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-semibold">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg">
            <p className="text-red-300 text-sm">
              Connection failed: {error.message}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {connectors
            .filter((connector) => connector.id !== 'safe') // Filter out Safe connector if not needed
            .map((connector) => (
            <button
              key={connector.id}
              disabled={isPending || connectingConnector === connector.id}
              onClick={() => handleConnect(connector)}
              className={`
                w-full flex items-center justify-between p-4 rounded-lg border transition-all
                ${connectingConnector === connector.id
                  ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400'
                  : 'bg-[#195281]/30 border-[#195281] text-white hover:bg-[#195281]/50 hover:border-cyan-400'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">
                  {getConnectorIcon(connector.name)}
                </span>
                <div className="text-left">
                  <div className="font-medium">
                    {getConnectorDisplayName(connector)}
                  </div>
                  <div className="text-xs opacity-70">
                    {getConnectorDescription(connector)}
                  </div>
                </div>
              </div>
              
              {connectingConnector === connector.id ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-400 border-t-transparent"></div>
              ) : (
                <span className="text-sm opacity-70">Connect</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            By connecting a wallet, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};
