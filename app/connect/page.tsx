'use client';

import { useState, useEffect } from 'react';

interface WalletState {
  isConnected: boolean;
  account: string | null;
  balance: string | null;
  chainId: string | null;
  isMetaMaskInstalled: boolean;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function ConnectPage() {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    account: null,
    balance: null,
    chainId: null,
    isMetaMaskInstalled: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkMetaMaskInstallation();
    if (window.ethereum) {
      checkConnection();
      setupEventListeners();
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  const checkMetaMaskInstallation = () => {
    const isInstalled = typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask;
    setWallet(prev => ({ ...prev, isMetaMaskInstalled: isInstalled }));
  };

  const checkConnection = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        const account = accounts[0];
        const balance = await getBalance(account);
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        setWallet(prev => ({
          ...prev,
          isConnected: true,
          account,
          balance,
          chainId
        }));
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const getBalance = async (account: string): Promise<string> => {
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [account, 'latest']
      });
      // Convert from Wei to ETH
      return (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0.0000';
    }
  };

  const setupEventListeners = () => {
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      setWallet(prev => ({
        ...prev,
        isConnected: false,
        account: null,
        balance: null
      }));
    } else {
      const account = accounts[0];
      const balance = await getBalance(account);
      setWallet(prev => ({
        ...prev,
        account,
        balance
      }));
    }
  };

  const handleChainChanged = (chainId: string) => {
    setWallet(prev => ({ ...prev, chainId }));
    // Reload the page to avoid state issues
    window.location.reload();
  };

  const handleDisconnect = () => {
    setWallet(prev => ({
      ...prev,
      isConnected: false,
      account: null,
      balance: null,
      chainId: null
    }));
  };

  const connectWallet = async () => {
    if (!wallet.isMetaMaskInstalled) {
      setError('MetaMask is not installed. Please install MetaMask extension.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        const account = accounts[0];
        const balance = await getBalance(account);
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });

        setWallet(prev => ({
          ...prev,
          isConnected: true,
          account,
          balance,
          chainId
        }));
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        setError('Connection rejected by user');
      } else {
        setError('Failed to connect wallet');
      }
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWallet(prev => ({
      ...prev,
      isConnected: false,
      account: null,
      balance: null,
      chainId: null
    }));
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId: string) => {
    const networks: { [key: string]: string } = {
      '0x1': 'Ethereum Mainnet',
      '0x3': 'Ropsten Testnet',
      '0x4': 'Rinkeby Testnet',
      '0x5': 'Goerli Testnet',
      '0x2a': 'Kovan Testnet',
      '0x38': 'BSC Mainnet',
      '0x61': 'BSC Testnet',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Polygon Mumbai'
    };
    return networks[chainId] || `Network ${chainId}`;
  };

  const copyAddress = () => {
    if (wallet.account) {
      navigator.clipboard.writeText(wallet.account);
      // You could add a toast notification here
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-xl text-gray-600">
            Connect your MetaMask wallet to access exclusive features and participate in events
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* MetaMask Logo and Status */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">MetaMask Wallet</h2>
            <p className="text-gray-600">
              {wallet.isMetaMaskInstalled 
                ? 'MetaMask detected' 
                : 'MetaMask not installed'
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800 font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Not Installed State */}
          {!wallet.isMetaMaskInstalled && (
            <div className="text-center">
              <div className="mb-6">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">MetaMask Required</h3>
                <p className="text-gray-500 mb-6">
                  You need to install MetaMask browser extension to connect your wallet
                </p>
              </div>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 font-semibold"
              >
                <span>Install MetaMask</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {/* Not Connected State */}
          {wallet.isMetaMaskInstalled && !wallet.isConnected && (
            <div className="text-center">
              <div className="mb-6">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Connect Your Wallet</h3>
                <p className="text-gray-500 mb-6">
                  Connect your MetaMask wallet to access all features
                </p>
              </div>
              <button
                onClick={connectWallet}
                disabled={loading}
                className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:transform active:scale-95 shadow-sm hover:shadow-md'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>Connect Wallet</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Connected State */}
          {wallet.isConnected && wallet.account && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Wallet Connected</h3>
                <p className="text-gray-600">Your MetaMask wallet is successfully connected</p>
              </div>

              {/* Wallet Info */}
              <div className="space-y-4 mb-6">
                {/* Account Address */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Account Address</label>
                      <div className="font-mono text-gray-900">{formatAddress(wallet.account)}</div>
                    </div>
                    <button
                      onClick={copyAddress}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      title="Copy full address"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Balance */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-sm font-medium text-gray-700 block mb-1">Balance</label>
                  <div className="text-2xl font-bold text-gray-900">{wallet.balance} ETH</div>
                </div>

                {/* Network */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-sm font-medium text-gray-700 block mb-1">Network</label>
                  <div className="text-gray-900">{wallet.chainId ? getNetworkName(wallet.chainId) : 'Unknown'}</div>
                </div>
              </div>

              {/* Disconnect Button */}
              <div className="text-center">
                <button
                  onClick={disconnectWallet}
                  className="px-6 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors duration-200 font-medium"
                >
                  Disconnect Wallet
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Secure</h3>
            <p className="text-sm text-gray-600">Your wallet keys never leave your device</p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Fast</h3>
            <p className="text-sm text-gray-600">Instant connection and transactions</p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Exclusive</h3>
            <p className="text-sm text-gray-600">Access premium events and features</p>
          </div>
        </div>
      </div>
    </div>
  );
}