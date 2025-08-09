'use client';

import { useState } from 'react';
import { ethers } from 'ethers';

// Contract ABI and address from your contract page
const CONTRACT_ABI = [
	{
		inputs: [],
		stateMutability: 'nonpayable',
		type: 'constructor',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: 'uint256',
				name: 'totalAmount',
				type: 'uint256',
			},
		],
		name: 'FundsDistributed',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: 'uint256',
				name: 'amount',
				type: 'uint256',
			},
		],
		name: 'FundsLocked',
		type: 'event',
	},
	{
		inputs: [
			{
				internalType: 'address[]',
				name: 'recipients',
				type: 'address[]',
			},
			{
				internalType: 'uint256[]',
				name: 'amounts',
				type: 'uint256[]',
			},
		],
		name: 'distributeFunds',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [],
		name: 'getBalance',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [],
		name: 'host',
		outputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [],
		name: 'lockFunds',
		outputs: [],
		stateMutability: 'payable',
		type: 'function',
	},
	{
		stateMutability: 'payable',
		type: 'receive',
	},
];

const CONTRACT_ADDRESS = '0xA3C96Ba32732199E1C8B9501A95D75Fc97E94405';

interface FormData {
	title: string;
	description: string;
	image: string;
	location: string;
	startDate: string;
	endDate: string;
	maxParticipants: string;
	prizePool: string;
	numberOfPrizes: string;
	tag: string;
}

interface FormErrors {
	title?: string;
	description?: string;
	startDate?: string;
	endDate?: string;
	prizePool?: string;
	wallet?: string;
}

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

