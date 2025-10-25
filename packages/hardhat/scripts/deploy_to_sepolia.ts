// scripts/deploy_sepolia.ts
import { ethers as ethersLib } from "ethers";
import hre from "hardhat";

const WAIT_CONF = parseInt(process.env.CONFIRMATIONS ?? "2", 10);

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function normalizePK(pk: string): string {
  return pk.startsWith("0x") ? pk : `0x${pk}`;
}

async function waitDeployed(c: ethersLib.Contract) {
  await c.deployTransaction.wait(WAIT_CONF);
  return c.address;
}

async function main() {
  console.log("🚀 Starting deployment on Sepolia (zero-funded state)...\n");

  const rpcUrl = mustGetEnv("SEPOLIA_RPC_URL");
  const deployerPK = normalizePK(mustGetEnv("SEPOLIA_DEPLOYER_PRIVATE_KEY"));

  const provider = new ethersLib.providers.JsonRpcProvider(rpcUrl, { name: "sepolia", chainId: 11155111 });
  const deployer = new ethersLib.Wallet(deployerPK, provider);
  const feeData = await provider.getFeeData();

  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethersLib.utils.formatEther(await provider.getBalance(deployer.address)), "ETH\n");

  const overrides: ethersLib.PayableOverrides = {
    maxFeePerGas: feeData.maxFeePerGas ?? undefined,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
  };

  // ===== Artifacts =====
  const MockERC20Artifact = await hre.artifacts.readArtifact("MockERC20");
  const MockPYUSDArtifact = await hre.artifacts.readArtifact("MockPYUSD");
  const MockWETH9Artifact = await hre.artifacts.readArtifact("MockWETH9");
  const MockEthOracleArtifact = await hre.artifacts.readArtifact("MockEthOracle");
  const MockPoolImplArtifact = await hre.artifacts.readArtifact("MockPoolImpl");
  const MockAddressesProviderArtifact = await hre.artifacts.readArtifact("MockAddressesProvider");
  const MockChainlinkOracleArtifact = await hre.artifacts.readArtifact("MockChainlinkOracle");
  const MockUniswapRouterArtifact = await hre.artifacts.readArtifact("MockUniswapRouter");
  const VaultArtifact = await hre.artifacts.readArtifact("Vault");
  const RegistryArtifact = await hre.artifacts.readArtifact("LoanWrapperRegistry");
  const ConsumerArtifact = await hre.artifacts.readArtifact("PriceConsumer");

  // ===== Factories =====
  const MockERC20Factory = new ethersLib.ContractFactory(MockERC20Artifact.abi, MockERC20Artifact.bytecode, deployer);
  const MockPYUSDFactory = new ethersLib.ContractFactory(MockPYUSDArtifact.abi, MockPYUSDArtifact.bytecode, deployer);
  const MockWETH9Factory = new ethersLib.ContractFactory(MockWETH9Artifact.abi, MockWETH9Artifact.bytecode, deployer);
  const MockEthOracleFactory = new ethersLib.ContractFactory(MockEthOracleArtifact.abi, MockEthOracleArtifact.bytecode, deployer);
  const MockPoolImplFactory = new ethersLib.ContractFactory(MockPoolImplArtifact.abi, MockPoolImplArtifact.bytecode, deployer);
  const MockAddressesProviderFactory = new ethersLib.ContractFactory(
    MockAddressesProviderArtifact.abi,
    MockAddressesProviderArtifact.bytecode,
    deployer
  );
  const MockChainlinkOracleFactory = new ethersLib.ContractFactory(
    MockChainlinkOracleArtifact.abi,
    MockChainlinkOracleArtifact.bytecode,
    deployer
  );
  const MockUniswapRouterFactory = new ethersLib.ContractFactory(
    MockUniswapRouterArtifact.abi,
    MockUniswapRouterArtifact.bytecode,
    deployer
  );
  const VaultFactory = new ethersLib.ContractFactory(VaultArtifact.abi, VaultArtifact.bytecode, deployer);
  const RegistryFactory = new ethersLib.ContractFactory(RegistryArtifact.abi, RegistryArtifact.bytecode, deployer);
  const ConsumerFactory = new ethersLib.ContractFactory(ConsumerArtifact.abi, ConsumerArtifact.bytecode, deployer);

  // ===== Deploy mocks (no seeding) =====
  console.log("📦 Deploying mocks (no mint/transfer)...");
  const mockUSDC = await MockERC20Factory.deploy({ ...overrides });
  const mockUSDCAddr = await waitDeployed(mockUSDC);

  const mockPYUSD = await MockPYUSDFactory.deploy({ ...overrides });
  const mockPYUSDAddr = await waitDeployed(mockPYUSD);

  const mockWETH = await MockWETH9Factory.deploy({ ...overrides });
  const mockWETHAddr = await waitDeployed(mockWETH);

  // Price oracles can mít libovolnou počáteční cenu; to nemění zůstatky
  const initialEthPrice = ethersLib.BigNumber.from("200000000000"); // 2000 * 10^8
  const mockEthOracle = await MockEthOracleFactory.deploy(initialEthPrice, 8, { ...overrides });
  const mockEthOracleAddr = await waitDeployed(mockEthOracle);

  // Pool + Provider (žádné vklady)
  const mockPool = await MockPoolImplFactory.deploy(mockUSDCAddr, mockWETHAddr, mockEthOracleAddr, { ...overrides });
  const mockPoolAddr = await waitDeployed(mockPool);

  const mockProvider = await MockAddressesProviderFactory.deploy(mockPoolAddr, { ...overrides });
  const mockProviderAddr = await waitDeployed(mockProvider);

  // Chainlink-like feeds (jen deploy, bez interakcí)
  console.log("📈 Deploying Chainlink-like feeds...");
  const mockEthUsdFeed = await MockChainlinkOracleFactory.deploy(3000n * 10n ** 8n, 8, { ...overrides });
  const mockEthUsdFeedAddr = await waitDeployed(mockEthUsdFeed);

  const mockPyusdUsdFeed = await MockChainlinkOracleFactory.deploy(1n * 10n ** 8n, 8, { ...overrides });
  const mockPyusdUsdFeedAddr = await waitDeployed(mockPyusdUsdFeed);

  // Router (bez seedování WETH/ETH)
  console.log("🔄 Deploying Mock Uniswap Router (no liquidity)...");
  const mockSwapRouter = await MockUniswapRouterFactory.deploy(mockEthOracleAddr, mockPYUSDAddr, mockUSDCAddr, { ...overrides });
  const mockSwapRouterAddr = await waitDeployed(mockSwapRouter);

  // Vault (prázdný start)
  console.log("📦 Deploying Vault...");
  const vault = await VaultFactory.deploy(
    "Cushion Vault",
    "cvPYUSD",
    mockPYUSDAddr,
    mockWETHAddr,
    mockSwapRouterAddr,
    mockEthUsdFeedAddr,
    mockPyusdUsdFeedAddr,
    mockUSDCAddr,
    { ...overrides }
  );
  const vaultAddr = await waitDeployed(vault);

  // Registry
  console.log("📦 Deploying LoanWrapperRegistry...");
  const registry = await RegistryFactory.deploy(mockProviderAddr, vaultAddr, mockWETHAddr, mockUSDCAddr, { ...overrides });
  const registryAddr = await waitDeployed(registry);

  // Druhý oracle + consumer (jen deploy)
  console.log("📊 Deploying secondary MockEthOracle + PriceConsumer...");
  const oracle2 = await MockEthOracleFactory.deploy(3000n * 10n ** 8n, 8, { ...overrides });
  const oracle2Addr = await waitDeployed(oracle2);

  const consumer = await ConsumerFactory.deploy(oracle2Addr, { ...overrides });
  const consumerAddr = await waitDeployed(consumer);

  // Výpis
  console.log("\n✨ Deployment completed (all balances start at 0).");
  console.log("\n📋 Deployed contracts:");
  console.log("  Vault:                  ", vaultAddr);
  console.log("  LoanWrapperRegistry:    ", registryAddr);
  console.log("\n📋 Mocks:");
  console.log("  Mock USDC:              ", mockUSDCAddr);
  console.log("  Mock PYUSD:             ", mockPYUSDAddr);
  console.log("  Mock WETH:              ", mockWETHAddr);
  console.log("  Mock Pool:              ", mockPoolAddr);
  console.log("  Mock Provider:          ", mockProviderAddr);
  console.log("  Mock ETH Oracle (main): ", mockEthOracleAddr);
  console.log("  Mock ETH/USD Feed:      ", mockEthUsdFeedAddr);
  console.log("  Mock PYUSD/USD Feed:    ", mockPyusdUsdFeedAddr);
  console.log("  Mock Uniswap Router:    ", mockSwapRouterAddr);
  console.log("  Mock ETH price (2nd):   ", oracle2Addr);
  console.log("  PriceConsumer:          ", consumerAddr);

  // Generate deployedContracts.ts
  const mockAddresses = {
    mockUSDC: mockUSDCAddr,
    mockPYUSD: mockPYUSDAddr,
    mockWETH: mockWETHAddr,
    mockPool: mockPoolAddr,
    mockProvider: mockProviderAddr,
    oracleAddress: oracle2Addr,
    consumerAddress: consumerAddr,
    mockEthUsdFeed: mockEthUsdFeedAddr,
    mockPyusdUsdFeed: mockPyusdUsdFeedAddr,
    mockSwapRouter: mockSwapRouterAddr,
    mockEthOracle: mockEthOracleAddr,
  };
  await generateDeployedContracts(vaultAddr, registryAddr, mockAddresses);
}

