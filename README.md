# AleaArt - Blockchain-Powered Generative Art Platform

AleaArt is a decentralized platform that generates unique art parameters using on-chain randomness from Pyth Entropy, creates AI-generated images using Stable Diffusion, and enables NFT minting and trading. Each art piece is truly unique, verifiable on the blockchain, and tradeable as NFTs.

## 🎨 Key Features

- **On-Chain Randomness**: Uses Pyth Entropy V2 for verifiable, tamper-proof randomness
- **Generative Art Parameters**: Converts randomness into detailed art generation parameters
- **AI Image Generation**: Creates stunning images using Stable Diffusion models
- **NFT Minting**: Convert generated art into tradeable NFTs on Arbitrum Sepolia
- **Decentralized Marketplace**: Buy and sell NFTs directly peer-to-peer
- **Spotlight Feature**: Randomly select and feature NFT holders using Pyth Entropy
- **IPFS Storage**: Images stored on decentralized IPFS network via Pinata
- **User Authentication**: Secure login/signup with NextAuth.js
- **Wallet Integration**: MetaMask connection for blockchain interactions
- **Image Gallery**: Personal gallery to view and manage generated artwork
- **Real-time Generation**: Asynchronous image generation with status tracking
- **No Platform Fees**: Direct peer-to-peer trading with 100% proceeds to sellers

## 🔗 Smart Contracts

### EntropyArtParamsV2 Contract
**Address**: `0x420D121aE08007Ef0A66E67D5D7BfFdC98AbECF0`  
**Network**: Arbitrum Sepolia  
**Location**: `contracts/EntropyArtParamsV2.sol`

The core contract that leverages **Pyth Entropy V2** to generate deterministic art parameters:

- **Randomness Request**: Requests verifiable randomness from Pyth's decentralized network
- **Parameter Generation**: Converts randomness into art parameters:
  - Prompt templates (12 different styles)
  - Style modifiers (10 artistic styles)
  - Technical parameters (steps, CFG scale, aspect ratio)
  - Unique seeds for reproducibility
- **On-Chain Storage**: Stores parameters permanently for verification
- **Event Emission**: Emits events for frontend integration

### AleaArtNFT Contract
**Address**: `0x806019F8a33A01a4A3fea93320601cC77B6Dcb79`  
**Network**: Arbitrum Sepolia  
**Location**: `contracts/AleaArtNFT.sol`

The NFT marketplace contract enabling art trading:

- **NFT Minting**: Convert generated art into ERC721 NFTs
- **IPFS Integration**: Links NFTs to images stored on IPFS
- **Marketplace Functions**: Buy, sell, and trade NFTs
- **Price Management**: Set and update NFT prices
- **Ownership Tracking**: Tracks both creator and current owner
- **Direct Payments**: 100% of sale proceeds go to seller (no platform fees)
- **Sale Status**: Enable/disable NFTs for sale

### SpotlightSelector Contract
**Address**: `0xd596C7C17331013C85c791092247e33267d9291e`  
**Network**: Arbitrum Sepolia  
**Location**: `contracts/SpotlightSelector.sol`

The spotlight feature contract for random NFT selection:

- **Random Selection**: Uses Pyth Entropy to randomly select NFT holders
- **Spotlight Duration**: Features selected NFT for 24 hours (configurable)
- **Fee System**: Requires 0.001 ETH fee to request new spotlight
- **Automatic Expiry**: Spotlight automatically expires after duration
- **Fair Selection**: Truly random selection from all available NFTs
- **Event Tracking**: Emits events for spotlight requests and selections

### Contract Functions Overview

#### EntropyArtParamsV2:
- `requestArtParams()` - Request new art parameters (costs ~0.0004 ETH)
- `viewRenderParams(tokenId)` - View generated parameters
- `tokenSeed(tokenId)` - Get the random seed used
- `nextTokenId()` - Get next available token ID

#### AleaArtNFT:
- `mintNFT(to, ipfsHash, prompt, price)` - Mint new NFT
- `buyNFT(tokenId)` - Purchase NFT (sends ETH to seller)
- `setPrice(tokenId, newPrice)` - Update NFT price
- `setSaleStatus(tokenId, isForSale)` - Enable/disable for sale
- `getAllNFTs()` - Get all minted NFTs
- `getNFTsForSale()` - Get NFTs currently for sale

#### SpotlightSelector:
- `requestSpotlight()` - Request new spotlight selection (costs 0.001 ETH)
- `getCurrentSpotlight()` - Get current active spotlight
- `isSpotlightActive(spotlightId)` - Check if spotlight is active
- `getSpotlight(spotlightId)` - Get spotlight by ID
- `setSpotlightDuration(duration)` - Update spotlight duration (owner only)
- `setSpotlightFee(fee)` - Update spotlight fee (owner only)

## 🏗️ Architecture

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Python Flask with Stable Diffusion integration
- **Database**: MongoDB for user data and generated images metadata
- **Blockchain**: Arbitrum Sepolia testnet
- **Authentication**: NextAuth.js with JWT tokens
- **Image Storage**: IPFS via Pinata (decentralized)
- **NFT Standard**: ERC721 compliant
- **Payment**: Direct ETH transfers (no platform fees)

## 🚀 Technology Stack

- **Blockchain**: Solidity, Hardhat, Ethers.js, OpenZeppelin
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Python, Flask, Stable Diffusion, PyTorch
- **Database**: MongoDB, Mongoose
- **Authentication**: NextAuth.js
- **Randomness**: Pyth Entropy V2 SDK
- **Storage**: IPFS, Pinata API
- **NFT**: ERC721 standard

## 🎯 User Journey

1. **Connect Wallet**: Link MetaMask to Arbitrum Sepolia
2. **Generate Parameters**: Request art parameters using Pyth Entropy (~0.0004 ETH)
3. **Create Art**: AI generates unique image using Stable Diffusion
4. **Mint NFT**: Convert art to tradeable NFT with custom price
5. **Trade**: Buy/sell NFTs in the decentralized marketplace
6. **Spotlight**: Request spotlight to randomly feature NFT holders (0.001 ETH)
7. **Own**: Full ownership and control of your digital art

## 💰 Economic Model

- **No Platform Fees**: 100% of NFT sales go to the seller
- **Gas Costs Only**: Users pay only blockchain transaction fees
- **Creator Royalties**: Not implemented (sellers keep full proceeds)
- **Decentralized**: No central authority controlling the platform
