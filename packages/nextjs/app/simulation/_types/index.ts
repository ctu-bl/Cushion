export type VaultAction = "injectToLoan" | "withdrawFromLoan" | "liquidate";

export interface SimulationData {
  address?: string;
  mockUSDCInfo?: any;
  mockPYUSDInfo?: any;
  mockWETHInfo?: any;
  mockPoolInfo?: any;
  registryAddress?: string;
  allWrappers?: string[];
  mockUSDCBalance?: bigint;
  mockPYUSDBalance?: bigint;
  mockWETHBalance?: bigint;
  poolUSDCBalance?: bigint;
  poolWETHBalance?: bigint;
  userWrapperAddress?: string;
}

export interface WrapperData {
  totalCollateral?: bigint;
  totalDebt?: bigint;
  ownerCollateral?: bigint;
  investorCollateral?: bigint;
  isLocked?: boolean;
  healthFactor?: bigint;
}

export interface EthPriceData {
  currentEthPrice?: bigint;
  priceDecimals?: number;
  newEthPrice: string;
  setNewEthPrice: (value: string) => void;
  isUpdatingPrice: boolean;
  formatEthPrice: (price: bigint | undefined, decimals: number | undefined) => string;
  handleEthPriceUpdate: () => Promise<void>;
}
