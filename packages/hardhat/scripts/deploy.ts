import { ethers as ethersLib } from "ethers";
import hre from "hardhat";

async function main() {
  console.log("🚀 Starting deployment on Hardhat network...\n");

  // Use default Hardhat network RPC URL
  const provider = new ethersLib.providers.JsonRpcProvider("http://127.0.0.1:8545");
  
  // Use default Hardhat account #0 private key
  const deployerPK = process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY || 
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const deployer = new ethersLib.Wallet(deployerPK, provider);
  
  console.log("Deploying contracts with account:", deployer.address);
  const balance = await provider.getBalance(deployer.address);
  console.log("Account balance:", ethersLib.utils.formatEther(balance), "ETH\n");

  // ========== Deploy Mock Contracts ==========
  console.log("📦 Deploying Mock Contracts...");
  
  // Deploy MockERC20 (USDC)
  const MockERC20Artifact = await hre.artifacts.readArtifact("MockERC20");
  const MockERC20Factory = new ethersLib.ContractFactory(MockERC20Artifact.abi, MockERC20Artifact.bytecode, deployer);
  const mockUSDC = await MockERC20Factory.deploy("Mock USDC", "mUSDC", 6);
  await mockUSDC.deployTransaction.wait();
  console.log("✅ Mock USDC deployed to:", mockUSDC.address);

  // Deploy MockWETH9
  const MockWETH9Artifact = await hre.artifacts.readArtifact("MockWETH9");
  const MockWETH9Factory = new ethersLib.ContractFactory(MockWETH9Artifact.abi, MockWETH9Artifact.bytecode, deployer);
  const mockWETH = await MockWETH9Factory.deploy();
  await mockWETH.deployTransaction.wait();
  console.log("✅ Mock WETH deployed to:", mockWETH.address);

  // Deploy MockAavePool
  const MockAavePoolArtifact = await hre.artifacts.readArtifact("MockAavePool");
  const MockAavePoolFactory = new ethersLib.ContractFactory(MockAavePoolArtifact.abi, MockAavePoolArtifact.bytecode, deployer);
  const mockPool = await MockAavePoolFactory.deploy();
  await mockPool.deployTransaction.wait();
  console.log("✅ Mock Aave Pool deployed to:", mockPool.address);

  // Deploy MockAddressesProvider
  const MockAddressesProviderArtifact = await hre.artifacts.readArtifact("MockAddressesProvider");
  const MockAddressesProviderFactory = new ethersLib.ContractFactory(MockAddressesProviderArtifact.abi, MockAddressesProviderArtifact.bytecode, deployer);
  const mockProvider = await MockAddressesProviderFactory.deploy(mockPool.address);
  await mockProvider.deployTransaction.wait();
  console.log("✅ Mock Addresses Provider deployed to:", mockProvider.address);

  // Deploy MockVariableDebtToken
  const MockVariableDebtTokenArtifact = await hre.artifacts.readArtifact("MockVariableDebtToken");
  const MockVariableDebtTokenFactory = new ethersLib.ContractFactory(MockVariableDebtTokenArtifact.abi, MockVariableDebtTokenArtifact.bytecode, deployer);
  const variableDebtToken = await MockVariableDebtTokenFactory.deploy();
  await variableDebtToken.deployTransaction.wait();
  console.log("✅ Mock Variable Debt Token deployed to:", variableDebtToken.address);

  // Deploy MockAToken
  const MockATokenArtifact = await hre.artifacts.readArtifact("MockAToken");
  const MockATokenFactory = new ethersLib.ContractFactory(MockATokenArtifact.abi, MockATokenArtifact.bytecode, deployer);
  const aToken = await MockATokenFactory.deploy(mockUSDC.address);
  await aToken.deployTransaction.wait();
  console.log("✅ Mock aToken deployed to:", aToken.address);

  // Configure pool reserve data
  await mockPool.setReserveData(mockUSDC.address, aToken.address, ethersLib.constants.AddressZero, variableDebtToken.address);
  console.log("✅ Pool reserve data configured");

  // Seed USDC liquidity
  await mockUSDC.mint(deployer.address, ethersLib.BigNumber.from(1_000_000n * 10n ** 6n));
  await mockUSDC.approve(mockPool.address, ethersLib.constants.MaxUint256);
  await mockPool.deposit(mockUSDC.address, ethersLib.BigNumber.from(500_000n * 10n ** 6n), deployer.address, 0);
  console.log("✅ Pool liquidity seeded");

  // ========== Deploy Vault ==========
  console.log("\n📦 Deploying Vault...");
  const VaultArtifact = await hre.artifacts.readArtifact("Vault");
  const VaultFactory = new ethersLib.ContractFactory(
    VaultArtifact.abi,
    VaultArtifact.bytecode,
    deployer
  );
  
  const vault = await VaultFactory.deploy("Cushion Vault", "cvPYUSD");
  await vault.deployTransaction.wait();
  const vaultAddress = vault.address;
  console.log("✅ Vault deployed to:", vaultAddress);

  // ========== Deploy LoanWrapperRegistry ==========
  console.log("\n📦 Deploying LoanWrapperRegistry...");
  const RegistryArtifact = await hre.artifacts.readArtifact("LoanWrapperRegistry");
  const RegistryFactory = new ethersLib.ContractFactory(
    RegistryArtifact.abi,
    RegistryArtifact.bytecode,
    deployer
  );
  
  const registry = await RegistryFactory.deploy(
    mockProvider.address,  // Aave Pool Addresses Provider
    vaultAddress,         // Vault address
    mockWETH.address,     // WETH address
    mockUSDC.address      // USDC address
  );
  await registry.deployTransaction.wait();
  const registryAddress = registry.address;
  console.log("✅ LoanWrapperRegistry deployed to:", registryAddress);

  console.log("\n✨ Deployment completed!");
  console.log("\n📋 Deployed contracts:");
  console.log("  Vault:                  ", vaultAddress);
  console.log("  LoanWrapperRegistry:    ", registryAddress);
  console.log("\n📋 Mock contracts:");
  console.log("  Mock USDC:              ", mockUSDC.address);
  console.log("  Mock WETH:              ", mockWETH.address);
  console.log("  Mock Aave Pool:         ", mockPool.address);
  console.log("  Mock Provider:          ", mockProvider.address);
  console.log("  Variable Debt Token:    ", variableDebtToken.address);
  console.log("  aToken:                 ", aToken.address);
  console.log("\n💡 LoanWrapper contracts will be deployed dynamically when wrapping loans");

  // Generate deployedContracts.ts for frontend
  const mockAddresses = {
    mockUSDC: mockUSDC.address,
    mockWETH: mockWETH.address,
    mockPool: mockPool.address,
    mockProvider: mockProvider.address,
    variableDebtToken: variableDebtToken.address,
    aToken: aToken.address,
  };
  await generateDeployedContracts(vaultAddress, registryAddress, mockAddresses);
}

