import * as dotenv from "dotenv";
import hre from "hardhat";

// Load environment variables
dotenv.config();

async function main() {
  console.log("Deploying PythEntropyExample...");
  
  // Get the contract factory
  const PythEntropyExample = await (hre as any).ethers.getContractFactory("PythEntropyExample");
  
  // Arbitrum Sepolia Entropy contract address
  const entropyAddress = "0x549ebba8036ab746611b4ffa1423eb0a4df61440";
  
  console.log("Entropy contract address:", entropyAddress);
  
  // Deploy the contract
  const contract = await PythEntropyExample.deploy(entropyAddress);
  
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("Contract deployed to:", contractAddress);
  
  // Verify deployment
  console.log("Verifying deployment...");
  const entropy = await contract.entropy();
  console.log("Entropy address from contract:", entropy);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
