import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../context/WalletContext';
import { 
  FaWallet, 
  FaChevronDown, 
  FaCheckCircle, 
  FaEthereum,
  FaCopy,
  FaExternalLinkAlt,
  FaSpinner
} from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';

export function WalletConnectButton() {
  const { 
    account, 
    balance, 
    isConnected, 
    isLoading, 
    error,
    connectWallet, 
    disconnectWallet,
    formatAddress,
    formatBalance,
    chainId,
    getNetworkName
  } = useWallet();

  const [isOpen, setIsOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopyAddress = async () => {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getEtherscanUrl = () => {
    if (!account) return '#';
    const baseUrl = chainId === 1 ? 'https://etherscan.io' : 
                   chainId === 137 ? 'https://polygonscan.com' :
                   chainId === 56 ? 'https://bscscan.com' :
                   'https://etherscan.io';
    return `${baseUrl}/address/${account}`;
  };

  if (!mounted) {
    return (
      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white opacity-50 cursor-not-allowed">
        <FaWallet />
        Connect Wallet
      </button>
    );
  }

  if (isConnected && account) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-medium">{formatAddress(account)}</span>
          </div>
          {balance && (
            <span className="text-xs bg-primary-800 px-2 py-1 rounded-full">
              {formatBalance(balance)} ETH
            </span>
          )}
          <FaChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''} text-xs`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-secondary-200 z-50 overflow-hidden"
            >
              <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-secondary-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-500" />
                    <span className="font-medium text-secondary-900">Connected</span>
                  </div>
                  <span className="text-xs bg-primary-200 text-primary-700 px-2 py-1 rounded-full">
                    {chainId ? getNetworkName(chainId) : 'Unknown'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between bg-white rounded-lg p-2">
                  <span className="text-sm font-mono text-secondary-700 truncate">
                    {account}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopyAddress}
                      className="p-1 hover:bg-secondary-100 rounded transition-colors"
                      title="Copy address"
                    >
                      {copySuccess ? (
                        <FaCheckCircle className="text-green-500 text-sm" />
                      ) : (
                        <FaCopy className="text-secondary-500 text-sm" />
                      )}
                    </button>
                    <a
                      href={getEtherscanUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-secondary-100 rounded transition-colors"
                      title="View on Block Explorer"
                    >
                      <FaExternalLinkAlt className="text-secondary-500 text-sm" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-4 border-b border-secondary-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Balance</span>
                  <div className="flex items-center gap-2">
                    <FaEthereum className="text-primary-600" />
                    <span className="font-medium text-secondary-900">
                      {balance ? `${formatBalance(balance)} ETH` : 'Loading...'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={() => {
                    disconnectWallet();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiLogOut />
                  Disconnect
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={connectWallet}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <FaSpinner className="animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <FaWallet />
            Connect Wallet
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full mt-2 w-64 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 shadow-lg z-50">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}