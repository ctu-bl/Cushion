// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {MockERC20} from "../contracts/mocks/MockERC20.sol";
import {MockWETH9} from "../contracts/mocks/MockWETH9.sol";
import {MockSwapAdapter} from "../contracts/test/MockSwapAdapter.sol";

/**
 * @title BasicSwapTest
 * @dev Základní test pro ověření swap adapteru
 */
contract BasicSwapTest {
    MockERC20 public pyusd;
    MockWETH9 public weth;
    MockSwapAdapter public swapAdapter;
    
    function testSwapAdapterBasic() public {
        pyusd = new MockERC20("PayPal USD", "PYUSD", 18);
        weth = new MockWETH9();
        swapAdapter = new MockSwapAdapter(address(weth));
        
        swapAdapter.setMockSwapRate(1e15);
        
        (bool ok,) = address(swapAdapter).call{value: 1 ether}("");
        require(ok, "Failed to send ETH to adapter");
        
        uint256 pyusdAmount = 1000e18; // 1000 PYUSD
        pyusd.mint(address(this), pyusdAmount);
        
        // Approve swap adapter
        pyusd.approve(address(swapAdapter), pyusdAmount);
        
        uint256 initialPyusdBalance = pyusd.balanceOf(address(this));
        uint256 initialWethBalance = weth.balanceOf(address(this));
        
        uint256 ethOut = swapAdapter.swapPyUsdToEth(address(pyusd), pyusdAmount);
        
        uint256 finalPyusdBalance = pyusd.balanceOf(address(this));
        uint256 finalWethBalance = weth.balanceOf(address(this));
        
        require(finalPyusdBalance == initialPyusdBalance - pyusdAmount, "PYUSD balance should decrease");
        require(finalWethBalance == initialWethBalance + ethOut, "WETH balance should increase");
        require(ethOut == 1 ether, "Expected 1 ETH out for 1000 PYUSD");
        require(swapAdapter.lastAmountPyUsdIn() == pyusdAmount, "Adapter should record PYUSD input");
        require(swapAdapter.lastEthOut() == ethOut, "Adapter should record ETH output");
    }
    
    function testSwapRateCalculation() public {
        pyusd = new MockERC20("PayPal USD", "PYUSD", 18);
        weth = new MockWETH9();
        swapAdapter = new MockSwapAdapter(address(weth));
        swapAdapter.setMockSwapRate(1e15);
        
        (bool ok,) = address(swapAdapter).call{value: 10 ether}("");
        require(ok, "Failed to send ETH to adapter");
        
        uint256[] memory testAmounts = new uint256[](3);
        testAmounts[0] = 100e18;   // 100 PYUSD -> 0.1 ETH
        testAmounts[1] = 1000e18;  // 1000 PYUSD -> 1 ETH
        testAmounts[2] = 5000e18;  // 5000 PYUSD -> 5 ETH
        
        for (uint i = 0; i < testAmounts.length; i++) {
            uint256 amount = testAmounts[i];
            
            // Mintni a approve
            pyusd.mint(address(this), amount);
            pyusd.approve(address(swapAdapter), amount);
            
            uint256 ethOut = swapAdapter.swapPyUsdToEth(address(pyusd), amount);
            
            uint256 expectedEth = (amount * 1e15) / 1e18;
            require(ethOut == expectedEth, "ETH calculation is wrong");
        }
    }
    
    // Přijímání ETH
    receive() external payable {}
}
