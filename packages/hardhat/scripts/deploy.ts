import { ethers } from "ethers";
import hre from "hardhat";

// Aave V3 Sepolia addresses
const AAVE_POOL_ADDRESSES_PROVIDER = "0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A";
const AAVE_DATA_PROVIDER = "0x3e9708d80f7B3e43118013075F7e95CE3AB31F31";

async function main() {
  console.log("🚀 Starting deployment...\n");

  // Use default Hardhat network RPC URL
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  // Use default Hardhat account #0 private key
  const deployerPK = process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY || 
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const deployer = new ethers.Wallet(deployerPK, provider);
  
  console.log("Deploying contracts with account:", deployer.address);
  const balance = await provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // ========== Deploy Vault ==========
  console.log("📦 Deploying Vault...");
  const VaultArtifact = await hre.artifacts.readArtifact("Vault");
  const VaultFactory = new ethers.ContractFactory(
    VaultArtifact.abi,
    VaultArtifact.bytecode,
    deployer
  );
  
  const vault = await VaultFactory.deploy("Cushion Vault", "cvPYUSD");
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ Vault deployed to:", vaultAddress);

  // ========== Deploy LoanWrapperRegistryV2 ==========
  console.log("\n📦 Deploying LoanWrapperRegistryV2...");
  const RegistryArtifact = await hre.artifacts.readArtifact("LoanWrapperRegistryV2");
  const RegistryFactory = new ethers.ContractFactory(
    RegistryArtifact.abi,
    RegistryArtifact.bytecode,
    deployer
  );
  
  const registry = await RegistryFactory.deploy(
    AAVE_POOL_ADDRESSES_PROVIDER,
    vaultAddress,
    AAVE_DATA_PROVIDER
  );
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ LoanWrapperRegistryV2 deployed to:", registryAddress);

  console.log("\n✨ Deployment completed!");
  console.log("\n📋 Deployed contracts:");
  console.log("  Vault:", vaultAddress);
  console.log("  LoanWrapperRegistryV2:", registryAddress);
  console.log("\n🔗 Aave V3 Sepolia:");
  console.log("  Pool Provider:", AAVE_POOL_ADDRESSES_PROVIDER);
  console.log("  Data Provider:", AAVE_DATA_PROVIDER);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

