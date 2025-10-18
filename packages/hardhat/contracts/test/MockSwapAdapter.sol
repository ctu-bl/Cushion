// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {ISwapAdapter} from "./ISwapAdapter.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint256 value) external returns (bool);
}

contract MockSwapAdapter is ISwapAdapter {
    uint256 public ethPer1e18Pyusd;      // WEI za 1e18 PYUSD
    uint256 public lastAmountPyUsdIn;
    uint256 public lastEthOut;

    address public immutable WETH;       // <- adresa tvého WETH mocku

    constructor(address _weth) { WETH = _weth; }

    function setMockSwapRate(uint256 rateWeiPer1e18) external {
        ethPer1e18Pyusd = rateWeiPer1e18;
    }

    function swapPyUsdToEth(address pyusd, uint256 amountPyUsd)
        external
        override
        returns (uint256 ethOut)
    {
        // stáhnout PYUSD z Vaultu (Vault dal approve)
        bool ok = MockERC20(pyusd).transferFrom(
            msg.sender,
            address(0x000000000000000000000000000000000000dEaD),
            amountPyUsd
        );
        require(ok, "pull/burn PYUSD failed");

        // spočítat "ETH ekvivalent"
        ethOut = (amountPyUsd * ethPer1e18Pyusd) / 1e18;

        // místo posílání ETH do Vaultu:
        // 1) udělej z vlastních seednutých ETH WETH
        IWETH(WETH).deposit{value: ethOut}();

        // 2) pošli WETH Vaultu (Vault ji následně sám unwrappne)
        ok = IWETH(WETH).transfer(msg.sender, ethOut);
        require(ok, "send WETH to vault failed");

        lastAmountPyUsdIn = amountPyUsd;
        lastEthOut        = ethOut;
    }

    receive() external payable {}
}