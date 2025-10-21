// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

<<<<<<< HEAD
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
=======
import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
>>>>>>> 47ac52f (fixed injection)
import "hardhat/console.sol";

/**
 * @title MockPYUSD
<<<<<<< HEAD
 * @author CtuBlockchain Lab
 * @notice Mock ERC20 s 6 decimals (jako USDC/PYUSD)
=======
 * @author CtuBlockhain Lab
 * @notice Mock implementation of PYUSD token for testing
 * @dev 6 decimals like USDC
>>>>>>> 47ac52f (fixed injection)
 */
contract MockPYUSD is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    string public name = "Mock PYUSD";
    string public symbol = "mPYUSD";
    uint8 public decimals = 6;

<<<<<<< HEAD
=======

>>>>>>> 47ac52f (fixed injection)
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
<<<<<<< HEAD
        address owner = msg.sender;
        _transfer(owner, to, amount);
=======
        console.log("MockPYUSD: transfer called from", msg.sender);
        console.log("MockPYUSD: transfer to", to);
        console.log("MockPYUSD: transfer amount:", amount);
        console.log("MockPYUSD: balance of", msg.sender, "before transfer:", _balances[msg.sender]);
        address owner = msg.sender;
        _transfer(owner, to, amount);
        console.log("MockPYUSD: balance of", to, "after transfer:", _balances[to]);
>>>>>>> 47ac52f (fixed injection)
        return true;
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        address owner = msg.sender;
        _approve(owner, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
<<<<<<< HEAD
        address spender = msg.sender;
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
=======
        console.log("MockPYUSD: transferFrom called from");
        console.log(from);
        console.log("MockPYUSD: transferFrom to", to);
        console.log("MockPYUSD: transferFrom amount:", amount);
        console.log("MockPYUSD: transferFrom by", msg.sender);
        console.log("MockPYUSD: balance of", from, "before transferFrom:", _balances[from]);
        address spender = msg.sender;
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        console.log("MockPYUSD: balance of", to, "after transferFrom:", _balances[to]);
>>>>>>> 47ac52f (fixed injection)
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
<<<<<<< HEAD
        require(from != address(0), "ERC20: transfer from zero");
        require(to != address(0), "ERC20: transfer to zero");
        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: exceeds balance");
=======
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
>>>>>>> 47ac52f (fixed injection)
        unchecked {
            _balances[from] = fromBalance - amount;
            _balances[to] += amount;
        }
<<<<<<< HEAD
=======

>>>>>>> 47ac52f (fixed injection)
        emit Transfer(from, to, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
<<<<<<< HEAD
        require(owner != address(0), "ERC20: approve from zero");
        require(spender != address(0), "ERC20: approve to zero");
=======
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

>>>>>>> 47ac52f (fixed injection)
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal {
<<<<<<< HEAD
        uint256 currentAllowance = _allowances[owner][spender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _allowances[owner][spender] = currentAllowance - amount;
            }
            emit Approval(owner, spender, _allowances[owner][spender]);
=======
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
>>>>>>> 47ac52f (fixed injection)
        }
    }

    function mint(address to, uint256 amount) external {
<<<<<<< HEAD
        require(to != address(0), "ERC20: mint to zero");
=======
        console.log("MockPYUSD: mint called to", to, "amount:", amount);
        require(to != address(0), "ERC20: mint to the zero address");
>>>>>>> 47ac52f (fixed injection)
        _totalSupply += amount;
        unchecked {
            _balances[to] += amount;
        }
        emit Transfer(address(0), to, amount);
<<<<<<< HEAD
    }

    function burn(address from, uint256 amount) external {
        require(from != address(0), "ERC20: burn from zero");
        uint256 accountBalance = _balances[from];
        require(accountBalance >= amount, "ERC20: burn exceeds balance");
=======
        console.log("MockPYUSD: mint completed. New balance of", to, ":", _balances[to]);
        console.log("MockPYUSD: new totalSupply:", _totalSupply);
    }

    function burn(address from, uint256 amount) external {
        require(from != address(0), "ERC20: burn from the zero address");
        uint256 accountBalance = _balances[from];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
>>>>>>> 47ac52f (fixed injection)
        unchecked {
            _balances[from] = accountBalance - amount;
            _totalSupply -= amount;
        }
        emit Transfer(from, address(0), amount);
    }
}
