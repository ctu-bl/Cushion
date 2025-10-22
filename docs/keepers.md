# Keepers

# 🧠 Loan Health Monitoring Bot (DeFi Automation using Web3.py)

> **Automated DeFi loan monitoring system** for Ethereum-compatible blockchains.  
> Simulates ETH price volatility and performs on-chain actions (`inject`, `liquidate`, `withdraw`) based on configurable Health Factor (HF) thresholds.  
> Ideal for testing, prototyping, and educational exploration of automated loan management logic.

---

## 🌍 Overview

This project implements an **autonomous loan management bot** that:
- Monitors the **Health Factor (HF)** of all active loans via a **LoanWrapperRegistry** contract.
- Automatically performs on-chain operations (`injectToLoan`, `liquidate`, `withdrawFromLoan`) through a **Vault** contract.
- Simulates ETH price volatility through a **MockEthOracle** smart contract.
- Runs both **price simulation** and **loan monitoring** in parallel threads.

---

## 🧩 Key Components

| Component               | Description                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------- |
| **LoanWrapperRegistry** | Contract that stores and exposes all active loan wrapper addresses and their HF values. |
| **Vault**               | Manages loan operations (injection of liquidity, liquidation, withdrawal).              |
| **MockEthOracle**       | Simulated ETH price oracle for testing volatility behavior.                             |
| **monitor.py**          | The main Python automation script handling monitoring and simulation logic.             |

---

## 🧠 Logic and Automation Flow

Below is a simplified diagram showing how the bot operates:

                         ┌──────────────────────────────────────────────┐
                         │                  monitor.py                  │
                         │──────────────────────────────────────────────│
                         │  Controls simulation & loan monitoring loops │
                         └──────────────────────────────────────────────┘
                                          │
                      ┌───────────────────┴───────────────────┐
                      │                                       │
          ┌────────────────────────────┐          ┌────────────────────────────┐
          │    Price Simulation Loop   │          │     Loan Monitoring Loop   │
          │       (simulate_price)     │          │        (monitoring)        │
          └────────────────────────────┘          └────────────────────────────┘
                      │                                       │
    ┌─────────────────┴──────────────────┐        ┌───────────┴───────────────────┐
    │ Randomly adjust ETH price by       │        │ Get all active loan wrappers  │
    │ ±VOLATILITY percent                │        │ from LoanWrapperRegistry      │
    └─────────────────┬──────────────────┘        └───────────┬───────────────────┘
                      │                                       │
     Set new price on-chain via                   For each wrapper:
       MockEthOracle.setPrice()                          │
                      │                                  │
                      │                          ┌───────┴────────────────────────────┐
                      │                          │ Retrieve HF value (getHF)          │
                      │                          │ Check if loan is locked (isLocked) │
                      │                          └───────┬────────────────────────────┘
                      │                                  │
                      │                                  ▼
                      │                 ┌────────────────────────────────────────────┐
                      │                 │                Decision Logic              │
                      │                 │--------------------------------------------│
                      │                 │ If HF < HF_INJECT_THRESHOLD:               │
                      │                 │     → inject or liquidate loan             │
                      │                 │                                            │
                      │                 │ Else if HF < HF_LIQUIDATE_THRESHOLD:       │
                      │                 │     → liquidate (if locked)                │
                      │                 │                                            │
                      │                 │ Else if HF < HF_WITHDRAW_THRESHOLD:        │
                      │                 │     → do nothing                           │
                      │                 │                                            │
                      │                 │ Else if HF ≥ HF_WITHDRAW_THRESHOLD:        │
                      │                 │     → withdraw from loan (if locked)       │
                      │                 └────────────────────────────────────────────┘
                      │
                      ▼
    ┌────────────────────────────────────────────────────────────────────────────┐
    │ All transactions (inject, liquidate, withdraw) are built, signed locally,  │
    │ and sent via Web3.py. Each transaction is confirmed and logged to console. │
    └────────────────────────────────────────────────────────────────────────────┘


---

### 💡 Summary

- The **left branch** simulates ETH price fluctuations and updates the on-chain oracle.
- The **right branch** constantly evaluates each loan’s health.
- Both threads run **simultaneously** and affect each other in real-time.
- The **Vault contract** executes actions based on current HF and loan lock status.

---

## 📘 Overview

This project uses Python and several external packages such as **web3**, **dotenv**, and **requests** to interact with APIs and blockchain data.  
All dependencies are managed through `requirements.txt`, and configuration is handled using a `.env` file for security and flexibility.

---

## 🧾 Setup and requirements

  ```requirements.txt
web3==7.13.0
python-dotenv==1.1.1
requests==2.32.5
eth-account==0.13.7
hexbytes==1.3.1
urllib3==2.5.0
typing-extensions==4.15.0
```

---

## ⚙️ Prerequisites

Before you begin, make sure your environment meets the following requirements:

  

-  **Python 3.8+** installed

```bash
python --version
```

```bash
pip install -r requirements.txt
```

- Windows

```bash
python keeper.py
```

- Mac / Linux
```bash
python3 keeper.py
```
