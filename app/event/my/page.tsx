'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Contract ABI and address
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

// Type definitions
interface Event {
  id: string;
  title: string;
  description: string;
  image?: string;
  tag?: string;
  prizePool?: number;
  numberOfPrizes?: number;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  isActive: boolean;
  contractAddress?: string;
  blockchainTxHash?: string;
  _count?: {
    participants: number;
    comments: number;
  };
}

interface Participant {
  id: string;
  status: string;
  joinedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    walletAddress?: string;
  };
}

interface Winner {
  position: number;
  userId: string;
  prizeAmount: number;
}

interface EventCardProps {
  event: Event;
  onEventClick: (eventId: string) => void;
  onCompleteEvent: (eventId: string) => void;
  isCreator: boolean;
}

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
  onEventUpdated: () => void;
}

// EventCard Component
const EventCard: React.FC<EventCardProps> = ({ event, onEventClick, onCompleteEvent, isCreator }) => {
  const isCompleted = event.isCompleted;
  const isActive = event.isActive;
  
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-black transition-colors cursor-pointer">
      {/* Event Image */}
      <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
        {event.image ? (
          <img 
            src={event.image} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Event Info */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-black line-clamp-2">{event.title}</h3>
          <div className="flex gap-2 ml-2">
            {/* Status Badges */}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              isCompleted 
                ? 'bg-green-100 text-green-800' 
                : isActive 
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'
            }`}>
              {isCompleted ? 'Completed' : isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {event.tag && (
          <span className="inline-block bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full mb-3">
            #{event.tag}
          </span>
        )}

        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{event.description}</p>

        {/* Event Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Participants:</span>
            <span className="font-semibold ml-1">{event._count?.participants || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Comments:</span>
            <span className="font-semibold ml-1">{event._count?.comments || 0}</span>
          </div>
          {event.prizePool && (
            <div className="col-span-2">
              <span className="text-gray-500">Prize Pool:</span>
              <span className="font-semibold ml-1 text-green-600">${event.prizePool}</span>
            </div>
          )}
        </div>

        {/* Event Dates */}
        <div className="mt-3 text-sm text-gray-500">
          <div>Start: {new Date(event.startDate).toLocaleDateString()}</div>
          <div>End: {new Date(event.endDate).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onEventClick(event.id)}
          className="flex-1 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          View Details
        </button>

        {isCreator && !isCompleted && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompleteEvent(event.id);
            }}
            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Complete
          </button>
        )}
      </div>
    </div>
  );
};

// EventDetailsModal Component
const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose, onEventUpdated }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedWinners, setSelectedWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [contractBalance, setContractBalance] = useState('0');
  const [distributingPrizes, setDistributingPrizes] = useState(false);

  // Connect wallet function
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Switch to Avalanche Fuji network
      await switchToFujiNetwork();

      setWalletAddress(accounts[0]);
      setWalletConnected(true);

      // Get contract balance
      await updateContractBalance();
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      alert('Error connecting wallet: ' + (error?.message || 'Unknown error'));
    }
  };

  // Update contract balance
  const updateContractBalance = async () => {
    try {
      const contract = getEthereumContract();
      if (!contract) return;

      const balance = await contract.getBalance();
      const balanceInEther = ethers.utils.formatEther(balance);
      setContractBalance(parseFloat(balanceInEther).toFixed(6));
    } catch (error) {
      console.error('Error getting contract balance:', error);
      setContractBalance('0');
    }
  };

  // Distribute prizes via smart contract
  const distributePrizesToWinners = async (winners: Winner[]) => {
    if (!walletConnected) {
      alert('Please connect your wallet to distribute prizes');
      return false;
    }

    // Filter winners that have wallet addresses
    const winnersWithWallets = winners.filter(winner => {
      const participant = participants.find(p => p.user?.id === winner.userId);
      return participant?.user?.walletAddress;
    });

    if (winnersWithWallets.length === 0) {
      alert('None of the selected winners have wallet addresses connected');
      return false;
    }

    const winnersWithoutWallets = winners.filter(winner => {
      const participant = participants.find(p => p.user?.id === winner.userId);
      return !participant?.user?.walletAddress;
    });

    if (winnersWithoutWallets.length > 0) {
      const names = winnersWithoutWallets.map(winner => {
        const participant = participants.find(p => p.user?.id === winner.userId);
        return participant?.user?.name || 'Unknown';
      }).join(', ');
      
      if (!confirm(`Warning: ${names} don't have wallet addresses and won't receive prizes via smart contract. Continue anyway?`)) {
        return false;
      }
    }

    // Prepare recipients and amounts
    const recipients = winnersWithWallets.map(winner => {
      const participant = participants.find(p => p.user?.id === winner.userId);
      return participant?.user?.walletAddress!;
    });

    const amounts = winnersWithWallets.map(winner => winner.prizeAmount);
    
    // Check if total amount exceeds contract balance
    const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0);
    const currentBalance = parseFloat(contractBalance);

    if (totalAmount > currentBalance) {
      alert(`Total prize amount (${totalAmount} AVAX) exceeds contract balance (${currentBalance} AVAX)`);
      return false;
    }

    setDistributingPrizes(true);
    try {
      console.log('=== DEBUG: Starting smart contract distribution ===');
      console.log('window.ethereum exists:', !!window.ethereum);
      console.log('walletConnected:', walletConnected);
      console.log('walletAddress:', walletAddress);
      
      const contract = getEthereumContract();
      console.log('Contract instance created:', !!contract);
      
      if (!contract) {
        throw new Error('Contract not available');
      }

      const amountsInWei = amounts.map(amount => ethers.utils.parseEther(amount.toString()));

      console.log('Distributing prizes via smart contract:', {
        recipients,
        amounts,
        amountsInWei: amountsInWei.map(amt => amt.toString()),
        totalAmount,
        contractBalance: currentBalance
      });

      // Estimate gas first
      try {
        console.log('Estimating gas...');
        const gasEstimate = await contract.estimateGas.distributeFunds(recipients, amountsInWei);
        console.log('Gas estimate successful:', gasEstimate.toString());
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        throw new Error('Transaction would fail. Please check recipient addresses and amounts.');
      }

      console.log('Sending transaction - MetaMask should pop up now...');
      const transaction = await contract.distributeFunds(recipients, amountsInWei, {
        gasLimit: 500000
      });

      console.log('Prize distribution transaction sent:', transaction.hash);
      alert(`Prize distribution transaction sent! Hash: ${transaction.hash}`);

      const receipt = await transaction.wait();
      console.log('Prize distribution confirmed:', receipt);
      alert('Prizes distributed successfully!');
      
      // Update contract balance
      await updateContractBalance();
      
      return true;
    } catch (error: any) {
      console.error('Error distributing prizes:', error);

      if (error.code === 'INSUFFICIENT_FUNDS') {
        alert('Insufficient AVAX for prize distribution and gas fees');
      } else if (error.code === 'USER_REJECTED') {
        alert('Transaction rejected by user');
      } else if (error.message?.includes('execution reverted')) {
        alert('Distribution failed: ' + (error.reason || 'Check contract balance and recipient addresses'));
      } else if (error.message?.includes('Transaction would fail')) {
        alert(error.message);
      } else {
        alert('Error distributing prizes: ' + (error?.message || 'Unknown error'));
      }
      return false;
    } finally {
      setDistributingPrizes(false);
    }
  };

  // Fetch participants
  const fetchParticipants = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3000/api/event/${event.id}/participants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const result = await response.json();
      setParticipants(result.data?.filter((p: Participant) => p.status === 'JOINED') || []);
    } catch (error) {
      console.error('Failed to fetch participants:', error);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize winners based on prize count
  useEffect(() => {
    if (event.numberOfPrizes) {
      setSelectedWinners(Array(event.numberOfPrizes).fill(null).map((_, index) => ({
        position: index + 1,
        userId: '',
        prizeAmount: 0
      })));
    }
    fetchParticipants();

    // Check if wallet is already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
      setWalletAddress(window.ethereum.selectedAddress);
      setWalletConnected(true);
      updateContractBalance();
    }

    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
          updateContractBalance();
        } else {
          setWalletAddress('');
          setWalletConnected(false);
          setContractBalance('0');
        }
      };

      const handleChainChanged = () => {
        // Refresh contract balance when chain changes
        if (walletConnected) {
          updateContractBalance();
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [event, walletConnected]);

  // Handle winner selection
  const handleWinnerSelect = (position: number, userId: string) => {
    setSelectedWinners(prev => 
      prev.map(winner => 
        winner.position === position 
          ? { ...winner, userId }
          : winner
      )
    );
  };

  // Handle prize amount change
  const handlePrizeAmountChange = (position: number, amount: string) => {
    setSelectedWinners(prev => 
      prev.map(winner => 
        winner.position === position 
          ? { ...winner, prizeAmount: parseFloat(amount) || 0 }
          : winner
      )
    );
  };

  // Submit winners
  const handleSubmitWinners = async () => {
    // Validate that at least one winner is selected
    const validWinners = selectedWinners.filter(w => w.userId && w.prizeAmount > 0);
    
    if (validWinners.length === 0) {
      alert('Please select at least one winner with a prize amount');
      return;
    }

    // Check if all selected winners have valid user data
    const winnersWithParticipantData = validWinners.map(winner => {
      const participant = participants.find(p => p.user?.id === winner.userId);
      if (!participant) {
        throw new Error(`Participant not found for winner ${winner.position}`);
      }
      return { ...winner, participant };
    });

    // Confirm the selection
    const winnerNames = winnersWithParticipantData.map(w => 
      `${w.position}${w.position === 1 ? 'st' : w.position === 2 ? 'nd' : w.position === 3 ? 'rd' : 'th'}: ${w.participant.user?.name} (${w.prizeAmount} AVAX)`
    ).join('\n');
    
    if (!confirm(`Confirm winners selection?\n\n${winnerNames}\n\nThis will complete the event and distribute prizes via smart contract.`)) {
      return;
    }

    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      
      // Step 1: Submit winners to backend (using existing winners endpoint if available)
      try {
        const winnersData = validWinners.map(winner => ({
          userId: winner.userId,
          position: winner.position,
          prizeAmount: winner.prizeAmount
        }));

        const winnersResponse = await fetch(`http://localhost:3000/api/event/${event.id}/winners`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ winners: winnersData })
        });

        if (winnersResponse.ok) {
          console.log('Winners saved successfully');
        } else {
          console.log('Winners endpoint not available, continuing with completion...');
        }
      } catch (winnersError) {
        console.log('Winners endpoint not available, continuing with completion...');
      }

      // Step 2: Mark event as completed (using existing status endpoint)
      const statusResponse = await fetch(`http://localhost:3000/api/event/${event.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isCompleted: true })
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to complete event! status: ${statusResponse.status}`);
      }

      console.log('Event marked as completed successfully');

      // Step 3: Distribute prizes via smart contract (if wallet connected)
      if (walletConnected) {
        console.log('Wallet connected, attempting to distribute prizes via smart contract...');
        console.log('Event contract details:', {
          contractAddress: event.contractAddress,
          blockchainTxHash: event.blockchainTxHash
        });
        
        const distributionSuccess = await distributePrizesToWinners(validWinners);
        
        if (distributionSuccess) {
          alert('Event completed and prizes distributed successfully via smart contract!');
        } else {
          alert('Event completed successfully! However, prize distribution via smart contract failed. Please distribute manually or retry.');
        }
      } else {
        alert('Event completed successfully! Connect your wallet to distribute prizes via smart contract.');
      }

      // Step 4: Refresh data and close modal
      onEventUpdated();
      onClose();
      
    } catch (error: any) {
      console.error('Error submitting winners:', error);
      alert('Error completing event: ' + (error?.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-black text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{event.title}</h2>
              <p className="text-gray-300 mt-1">Event Management</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Event Info */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-black">{participants.length}</div>
                <div className="text-gray-600">Participants</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">${event.prizePool || 0}</div>
                <div className="text-gray-600">Prize Pool</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{event.numberOfPrizes || 0}</div>
                <div className="text-gray-600">Prizes</div>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                event.isCompleted 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {event.isCompleted ? 'Completed' : 'Active'}
              </span>
              {event.tag && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  #{event.tag}
                </span>
              )}
              {event.contractAddress && event.blockchainTxHash && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  🔗 Smart Contract
                </span>
              )}
            </div>

            {/* Contract Information */}
            {event.contractAddress && event.blockchainTxHash && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900 mb-2">🔗 Blockchain Integration</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><span className="font-medium">Contract:</span> {event.contractAddress}</p>
                  <p><span className="font-medium">Transaction:</span> {event.blockchainTxHash}</p>
                  {walletConnected && (
                    <p><span className="font-medium">Contract Balance:</span> {contractBalance} AVAX</p>
                  )}
                </div>
              </div>
            )}

            {/* Wallet Connection for Prize Distribution */}
            {!event.isCompleted && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-yellow-900 mb-2">💰 Prize Distribution Setup</h4>
                <div className="space-y-3">
                  <p className="text-sm text-yellow-800">
                    Connect your wallet to distribute prizes automatically via smart contract when selecting winners.
                  </p>
                  
                  {/* Always show wallet status and connect button */}
                  {walletConnected ? (
                    <div className="space-y-3">
                      <div className="bg-green-100 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 font-medium">✅ Wallet Connected</p>
                        <div className="text-xs text-green-700 mt-1">
                          <p>Address: {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}</p>
                          <p>Contract Balance: {contractBalance} AVAX</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={connectWallet}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                        >
                          🦊 Reconnect MetaMask
                        </button>
                        <button
                          onClick={() => {
                            setWalletConnected(false);
                            setWalletAddress('');
                            setContractBalance('0');
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                        >
                          🔌 Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={connectWallet}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      🦊 Connect MetaMask
                    </button>
                  )}
                </div>
                
                {distributingPrizes && (
                  <div className="mt-3 text-sm text-blue-800">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Distributing prizes via smart contract...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Winner Selection */}
          {!event.isCompleted && (event.numberOfPrizes ?? 0) > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Select Winners</h3>
              
              <div className="space-y-4">
                {selectedWinners.map((winner, index) => (
                  <div key={winner.position} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <span className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                          {winner.position}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {winner.position === 1 ? '1st Place' : 
                           winner.position === 2 ? '2nd Place' : 
                           winner.position === 3 ? '3rd Place' : 
                           `${winner.position}th Place`}
                        </label>
                        <select
                          value={winner.userId}
                          onChange={(e) => handleWinnerSelect(winner.position, e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-black"
                        >
                          <option value="">Select a winner...</option>
                          {participants
                            .filter(p => !selectedWinners.some(w => w.userId === p.user?.id && w.position !== winner.position))
                            .map(participant => (
                              <option key={participant.user?.id} value={participant.user?.id}>
                                {participant.user?.name} ({participant.user?.email})
                              </option>
                            ))}
                        </select>
                      </div>
                      
                      <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prize Amount (AVAX)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={winner.prizeAmount}
                          onChange={(e) => handlePrizeAmountChange(winner.position, e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-black"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    {/* Show selected participant's wallet status */}
                    {winner.userId && (
                      <div className="mt-2 text-sm">
                        {(() => {
                          const selectedParticipant = participants.find(p => p.user?.id === winner.userId);
                          return selectedParticipant?.user?.walletAddress ? (
                            <div className="text-green-600 flex items-center space-x-1">
                              <span>✅</span>
                              <span>Wallet: {selectedParticipant.user.walletAddress.slice(0, 10)}...{selectedParticipant.user.walletAddress.slice(-6)}</span>
                            </div>
                          ) : (
                            <div className="text-red-600 flex items-center space-x-1">
                              <span>⚠️</span>
                              <span>No wallet address - cannot receive smart contract prize</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleSubmitWinners}
                  disabled={submitting || selectedWinners.filter(w => w.userId).length === 0}
                  className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {submitting ? 'Selecting Winners...' : 'Select Winners & Complete Event'}
                </button>
              </div>
            </div>
          )}

          {/* Participants List */}
          <div>
            <h3 className="text-xl font-bold text-black mb-4">
              Participants ({participants.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading participants...</p>
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No participants yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {participants.map((participant, index) => (
                  <div key={participant.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium text-black">{participant.user?.name}</div>
                        <div className="text-sm text-gray-600">{participant.user?.email}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Joined: {new Date(participant.joinedAt).toLocaleDateString()}
                        </div>
                        {participant.user?.walletAddress && (
                          <div className="text-xs text-gray-500 font-mono">
                            🔗 {participant.user.walletAddress.slice(0, 10)}...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main EventManagementPage Component
const EventManagementPage = () => {
  const [events, setEvents] = useState<{ createdEvents: Event[], participatingEvents: Event[] }>({ createdEvents: [], participatingEvents: [] });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch user's events
  const fetchMyEvents = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/event/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const result = await response.json();
      setEvents(result.data || { createdEvents: [], participatingEvents: [] });
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents({ createdEvents: [], participatingEvents: [] });
    } finally {
      setLoading(false);
    }
  };

  // Handle event click to view details
  const handleEventClick = async (eventId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3000/api/event/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const result = await response.json();
      setSelectedEvent(result.data);
      setShowEventDetails(true);
    } catch (error) {
      console.error('Failed to fetch event details:', error);
    }
  };

  // Quick complete event
  const handleCompleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to mark this event as completed?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3000/api/event/${eventId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isCompleted: true })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      alert('Event marked as completed!');
      fetchMyEvents(); // Refresh the list
    } catch (error) {
      console.error('Failed to complete event:', error);
      alert('Failed to complete event');
    }
  };

  // Add wallet event listeners like in contract page
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Accounts changed:', accounts);
        // This will be handled in the modal component
      };

      const handleChainChanged = () => {
        console.log('Chain changed');
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Event Management Dashboard</h1>
          <p className="text-gray-300 mt-2">Manage your created events and select winners</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Created Events Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">
              My Created Events ({events.createdEvents?.length || 0})
            </h2>
          </div>

          {!events.createdEvents || events.createdEvents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-gray-500 text-lg">No events created yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.createdEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onEventClick={handleEventClick}
                  onCompleteEvent={handleCompleteEvent}
                  isCreator={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Participating Events Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-black mb-6">
            Events I'm Participating In ({events.participatingEvents?.length || 0})
          </h2>

          {!events.participatingEvents || events.participatingEvents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-gray-500 text-lg">Not participating in any events</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.participatingEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onEventClick={handleEventClick}
                  onCompleteEvent={handleCompleteEvent}
                  isCreator={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent}
          onClose={() => setShowEventDetails(false)}
          onEventUpdated={fetchMyEvents}
        />
      )}
    </div>
  );
};

export default EventManagementPage;