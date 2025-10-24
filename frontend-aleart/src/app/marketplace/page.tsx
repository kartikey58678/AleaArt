'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BrowserProvider } from 'ethers';

interface NFTData {
  tokenId: number;
  owner: string;
  ipfsHash: string;
  prompt: string;
  price: string;
  isForSale: boolean;
  creator: string;
  createdAt: number;
}

export default function Marketplace() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingNFT, setBuyingNFT] = useState<number | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    fetchNFTs();
    checkWalletConnection();
  }, [session, status, router]);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);
        setWalletConnected(true);
      } catch (error) {
        console.log('Wallet not connected');
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!');
      return;
    }

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Switch to Arbitrum Sepolia network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x66eee' }], // Arbitrum Sepolia chain ID
      });
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setUserAddress(address);
      setWalletConnected(true);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please make sure you\'re on Arbitrum Sepolia network.');
    }
  };

  const fetchNFTs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marketplace');
      const data = await response.json();
      
      if (data.success) {
        setNfts(data.nfts);
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const buyNFT = async (nft: NFTData) => {
    if (!walletConnected) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      setBuyingNFT(nft.tokenId);
      
      const response = await fetch('/api/buy-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId: nft.tokenId,
          price: nft.price,
          userAddress: userAddress,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`NFT purchased successfully! Token ID: ${nft.tokenId}`);
        fetchNFTs(); // Refresh the list
      } else {
        alert(`Failed to buy NFT: ${data.error}`);
      }
    } catch (error) {
      console.error('Error buying NFT:', error);
      alert('Error buying NFT. Please try again.');
    } finally {
      setBuyingNFT(null);
    }
  };

  const formatPrice = (price: string) => {
    const priceInEth = parseFloat(price) / 1e18;
    return priceInEth.toFixed(4);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">🎨 AleaArt Marketplace</h1>
            <p className="text-blue-200">Discover and collect unique AI-generated art NFTs</p>
          </div>
          
          <div className="flex gap-4">
            {!walletConnected ? (
              <button
                onClick={connectWallet}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-white text-sm">
                  {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </p>
              </div>
            )}
            
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Total NFTs</h3>
            <p className="text-3xl font-bold text-blue-300">{nfts.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">For Sale</h3>
            <p className="text-3xl font-bold text-green-300">
              {nfts.filter(nft => nft.isForSale).length}
            </p>
          </div>
        </div>

        {/* NFT Grid */}
        {nfts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-white text-xl mb-4">No NFTs available yet</div>
            <p className="text-blue-200">Be the first to mint an NFT!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nfts.map((nft) => (
              <div key={nft.tokenId} className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-200">
                {/* NFT Image */}
                <div className="aspect-square">
                  <img
                    src={`https://gateway.pinata.cloud/ipfs/${nft.ipfsHash}`}
                    alt={`NFT #${nft.tokenId}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* NFT Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-semibold">#{nft.tokenId}</h3>
                    {nft.isForSale && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        For Sale
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                    {nft.prompt}
                  </p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-gray-400 text-xs">Price</p>
                      <p className="text-white font-semibold">
                        {nft.isForSale ? `${formatPrice(nft.price)} ETH` : 'Not for sale'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Created</p>
                      <p className="text-white text-sm">{formatDate(nft.createdAt)}</p>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  {nft.isForSale ? (
                    <button
                      onClick={() => buyNFT(nft)}
                      disabled={buyingNFT === nft.tokenId || nft.owner.toLowerCase() === userAddress.toLowerCase()}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {buyingNFT === nft.tokenId ? '⏳ Buying...' : 
                       nft.owner.toLowerCase() === userAddress.toLowerCase() ? 'Your NFT' : 'Buy NFT'}
                    </button>
                  ) : (
                    <div className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg text-center font-medium">
                      Not for Sale
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
