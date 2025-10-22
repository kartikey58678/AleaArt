import * as dotenv from "dotenv";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Deploying to Arbitrum Sepolia...");
  
  // Check environment variables
  if (!process.env.SEPOLIA_RPC_URL) {
    throw new Error("SEPOLIA_RPC_URL not set in environment variables");
  }
  if (!process.env.SEPOLIA_PRIVATE_KEY) {
    throw new Error("SEPOLIA_PRIVATE_KEY not set in environment variables");
  }
  
  // Connect to Sepolia network
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  
  // Ensure private key has 0x prefix
  const privateKey = process.env.SEPOLIA_PRIVATE_KEY.startsWith('0x') 
    ? process.env.SEPOLIA_PRIVATE_KEY 
    : '0x' + process.env.SEPOLIA_PRIVATE_KEY;
    
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("Deploying from address:", wallet.address);
  
  // Read compiled contract artifacts
  const artifactsPath = path.join(__dirname, "../artifacts/contracts/genRandom.sol/PythEntropyExample.json");
  const artifacts = JSON.parse(fs.readFileSync(artifactsPath, "utf8"));
  
  // Create contract factory from artifacts
  const factory = new ethers.ContractFactory(artifacts.abi, artifacts.bytecode, wallet);
  
  // Arbitrum Sepolia Entropy contract address
  const entropyAddress = "0x549ebba8036ab746611b4ffa1423eb0a4df61440";
  
  console.log("Entropy contract address:", entropyAddress);
  
  // Deploy the contract
  const contract = await factory.deploy(entropyAddress);
  
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("Contract deployed to:", contractAddress);
  
  // Verify deployment
  console.log("Verifying deployment...");
  const entropy = await contract.entropy();
  console.log("Entropy address from contract:", entropy);
  
  console.log("\n🎉 Deployment successful!");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Arbitrum Sepolia");
  console.log("Entropy Address:", entropy);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