async function generateDeployedContracts(vaultAddress: string, registryAddress: string, mockAddresses: any) {
  const fs = await import("fs");
  const path = await import("path");

  const VaultABI = (await hre.artifacts.readArtifact("Vault")).abi;
  const RegistryABI = (await hre.artifacts.readArtifact("LoanWrapperRegistry")).abi;
  const MockERC20ABI = (await hre.artifacts.readArtifact("MockERC20")).abi;
  const MockWETH9ABI = (await hre.artifacts.readArtifact("MockWETH9")).abi;
  const MockPoolImplABI = (await hre.artifacts.readArtifact("MockPoolImpl")).abi;
  const MockAddressesProviderABI = (await hre.artifacts.readArtifact("MockAddressesProvider")).abi;
  const OracleABI = (await hre.artifacts.readArtifact("MockEthOracle")).abi;
  const ConsumerABI = (await hre.artifacts.readArtifact("PriceConsumer")).abi;

  const chainId = "11155111"; // Sepolia

  const deployedContracts = {
    [chainId]: {
      Vault: { address: vaultAddress, abi: VaultABI },
      LoanWrapperRegistry: { address: registryAddress, abi: RegistryABI },
      MockUSDC: { address: mockAddresses.mockUSDC, abi: MockERC20ABI },
      MockPYUSD: { address: mockAddresses.mockPYUSD, abi: MockERC20ABI },
      MockWETH: { address: mockAddresses.mockWETH, abi: MockWETH9ABI },
      MockPool: { address: mockAddresses.mockPool, abi: MockPoolImplABI },
      MockAddressesProvider: { address: mockAddresses.mockProvider, abi: MockAddressesProviderABI },
      MockEthOracle: { address: mockAddresses.mockEthOracle, abi: OracleABI },
      PriceConsumer: { address: mockAddresses.consumerAddress, abi: ConsumerABI },
    },
  } as const;

  const fileContent = `/**
 * Autogenerated by deploy_sepolia.ts (zero-funded)
 */
import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

const deployedContracts = ${JSON.stringify(deployedContracts, null, 2)} as const;

export default deployedContracts satisfies GenericContractsDeclaration;
`;

  const outputPath = path.join(process.cwd(), "../nextjs/contracts/deployedContracts.ts");
  fs.writeFileSync(outputPath, fileContent);

  console.log("\n✅ Generated deployedContracts.ts for frontend (Sepolia, zero-funded)");
  console.log("🌐 Check http://localhost:3000/debug");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
