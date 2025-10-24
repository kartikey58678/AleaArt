'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BrowserProvider, Contract, parseEther, ethers } from 'ethers';
import { ArtToken } from '@/types';

// Extend Window interface to include ethereum
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  send: (method: string, params?: unknown[]) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

interface ArtTokenCardProps {
  token: ArtToken;
  fetchTokenParameters: (tokenId: number) => Promise<{
    tokenId: number;
    seed: string;
    parameters: {
      promptIndex: number;
      styleIndex: number;
      samplerIndex: number;
      aspectIndex: number;
      steps: number;
      cfg: number;
      latentSeed: number;
      paletteId: number;
    };
  } | null>;
}

function ArtTokenCard({ token, fetchTokenParameters }: ArtTokenCardProps) {
  const [parameters, setParameters] = useState<{
    tokenId: number;
    seed: string;
    parameters: {
      promptIndex: number;
      styleIndex: number;
      samplerIndex: number;
      aspectIndex: number;
      steps: number;
      cfg: number;
      latentSeed: number;
      paletteId: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const loadParameters = async () => {
    if (parameters) return; // Already loaded
    
    setLoading(true);
    setError('');
    
    try {
      const params = await fetchTokenParameters(token.tokenId);
      if (params) {
        setParameters(params);
      } else {
        setError('Failed to load parameters');
      }
    } catch {
      setError('Failed to load parameters');
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async () => {
    if (!parameters) return;
    
    setGeneratingImage(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-image-async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters: parameters.parameters,
          tokenId: token.tokenId
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Show success message
        alert('Image generation started! Your art will be ready in a few minutes. You can check the status by refreshing the page.');
        
        // Start polling for status updates
        pollImageStatus();
      } else {
        setError('Failed to start image generation');
      }
    } catch {
      setError('Failed to start image generation');
    } finally {
      setGeneratingImage(false);
    }
  };

  const pollImageStatus = async () => {
    const maxAttempts = 30; // Poll for up to 5 minutes (10 seconds * 30)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/images?tokenId=${token.tokenId}`);
        if (response.ok) {
          const result = await response.json();
          
          if (result.status === 'completed') {
            // Image is ready, update the UI
            setGeneratedImage(result.imageData);
            setGeneratingImage(false);
            return;
          } else if (result.status === 'failed') {
            setError('Image generation failed');
            setGeneratingImage(false);
            return;
          }
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setError('Image generation timed out');
          setGeneratingImage(false);
        }
      } catch (error) {
        console.error('Error polling image status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        } else {
          setError('Failed to check image status');
          setGeneratingImage(false);
        }
      }
    };

    poll();
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">Token #{token.tokenId}</h3>
        <span className="text-green-400 text-sm">✅ Ready</span>
      </div>
      
      {!parameters ? (
        <div className="text-center">
          <button
            onClick={loadParameters}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load Parameters'}
          </button>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="text-blue-200">
              <span className="text-white font-medium">Prompt:</span> {parameters.parameters.promptIndex}/12
            </div>
            <div className="text-blue-200">
              <span className="text-white font-medium">Style:</span> {parameters.parameters.styleIndex}/10
            </div>
            <div className="text-blue-200">
              <span className="text-white font-medium">Sampler:</span> {parameters.parameters.samplerIndex}/6
            </div>
            <div className="text-blue-200">
              <span className="text-white font-medium">Aspect:</span> {parameters.parameters.aspectIndex}/5
            </div>
            <div className="text-blue-200">
              <span className="text-white font-medium">Steps:</span> {parameters.parameters.steps}
            </div>
            <div className="text-blue-200">
              <span className="text-white font-medium">CFG:</span> {(parameters.parameters.cfg / 10).toFixed(1)}
            </div>
            <div className="text-blue-200">
              <span className="text-white font-medium">Palette:</span> {parameters.parameters.paletteId}/24
            </div>
            <div className="text-blue-200">
              <span className="text-white font-medium">Seed:</span> {parameters.parameters.latentSeed}
            </div>
          </div>
          
          <div className="text-center">
            <button
              onClick={generateImage}
              disabled={generatingImage}
              className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingImage ? '⏳ Generating... (2-3 min)' : '🎨 Generate Image'}
            </button>
          </div>
          
          {generatedImage && (
            <div className="mt-4">
              <h4 className="text-white font-medium mb-2">Generated Image:</h4>
              <img 
                src={generatedImage} 
                alt={`Generated art for token ${token.tokenId}`}
                className="w-full rounded-lg border border-white/20"
              />
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 text-xs text-blue-300">
        Generated: {new Date(token.createdAt).toLocaleString()}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [artTokens, setArtTokens] = useState<ArtToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [latestParams, setLatestParams] = useState<{
    tokenId: string;
    seed: string;
    parameters: {
      promptIndex: bigint;
      styleIndex: bigint;
      samplerIndex: bigint;
      aspectIndex: bigint;
      steps: bigint;
      cfg: bigint;
      latentSeed: bigint;
      paletteId: bigint;
    };
  } | null>(null);
  const [loadingParams, setLoadingParams] = useState(false);
  const [generatingLatestImage, setGeneratingLatestImage] = useState(false);
  const [latestGeneratedImage, setLatestGeneratedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<{
    tokenId: number;
    imageData: string;
    prompt: string;
    createdAt: string;
    ipfsHash?: string;
    ipfsUrl?: string;
  }[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [mintingNFT, setMintingNFT] = useState<number | null>(null);

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x420D121aE08007Ef0A66E67D5D7BfFdC98AbECF0';
  const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '0x806019F8a33A01a4A3fea93320601cC77B6Dcb79';
  const CONTRACT_ABI = [
    "function requestArtParams() external payable returns (uint256 tokenId, uint64 requestId)",
    "function viewRenderParams(uint256 tokenId) external view returns (tuple(uint8 promptIndex, uint8 styleIndex, uint8 samplerIndex, uint8 aspectIndex, uint16 steps, uint16 cfg, uint32 latentSeed, uint16 paletteId))",
    "function tokenSeed(uint256 tokenId) external view returns (bytes32)",
    "function nextTokenId() external view returns (uint256)",
    "event EntropyRequested(uint256 indexed tokenId, uint64 indexed requestId, uint256 feePaid)",
    "event EntropyFulfilled(uint256 indexed tokenId, bytes32 seed)"
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchArtTokens();
      checkWalletConnection();
      fetchGeneratedImages();
    }
  }, [session]);

  const checkWalletConnection = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new BrowserProvider(window.ethereum!);
        const accounts = await provider.send('eth_accounts', []);
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setWalletAddress(address);
          setWalletConnected(true);
          console.log('Wallet already connected:', address);
        }
      }
    } catch {
      console.log('No wallet connected');
    }
  };

  const fetchTokenParameters = async (tokenId: number) => {
    try {
      const provider = new BrowserProvider(window.ethereum!);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const params = await contract.viewRenderParams(tokenId);
      const seed = await contract.tokenSeed(tokenId);
      
      return {
        tokenId,
        seed: seed,
        parameters: {
          promptIndex: Number(params.promptIndex),
          styleIndex: Number(params.styleIndex),
          samplerIndex: Number(params.samplerIndex),
          aspectIndex: Number(params.aspectIndex),
          steps: Number(params.steps),
          cfg: Number(params.cfg),
          latentSeed: Number(params.latentSeed),
          paletteId: Number(params.paletteId),
        }
      };
    } catch (error) {
      console.error(`Failed to fetch parameters for token ${tokenId}:`, error);
      return null;
    }
  };

  const fetchArtTokens = async () => {
    try {
      const response = await fetch('/api/art-tokens');
      if (response.ok) {
        const data = await response.json();
        setArtTokens(data.artTokens || []);
      }
    } catch (error) {
      console.error('Failed to fetch art tokens:', error);
    }
  };

  const fetchGeneratedImages = async () => {
    try {
      setLoadingImages(true);
      const response = await fetch('/api/user-images');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched images data:', data);
        setGeneratedImages(data.images || []);
      }
    } catch (error) {
      console.error('Error fetching generated images:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  const mintNFT = async (image: any) => {
    try {
      setMintingNFT(image.tokenId);
      
      // Get user's wallet address
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Get price from user
      const price = prompt('Enter price in ETH (0 for not for sale):', '0');
      if (price === null) return;

      const priceInWei = parseFloat(price) * 1e18;

      // Get transaction data from API
      const response = await fetch('/api/mint-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId: image.tokenId,
          ipfsHash: image.ipfsHash,
          prompt: image.prompt,
          price: priceInWei.toString(),
          userAddress: userAddress,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        alert(`Failed to prepare mint transaction: ${data.error}`);
        return;
      }

      // Create contract instance with user's signer
      const contract = new ethers.Contract(data.contractAddress, data.contractABI, signer);
      
      // Call the mintNFT function directly with user's wallet
      const tx = await contract.mintNFT(...data.functionArgs);
      
      console.log('Minting transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      console.log('Transaction confirmed:', receipt);
      
      // Get the token ID from the transaction logs
      const mintEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'NFTMinted';
        } catch {
          return false;
        }
      });
      
      let mintedTokenId = image.tokenId; // fallback
      
      if (mintEvent) {
        const parsed = contract.interface.parseLog(mintEvent);
        if (parsed) {
          mintedTokenId = parsed.args.tokenId.toString();
        }
      }

      alert(`NFT minted successfully! Token ID: ${mintedTokenId}\nTransaction: ${tx.hash}`);
      
    } catch (error) {
      console.error('Error minting NFT:', error);
      alert('Error minting NFT. Please try again.');
    } finally {
      setMintingNFT(null);
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        setError('MetaMask not detected. Please install MetaMask.');
        return;
      }

      console.log('Connecting to MetaMask...');
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Switch to Arbitrum Sepolia network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x66eee' }], // Arbitrum Sepolia chain ID
        });
      } catch (switchError) {
        // If the network doesn't exist, add it
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x66eee',
            chainName: 'Arbitrum Sepolia',
            rpcUrls: ['https://arbitrum-sepolia-rpc.publicnode.com'],
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
          }],
        });
      }
      
      const provider = new BrowserProvider(window.ethereum!);
      const accounts = await provider.send('eth_requestAccounts', []);
      console.log('Accounts:', accounts);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      console.log('Connected address:', address);
      
      setWalletAddress(address);
      setWalletConnected(true);

      // Save wallet address to user profile
      const response = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (response.ok) {
        setSuccess('Wallet connected successfully!');
      } else {
        console.error('Failed to save wallet address to profile');
        setSuccess('Wallet connected! (Profile update failed)');
      }
    } catch (error: unknown) {
      console.error('Wallet connection error:', error);
      setError(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const requestArtParams = async () => {
    if (!walletConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const provider = new BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const totalValue = parseEther("0.001");
      const tx = await contract.requestArtParams({ value: totalValue });
      
      setSuccess(`Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: { topics: readonly string[]; data: string }) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'EntropyRequested';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = contract.interface.parseLog(event);
        const tokenId = parsed?.args.tokenId.toString();
        // const requestId = parsed?.args.requestId.toString();
        
        setSuccess(`Art parameters requested! Token ID: ${tokenId}`);
        
        // Poll for completion
        pollForArtParams(tokenId);
      }
    } catch (error: unknown) {
      setError(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const pollForArtParams = async (tokenId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        // const provider = new BrowserProvider(window.ethereum);
        // const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        
        // const params = await contract.viewRenderParams(tokenId);
        // const seed = await contract.tokenSeed(tokenId);
        
        // Save only token ID to database
        await fetch('/api/art-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenId: parseInt(tokenId),
            requestId: tokenId,
          }),
        });

        setSuccess(`Art parameters generated for Token #${tokenId}!`);
        fetchArtTokens(); // Refresh the list
        return;
      } catch {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else {
          setError('Art parameters generation timed out');
        }
      }
    };

    poll();
  };

  const fetchLatestArtParams = async () => {
    if (!walletConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setLoadingParams(true);
    setError('');

    try {
      const provider = new BrowserProvider(window.ethereum!);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      // Get the next token ID to see what the latest token would be
      const nextTokenId = await contract.nextTokenId();
      const latestTokenId = nextTokenId - BigInt(1); // Subtract 1 to get the latest token
      
      if (latestTokenId < BigInt(1)) {
        setError('No art tokens have been generated yet');
        setLoadingParams(false);
        return;
      }

      // Try to get parameters for the latest token
      const params = await contract.viewRenderParams(latestTokenId);
      const seed = await contract.tokenSeed(latestTokenId);
      
      setLatestParams({
        tokenId: latestTokenId.toString(),
        seed: seed,
        parameters: {
          promptIndex: params.promptIndex,
          styleIndex: params.styleIndex,
          samplerIndex: params.samplerIndex,
          aspectIndex: params.aspectIndex,
          steps: params.steps,
          cfg: params.cfg,
          latentSeed: params.latentSeed,
          paletteId: params.paletteId,
        }
      });
      
      // Save only token ID to database
      await fetch('/api/art-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: parseInt(latestTokenId.toString()),
          requestId: latestTokenId.toString(),
        }),
      });
      
      setSuccess(`Latest art parameters loaded for Token #${latestTokenId}`);
      fetchArtTokens(); // Refresh the saved tokens list
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('not ready')) {
        setError('Latest art parameters are not yet ready. Please wait a moment and try again.');
      } else {
        setError(`Failed to fetch latest art parameters: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setLoadingParams(false);
    }
  };

  const generateLatestImage = async () => {
    if (!latestParams) return;
    
    setGeneratingLatestImage(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-image-async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters: latestParams.parameters,
          tokenId: latestParams.tokenId
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Show success message
        alert('Image generation started! Your art will be ready in a few minutes. You can check the status by refreshing the page.');
        
        // Start polling for status updates
        pollLatestImageStatus();
      } else {
        setError('Failed to start image generation');
      }
    } catch {
      setError('Failed to start image generation');
    } finally {
      setGeneratingLatestImage(false);
    }
  };

  const pollLatestImageStatus = async () => {
    const maxAttempts = 30; // Poll for up to 5 minutes (10 seconds * 30)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/images?tokenId=${latestParams?.tokenId}`);
        if (response.ok) {
          const result = await response.json();
          
          if (result.status === 'completed') {
            // Image is ready, update the UI
            setLatestGeneratedImage(result.imageData);
            setGeneratingLatestImage(false);
            return;
          } else if (result.status === 'failed') {
            setError('Image generation failed');
            setGeneratingLatestImage(false);
            return;
          }
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setError('Image generation timed out');
          setGeneratingLatestImage(false);
        }
      } catch (error) {
        console.error('Error polling image status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        } else {
          setError('Failed to check image status');
          setGeneratingLatestImage(false);
        }
      }
    };

    poll();
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">🎨 AleaArt Dashboard</h1>
            <p className="text-blue-200">Generate unique art with blockchain randomness</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/marketplace')}
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 font-medium"
            >
              🛒 Marketplace
            </button>
            <span className="text-white">Welcome, {session?.user?.name}</span>
            <button
              onClick={() => signOut()}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Wallet Connection */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">🔗 Wallet Connection</h2>
            {!walletConnected ? (
              <button
                onClick={connectWallet}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Connect MetaMask
              </button>
            ) : (
              <div className="text-white">
                <p className="text-green-400 mb-2">✅ Wallet Connected</p>
                <p className="text-sm text-blue-200 break-all">{walletAddress}</p>
              </div>
            )}
          </div>

          {/* Art Generation */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">🎲 Generate Art Parameters</h2>
            <button
              onClick={requestArtParams}
              disabled={!walletConnected || loading}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Request Art Parameters'}
            </button>
            <p className="text-blue-200 text-sm mt-2">
              Estimated cost: ~0.0004 ETH + gas
            </p>
          </div>
        </div>

        {/* Fetch Latest Art Parameters */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">🔍 Fetch Latest Art Parameters</h2>
            <div className="flex gap-4">
              <button
                onClick={fetchLatestArtParams}
                disabled={!walletConnected || loadingParams}
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingParams ? 'Fetching...' : 'Get Latest Art Parameters'}
              </button>
              {latestParams && (
                <button
                  onClick={() => setLatestParams(null)}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Clear Display
                </button>
              )}
            </div>
            <p className="text-blue-200 text-sm mt-2">
              Fetch the most recently generated art parameters from the blockchain
            </p>
          </div>
        </div>

        {/* Latest Art Parameters Display */}
        {latestParams && (
          <div className="mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">🎨 Latest Art Parameters</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-blue-200 text-sm">Token ID</div>
                  <div className="text-white font-bold text-xl">#{latestParams.tokenId}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-blue-200 text-sm">Prompt Index</div>
                  <div className="text-white font-bold text-xl">{Number(latestParams.parameters.promptIndex)}/12</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-blue-200 text-sm">Style Index</div>
                  <div className="text-white font-bold text-xl">{Number(latestParams.parameters.styleIndex)}/10</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-blue-200 text-sm">Sampler Index</div>
                  <div className="text-white font-bold text-xl">{Number(latestParams.parameters.samplerIndex)}/6</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-blue-200 text-sm">Aspect Index</div>
                  <div className="text-white font-bold text-xl">{Number(latestParams.parameters.aspectIndex)}/5</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-blue-200 text-sm">Steps</div>
                  <div className="text-white font-bold text-xl">{Number(latestParams.parameters.steps)}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-blue-200 text-sm">CFG Scale</div>
                  <div className="text-white font-bold text-xl">{(Number(latestParams.parameters.cfg) / 10).toFixed(1)}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-blue-200 text-sm">Palette ID</div>
                  <div className="text-white font-bold text-xl">{Number(latestParams.parameters.paletteId)}/24</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-blue-200 text-sm">Latent Seed</div>
                <div className="text-white font-mono text-sm break-all">{Number(latestParams.parameters.latentSeed)}</div>
              </div>
              <div className="mt-2">
                <div className="text-blue-200 text-sm">Random Seed</div>
                <div className="text-white font-mono text-xs break-all">{latestParams.seed}</div>
              </div>
              
              <div className="mt-4 text-center">
                <button
                  onClick={generateLatestImage}
                  disabled={generatingLatestImage}
                  className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingLatestImage ? '⏳ Generating... (2-3 min)' : '🎨 Generate Image'}
                </button>
              </div>
              
              {latestGeneratedImage && (
                <div className="mt-4">
                  <h4 className="text-white font-medium mb-2">Generated Image:</h4>
                  <img 
                    src={latestGeneratedImage} 
                    alt={`Generated art for token ${latestParams.tokenId}`}
                    className="w-full rounded-lg border border-white/20"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mt-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mt-6">
            {success}
          </div>
        )}

        {/* Generated Images */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">🖼️ Generated Images</h2>
            <button
              onClick={fetchGeneratedImages}
              disabled={loadingImages}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loadingImages ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          {generatedImages.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              No generated images yet. Generate some art from your tokens above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedImages.map((image, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-white/20">
                  <div className="aspect-square mb-3">
                    <img
                      src={image.ipfsUrl || (image.imageData?.startsWith('data:') ? image.imageData : `data:image/png;base64,${image.imageData}`)}
                      alt={`Generated art for token ${image.tokenId}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="text-white text-sm">
                    <div className="font-medium">Token #{image.tokenId}</div>
                    <div className="text-gray-400 text-xs mt-1">
                      {new Date(image.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-gray-400 text-xs mt-1 truncate">
                      {image.prompt}
                    </div>
                    <button
                      onClick={() => mintNFT(image)}
                      disabled={mintingNFT === image.tokenId}
                      className="mt-3 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {mintingNFT === image.tokenId ? '⏳ Minting...' : '🎨 Mint as NFT'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Art Tokens */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-white mb-6">🎨 Your Art Tokens</h2>
          {artTokens.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
              <p className="text-blue-200 text-lg">No art tokens generated yet</p>
              <p className="text-blue-300 text-sm mt-2">Connect your wallet and generate your first art parameters!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artTokens.map((token, index) => (
                <ArtTokenCard key={index} token={token} fetchTokenParameters={fetchTokenParameters} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
