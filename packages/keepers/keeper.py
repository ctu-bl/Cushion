from web3 import Web3
import json
import time

# === Connect to Anvil RPC ===
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
assert w3.is_connected(), "Chain is not connected"
print("Connect on chain:", w3.client_version)

# === Conf ===
CHAIN_ID = 31337  # anvil chain ID
PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"      # anvil private key
ACCOUNT = w3.eth.account.from_key(PRIVATE_KEY)
LoanWrapperRegistry_ADDRESS = w3.to_checksum_address("0x0000000000000000000000000000000000000000")
Vault_ADDRESS = w3.to_checksum_address("0x0000000000000000000000000000000000000000")
# LoanWrapper_ADDRESS = w3.to_checksum_address("0x0000000000000000000000000000000000000000")

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

vault_contract = w3.eth.contract(address=Vault_ADDRESS, abi=ABI_Vault)
LoanWrapperRegistry_contract = w3.eth.contract(address=LoanWrapperRegistry_ADDRESS, abi=ABI_LoanWrapperRegistry)

# loanWrapper_contract = w3.eth.contract(address=LoanWrapper_ADDRESS, abi=ABI_LoanWrapper)


# === Pomocné funkce ===
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
    nonce = w3.eth.get_transaction_count(ACCOUNT.address)
    tx = vault_contract.functions.injectToLoan(loan_address).build_transaction({
        "from": ACCOUNT.address,
        "chainId": CHAIN_ID,
        "gas": 150000,
        "gasPrice": w3.eth.gas_price,
        "nonce": nonce
    })
    return send_tx(tx)


def liquidate(loan_address: str):
    """
    Liquidate a loan
    :param loan_address: address of the loan
    :return: transaction hash
    """
    nonce = w3.eth.get_transaction_count(ACCOUNT.address)
    tx = vault_contract.functions.liquidate(loan_address).build_transaction({
        "from": ACCOUNT.address,
        "chainId": CHAIN_ID,
        "gas": 150000,
        "gasPrice": w3.eth.gas_price,
        "nonce": nonce
    })
    return send_tx(tx)


def withdraw_from_loan(loan_address: str):
    """
    Withdraw funds from a loan
    :param loan_address: address of the loan
    :return: transaction hash
    """
    nonce = w3.eth.get_transaction_count(ACCOUNT.address)
    tx = vault_contract.functions.withdrawFromLoan(loan_address).build_transaction({
        "from": ACCOUNT.address,
        "chainId": CHAIN_ID,
        "gas": 150000,
        "gasPrice": w3.eth.gas_price,
        "nonce": nonce
    })
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
    """
    Check if the loan wrapper is locked
    :return: True if locked, False otherwise
    """
    loanWrapper_contract = w3.eth.contract(address=LoanWrapper_address, abi=ABI_LoanWrapper)
    locked = loanWrapper_contract.functions.isLocked().call()
    print(f"Loan wrapper locked: {locked}")
    return locked



HF_INJECT_THRESHOLD = 1.15
HF_LIQUIDATE_TRESHOLD = 1.4
HF_WITHDRAW_THRESHOLD = 2.5
CHECK_INTERVAL = 10  # seconds

def monitoring():
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
                        inject_to_loan(wrapper)

                elif hf < HF_LIQUIDATE_TRESHOLD:
                    if locked:
                        print(f"HF ({hf}) < {HF_LIQUIDATE_TRESHOLD} → liquidate({wrapper})")
                        liquidate(wrapper)

                elif hf < HF_WITHDRAW_THRESHOLD:
                    print(f"HF ({hf}) < {HF_WITHDRAW_THRESHOLD} → ({wrapper})")

                else:
                    if locked:
                        print(f"HF ({hf}) < {HF_LIQUIDATE_TRESHOLD} → withdraw from loan({wrapper})")
                        withdraw_from_loan(wrapper)

            print(f"Wait {CHECK_INTERVAL} seconds...\n")
            time.sleep(CHECK_INTERVAL)

        except Exception as e:
            print(f"Error: {e}")
            print(f"Wait again {CHECK_INTERVAL} seconds...\n")
            time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    monitoring()
