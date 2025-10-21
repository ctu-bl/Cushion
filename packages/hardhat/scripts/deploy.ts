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

  // Deploy MockPYUSD
  const MockPYUSDArtifact = await hre.artifacts.readArtifact("MockPYUSD");
  const MockPYUSDFactory = new ethersLib.ContractFactory(MockPYUSDArtifact.abi, MockPYUSDArtifact.bytecode, deployer);
  const mockPYUSD = await MockPYUSDFactory.deploy();
  await mockPYUSD.deployTransaction.wait();
  console.log("✅ Mock PYUSD deployed to:", mockPYUSD.address);

  // Deploy MockWETH9
  const MockWETH9Artifact = await hre.artifacts.readArtifact("MockWETH9");
  const MockWETH9Factory = new ethersLib.ContractFactory(MockWETH9Artifact.abi, MockWETH9Artifact.bytecode, deployer);
  const mockWETH = await MockWETH9Factory.deploy();
  await mockWETH.deployTransaction.wait();
  console.log("✅ Mock WETH deployed to:", mockWETH.address);

<<<<<<< HEAD
  // Deploy MockEthOracle
  const MockEthOracleArtifact = await hre.artifacts.readArtifact("MockEthOracle");
  const MockEthOracleFactory = new ethersLib.ContractFactory(MockEthOracleArtifact.abi, MockEthOracleArtifact.bytecode, deployer);
  // Initial price: 2000 USD with 8 decimals (like Chainlink)
  const initialEthPrice = ethersLib.BigNumber.from("200000000000"); // 2000 * 10^8
  const mockEthOracle = await MockEthOracleFactory.deploy(initialEthPrice, 8);
  await mockEthOracle.deployTransaction.wait();
  console.log("✅ Mock ETH Oracle deployed to:", mockEthOracle.address);

  // Seed MockWETH9 with ETH
  console.log("\n💰 Seeding MockWETH9 with ETH...");
  const wethEthAmount = ethersLib.utils.parseEther("200"); // 200 ETH (increased for pool operations)
=======
  // Seed MockWETH9 with ETH
  console.log("\n💰 Seeding MockWETH9 with ETH...");
  const wethEthAmount = ethersLib.utils.parseEther("20"); // 20 ETH (reduced)
>>>>>>> 47ac52f (fixed injection)
  await deployer.sendTransaction({
    to: mockWETH.address,
    value: wethEthAmount
  });
<<<<<<< HEAD
  console.log("✅ MockWETH9 seeded with 200 ETH");

  // Deploy MockPoolImpl (constructor expects USDC, WETH, and ETH Oracle)
=======
  console.log("✅ MockWETH9 seeded with 20 ETH");

  // Deploy MockPoolImpl (constructor expects USDC and WETH)
>>>>>>> 47ac52f (fixed injection)
  const MockPoolImplArtifact = await hre.artifacts.readArtifact("MockPoolImpl");
  const MockPoolImplFactory = new ethersLib.ContractFactory(MockPoolImplArtifact.abi, MockPoolImplArtifact.bytecode, deployer);
  const mockPool = await MockPoolImplFactory.deploy(mockUSDC.address, mockWETH.address, mockEthOracle.address);
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

  // ========== Deploy Mock Chainlink Oracles ==========
  console.log("\n📈 Deploying Mock Chainlink Oracles...");
  const MockChainlinkOracleArtifact = await hre.artifacts.readArtifact("MockChainlinkOracle");
  const MockChainlinkOracleFactory = new ethersLib.ContractFactory(MockChainlinkOracleArtifact.abi, MockChainlinkOracleArtifact.bytecode, deployer);
  
  // ETH/USD price feed (3000 USD per ETH)
  const mockEthUsdFeed = await MockChainlinkOracleFactory.deploy(3000n * 10n ** 8n, 8);
  await mockEthUsdFeed.deployTransaction.wait();
  console.log("✅ Mock ETH/USD Feed deployed to:", mockEthUsdFeed.address);
  
  // PYUSD/USD price feed (1 USD per PYUSD)
  const mockPyusdUsdFeed = await MockChainlinkOracleFactory.deploy(1n * 10n ** 8n, 8);
  await mockPyusdUsdFeed.deployTransaction.wait();
  console.log("✅ Mock PYUSD/USD Feed deployed to:", mockPyusdUsdFeed.address);

  // ========== Deploy Mock Uniswap Router ==========
  console.log("\n🔄 Deploying Mock Uniswap Router...");
  const MockUniswapRouterArtifact = await hre.artifacts.readArtifact("MockUniswapRouter");
  const MockUniswapRouterFactory = new ethersLib.ContractFactory(MockUniswapRouterArtifact.abi, MockUniswapRouterArtifact.bytecode, deployer);
