"use client";
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wallet, 
  RefreshCw, 
  Lock, 
  Send, 
  Plus, 
  X, 
  ExternalLink, 
  Crown, 
  User, 
  DollarSign,
  Shield,
  AlertCircle,
  Loader2
} from "lucide-react";

// TypeScript interfaces
interface SwitchError {
  code: number;
  message: string;
}

// Contract ABI - Fixed to match your actual contract
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalAmount",
        "type": "uint256"
      }
    ],
    "name": "FundsDistributed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "FundsLocked",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "recipients",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "name": "distributeFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "host",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lockFunds",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

const CONTRACT_ADDRESS = "0xA3C96Ba32732199E1C8B9501A95D75Fc97E94405";

// Get contract instance
const getEthereumContract = (): ethers.Contract | null => {
  try {
    if (!window.ethereum) return null;
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    return contract;
  } catch (error) {
    console.error('Error getting contract:', error);
    return null;
  }
};

export default function EtherDistributionDApp() {
  const [account, setAccount] = useState<string>('');
  const [contractBalance, setContractBalance] = useState<string>('0');
  const [hostAddress, setHostAddress] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Lock funds state
  const [lockAmount, setLockAmount] = useState<string>('');
  
  // Distribution state
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [amounts, setAmounts] = useState<string[]>(['']);

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      await switchToFujiNetwork();
      setAccount(accounts[0]);
      await updateContractInfo();

    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      alert('Error connecting wallet: ' + (error?.message || 'Unknown error'));
    }
  };

  // Switch to Fuji network
  const switchToFujiNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xA869' }], // 43113 in hex
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0xA869',
              chainName: 'Avalanche Fuji Testnet',
              nativeCurrency: {
                name: 'AVAX',
                symbol: 'AVAX',
                decimals: 18,
              },
              rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
              blockExplorerUrls: ['https://testnet.snowtrace.io/'],
            },
          ],
        });
      }
    }
  };

  // Update contract information
  const updateContractInfo = async () => {
    try {
      const contract = getEthereumContract();
      if (!contract) return;
      
      const balance = await contract.getBalance();
      const balanceInEther = ethers.utils.formatEther(balance);
      
      const host = await contract.host();
      
      setContractBalance(parseFloat(balanceInEther).toFixed(6));
      setHostAddress(host);
      setIsHost(account.toLowerCase() === host.toLowerCase());
      
      console.log('Contract updated:', {
        balance: balanceInEther,
        host: host,
        isHost: account.toLowerCase() === host.toLowerCase()
      });
      
    } catch (error) {
      console.error('Error updating contract info:', error);
      setContractBalance('0');
      setHostAddress('Error loading');
      setIsHost(false);
    }
  };

  // Lock funds
  const lockFunds = async () => {
    if (!lockAmount || parseFloat(lockAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    setLoading(true);
    try {
      const contract = getEthereumContract();
      if (!contract) {
        throw new Error('Contract not available');
      }
      
      const amountInWei = ethers.utils.parseEther(lockAmount);
      
      console.log('Locking funds:', {
        amount: lockAmount,
        amountInWei: amountInWei.toString()
      });
      
      const transaction = await contract.lockFunds({
        value: amountInWei,
        gasLimit: 300000
      });
      
      console.log('Transaction sent:', transaction.hash);
      alert('Transaction sent! Hash: ' + transaction.hash);
      
      const receipt = await transaction.wait();
      console.log('Transaction confirmed:', receipt);
      alert('Funds locked successfully!');
      
      setLockAmount('');
      await updateContractInfo();
      
    } catch (error: any) {
      console.error('Error locking funds:', error);
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        alert('Insufficient funds for transaction');
      } else if (error.code === 'USER_REJECTED') {
        alert('Transaction rejected by user');
      } else if (error.message?.includes('execution reverted')) {
        alert('Transaction failed: ' + (error.reason || 'Contract execution reverted'));
      } else {
        alert('Error locking funds: ' + (error?.message || 'Unknown error'));
      }
    }
    setLoading(false);
  };

  // Distribute funds - Fixed to check contract balance first
  const distributeFunds = async () => {
    const validRecipients = recipients.filter((addr, i) => addr && amounts[i] && parseFloat(amounts[i]) > 0);
    const validAmounts = amounts.filter((amt, i) => amt && recipients[i] && parseFloat(amt) > 0);
    
    if (validRecipients.length === 0) {
      alert('Please add at least one valid recipient and amount');
      return;
    }
    
    // Check if total amount exceeds contract balance
    const totalAmount = validAmounts.reduce((sum, amt) => sum + parseFloat(amt), 0);
    const currentBalance = parseFloat(contractBalance);
    
    if (totalAmount > currentBalance) {
      alert(`Total distribution amount (${totalAmount} AVAX) exceeds contract balance (${currentBalance} AVAX)`);
      return;
    }
    
    setLoading(true);
    try {
      const contract = getEthereumContract();
      if (!contract) {
        throw new Error('Contract not available');
      }
      
      const amountsInWei = validAmounts.map(amount => ethers.utils.parseEther(amount));
      
      console.log('Distributing funds:', {
        recipients: validRecipients,
        amounts: validAmounts,
        amountsInWei: amountsInWei.map(amt => amt.toString()),
        totalAmount: totalAmount,
        contractBalance: currentBalance
      });
      
      // Estimate gas first
      try {
        const gasEstimate = await contract.estimateGas.distributeFunds(validRecipients, amountsInWei);
        console.log('Gas estimate:', gasEstimate.toString());
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        throw new Error('Transaction would fail. Please check recipient addresses and amounts.');
      }
      
      const transaction = await contract.distributeFunds(validRecipients, amountsInWei, {
        gasLimit: 500000
      });
      
      console.log('Distribution transaction sent:', transaction.hash);
      alert('Distribution transaction sent! Hash: ' + transaction.hash);
      
      const receipt = await transaction.wait();
      console.log('Distribution confirmed:', receipt);
      alert('Funds distributed successfully!');
      
      setRecipients(['']);
      setAmounts(['']);
      await updateContractInfo();
      
    } catch (error: any) {
      console.error('Error distributing funds:', error);
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        alert('Insufficient funds for distribution');
      } else if (error.code === 'USER_REJECTED') {
        alert('Transaction rejected by user');
      } else if (error.message?.includes('execution reverted')) {
        alert('Distribution failed: ' + (error.reason || 'Check contract balance and recipient addresses'));
      } else if (error.message?.includes('Transaction would fail')) {
        alert(error.message);
      } else {
        alert('Error distributing funds: ' + (error?.message || 'Unknown error'));
      }
    }
    setLoading(false);
  };

  // Send direct AVAX to contract (triggers receive function)
  const sendDirectToContract = async () => {
    if (!lockAmount || parseFloat(lockAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const amountInWei = ethers.utils.parseEther(lockAmount);
      
      const transaction = await signer.sendTransaction({
        to: CONTRACT_ADDRESS,
        value: amountInWei,
        gasLimit: 100000
      });
      
      console.log('Direct send transaction:', transaction.hash);
      alert('Transaction sent! Hash: ' + transaction.hash);
      
      const receipt = await transaction.wait();
      console.log('Transaction confirmed:', receipt);
      alert('Funds sent successfully!');
      
      setLockAmount('');
      await updateContractInfo();
      
    } catch (error: any) {
      console.error('Error sending funds:', error);
      alert('Error sending funds: ' + (error?.message || 'Unknown error'));
    }
    setLoading(false);
  };

  // Add recipient field
  const addRecipient = () => {
    setRecipients([...recipients, '']);
    setAmounts([...amounts, '']);
  };

  // Remove recipient field
  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
    setAmounts(amounts.filter((_, i) => i !== index));
  };

  // Update recipient address
  const updateRecipient = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  // Update amount
  const updateAmount = (index: number, value: string) => {
    const newAmounts = [...amounts];
    newAmounts[index] = value;
    setAmounts(newAmounts);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount('');
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  // Update contract info when account changes
  useEffect(() => {
    if (account) {
      updateContractInfo();
    }
  }, [account]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
              <Shield className="w-8 h-8" />
              Ether Distribution DApp
            </h1>
            <p className="text-gray-300 text-lg">Powered by Ethers.js | Avalanche Fuji Testnet</p>
            <Badge variant="outline" className="mt-3 bg-white/10 text-white border-white/20">
              Contract: {CONTRACT_ADDRESS}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {!account ? (
          <div className="text-center space-y-6">
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Connect Your Wallet
                </CardTitle>
                <CardDescription>
                  Connect MetaMask to interact with the smart contract
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={connectWallet}
                  className="w-full h-12"
                  size="lg"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect MetaMask
                </Button>
                
                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    Make sure you have MetaMask installed and some Fuji AVAX for gas fees
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href="https://faucet.avax.network/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      Get free Fuji AVAX
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Contract Information
                </CardTitle>
                <CardDescription>
                  View contract details and your connection status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Your Address</Label>
                    <p className="font-mono text-sm bg-gray-50 p-2 rounded border break-all">{account}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Contract Balance</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                        {contractBalance} AVAX
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Host Address</Label>
                    <p className="font-mono text-sm bg-gray-50 p-2 rounded border break-all">{hostAddress}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Your Role</Label>
                    <Badge variant={isHost ? "default" : "secondary"} className="text-sm">
                      {isHost ? (
                        <>
                          <Crown className="w-4 h-4 mr-1" />
                          HOST
                        </>
                      ) : (
                        <>
                          <User className="w-4 h-4 mr-1" />
                          USER
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <Button
                    onClick={updateContractInfo}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Info
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isHost ? (
              <>
                {/* Lock Funds */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Send Funds to Contract
                    </CardTitle>
                    <CardDescription>
                      Lock AVAX in the contract for later distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (AVAX)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.001"
                          min="0"
                          value={lockAmount}
                          onChange={(e) => setLockAmount(e.target.value)}
                          placeholder="0.0"
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={lockFunds}
                          disabled={loading || !lockAmount || parseFloat(lockAmount) <= 0}
                          className="flex-1"
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Lock className="w-4 h-4 mr-2" />
                          )}
                          Lock Funds
                        </Button>
                        <Button
                          onClick={sendDirectToContract}
                          disabled={loading || !lockAmount || parseFloat(lockAmount) <= 0}
                          variant="outline"
                          className="flex-1"
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Direct Send
                        </Button>
                      </div>
                      
                      <div className="text-xs text-gray-600 space-y-1 p-3 bg-gray-50 rounded">
                        <p><strong>Lock:</strong> Calls lockFunds() function</p>
                        <p><strong>Direct Send:</strong> Direct transfer (triggers receive() function)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Distribute Funds */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      Distribute Funds
                    </CardTitle>
                    <CardDescription>
                      Send AVAX from contract to multiple recipients
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recipients.map((recipient, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex gap-3 items-start">
                            <div className="flex-1 space-y-2">
                              <Label htmlFor={`recipient-${index}`}>Recipient Address</Label>
                              <Input
                                id={`recipient-${index}`}
                                type="text"
                                value={recipient}
                                onChange={(e) => updateRecipient(index, e.target.value)}
                                placeholder="0x..."
                              />
                            </div>
                            <div className="w-32 space-y-2">
                              <Label htmlFor={`amount-${index}`}>Amount</Label>
                              <Input
                                id={`amount-${index}`}
                                type="number"
                                step="0.001"
                                min="0"
                                value={amounts[index]}
                                onChange={(e) => updateAmount(index, e.target.value)}
                                placeholder="0.0"
                              />
                            </div>
                            {recipients.length > 1 && (
                              <Button
                                onClick={() => removeRecipient(index)}
                                variant="destructive"
                                size="sm"
                                className="mt-6"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}

                      {/* Show total amount */}
                      {recipients.some((addr, i) => addr && amounts[i] && parseFloat(amounts[i]) > 0) && (
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                Total to distribute: {
                                  amounts.reduce((sum, amt, i) => {
                                    return recipients[i] && amt && parseFloat(amt) > 0 
                                      ? sum + parseFloat(amt) 
                                      : sum;
                                  }, 0).toFixed(6)
                                } AVAX
                              </p>
                              <p className="text-xs text-gray-600">
                                Contract balance: {contractBalance} AVAX
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div className="flex gap-3">
                        <Button
                          onClick={addRecipient}
                          variant="outline"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Recipient
                        </Button>
                        <Button
                          onClick={distributeFunds}
                          disabled={loading}
                          className="flex-1"
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          {loading ? 'Distributing...' : 'Distribute Funds'}
                        </Button>
                      </div>
                      
                      <p className="text-xs text-gray-600 p-3 bg-gray-50 rounded">
                        This calls distributeFunds() to send AVAX from contract to multiple recipients
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    Not Authorized
                  </CardTitle>
                  <CardDescription>
                    Only the contract host can lock and distribute funds
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600">
                    You can view the contract state but cannot perform transactions.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Useful Links
                </CardTitle>
                <CardDescription>
                  External resources and contract information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={`https://testnet.snowtrace.io/address/${CONTRACT_ADDRESS}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      View Contract
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href="https://faucet.avax.network/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      Get Fuji AVAX
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}