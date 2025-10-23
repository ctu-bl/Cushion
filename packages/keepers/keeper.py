from web3 import Web3
from dotenv import load_dotenv
import json
import time
import threading
import random
import os

from web3.exceptions import ContractLogicError

# === Load environment variables ===
load_dotenv()

# === Connect to Anvil RPC ===
RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
w3 = Web3(Web3.HTTPProvider(RPC_URL))
assert w3.is_connected(), "Chain is not connected"
print("Connect on chain:", w3.client_version)

# === Conf  from .env ===
CHAIN_ID = int(os.getenv("CHAIN_ID", "31337"))  # anvil chain ID
PRIVATE_KEY = os.getenv("PRIVATE_KEY")          # anvil private key
assert PRIVATE_KEY, "Missing PRIVATE_KEY in .env file"
ACCOUNT = w3.eth.account.from_key(PRIVATE_KEY)

LoanWrapperRegistry_ADDRESS = w3.to_checksum_address(os.getenv("LoanWrapperRegistry_ADDRESS"))
Vault_ADDRESS = w3.to_checksum_address(os.getenv("Vault_ADDRESS"))
MockEthOracle_ADDRESS = w3.to_checksum_address(os.getenv("MockEthOracle_ADDRESS"))
# LoanWrapper_ADDRESS = w3.to_checksum_address("0x0000000000000000000000000000000000000000")

HF_INJECT_THRESHOLD = float(os.getenv("HF_INJECT_THRESHOLD", "1.15"))
HF_LIQUIDATE_THRESHOLD = float(os.getenv("HF_LIQUIDATE_THRESHOLD", "1.4"))
HF_WITHDRAW_THRESHOLD = float(os.getenv("HF_WITHDRAW_THRESHOLD", "2.5"))
CHECK_INTERVAL = int(os.getenv("CHECK_INTERVAL", "10"))     # seconds

MIN_PRICE = float(os.getenv("MIN_PRICE", "2000"))
MAX_PRICE = float(os.getenv("MAX_PRICE", "4500"))
VOLATILITY = float(os.getenv("VOLATILITY", "0.08"))     # ±8 % jump