<<<<<<< HEAD
  const mockSwapRouter = await MockUniswapRouterFactory.deploy(mockEthOracle.address);
=======
  const mockSwapRouter = await MockUniswapRouterFactory.deploy();
>>>>>>> 47ac52f (fixed injection)
  await mockSwapRouter.deployTransaction.wait();
  console.log("✅ Mock Uniswap Router deployed to:", mockSwapRouter.address);

  // ========== Seed Mock Router with WETH ==========
  console.log("\n💰 Seeding Mock Router with WETH...");
  await mockWETH.mint(mockSwapRouter.address, ethersLib.BigNumber.from(1000n * 10n ** 18n)); // 1000 WETH
  console.log("✅ Mock Router seeded with 1000 WETH");

  // ========== Seed Mock Router with ETH ==========
  console.log("\n💰 Seeding Mock Router with ETH...");
  const routerEthAmount = ethersLib.utils.parseEther("10"); // 10 ETH (much smaller amount)
  try {
    await deployer.sendTransaction({
      to: mockSwapRouter.address,
      value: routerEthAmount
    });
    console.log("✅ Mock Router seeded with 10 ETH");
  } catch (error: any) {
    console.log("⚠️ Failed to seed Mock Router with ETH, continuing without it");
    console.log("Error:", error.message);
  }

  // ========== Deploy Vault ==========
  console.log("\n📦 Deploying Vault...");
  const VaultArtifact = await hre.artifacts.readArtifact("Vault");
  const VaultFactory = new ethersLib.ContractFactory(
    VaultArtifact.abi,
    VaultArtifact.bytecode,
    deployer
  );
  
  const vault = await VaultFactory.deploy(
    "Cushion Vault", 
    "cvPYUSD", 
    mockPYUSD.address,
    mockWETH.address,
    mockSwapRouter.address,
    mockEthUsdFeed.address,
    mockPyusdUsdFeed.address
  );
  await vault.deployTransaction.wait();
  const vaultAddress = vault.address;
  console.log("✅ Vault deployed to:", vaultAddress);

<<<<<<< HEAD
  // ========== Vault starts empty ==========
  console.log("\n💰 Vault starts empty - no initial PYUSD seeding");

  // ========== Seed Deployer with PYUSD for testing ==========
  console.log("\n💰 Seeding Deployer with PYUSD for testing...");
  await mockPYUSD.mint(deployer.address, ethersLib.BigNumber.from(10000n * 10n ** 6n)); // 10K PYUSD
  console.log("✅ Deployer seeded with 10K PYUSD for testing");

  // ========== Seed Vault with ETH ==========
  //  will receive ETH from WETH withdraw operations, no need to seed with ETH
=======
  // ========== Seed Vault with PYUSD ==========
  console.log("\n💰 Seeding Vault with PYUSD...");
  await mockPYUSD.mint(vaultAddress, ethersLib.BigNumber.from(1000000n * 10n ** 6n)); // 1M PYUSD
  console.log("✅ Vault seeded with 1M PYUSD");

  // ========== Seed Vault with ETH ==========
  // Vault will receive ETH from WETH withdraw operations, no need to seed with ETH
>>>>>>> 47ac52f (fixed injection)
  console.log("✅ Vault will receive ETH from WETH operations");

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
  console.log("  Mock PYUSD:             ", mockPYUSD.address);
  console.log("  Mock WETH:              ", mockWETH.address);
  console.log("  Mock Pool:              ", mockPool.address);
  console.log("  Mock Provider:          ", mockProvider.address);
  console.log("  Mock ETH price:         ", oracleAddress);
  console.log("  PriceConsumer:          ", consumerAddress);
  console.log("  Mock ETH/USD Feed:      ", mockEthUsdFeed.address);
  console.log("  Mock PYUSD/USD Feed:    ", mockPyusdUsdFeed.address);
  console.log("  Mock Uniswap Router:    ", mockSwapRouter.address);
  console.log("\n💡 LoanWrapper contracts will be deployed dynamically when wrapping loans");

  // Generate deployedContracts.ts for frontend
  const mockAddresses = {
    mockUSDC: mockUSDC.address,
    mockPYUSD: mockPYUSD.address,
    mockWETH: mockWETH.address,
    mockPool: mockPool.address,
    mockProvider: mockProvider.address,
    oracleAddress: oracleAddress,
    consumerAddress: consumerAddress,
    mockEthUsdFeed: mockEthUsdFeed.address,
    mockPyusdUsdFeed: mockPyusdUsdFeed.address,
    mockSwapRouter: mockSwapRouter.address,
<<<<<<< HEAD
    mockEthOracle: mockEthOracle.address,
=======
>>>>>>> 47ac52f (fixed injection)
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
      MockPYUSD: {
        address: mockAddresses.mockPYUSD,
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
        address: mockAddresses.mockEthOracle,
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