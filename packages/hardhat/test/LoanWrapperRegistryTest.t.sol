// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

// === tvůj kontrakt (uprav import podle své struktury) ===
import {LoanWrapperRegistry} from "../contracts/LoanWrapperRegistryV1.sol";

// ---------- Mocks ----------

contract MockERC20 {
    string public name;
    string public symbol;
    uint8  public decimals;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory n, string memory s, uint8 d) {
        name = n; symbol = s; decimals = d;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "bal");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "bal");
        require(allowance[from][msg.sender] >= amount, "allow");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    // test helper
    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }
    function burn(address from, uint256 amount) external { require(balanceOf[from] >= amount, "burn"); balanceOf[from] -= amount; }
}

// WETH9 mock = ERC20 + deposit/withdraw
contract MockWETH9 is MockERC20 {
    constructor() MockERC20("Wrapped Ether", "WETH", 18) {}
    function deposit() external payable { balanceOf[msg.sender] += msg.value; }
    function withdraw(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "bal");
        balanceOf[msg.sender] -= amount;
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "eth send");
    }
    receive() external payable {}
}

// Aave Pool mock – implementuje jen to, co Registry volá
contract MockPool is IPool {
    address public immutable usdc;
    address public immutable weth;

    // záznamy posledního volání pro aserty
    address public lastDepositAsset;
    uint256 public lastDepositAmount;
    address public lastDepositOnBehalfOf;

    address public lastBorrowAsset;
    uint256 public lastBorrowAmount;
    address public lastBorrowOnBehalfOf;
    uint256 public lastBorrowRateMode;

    mapping(address => uint256) public debtByUser; // velmi zjednodušené

    constructor(address _usdc, address _weth) { usdc = _usdc; weth = _weth; }

    // --- IPool funkce, co používáme ---

    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 /*referral*/ ) external override {
        // Aave si stáhne underlying z msg.sender
        MockERC20(asset).transferFrom(msg.sender, address(this), amount);
        lastDepositAsset = asset;
        lastDepositAmount = amount;
        lastDepositOnBehalfOf = onBehalfOf;
        // (aToken mint neřešíme; pro test nám stačí záznamy)
    }

    function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 /*referral*/, address onBehalfOf) external override {
        require(asset == usdc, "only USDC in mock");
        // Mint USDC volajícímu (msg.sender) – tak to dělá reálný Pool
        MockERC20(usdc).mint(msg.sender, amount);
        lastBorrowAsset = asset;
        lastBorrowAmount = amount;
        lastBorrowOnBehalfOf = onBehalfOf;
        lastBorrowRateMode = interestRateMode;
        debtByUser[onBehalfOf] += amount;
    }

    // vrátíme jednoduché HF > 1 pro wrapper
    function getUserAccountData(address user) external view override returns (
        uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 availableBorrowsBase,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    ) {
        // fake metriky: pokud má user dluh, vraťme HF 2e18, jinak 10e18
        uint256 debt = debtByUser[user];
        totalDebtBase = debt;
        totalCollateralBase = debt * 2;
        availableBorrowsBase = 1e27;
        currentLiquidationThreshold = 1e18;
        ltv = 8e17;
        healthFactor = debt > 0 ? 2e18 : 10e18;
    }

    // nepoužívané v těchto testech – dummy implementace pro kompilaci
    function withdraw(address, uint256, address) external pure override returns (uint256) { return 0; }
    function supply(address, uint256, address, uint16) external pure {}
    function setUserUseReserveAsCollateral(address, bool) external pure {}
    function repay(address, uint256, uint256, address) external pure override returns (uint256) { return 0; }
    function getReservesList() external pure override returns (address; }
    function configureEModeCategory(uint8, DataTypes.EModeCategory memory) external pure {}
    function setUserEMode(uint8) external pure {}
    function getUserEMode(address) external pure returns (uint8) { return 0; }
    function getEModeCategoryData(uint8) external pure returns (DataTypes.EModeCategory memory) { revert(); }
    function getReserveData(address) external pure override returns (DataTypes.ReserveData memory) { revert(); }
}

// Provider mock – vrací náš MockPool
contract MockProvider is IPoolAddressesProvider {
    address public pool;
    constructor(address _pool) { pool = _pool; }
    function getPool() external view override returns (address) { return pool; }
    // zbytek interfacu nás nezajímá pro testy
}

