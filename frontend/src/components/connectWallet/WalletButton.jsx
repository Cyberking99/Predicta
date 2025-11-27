import React, { useState } from 'react';
import { useAccount, useDisconnect, useEnsName, useEnsAvatar } from 'wagmi';
import { WalletModal } from '../WalletModal';

export const WalletButton = ({ className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName });

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-2 justify-center ${className}`}
        >
          {ensAvatar && (
            <img src={ensAvatar} alt="ENS Avatar" className="w-6 h-6 rounded-full" />
          )}
          <span className="font-medium">
            {ensName || formatAddress(address)}
          </span>
        </button>

        {/* Account Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#01052D] rounded-2xl p-6 w-full max-w-sm border-2 border-[#195281]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-lg font-semibold">Account</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>

              <div className="text-center mb-6">
                {ensAvatar && (
                  <img 
                    src={ensAvatar} 
                    alt="ENS Avatar" 
                    className="w-16 h-16 rounded-full mx-auto mb-3" 
                  />
                )}
                <p className="text-white font-medium">
                  {ensName || formatAddress(address)}
                </p>
                {ensName && (
                  <p className="text-gray-400 text-sm">
                    {formatAddress(address)}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  disconnect();
                  setIsModalOpen(false);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-all"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={isConnecting}
        className={className}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      
      <WalletModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};