export default function CreateEventPage() {
	const [formData, setFormData] = useState<FormData>({
		title: '',
		description: '',
		image: '',
		location: '',
		startDate: '',
		endDate: '',
		maxParticipants: '',
		prizePool: '',
		numberOfPrizes: '',
		tag: '',
	});

	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [walletConnected, setWalletConnected] = useState(false);
	const [walletAddress, setWalletAddress] = useState('');
	const [contractBalance, setContractBalance] = useState('0');
	const [lockingFunds, setLockingFunds] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));

		// Clear error when user starts typing
		if (errors[name as keyof FormErrors]) {
			setErrors(prev => ({
				...prev,
				[name]: '',
			}));
		}
	};

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

	// Lock funds in smart contract
	const lockPrizePoolFunds = async (prizePoolAmount: string): Promise<string | null> => {
		try {
			setLockingFunds(true);

			const contract = getEthereumContract();
			if (!contract) {
				throw new Error('Contract not available');
			}

			const amountInWei = ethers.utils.parseEther(prizePoolAmount);

			console.log('Locking prize pool funds:', {
				amount: prizePoolAmount,
				amountInWei: amountInWei.toString(),
			});

			// Call lockFunds with the prize pool amount
			const transaction = await contract.lockFunds({
				value: amountInWei,
				gasLimit: 300000,
			});

			console.log('Prize pool lock transaction sent:', transaction.hash);

			// Wait for confirmation
			const receipt = await transaction.wait();
			console.log('Prize pool lock confirmed:', receipt);

			// Update contract balance
			await updateContractBalance();

			return transaction.hash;
		} catch (error: any) {
			console.error('Error locking prize pool funds:', error);

			if (error.code === 'INSUFFICIENT_FUNDS') {
				throw new Error('Insufficient AVAX for prize pool and gas fees');
			} else if (error.code === 'USER_REJECTED') {
				throw new Error('Transaction rejected by user');
			} else if (error.message?.includes('execution reverted')) {
				throw new Error('Transaction failed: ' + (error.reason || 'Contract execution reverted'));
			} else {
				throw new Error('Error locking funds: ' + (error?.message || 'Unknown error'));
			}
		} finally {
			setLockingFunds(false);
		}
	};

	const validateForm = (): FormErrors => {
		const newErrors: FormErrors = {};

		if (!formData.title.trim()) {
			newErrors.title = 'Title is required';
		}

		if (!formData.description.trim()) {
			newErrors.description = 'Description is required';
		}

		if (!formData.startDate) {
			newErrors.startDate = 'Start date is required';
		}

		if (!formData.endDate) {
			newErrors.endDate = 'End date is required';
		}

		if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
			newErrors.endDate = 'End date must be after start date';
		}

		// Validate prize pool and wallet connection
		if (formData.prizePool && parseFloat(formData.prizePool) > 0) {
			if (!walletConnected) {
				newErrors.wallet = 'Please connect your wallet to lock prize pool funds';
			} else if (parseFloat(formData.prizePool) <= 0) {
				newErrors.prizePool = 'Prize pool must be greater than 0';
			}
		}

		return newErrors;
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const validationErrors = validateForm();
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}

		setIsSubmitting(true);

		try {
			// Get token from localStorage
			const token = localStorage.getItem('auth_token');

			if (!token) {
				alert('Please login to create an event');
				return;
			}

			let blockchainTxHash = null;

			// If there's a prize pool, lock funds in smart contract first
			if (formData.prizePool && parseFloat(formData.prizePool) > 0 && walletConnected) {
				try {
					blockchainTxHash = await lockPrizePoolFunds(formData.prizePool);
					alert(`Prize pool locked successfully! Transaction: ${blockchainTxHash}`);
				} catch (lockError: any) {
					alert(`Failed to lock prize pool: ${lockError.message}`);
					return;
				}
			}

			// Prepare the data for event creation
			const submitData = {
				title: formData.title,
				description: formData.description,
				image: formData.image || undefined,
				location: formData.location || undefined,
				tag: formData.tag || 'general',
				startDate: new Date(formData.startDate).toISOString(),
				endDate: new Date(formData.endDate).toISOString(),
				maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
				prizePool: formData.prizePool ? parseFloat(formData.prizePool) : undefined,
				numberOfPrizes: formData.numberOfPrizes ? parseInt(formData.numberOfPrizes) : undefined,
				// Add blockchain transaction hash if funds were locked
				blockchainTxHash: blockchainTxHash,
				contractAddress: blockchainTxHash ? CONTRACT_ADDRESS : undefined,
				walletAddress: walletConnected ? walletAddress : undefined,
			};

			const response = await fetch('http://localhost:3000/api/event/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(submitData),
			});

			if (response.ok) {
				alert('Event created successfully with prize pool locked in smart contract!');
				// Clear form
				setFormData({
					title: '',
					description: '',
					image: '',
					location: '',
					startDate: '',
					endDate: '',
					maxParticipants: '',
					prizePool: '',
					numberOfPrizes: '',
					tag: '',
				});
				// Optional: redirect to events list
				window.location.href = '/event';
			} else {
				const errorData = await response.json();
				alert(`Error creating event: ${errorData.message || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error creating event:', error);
			alert('Something went wrong. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
			<div className="max-w-4xl mx-auto">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-white mb-2">🎯 Create New Event</h1>
					<p className="text-blue-200">Create events with blockchain-secured prize pools</p>
				</div>

				{/* Wallet Connection Section */}
				{formData.prizePool && parseFloat(formData.prizePool) > 0 && (
					<div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
						<h2 className="text-xl font-semibold text-white mb-4 flex items-center">
							🔗 Wallet Connection (Required for Prize Pool)
						</h2>

						{!walletConnected ? (
							<div className="text-center">
								<button
									onClick={connectWallet}
									type="button"
									className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-xl transition duration-200 transform hover:scale-105 shadow-lg"
								>
									🦊 Connect MetaMask to Lock Prize Pool
								</button>
								<p className="text-gray-300 text-sm mt-2">
									Required to lock prize pool funds in smart contract
								</p>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
								<div>
									<p className="text-gray-300">Connected Wallet:</p>
									<p className="text-white font-mono break-all">{walletAddress}</p>
								</div>
								<div>
									<p className="text-gray-300">Contract Balance:</p>
									<p className="text-white font-bold">{contractBalance} AVAX</p>
								</div>
							</div>
						)}
						{errors.wallet && <p className="text-red-400 text-sm mt-2">{errors.wallet}</p>}
					</div>
				)}

				<div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Title */}
						<div>
							<label className="block text-gray-300 mb-2 font-semibold">
								Event Title *
							</label>
							<input
								type="text"
								name="title"
								value={formData.title}
								onChange={handleChange}
								className={`w-full p-3 bg-white/20 border ${errors.title ? 'border-red-400' : 'border-white/30'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20`}
								placeholder="Enter event title"
							/>
							{errors.title && <span className="text-red-400 text-sm">{errors.title}</span>}
						</div>

						{/* Description */}
						<div>
							<label className="block text-gray-300 mb-2 font-semibold">
								Description *
							</label>
							<textarea
								name="description"
								value={formData.description}
								onChange={handleChange}
								rows={4}
								className={`w-full p-3 bg-white/20 border ${errors.description ? 'border-red-400' : 'border-white/30'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 resize-vertical`}
								placeholder="Describe your event"
							/>
							{errors.description && <span className="text-red-400 text-sm">{errors.description}</span>}
						</div>

						{/* Image URL */}
						<div>
							<label className="block text-gray-300 mb-2 font-semibold">
								Image URL (optional)
							</label>
							<input
								type="url"
								name="image"
								value={formData.image}
								onChange={handleChange}
								className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
								placeholder="https://example.com/image.jpg"
							/>
						</div>

						{/* Location and Tag Row */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-gray-300 mb-2 font-semibold">
									Location (optional)
								</label>
								<input
									type="text"
									name="location"
									value={formData.location}
									onChange={handleChange}
									className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
									placeholder="Event location"
								/>
							</div>

							<div>
								<label className="block text-gray-300 mb-2 font-semibold">
									Category
								</label>
								<select
									name="tag"
									value={formData.tag}
									onChange={handleChange}
									className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
								>
									<option value="general" className="bg-gray-800">
										🎯 General
									</option>
									<option value="gaming" className="bg-gray-800">
										🎮 Gaming
									</option>
									<option value="sports" className="bg-gray-800">
										⚽ Sports
									</option>
									<option value="tech" className="bg-gray-800">
										💻 Tech
									</option>
									<option value="music" className="bg-gray-800">
										🎵 Music
									</option>
									<option value="art" className="bg-gray-800">
										🎨 Art
									</option>
									<option value="food" className="bg-gray-800">
										🍕 Food
									</option>
									<option value="education" className="bg-gray-800">
										📚 Education
									</option>
									<option value="business" className="bg-gray-800">
										💼 Business
									</option>
								</select>
							</div>
						</div>

						{/* Date Range */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-gray-300 mb-2 font-semibold">
									Start Date & Time *
								</label>
								<input
									type="datetime-local"
									name="startDate"
									value={formData.startDate}
									onChange={handleChange}
									className={`w-full p-3 bg-white/20 border ${errors.startDate ? 'border-red-400' : 'border-white/30'} rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20`}
								/>
								{errors.startDate && <span className="text-red-400 text-sm">{errors.startDate}</span>}
							</div>

							<div>
								<label className="block text-gray-300 mb-2 font-semibold">
									End Date & Time *
								</label>
								<input
									type="datetime-local"
									name="endDate"
									value={formData.endDate}
									onChange={handleChange}
									className={`w-full p-3 bg-white/20 border ${errors.endDate ? 'border-red-400' : 'border-white/30'} rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20`}
								/>
								{errors.endDate && <span className="text-red-400 text-sm">{errors.endDate}</span>}
							</div>
						</div>

						{/* Event Settings */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div>
								<label className="block text-gray-300 mb-2 font-semibold">
									Max Participants
								</label>
								<input
									type="number"
									name="maxParticipants"
									value={formData.maxParticipants}
									onChange={handleChange}
									min="1"
									className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
									placeholder="Unlimited"
								/>
							</div>

							<div>
								<label className="block text-gray-300 mb-2 font-semibold">
									💰 Prize Pool (AVAX)
								</label>
								<input
									type="number"
									name="prizePool"
									value={formData.prizePool}
									onChange={handleChange}
									min="0"
									step="0.001"
									className={`w-full p-3 bg-white/20 border ${errors.prizePool ? 'border-red-400' : 'border-white/30'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20`}
									placeholder="0.0"
								/>
								{errors.prizePool && <span className="text-red-400 text-sm">{errors.prizePool}</span>}
								{formData.prizePool && parseFloat(formData.prizePool) > 0 && (
									<p className="text-yellow-300 text-xs mt-1">
										🔒 This amount will be locked in smart contract
									</p>
								)}
							</div>

							<div>
								<label className="block text-gray-300 mb-2 font-semibold">
									Number of Prizes
								</label>
								<input
									type="number"
									name="numberOfPrizes"
									value={formData.numberOfPrizes}
									onChange={handleChange}
									min="1"
									className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
									placeholder="1"
								/>
							</div>
						</div>

						{/* Submit Button */}
						<div className="pt-6">
							<button
								type="submit"
								disabled={isSubmitting || lockingFunds}
								className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition duration-200 transform hover:scale-105 shadow-lg"
							>
								{lockingFunds ? (
									'🔒 Locking Prize Pool...'
								) : isSubmitting ? (
									'📅 Creating Event...'
								) : formData.prizePool && parseFloat(formData.prizePool) > 0 ? (
									'🔒 Create Event & Lock Prize Pool'
								) : (
									'📅 Create Event'
								)}
							</button>
						</div>

						{/* Info Section */}
						{formData.prizePool && parseFloat(formData.prizePool) > 0 && (
							<div className="bg-blue-500/20 rounded-lg p-4 mt-4">
								<h3 className="text-blue-200 font-semibold mb-2">🔒 Blockchain Integration</h3>
								<ul className="text-blue-100 text-sm space-y-1">
									<li>• Prize pool will be locked in smart contract</li>
									<li>• Funds are secured on Avalanche Fuji Testnet</li>
									<li>• Only you can distribute prizes to winners</li>
									<li>• Transaction hash will be stored with event</li>
								</ul>
								<div className="mt-3 text-xs text-blue-200">
									<p>Contract: {CONTRACT_ADDRESS}</p>
								</div>
							</div>
						)}
					</form>
				</div>
			</div>
		</div>
	);
}
