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
  
  // Deploy MockERC20 (USDC) - current mock has no constructor args
  const MockERC20Artifact = await hre.artifacts.readArtifact("MockERC20");
  const MockERC20Factory = new ethersLib.ContractFactory(MockERC20Artifact.abi, MockERC20Artifact.bytecode, deployer);
  const mockUSDC = await MockERC20Factory.deploy();
  await mockUSDC.deployTransaction.wait();
  console.log("✅ Mock USDC deployed to:", mockUSDC.address);

  // Deploy MockWETH9
  const MockWETH9Artifact = await hre.artifacts.readArtifact("MockWETH9");
  const MockWETH9Factory = new ethersLib.ContractFactory(MockWETH9Artifact.abi, MockWETH9Artifact.bytecode, deployer);
  const mockWETH = await MockWETH9Factory.deploy();
  await mockWETH.deployTransaction.wait();
  console.log("✅ Mock WETH deployed to:", mockWETH.address);

  // Deploy MockPoolImpl (constructor expects USDC and WETH)
  const MockPoolImplArtifact = await hre.artifacts.readArtifact("MockPoolImpl");
  const MockPoolImplFactory = new ethersLib.ContractFactory(MockPoolImplArtifact.abi, MockPoolImplArtifact.bytecode, deployer);
  const mockPool = await MockPoolImplFactory.deploy(mockUSDC.address, mockWETH.address);
  await mockPool.deployTransaction.wait();
  console.log("✅ Mock Pool deployed to:", mockPool.address);

  // Deploy MockAddressesProvider
  const MockAddressesProviderArtifact = await hre.artifacts.readArtifact("MockAddressesProvider");
  const MockAddressesProviderFactory = new ethersLib.ContractFactory(MockAddressesProviderArtifact.abi, MockAddressesProviderArtifact.bytecode, deployer);
  const mockProvider = await MockAddressesProviderFactory.deploy(mockPool.address);
  await mockProvider.deployTransaction.wait();
  console.log("✅ Mock Addresses Provider deployed to:", mockProvider.address);

  // No reserve configuration needed for current MockPool implementation

  // Seed USDC liquidity
  await mockUSDC.mint(deployer.address, ethersLib.BigNumber.from(1_000_000n * 10n ** 6n));
  await mockUSDC.approve(mockPool.address, ethersLib.constants.MaxUint256);
  await mockPool.deposit(mockUSDC.address, ethersLib.BigNumber.from(500_000n * 10n ** 6n), deployer.address, 0);
  
  // Seed WETH liquidity to Mock Pool
  await mockWETH.deposit({ value: ethersLib.BigNumber.from(100n * 10n ** 18n) }); // 100 ETH worth of WETH
  await mockWETH.transfer(mockPool.address, ethersLib.BigNumber.from(100n * 10n ** 18n));
  console.log("✅ Pool liquidity seeded (USDC + WETH)");

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

  // ========== Deploy MockEthOracle ==========
  console.log("\n📈 Deploying MockEthOracle...");
  const OracleArtifact = await hre.artifacts.readArtifact("MockEthOracle");
  const OracleFactory = new ethersLib.ContractFactory(
    OracleArtifact.abi,
    OracleArtifact.bytecode,
    deployer
  );

  const oracle = await OracleFactory.deploy(3000n * 10n ** 8n, 8);
  await oracle.deployTransaction.wait();
  const oracleAddress = oracle.address;
  console.log("✅ MockEthOracle deployed to:", oracleAddress);

  // ========== Deploy PriceConsumer linked to Oracle ==========
  console.log("\n📊 Deploying PriceConsumer...");
  const ConsumerArtifact = await hre.artifacts.readArtifact("PriceConsumer");
  const ConsumerFactory = new ethersLib.ContractFactory(
    ConsumerArtifact.abi,
    ConsumerArtifact.bytecode,
    deployer
  );

  const consumer = await ConsumerFactory.deploy(oracleAddress);
  await consumer.deployTransaction.wait();
  const consumerAddress = consumer.address;
  console.log("✅ PriceConsumer deployed to:", consumerAddress);

  console.log("\n✨ Deployment completed!");
  console.log("\n📋 Deployed contracts:");
  console.log("  Vault:                  ", vaultAddress);
  console.log("  LoanWrapperRegistry:    ", registryAddress);
  console.log("\n📋 Mock contracts:");
  console.log("  Mock USDC:              ", mockUSDC.address);
  console.log("  Mock WETH:              ", mockWETH.address);
  console.log("  Mock Pool:              ", mockPool.address);
  console.log("  Mock Provider:          ", mockProvider.address);
  console.log("  Mock ETH price:         ", oracleAddress);
  console.log("  PriceConsumer:          ", consumerAddress);
  console.log("\n💡 LoanWrapper contracts will be deployed dynamically when wrapping loans");

  // Generate deployedContracts.ts for frontend
  const mockAddresses = {
    mockUSDC: mockUSDC.address,
    mockWETH: mockWETH.address,
    mockPool: mockPool.address,
    mockProvider: mockProvider.address,
    oracleAddress: oracleAddress,
    consumerAddress: consumerAddress,
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
  const MockPoolImplABI = (await hre.artifacts.readArtifact("MockPoolImpl")).abi;
  const MockAddressesProviderABI = (await hre.artifacts.readArtifact("MockAddressesProvider")).abi;
  const MockVariableDebtTokenABI = (await hre.artifacts.readArtifact("MockVariableDebtToken")).abi;
  const MockATokenABI = (await hre.artifacts.readArtifact("MockAToken")).abi;
  const OracleABI = (await hre.artifacts.readArtifact("MockEthOracle")).abi;
  const ConsumerABI = (await hre.artifacts.readArtifact("PriceConsumer")).abi;
  
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
      MockPool: {
        address: mockAddresses.mockPool,
        abi: MockPoolImplABI,
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
      MockEthOracle: {
        address: mockAddresses.oracleAddress,
        abi: OracleABI,
      },
      PriceConsumer: {
        address: mockAddresses.consumerAddress,
        abi: ConsumerABI,
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