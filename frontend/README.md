# 🎲 AleaArt Random Number Generator Frontend

A simple HTML/JavaScript frontend to interact with your deployed PythEntropyExample contract on Arbitrum Sepolia.

## 🚀 Quick Start

1. **Open the frontend**: Open `frontend/index.html` in your web browser
2. **Install MetaMask**: Make sure you have MetaMask browser extension installed
3. **Connect wallet**: Click "Connect MetaMask" and switch to Arbitrum Sepolia network
4. **Get test ETH**: Get some Arbitrum Sepolia ETH from a faucet
5. **Generate random numbers**: Click "Request Random Number" and wait for the result!

## 📋 Features

- **Wallet Connection**: Connect MetaMask and automatically switch to Arbitrum Sepolia
- **Fee Display**: See the required fee before requesting random numbers
- **Random Generation**: Request cryptographically secure random numbers
- **Real-time Status**: See transaction status and results in real-time
- **Beautiful UI**: Modern, responsive design with gradient backgrounds

## 🔧 Contract Details

- **Contract Address**: `0xe20CF41Cd65E9F24d9d5E37f6ED6Cc2b099c0c6D`
- **Network**: Arbitrum Sepolia
- **Entropy Provider**: Pyth Network
- **Entropy Address**: `0x549Ebba8036Ab746611B4fFA1423eb0A4Df61440`

## 🧪 Testing

You can also test the contract using the command line:

```bash
npx tsx scripts/test-genRandom.ts
```

## 📱 How to Use

1. **Connect Wallet**: Click the "Connect MetaMask" button
2. **Check Fee**: Click "Get Required Fee" to see how much ETH you need
3. **Request Random**: Click "Request Random Number" (this will cost ETH)
4. **Check Results**: Click "Check Random Results" to see if your number is ready
5. **View Results**: Generated random numbers will appear below

## ⚠️ Important Notes

- You need Arbitrum Sepolia ETH to pay for random number generation
- Random numbers are generated asynchronously and may take some time
- Each request costs a small fee (usually around 0.001 ETH)
- Make sure you're connected to Arbitrum Sepolia network

## 🎯 Use Cases

This random number generator can be used for:
- Gaming applications
- Lottery systems
- NFT generation
- Cryptographic applications
- Any application requiring verifiable randomness

## 🔗 Links

- [Arbitrum Sepolia Explorer](https://sepolia.arbiscan.io/address/0xe20CF41Cd65E9F24d9d5E37f6ED6Cc2b099c0c6D)
- [Pyth Network Documentation](https://docs.pyth.network/entropy)
- [Arbitrum Sepolia Faucet](https://faucet.quicknode.com/arbitrum/sepolia)
