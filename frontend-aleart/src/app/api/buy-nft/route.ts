import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ethers } from 'ethers';

const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '0x806019F8a33A01a4A3fea93320601cC77B6Dcb79';
const ARBITRUM_SEPOLIA_RPC = 'https://arbitrum-sepolia-rpc.publicnode.com';

// NFT Contract ABI
const NFT_CONTRACT_ABI = [
  "function buyNFT(uint256 tokenId) public payable",
  "function nftData(uint256 tokenId) public view returns (tuple(uint256 tokenId, address owner, string ipfsHash, string prompt, uint256 price, bool isForSale, address creator, uint256 createdAt))"
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tokenId, price, userAddress } = await request.json();

    if (!tokenId || !price || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to Arbitrum Sepolia
    const provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
    
    // Use the buyer's private key (in production, this would be handled client-side)
    const buyerPrivateKey = process.env.SEPOLIA_PRIVATE_KEY; // For demo purposes
    if (!buyerPrivateKey) {
      return NextResponse.json(
        { error: 'Buyer private key not configured' },
        { status: 500 }
      );
    }
    
    const wallet = new ethers.Wallet(buyerPrivateKey, provider);
    const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, wallet);
    
    // Check if NFT is for sale and get current price
    const nftData = await contract.nftData(tokenId);
    if (!nftData.isForSale) {
      return NextResponse.json(
        { error: 'NFT is not for sale' },
        { status: 400 }
      );
    }
    
    if (nftData.price.toString() !== price) {
      return NextResponse.json(
        { error: 'Price mismatch' },
        { status: 400 }
      );
    }
    
    // Call the buyNFT function with the correct price
    const tx = await contract.buyNFT(tokenId, { value: price });
    
    console.log('Buy transaction sent:', tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    console.log('Transaction confirmed:', receipt);

    return NextResponse.json({
      success: true,
      tokenId: tokenId,
      transactionHash: tx.hash,
      message: 'NFT purchased successfully on Arbitrum Sepolia'
    });

  } catch (error: unknown) {
    console.error('NFT purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to purchase NFT: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
