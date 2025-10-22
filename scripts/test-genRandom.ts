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
  console.log("Testing PythEntropyExample contract...");
  
  // Check environment variables
  if (!process.env.SEPOLIA_RPC_URL) {
    throw new Error("SEPOLIA_RPC_URL not set in environment variables");
  }
  if (!process.env.SEPOLIA_PRIVATE_KEY) {
    throw new Error("SEPOLIA_PRIVATE_KEY not set in environment variables");
  }
  
  // Connect to Arbitrum Sepolia network
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  
  // Ensure private key has 0x prefix
  const privateKey = process.env.SEPOLIA_PRIVATE_KEY.startsWith('0x') 
    ? process.env.SEPOLIA_PRIVATE_KEY 
    : '0x' + process.env.SEPOLIA_PRIVATE_KEY;
    
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("Testing from address:", wallet.address);
  
  // Read compiled contract artifacts
  const artifactsPath = path.join(__dirname, "../artifacts/contracts/genRandom.sol/PythEntropyExample.json");
  const artifacts = JSON.parse(fs.readFileSync(artifactsPath, "utf8"));
  
  // Create contract instance
  const contract = new ethers.Contract("0xe20CF41Cd65E9F24d9d5E37f6ED6Cc2b099c0c6D", artifacts.abi, wallet);
  
  // Entropy contract ABI
  const entropyAbi = ["function getFeeV2() external view returns (uint256)"];
  const entropyContract = new ethers.Contract("0x549Ebba8036Ab746611B4fFA1423eb0A4Df61440", entropyAbi, provider);
  
  console.log("Contract address:", await contract.getAddress());
  
  // Check entropy address
  const entropy = await contract.entropy();
  console.log("Entropy address from contract:", entropy);
  
  // Get required fee
  console.log("\nGetting required fee...");
  const fee = await entropyContract.getFeeV2();
  const feeInEth = ethers.formatEther(fee);
  console.log("Required fee:", feeInEth, "ETH");
  
  // Request random number
  console.log("\nRequesting random number...");
  const totalValue = fee + ethers.parseEther("0.001"); // Add extra for gas
  
  const tx = await contract.requestRandomNumber({ value: totalValue });
  console.log("Transaction hash:", tx.hash);
  
  // Wait for transaction
  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt?.blockNumber);
  
  // Get sequence number from event
  const event = receipt?.logs.find(log => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "Requested";
    } catch {
      return false;
    }
  });
  
  if (event) {
    const parsed = contract.interface.parseLog(event);
    const sequenceNumber = parsed?.args[0];
    console.log("Sequence number:", sequenceNumber.toString());
    
    // Wait a bit for the callback to be executed
    console.log("\nWaiting for random number to be generated...");
    await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
    
    // Check if random number was generated
    const randomResult = await contract.randomResults(sequenceNumber);
    if (randomResult !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
      console.log("🎉 Random number generated:", randomResult);
    } else {
      console.log("⏳ Random number not yet generated. This may take some time...");
      console.log("You can check the result later using the frontend or by calling randomResults(", sequenceNumber.toString(), ")");
    }
  }
  
  console.log("\n✅ Test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
