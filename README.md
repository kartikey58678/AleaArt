# AleaArt - Blockchain-Powered Generative Art Platform

AleaArt is a decentralized platform that generates unique art parameters using on-chain randomness from Pyth Entropy, then creates AI-generated images using Stable Diffusion. Each art piece is truly unique and verifiable on the blockchain.

## 🎨 Key Features

- **On-Chain Randomness**: Uses Pyth Entropy V2 for verifiable, tamper-proof randomness
- **Generative Art Parameters**: Converts randomness into detailed art generation parameters
- **AI Image Generation**: Creates stunning images using Stable Diffusion models
- **User Authentication**: Secure login/signup with NextAuth.js
- **Wallet Integration**: MetaMask connection for blockchain interactions
- **Image Gallery**: Personal gallery to view and manage generated artwork
- **Real-time Generation**: Asynchronous image generation with status tracking

## 🔗 Smart Contracts

### EntropyArtParamsV2 Contract

The core contract that leverages **Pyth Entropy V2** to generate deterministic art parameters:

- **Network**: Arbitrum Sepolia
- **Entropy Provider**: Pyth Network's decentralized randomness
- **Functionality**: 
  - Requests verifiable randomness from Pyth Entropy
  - Converts randomness into art generation parameters (prompt, style, sampler, etc.)
  - Stores parameters on-chain for permanent verification
  - Emits events for frontend integration

### How Pyth Entropy Works

1. **Randomness Request**: Contract requests randomness from Pyth's decentralized network
2. **Callback Mechanism**: Pyth calls back with verifiable random data
3. **Parameter Generation**: Randomness is converted into art parameters:
   - Prompt templates (12 different styles)
   - Style modifiers (10 artistic styles)
   - Technical parameters (steps, CFG scale, aspect ratio)
   - Unique seeds for reproducibility

## 🏗️ Architecture

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Python Flask with Stable Diffusion integration
- **Database**: MongoDB for user data and generated images
- **Blockchain**: Arbitrum Sepolia testnet
- **Authentication**: NextAuth.js with JWT tokens
- **Image Storage**: Base64 encoding in MongoDB

## 🚀 Technology Stack

- **Blockchain**: Solidity, Hardhat, Ethers.js
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Python, Flask, Stable Diffusion, PyTorch
- **Database**: MongoDB, Mongoose
- **Authentication**: NextAuth.js
- **Randomness**: Pyth Entropy V2 SDK
