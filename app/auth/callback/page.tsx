'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Wallet, 
  ArrowRight,
  Copy,
  ExternalLink 
} from 'lucide-react';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function AuthCallbackPage() {
  const [authStatus, setAuthStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [walletStatus, setWalletStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [message, setMessage] = useState('Processing authentication...');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [showWalletSetup, setShowWalletSetup] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    handleAuthCallback();
  }, [searchParams]);

  const handleAuthCallback = async () => {
    try {
      const token = searchParams.get('token');
      
      if (!token) {
        setAuthStatus('error');
        setMessage('No token received from authentication provider.');
        return;
      }

      // Store token in localStorage
      localStorage.setItem('auth_token', token);
      
      // Skip authentication success state and go directly to wallet setup
      setAuthStatus('success');
      setShowWalletSetup(true);
      
      // Check if user already has a wallet
      await checkExistingWallet(token);
      
    } catch (error) {
      console.error('Error storing token:', error);
      setAuthStatus('error');
      setMessage('Failed to store authentication token.');
    }
  };

  const checkExistingWallet = async (token: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/wallet/info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data.hasWallet) {
          setWalletAddress(data.data.walletAddress);
          setWalletStatus('connected');
          setShowWalletSetup(false); // Hide setup since wallet already exists
          // Auto redirect after 3 seconds if wallet is already connected
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        }
        // If no wallet, showWalletSetup is already true from handleAuthCallback
      } else {
        // API call failed, but still show wallet setup
        console.log('Failed to check existing wallet, showing setup anyway');
      }
    } catch (error) {
      console.error('Error checking wallet:', error);
      // Even if checking fails, we still want to show wallet setup
    }
  };

  const connectWallet = async () => {
    try {
      setWalletStatus('connecting');
      setWalletError(null);

      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please make sure MetaMask is unlocked.');
      }

      const address = accounts[0];
      setWalletAddress(address);

      // Send wallet address to backend
      await createOrUpdateWallet(address);
      
      setWalletStatus('connected');
      
      // Redirect after successful wallet connection
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setWalletStatus('error');
      setWalletError(error.message || 'Failed to connect wallet');
    }
  };

  const createOrUpdateWallet = async (address: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // First try to create a new wallet
      let response = await fetch('http://localhost:3000/api/wallet/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
      });

      // If creation fails (wallet might already exist), try updating
      if (!response.ok) {
        response = await fetch('http://localhost:3000/api/wallet/update', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress: address }),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save wallet address');
      }

      const result = await response.json();
      console.log('Wallet saved successfully:', result);
      
    } catch (error: any) {
      console.error('Error saving wallet:', error);
      throw new Error(error.message || 'Failed to save wallet to backend');
    }
  };

  const handleSkipWallet = () => {
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  const handleManualRedirect = () => {
    window.location.href = '/';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {/* Only show header for processing and error states */}
          {authStatus !== 'success' && (
            <>
              <div className="flex justify-center mb-4">
                {authStatus === 'processing' && <Loader2 className="w-12 h-12 animate-spin text-blue-500" />}
                {authStatus === 'error' && <XCircle className="w-12 h-12 text-red-500" />}
              </div>
              
              <CardTitle className="text-2xl">
                {authStatus === 'processing' && 'Authenticating...'}
                {authStatus === 'error' && 'Authentication Failed'}
              </CardTitle>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Authentication Status - only show for non-success states */}
          {authStatus !== 'success' && (
            <div className="text-center">
              <p className="text-muted-foreground">{message}</p>
            </div>
          )}

          {/* Wallet Setup Section - show immediately after auth success */}
          {showWalletSetup && authStatus === 'success' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <Wallet className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Connect your crypto wallet to participate in events and receive winnings
              </p>

              {/* Always show connect button, but update based on status */}
              <div className="space-y-3">
                <Button 
                  onClick={connectWallet}
                  disabled={walletStatus === 'connecting'}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {walletStatus === 'connecting' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect MetaMask
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSkipWallet}
                  className="w-full"
                  disabled={walletStatus === 'connecting'}
                >
                  Skip for now
                </Button>
              </div>

              {/* Success state */}
              {walletStatus === 'connected' && walletAddress && (
                <div className="mt-4 space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800">Wallet Connected!</p>
                        <p className="text-sm text-green-600">
                          {formatAddress(walletAddress)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(walletAddress)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://etherscan.io/address/${walletAddress}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Badge className="w-full justify-center bg-green-100 text-green-800">
                    Redirecting to dashboard...
                  </Badge>
                </div>
              )}

              {/* Error state */}
              {walletStatus === 'error' && (
                <div className="mt-4 space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-medium text-red-800">Connection Failed</p>
                    <p className="text-sm text-red-600 mt-1">
                      {walletError}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Existing Wallet Display */}
          {walletAddress && walletStatus === 'connected' && !showWalletSetup && (
            <div className="space-y-4">
              <div className="border-t pt-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-800">Wallet Connected</p>
                      <p className="text-sm text-green-600">
                        {formatAddress(walletAddress)}
                      </p>
                    </div>
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <Badge className="w-full justify-center mt-3 bg-blue-100 text-blue-800">
                  Redirecting to dashboard...
                </Badge>
              </div>
            </div>
          )}

          {/* Manual Navigation */}
          {(authStatus !== 'processing' && !showWalletSetup) && (
            <Button
              onClick={handleManualRedirect}
              className="w-full bg-black hover:bg-gray-800"
            >
              Continue to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {/* MetaMask Installation Help */}
          {walletStatus === 'error' && walletError?.includes('MetaMask') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                Need MetaMask?
              </p>
              <p className="text-sm text-blue-600 mb-3">
                MetaMask is required to connect your wallet and participate in events.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://metamask.io/download/', '_blank')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Install MetaMask
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}