async function generateDeployedContracts(vaultAddress: string, registryAddress: string, mockAddresses: any) {
  const fs = await import("fs");
  const path = await import("path");
  
  // Read ABIs from artifacts
  const VaultABI = (await hre.artifacts.readArtifact("Vault")).abi;
  const RegistryABI = (await hre.artifacts.readArtifact("LoanWrapperRegistry")).abi;
  const MockERC20ABI = (await hre.artifacts.readArtifact("MockERC20")).abi;
  const MockWETH9ABI = (await hre.artifacts.readArtifact("MockWETH9")).abi;
  const MockAavePoolABI = (await hre.artifacts.readArtifact("MockAavePool")).abi;
  const MockAddressesProviderABI = (await hre.artifacts.readArtifact("MockAddressesProvider")).abi;
  const MockVariableDebtTokenABI = (await hre.artifacts.readArtifact("MockVariableDebtToken")).abi;
  const MockATokenABI = (await hre.artifacts.readArtifact("MockAToken")).abi;
  
  const chainId = "31337"; // Hardhat local chain ID as string
  
  const deployedContracts = {
    [chainId]: {
      Vault: {
        address: vaultAddress,
        abi: VaultABI,
      },
      LoanWrapperRegistry: {
        address: registryAddress,
        abi: RegistryABI,
      },
      MockUSDC: {
        address: mockAddresses.mockUSDC,
        abi: MockERC20ABI,
      },
      MockWETH: {
        address: mockAddresses.mockWETH,
        abi: MockWETH9ABI,
      },
      MockAavePool: {
        address: mockAddresses.mockPool,
        abi: MockAavePoolABI,
      },
      MockAddressesProvider: {
        address: mockAddresses.mockProvider,
        abi: MockAddressesProviderABI,
      },
      MockVariableDebtToken: {
        address: mockAddresses.variableDebtToken,
        abi: MockVariableDebtTokenABI,
      },
      MockAToken: {
        address: mockAddresses.aToken,
        abi: MockATokenABI,
      },
    },
  } as const;
  
  const fileContent = `/**
 * This file is autogenerated by Scaffold-ETH.
 * You should not edit it manually or your changes might be overwritten.
 */
import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

const deployedContracts = ${JSON.stringify(deployedContracts, null, 2)} as const;

export default deployedContracts satisfies GenericContractsDeclaration;
`;
  
  const outputPath = path.join(process.cwd(), "../nextjs/contracts/deployedContracts.ts");
  fs.writeFileSync(outputPath, fileContent);
  
  console.log("\n✅ Generated deployedContracts.ts for frontend");
  console.log("🌐 You can now view your contracts at http://localhost:3000/debug");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });