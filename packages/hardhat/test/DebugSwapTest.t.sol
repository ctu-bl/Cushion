// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {MockERC20} from "../contracts/mocks/MockERC20.sol";
import {MockWETH9} from "../contracts/mocks/MockWETH9.sol";
import {MockSwapAdapter} from "../contracts/test/MockSwapAdapter.sol";

/**
 * @title DebugSwapTest
 * @dev Debug test pro zjištění, kde je problém se swapem
 */
contract DebugSwapTest {
    
    function testStepByStepSwap() public {
        MockERC20 pyusd = new MockERC20("PayPal USD", "PYUSD", 18);
        MockWETH9 weth = new MockWETH9();
        MockSwapAdapter swapAdapter = new MockSwapAdapter(address(weth));
        
        swapAdapter.setMockSwapRate(1e15); // 1 PYUSD = 0.001 ETH
        
        (bool ok,) = address(swapAdapter).call{value: 1 ether}("");
        require(ok, "Failed to send ETH to adapter");
        
        uint256 pyusdAmount = 1000e18; // 1000 PYUSD
        pyusd.mint(address(this), pyusdAmount);
        
        // 
        pyusd.approve(address(swapAdapter), pyusdAmount);
        
        uint256 pyusdBefore = pyusd.balanceOf(address(this));
        uint256 wethBefore = weth.balanceOf(address(this));
        uint256 adapterEthBefore = address(swapAdapter).balance;
        
        uint256 ethOut = swapAdapter.swapPyUsdToEth(address(pyusd), pyusdAmount);
        
        uint256 pyusdAfter = pyusd.balanceOf(address(this));
        uint256 wethAfter = weth.balanceOf(address(this));
        uint256 adapterEthAfter = address(swapAdapter).balance;
        
        uint256 adapterPyusdIn = swapAdapter.lastAmountPyUsdIn();
        uint256 adapterEthOut = swapAdapter.lastEthOut();
        
        require(pyusdAfter == pyusdBefore - pyusdAmount, 
            string(abi.encodePacked("PYUSD balance wrong. Before: ", uint2str(pyusdBefore), " After: ", uint2str(pyusdAfter), " Expected decrease: ", uint2str(pyusdAmount))));
        
        require(wethAfter == wethBefore + ethOut, 
            string(abi.encodePacked("WETH balance wrong. Before: ", uint2str(wethBefore), " After: ", uint2str(wethAfter), " Expected increase: ", uint2str(ethOut))));
        
        require(ethOut == 1 ether, 
            string(abi.encodePacked("ETH out wrong. Got: ", uint2str(ethOut), " Expected: ", uint2str(1 ether))));
        
        require(adapterPyusdIn == pyusdAmount, 
            string(abi.encodePacked("Adapter PYUSD input wrong. Got: ", uint2str(adapterPyusdIn), " Expected: ", uint2str(pyusdAmount))));
        
        require(adapterEthOut == ethOut, 
            string(abi.encodePacked("Adapter ETH output wrong. Got: ", uint2str(adapterEthOut), " Expected: ", uint2str(ethOut))));
    }
    
    // Helper funkce pro převod uint na string
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
    
    // Přijímání ETH
    receive() external payable {}
}