// LoanWrapper stub – jen aby šel Registry zkompilovat/deploynout
contract LoanWrapper {
    constructor(address /*owner*/, uint256 /*collateral*/, uint256 /*amount*/, address /*vault*/, address /*weth*/, address /*usdc*/, IPoolAddressesProvider /*provider*/) {}
}

// ---------- Testy ----------

contract LoanWrapperRegistrySolidityTest {
    // helper pro izolovaný deploy
    function _deploy() internal returns (
        LoanWrapperRegistry registry,
        MockPool pool,
        MockProvider provider,
        MockWETH9 weth,
        MockERC20 usdc
    ) {
        usdc = new MockERC20("USD Coin", "USDC", 6);
        weth = new MockWETH9();
        pool = new MockPool(address(usdc), address(weth));
        provider = new MockProvider(address(pool));
        registry = new LoanWrapperRegistry(address(provider), address(0), address(weth), address(usdc));
    }

    // happy path: wrapLoan -> aWETH onBehalfOf wrapper, borrow USDC onBehalfOf wrapper, USDC posláno borrowerovi
    function testWrapLoanHappyPath() public {
        (LoanWrapperRegistry registry, MockPool pool, , MockWETH9 weth, MockERC20 usdc) = _deploy();

        address borrower = address(0xB0R);
        uint256 ethCollateral = 5 ether;
        uint256 borrowUSDC    = 1_000_000; // 1,000,000 wei USDC (6 dec)

        // zavolej wrapLoan s ETH
        registry.wrapLoan{value: ethCollateral}(borrower, borrowUSDC);

        // 1) Registry už nemá WETH – Pool si ho strhnul v depositu
        require(weth.balanceOf(address(registry)) == 0, "registry still holds WETH");

        // 2) Pool zaznamenal deposit onBehalfOf = wrapper
        address wrapper = registry.wrapperOf(borrower);
        require(wrapper != address(0), "wrapper not stored");
        require(pool.lastDepositOnBehalfOf() == wrapper, "deposit not on wrapper");
        require(pool.lastDepositAsset() == address(weth), "deposit asset != WETH");
        require(pool.lastDepositAmount() == ethCollateral, "deposit amount mismatch");

        // 3) Pool zaznamenal borrow onBehalfOf = wrapper, rateMode=2
        require(pool.lastBorrowOnBehalfOf() == wrapper, "borrow not on wrapper");
        require(pool.lastBorrowAsset() == address(usdc), "borrow asset != USDC");
        require(pool.lastBorrowAmount() == borrowUSDC, "borrow amount mismatch");
        require(pool.lastBorrowRateMode() == 2, "rateMode != VARIABLE");

        // 4) Borrower obdržel USDC, registry by měla mít 0
        require(usdc.balanceOf(borrower) == borrowUSDC, "borrower USDC not received");
        require(usdc.balanceOf(address(registry)) == 0, "registry still holds USDC");
    }

    // wrapLoan bez ETH musí revertnout
    function testWrapLoanRevertsWithoutETH() public {
        (LoanWrapperRegistry registry, , , , ) = _deploy();
        address borrower = address(0xB0R);
        uint256 borrowUSDC = 1;

        // nízkoúrovňový call, ať umíme zachytit revert
        (bool ok, ) = address(registry).call(
            abi.encodeWithSelector(registry.wrapLoan.selector, borrower, borrowUSDC)
        );
        require(!ok, "expected revert when no ETH sent");
    }

    // sanity: getHF a checkHF něco vrací pro wrappera po wrapLoan
    function testGetHFAndCheckHF() public {
        (LoanWrapperRegistry registry, , MockProvider provider, , ) = _deploy();
        address borrower = address(0xB0R);

        registry.wrapLoan{value: 1 ether}(borrower, 1_000_000);
        address wrapper = registry.wrapperOf(borrower);

        uint256 hf = registry.getHF(wrapper);
        require(hf >= 1e18, "hf too low");

        bool healthy = registry.checkHF(wrapper);
        require(healthy, "expected healthy");
    }

    // umožní test kontraktu přijímat ETH z WETH.withdraw() apod.
    receive() external payable {}
}