# === Contract ABI ===
ABI_LoanWrapper = [
    {
        "inputs": [],
        "name": "isLocked",
        "outputs": [
            {"internalType": "bool", "name": "", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function",
    },
]

ABI_LoanWrapperRegistry = [
    {
        "inputs": [],
        "name": "getAllWrappers",
        "outputs": [
            {"internalType": "address[]", "name": "", "type": "address[]"}
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "address", "name": "wrapper", "type": "address"}
        ],
        "name": "getHF",
        "outputs": [
            {"internalType": "uint256", "name": "hf", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function",
    },
]

ABI_Vault = [
    {
        "inputs": [
            {"internalType": "address", "name": "loan", "type": "address"}
        ],
        "name": "injectToLoan",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "address", "name": "loan", "type": "address"}
        ],
        "name": "liquidate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "address", "name": "loan", "type": "address"}
        ],
        "name": "withdrawFromLoan",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
]

ABI_MockEthOracle = [
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            { "internalType": "address", "name": "", "type": "address" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            { "internalType": "uint8", "name": "", "type": "uint8" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "int256", "name": "_newPrice", "type": "int256" }
        ],
        "name": "setPrice",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getLatestPrice",
        "outputs": [
            { "internalType": "int256", "name": "", "type": "int256" },
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "latestAnswer",
        "outputs": [
            { "internalType": "int256", "name": "", "type": "int256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "latestTimestamp",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "_newOwner", "type": "address" }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
];


vault_contract = w3.eth.contract(address=Vault_ADDRESS, abi=ABI_Vault)
LoanWrapperRegistry_contract = w3.eth.contract(address=LoanWrapperRegistry_ADDRESS, abi=ABI_LoanWrapperRegistry)
mockETHOracle_contract = w3.eth.contract(address=MockEthOracle_ADDRESS, abi=ABI_MockEthOracle)
# loanWrapper_contract = w3.eth.contract(address=LoanWrapper_ADDRESS, abi=ABI_LoanWrapper)


def send_tx(tx):
    """
    this method sent a transaction on chain
    :param tx: transaction param
    :return: transaction hash
    """
    signed = w3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Tx hash: {tx_hash.hex()} | Block {receipt.blockNumber} | Gas used: {receipt.gasUsed}")
    return receipt


def inject_to_loan(loan_address: str):
    """
    Inject to a loan (nonpayable)
    :param loan_address: address of the loan
    :return: transaction hash
    """
    loan_address = w3.to_checksum_address(loan_address)
    nonce = w3.eth.get_transaction_count(ACCOUNT.address, "pending")
    gas_estimate = vault_contract.functions.injectToLoan(loan_address).estimate_gas({"from": ACCOUNT.address})

    tx = vault_contract.functions.injectToLoan(loan_address).build_transaction({
        "from": ACCOUNT.address,
        "chainId": CHAIN_ID,
        "nonce": nonce,
        "gasPrice": w3.eth.gas_price,
        "gas": gas_estimate + 5000,
    })

    return send_tx(tx)


def liquidate(loan_address: str):
    """
    Liquidate a loan
    :param loan_address: address of the loan
    :return: transaction hash
    """
    loan_address = w3.to_checksum_address(loan_address)
    nonce = w3.eth.get_transaction_count(ACCOUNT.address, "pending")
    gas_estimate = vault_contract.functions.liquidate(loan_address).estimate_gas({"from": ACCOUNT.address})
    tx = vault_contract.functions.liquidate(loan_address).build_transaction({
        "from": ACCOUNT.address,
        "chainId": CHAIN_ID,
        "nonce": nonce,
        "gasPrice": w3.eth.gas_price,
        "gas": gas_estimate + 5000,
    })
    vault_contract.functions.liquidate(loan_address).call({"from": ACCOUNT.address})
    return send_tx(tx)


def withdraw_from_loan(loan_address: str):
    """
    Withdraw funds from a loan
    :param loan_address: address of the loan
    :return: transaction hash
    """
    loan_address = w3.to_checksum_address(loan_address)
    nonce = w3.eth.get_transaction_count(ACCOUNT.address, "pending")
    gas_estimate = vault_contract.functions.withdrawFromLoan(loan_address).estimate_gas({"from": ACCOUNT.address})
    tx = vault_contract.functions.withdrawFromLoan(loan_address).build_transaction({
        "from": ACCOUNT.address,
        "chainId": CHAIN_ID,
        "nonce": nonce,
        "gasPrice": w3.eth.gas_price,
        "gas": gas_estimate + 5000,
    })
    vault_contract.functions.withdrawFromLoan(loan_address).call({"from": ACCOUNT.address})
    return send_tx(tx)


def get_all_wrappers():
    """
    Retrieve all loan wrappers from the registry
    :return: list of wrapper addresses
    """
    wrappers = LoanWrapperRegistry_contract.functions.getAllWrappers().call()
    print(f"Wrappers: {wrappers}")
    return wrappers

def get_hf(wrapper_address: str):
    """
    Get HF value for a specific wrapper
    :param wrapper_address: address of the wrapper
    :return: hf value as int
    """
    hf_value = LoanWrapperRegistry_contract.functions.getHF(wrapper_address).call()
    print(f"HF for {wrapper_address}: {hf_value}")
    return hf_value


def is_locked(LoanWrapper_address: str):
    """Check if the specified LoanWrapper contract is locked.
    :param LoanWrapper_address: Address of the LoanWrapper contract.
    :return: True if locked, False otherwise.
    """
    loanWrapper_contract = w3.eth.contract(address=LoanWrapper_address, abi=ABI_LoanWrapper)
    locked = loanWrapper_contract.functions.isLocked().call()
    print(f"Loan wrapper locked: {locked}")
    return locked

def set_price(newPrice: int):
    """
    Update the ETH price in the MockEthOracle contract on-chain
    :param newPrice: New ETH price (integer value, e.g. 250000 for $2500.00)
    :return: Transaction receipt after sending the transaction
    """
    nonce = w3.eth.get_transaction_count(ACCOUNT.address)
    tx = mockETHOracle_contract.functions.setPrice(newPrice * (10 **6)).build_transaction({
        "from": ACCOUNT.address,
        "chainId": CHAIN_ID,
        "gas": 150000,
        "gasPrice": w3.eth.gas_price,
        "nonce": nonce
    })
    return send_tx(tx)

def get_latest_price():
    """
    Retrieve the latest ETH price from the MockEthOracle contract
    :return: Current ETH price (int value from the smart contract)
    """
    price = mockETHOracle_contract.functions.latestAnswer().call()
    return price


def monitoring():
    """
    Monitor all active loan wrappers, evaluate their Health Factor (HF),
    and take automated actions (inject, liquidate, withdraw) based on thresholds.

    Logic:
    - If HF < HF_INJECT_THRESHOLD → inject or liquidate depending on lock status
    - If HF < HF_LIQUIDATE_THRESHOLD → liquidate if locked
    - If HF < HF_WITHDRAW_THRESHOLD → no action
    - If HF ≥ HF_WITHDRAW_THRESHOLD and loan is locked → withdraw from loan

    This function runs continuously in a loop with CHECK_INTERVAL pauses.
    """
    print("=== Loan Monitor started ===")
    while True:
        try:
            wrappers = get_all_wrappers()
            if not wrappers:
                print("Address pool is empty")
            for wrapper in wrappers:
                hf = get_hf(wrapper)
                locked = is_locked(wrapper)

                print(f"[{time.strftime('%H:%M:%S')}] Wrapper: {wrapper} | HF: {hf} | Locked: {locked}")

                if hf < HF_INJECT_THRESHOLD:
                    if locked:
                        print(f"HF ({hf}) < {HF_INJECT_THRESHOLD} → liquidate({wrapper})")
                        liquidate(wrapper)
                    else:
                        print(f"HF ({hf}) < {HF_INJECT_THRESHOLD} → inject_to_loan({wrapper})")
                        tx = inject_to_loan(wrapper)

                elif hf < HF_LIQUIDATE_THRESHOLD:
                    if locked:
                        print(f"HF ({hf}) < {HF_LIQUIDATE_THRESHOLD} → liquidate({wrapper})")
                        liquidate(wrapper)

                elif hf < HF_WITHDRAW_THRESHOLD:
                    print(f"HF ({hf}) < {HF_WITHDRAW_THRESHOLD} → okej({wrapper})")

                else:
                    if locked:
                        print(f"HF ({hf}) < {HF_LIQUIDATE_THRESHOLD} → withdraw from loan({wrapper})")
                        withdraw_from_loan(wrapper)

            print(f"Wait {CHECK_INTERVAL} seconds...\n")
            time.sleep(CHECK_INTERVAL)

        except Exception as e:
            print(f"Error: {e}")
            print(f"Wait again {CHECK_INTERVAL} seconds...\n")
            time.sleep(CHECK_INTERVAL)


def simulate_price():
    """
    Continuously simulate ETH price changes and push them on-chain via set_price().
    - Starts from a random price between MIN_PRICE and MAX_PRICE.
    - Randomly changes the price by ±VOLATILITY percent.
    - Keeps the price within [MIN_PRICE, MAX_PRICE] bounds.
    - Sends each update to the blockchain using set_price().
    - Waits a random 0.7–1.0 seconds between updates.
    """
    current_price = random.uniform(MIN_PRICE, MAX_PRICE)

    while True:
        change_pct = random.uniform(-VOLATILITY, VOLATILITY)
        new_price = current_price * (1 + change_pct)
        new_price = max(MIN_PRICE, min(MAX_PRICE, new_price))

        try:
            tx = set_price(int(new_price * 100))
            print(f"New ETH price: {new_price:.2f} USD")
        except Exception as e:
            print(f"ERROR set_price failed: {e}")

        current_price = new_price
        time.sleep(random.uniform(10, 13))

def start_simulate_with_mockETH():
    """
    Start both the price simulation and loan monitoring processes in separate threads.

    - Thread 1: simulate_price() → updates ETH price on-chain periodically.
    - Thread 2: monitoring() → observes loans and reacts to HF changes.

    Runs until interrupted by user (Ctrl+C).
    """
    t1 = threading.Thread(target=simulate_price, daemon=True)
    t2 = threading.Thread(target=monitoring, daemon=True)

    t1.start()
    t2.start()

    print("=== Simulation and monitoring threads started ===")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n=== Stopping threads and exiting ===")

def start_simulate_without_mockETH():
    """
    Start only monitoring process in separate threads.
    This is for real run on blockchain without mock ETH.
    """
    try:
        monitoring()
    except Exception as e:
        print("[ERROR] ", e)
        raise



if __name__ == "__main__":
    # start_simulate_with_mockETH()
    start_simulate_without_mockETH()

