# Setup

## Prerequisites
- Node.js 18+ (LTS recommended)
- Yarn (classic) installed globally
- Git

## Clone the repository
```bash
git clone git@github.com:ctu-bl/Cushion.git
cd cushion
```

## Install dependencies
```bash
yarn install
```

## Start local blockchain (Hardhat)
```bash
yarn chain
```

## Deploy contracts to the local chain
```bash
yarn deploy
```

## Start the frontend
```bash
yarn start
```

Open `http://localhost:3000` in your browser.

## Useful scripts
- Re-deploy after changes: `yarn deploy`
- Generate ABIs/types (if configured): `yarn generate`
