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
  console.log("Testing EntropyArtParamsV2 contract...");
  
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
  const artifactsPath = path.join(__dirname, "../artifacts/contracts/EntropyArtParamsV2.sol/EntropyArtParamsV2.json");
  const artifacts = JSON.parse(fs.readFileSync(artifactsPath, "utf8"));
  
  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = "0x420D121aE08007Ef0A66E67D5D7BfFdC98AbECF0";
  
  // Create contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, artifacts.abi, wallet);
  
  console.log("Contract address:", CONTRACT_ADDRESS);
  
  // Check entropy address (we know it from the contract)
  const entropy = "0x549Ebba8036Ab746611B4fFA1423eb0A4Df61440";
  console.log("Entropy address:", entropy);
  
  // Get required fee
  console.log("\nGetting required fee...");
  const fee = await contract.quoteEntropyFee();
  const feeInEth = ethers.formatEther(fee);
  console.log("Required fee:", feeInEth, "ETH");
  
  // Request art parameters
  console.log("\nRequesting art parameters...");
  const totalValue = fee + ethers.parseEther("0.001"); // Add extra for gas
  
  const tx = await contract.requestArtParams({ value: totalValue });
  console.log("Transaction hash:", tx.hash);
  
  // Wait for transaction
  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt?.blockNumber);
  
  // Get token ID and request ID from event
  const event = receipt?.logs.find(log => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "EntropyRequested";
    } catch {
      return false;
    }
  });
  
  if (event) {
    const parsed = contract.interface.parseLog(event);
    const tokenId = parsed?.args[0];
    const requestId = parsed?.args[1];
    console.log("Token ID:", tokenId.toString());
    console.log("Request ID:", requestId.toString());
    
    // Wait a bit for the callback to be executed
    console.log("\nWaiting for art parameters to be generated...");
    await new Promise(resolve => setTimeout(resolve, 20000)); // Wait 20 seconds
    
    // Check if art parameters were generated
    try {
      const params = await contract.viewRenderParams(tokenId);
      console.log("🎨 Art Parameters Generated!");
      console.log("Prompt Index:", params.promptIndex.toString());
      console.log("Style Index:", params.styleIndex.toString());
      console.log("Sampler Index:", params.samplerIndex.toString());
      console.log("Aspect Index:", params.aspectIndex.toString());
      console.log("Steps:", params.steps.toString());
      console.log("CFG:", params.cfg.toString());
      console.log("Latent Seed:", params.latentSeed.toString());
      console.log("Palette ID:", params.paletteId.toString());
      
      // Get the seed
      const seed = await contract.tokenSeed(tokenId);
      console.log("Token Seed:", seed);
      
    } catch (error) {
      console.log("⏳ Art parameters not yet generated. This may take some time...");
      console.log("You can check the result later using viewRenderParams(", tokenId.toString(), ")");
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
