import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const initWeb3 = async () => {
      try {
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const accounts = await web3Instance.eth.getAccounts();
          if (accounts.length > 0) {
            await handleConnection(web3Instance, accounts[0]);
          }

          setupEventListeners(web3Instance);
        }
      } catch (err) {
        setError('Failed to initialize Web3');
      }
    };

    initWeb3();
  }, [isClient]);

  const setupEventListeners = useCallback((web3Instance) => {
    if (!web3Instance || !window.ethereum) return;

    window.ethereum.on('accountsChanged', async (accounts) => {
      if (accounts.length > 0) {
        await handleConnection(web3Instance, accounts[0]);
      } else {
        disconnectWallet();
      }
    });

    window.ethereum.on('chainChanged', (chainId) => {
      setChainId(parseInt(chainId));
      window.location.reload();
    });

    window.ethereum.on('disconnect', () => {
      disconnectWallet();
      setError('Wallet disconnected');
    });
  }, []);

  const handleConnection = async (web3Instance, accountAddress) => {
    try {
      setAccount(accountAddress);
      setIsConnected(true);
      setError(null);

      const balanceWei = await web3Instance.eth.getBalance(accountAddress);
      const balanceEth = web3Instance.utils.fromWei(balanceWei, 'ether');
      setBalance(balanceEth);

      const chainId = await web3Instance.eth.getChainId();
      setChainId(chainId);
    } catch (err) {
      setError('Failed to load account data');
    }
  };

  const connectWallet = useCallback(async () => {
    if (!isClient) return;
    
    setIsLoading(true);
    setError(null);

    try {
      if (!window.ethereum) {
        setError('Please install MetaMask to continue.');
        setIsLoading(false);
        return;
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      let web3Instance = web3;
      if (!web3Instance) {
        web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        setupEventListeners(web3Instance);
      }
      await handleConnection(web3Instance, accounts[0]);
    } catch (err) {
      if (err.code === 4001) {
        setError('Connection rejected');
      } else {
        setError(err.message || 'Failed to connect wallet');
      }
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [isClient, web3, setupEventListeners]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setBalance(null);
    setChainId(null);
    setIsConnected(false);
    setError(null);
  }, []);

  const sendTransaction = useCallback(async (to, amount, data = '') => {
    if (!web3 || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      const transactionParameters = {
        from: account,
        to: to,
        value: web3.utils.toWei(amount.toString(), 'ether'),
        data: data,
      };

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      return txHash;
    } catch (err) {
      throw err;
    }
  }, [web3, account]);

  const formatAddress = useCallback((addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  const formatBalance = useCallback((bal) => {
    if (!bal) return '0';
    return parseFloat(bal).toFixed(4);
  }, []);

  const getNetworkName = useCallback((chainId) => {
    const networks = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai Testnet',
      56: 'BNB Smart Chain',
      97: 'BNB Testnet',
      43114: 'Avalanche C-Chain',
      42161: 'Arbitrum One',
      10: 'Optimism',
    };
    return networks[chainId] || 'Unknown Network';
  }, []);

  const value = {
    web3,
    account,
    balance,
    chainId,
    isConnected,
    isLoading,
    error,
    isClient,
    connectWallet,
    disconnectWallet,
    sendTransaction,
    formatAddress,
    formatBalance,
    getNetworkName,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}