"use client";
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🚀 Ether Distribution DApp</h1>
          <p className="text-blue-200">Powered by Ethers.js | Avalanche Fuji Testnet</p>
          <p className="text-xs text-gray-400 mt-2 break-all">Contract: {CONTRACT_ADDRESS}</p>
        </div>

        {!account ? (
          <div className="text-center">
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-10 rounded-xl transition duration-200 transform hover:scale-105 shadow-lg"
            >
              🦊 Connect MetaMask
            </button>
            <div className="mt-6 text-center">
              <p className="text-gray-300 text-sm mb-2">
                Make sure you have MetaMask installed and some Fuji AVAX for gas fees
              </p>
              <a 
                href="https://faucet.avax.network/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-lg transition duration-200 text-sm"
              >
                💰 Get free Fuji AVAX
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                📊 Contract Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-300">Your Address:</p>
                  <p className="text-white font-mono break-all">{account}</p>
                </div>
                <div>
                  <p className="text-gray-300">Contract Balance:</p>
                  <p className="text-white font-bold text-lg">{contractBalance} AVAX</p>
                </div>
                <div>
                  <p className="text-gray-300">Host Address:</p>
                  <p className="text-white font-mono break-all">{hostAddress}</p>
                </div>
                <div>
                  <p className="text-gray-300">Your Role:</p>
                  <p className={`font-bold text-lg ${isHost ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isHost ? '👑 HOST' : '👤 USER'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/20">
                <button
                  onClick={updateContractInfo}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-4 py-2 rounded-lg transition duration-200 text-sm"
                >
                  🔄 Refresh Info
                </button>
              </div>
            </div>

            {isHost && (
              <>
                {/* Lock Funds */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                    🔒 Send Funds to Contract
                  </h2>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-gray-300 mb-2">Amount (AVAX)</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={lockAmount}
                        onChange={(e) => setLockAmount(e.target.value)}
                        placeholder="0.0"
                        className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={lockFunds}
                        disabled={loading || !lockAmount || parseFloat(lockAmount) <= 0}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-semibold transition duration-200"
                      >
                        {loading ? '⏳' : '🔒'} Lock
                      </button>
                      <button
                        onClick={sendDirectToContract}
                        disabled={loading || !lockAmount || parseFloat(lockAmount) <= 0}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-semibold transition duration-200"
                      >
                        {loading ? '⏳' : '📤'} Send
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 space-y-1">
                    <p>🔒 <strong>Lock:</strong> Calls lockFunds() function</p>
                    <p>📤 <strong>Send:</strong> Direct transfer (triggers receive() function)</p>
                  </div>
                </div>

                {/* Distribute Funds */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                    📤 Distribute Funds
                  </h2>
                  
                  <div className="space-y-3 mb-4">
                    {recipients.map((recipient, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={recipient}
                            onChange={(e) => updateRecipient(index, e.target.value)}
                            placeholder="Recipient address (0x...)"
                            className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                          />
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={amounts[index]}
                            onChange={(e) => updateAmount(index, e.target.value)}
                            placeholder="Amount"
                            className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                          />
                        </div>
                        {recipients.length > 1 && (
                          <button
                            onClick={() => removeRecipient(index)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-3 rounded-lg transition duration-200"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Show total amount */}
                  {recipients.some((addr, i) => addr && amounts[i] && parseFloat(amounts[i]) > 0) && (
                    <div className="mb-4 p-3 bg-blue-500/20 rounded-lg">
                      <p className="text-blue-200 text-sm">
                        Total to distribute: {
                          amounts.reduce((sum, amt, i) => {
                            return recipients[i] && amt && parseFloat(amt) > 0 
                              ? sum + parseFloat(amt) 
                              : sum;
                          }, 0).toFixed(6)
                        } AVAX
                      </p>
                      <p className="text-blue-200 text-xs">
                        Contract balance: {contractBalance} AVAX
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={addRecipient}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200"
                    >
                      ➕ Add Recipient
                    </button>
                    <button
                      onClick={distributeFunds}
                      disabled={loading}
                      className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition duration-200"
                    >
                      {loading ? '⏳ Distributing...' : '📤 Distribute Funds'}
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    This calls distributeFunds() to send AVAX from contract to multiple recipients
                  </p>
                </div>
              </>
            )}

            {!isHost && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
                <h2 className="text-xl font-semibold text-white mb-2">🚫 Not Authorized</h2>
                <p className="text-gray-300">Only the contract host can lock and distribute funds.</p>
                <p className="text-sm text-gray-400 mt-2">You can view the contract state but cannot perform transactions.</p>
              </div>
            )}

            {/* Links */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
              <h3 className="text-lg font-semibold text-white mb-3">🔗 Useful Links</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                <a 
                  href={`https://testnet.snowtrace.io/address/${CONTRACT_ADDRESS}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-lg transition duration-200 text-sm"
                >
                  🔍 View Contract
                </a>
                <a 
                  href="https://faucet.avax.network/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-lg transition duration-200 text-sm"
                >
                  💰 Get Fuji AVAX
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}