'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Image as ImageIcon,
  Save,
  Eye,
  Wallet,
  Lock,
  AlertCircle
} from 'lucide-react';

// Contract ABI and address
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
	const router = useRouter();
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
		tag: 'web3',
	});

	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [walletConnected, setWalletConnected] = useState(false);
	const [walletAddress, setWalletAddress] = useState('');
	const [contractBalance, setContractBalance] = useState('0');
	const [lockingFunds, setLockingFunds] = useState(false);

	const tags = ['web3', 'defi', 'nft', 'crypto', 'blockchain', 'gaming', 'sports', 'tech', 'music', 'art'];

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));

		// Clear error when user starts typing
		if (errors[name as keyof FormErrors]) {
			setErrors(prev => ({
				...prev,
				[name]: undefined,
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

	const validateForm = (): boolean => {
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
		} else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
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

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!validateForm()) {
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

			const response = await fetch('https://api-avalink.portos.cloud/api/event/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(submitData),
			});

			if (response.ok) {
				const result = await response.json();
				alert('Event created successfully with prize pool locked in smart contract!');
				// Redirect to the created event
				router.push(`/event/${result.data.id}`);
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

	const handleButtonSubmit = async () => {
		if (!validateForm()) {
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

			const response = await fetch('https://api-avalink.portos.cloud/api/event/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(submitData),
			});

			if (response.ok) {
				const result = await response.json();
				alert('Event created successfully with prize pool locked in smart contract!');
				// Redirect to the created event
				router.push(`/event/${result.data.id}`);
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
		<div className="min-h-screen bg-white">
			{/* Header */}
			<div className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center space-x-4">
							<Button 
								variant="ghost" 
								onClick={() => router.back()}
								className="inline-flex items-center space-x-2"
							>
								<ArrowLeft className="w-4 h-4" />
								<span>Back</span>
							</Button>
							
							<div className="h-6 w-px bg-gray-300" />
							
							<h1 className="text-xl font-semibold">Create New Event</h1>
						</div>

						<div className="flex items-center space-x-2">
							<Button variant="outline" size="sm">
								<Eye className="w-4 h-4 mr-2" />
								Preview
							</Button>
							
							<Button 
								onClick={handleButtonSubmit}
								disabled={isSubmitting || lockingFunds}
								className="bg-black hover:bg-gray-800"
								size="sm"
							>
								{lockingFunds ? (
									<>
										<Lock className="w-4 h-4 mr-2" />
										Locking Prize...
									</>
								) : isSubmitting ? (
									'Creating...'
								) : (
									<>
										<Save className="w-4 h-4 mr-2" />
										Create Event
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<form onSubmit={handleSubmit} className="space-y-8">
					
					{/* Basic Information */}
					<Card>
						<CardHeader>
							<CardTitle>Basic Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="title">Event Title *</Label>
								<Input
									id="title"
									name="title"
									value={formData.title}
									onChange={handleChange}
									placeholder="Enter event title"
									className={errors.title ? 'border-red-500' : ''}
								/>
								{errors.title && (
									<p className="text-sm text-red-600">{errors.title}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description *</Label>
								<Textarea
									id="description"
									name="description"
									value={formData.description}
									onChange={handleChange}
									placeholder="Describe your event..."
									rows={4}
									className={errors.description ? 'border-red-500' : ''}
								/>
								{errors.description && (
									<p className="text-sm text-red-600">{errors.description}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="image">Event Image URL</Label>
								<div className="relative">
									<ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
									<Input
										id="image"
										name="image"
										value={formData.image}
										onChange={handleChange}
										placeholder="https://example.com/image.jpg"
										className="pl-10"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Category</Label>
								<div className="flex flex-wrap gap-2">
									{tags.map((tag) => (
										<Badge
											key={tag}
											variant={formData.tag === tag ? "default" : "outline"}
											className={`cursor-pointer ${
												formData.tag === tag 
													? 'bg-black text-white' 
													: 'hover:bg-gray-100'
											}`}
											onClick={() => setFormData(prev => ({ ...prev, tag }))}
										>
											{tag.toUpperCase()}
										</Badge>
									))}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Location & Timing */}
					<Card>
						<CardHeader>
							<CardTitle>Location & Timing</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="location">Location</Label>
								<div className="relative">
									<MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
									<Input
										id="location"
										name="location"
										value={formData.location}
										onChange={handleChange}
										placeholder="Event location or 'Online'"
										className="pl-10"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label htmlFor="startDate">Start Date *</Label>
									<div className="relative">
										<Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
										<Input
											id="startDate"
											name="startDate"
											type="datetime-local"
											value={formData.startDate}
											onChange={handleChange}
											className={`pl-10 ${errors.startDate ? 'border-red-500' : ''}`}
										/>
									</div>
									{errors.startDate && (
										<p className="text-sm text-red-600">{errors.startDate}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="endDate">End Date *</Label>
									<div className="relative">
										<Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
										<Input
											id="endDate"
											name="endDate"
											type="datetime-local"
											value={formData.endDate}
											onChange={handleChange}
											className={`pl-10 ${errors.endDate ? 'border-red-500' : ''}`}
										/>
									</div>
									{errors.endDate && (
										<p className="text-sm text-red-600">{errors.endDate}</p>
									)}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Prize Pool & Wallet Connection */}
					<Card>
						<CardHeader>
							<CardTitle>Prize Pool & Blockchain</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="space-y-2">
									<Label htmlFor="maxParticipants">Max Participants</Label>
									<div className="relative">
										<Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
										<Input
											id="maxParticipants"
											name="maxParticipants"
											type="number"
											value={formData.maxParticipants}
											onChange={handleChange}
											placeholder="Unlimited"
											className="pl-10"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="prizePool">Prize Pool (AVAX)</Label>
									<div className="relative">
										<DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
										<Input
											id="prizePool"
											name="prizePool"
											type="number"
											step="0.001"
											value={formData.prizePool}
											onChange={handleChange}
											placeholder="0.0"
											className={`pl-10 ${errors.prizePool ? 'border-red-500' : ''}`}
										/>
									</div>
									{errors.prizePool && (
										<p className="text-sm text-red-600">{errors.prizePool}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="numberOfPrizes">Number of Prizes</Label>
									<Input
										id="numberOfPrizes"
										name="numberOfPrizes"
										type="number"
										value={formData.numberOfPrizes}
										onChange={handleChange}
										placeholder="1"
									/>
								</div>
							</div>

							{/* Wallet Connection Section */}
							{formData.prizePool && parseFloat(formData.prizePool) > 0 && (
								<div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
									<div className="flex items-center space-x-2 mb-4">
										<Lock className="w-5 h-5 text-blue-600" />
										<h3 className="font-semibold text-blue-900">Blockchain Integration Required</h3>
									</div>

									{!walletConnected ? (
										<div className="space-y-3">
											<div className="flex items-start space-x-2">
												<AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
												<p className="text-sm text-blue-800">
													Connect your wallet to lock prize pool funds in smart contract
												</p>
											</div>
											<Button 
												type="button"
												onClick={connectWallet}
												variant="outline"
												className="border-blue-300 text-blue-700 hover:bg-blue-100"
											>
												<Wallet className="w-4 h-4 mr-2" />
												Connect MetaMask
											</Button>
										</div>
									) : (
										<div className="space-y-3">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
												<div>
													<p className="text-blue-700 font-medium">Connected Wallet:</p>
													<p className="text-blue-900 font-mono text-xs break-all">{walletAddress}</p>
												</div>
												<div>
													<p className="text-blue-700 font-medium">Contract Balance:</p>
													<p className="text-blue-900 font-semibold">{contractBalance} AVAX</p>
												</div>
											</div>
											<div className="bg-blue-100 rounded p-3">
												<p className="text-xs text-blue-800">
													<Lock className="w-3 h-3 inline mr-1" />
													{formData.prizePool} AVAX will be locked in smart contract: {CONTRACT_ADDRESS}
												</p>
											</div>
										</div>
									)}
									{errors.wallet && (
										<p className="text-sm text-red-600 mt-2">{errors.wallet}</p>
									)}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Form Actions */}
					<div className="flex items-center justify-between pt-6 border-t">
						<Button 
							type="button"
							variant="outline"
							onClick={() => router.back()}
						>
							Cancel
						</Button>
						
						<Button 
							type="submit"
							disabled={isSubmitting || lockingFunds}
							className="bg-black hover:bg-gray-800"
						>
							{lockingFunds ? (
								<>
									<Lock className="w-4 h-4 mr-2" />
									Locking Prize Pool...
								</>
							) : isSubmitting ? (
								'Creating Event...'
							) : formData.prizePool && parseFloat(formData.prizePool) > 0 ? (
								<>
									<Lock className="w-4 h-4 mr-2" />
									Create Event & Lock Prize Pool
								</>
							) : (
								'Create Event'
							)}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
