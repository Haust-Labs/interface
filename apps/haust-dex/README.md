# Haust DEX Interface

An interface for Haust DEX - a protocol for decentralized exchange of Haust tokens.

# Run app in docker:

1. Run

```sh
  docker-compose up --build -d 
```

## Features

- **Token Swapping**: Swap tokens instantly on the Haust DEX platform.
- **Liquidity Management**: Add and remove liquidity from pools to earn fees.
- **NFT Support**: View NFT collections, recent activity, and asset details.
- **Token Prices**: Fetch real-time and historical token prices using GraphQL.
- **Trending Tokens**: View top and trending tokens in the DEX.

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/Haust-Labs/haust-dex-frontend
    ```

2. Navigate to the project directory:

    ```bash
    cd haust-dex-frontend
    ```

3. To ensure proper functionality of the project, you need to replace the following dependency line in your `package.json` file:

    ```bash
    "@uniswap/smart-order-router": "git+https://GITLAB_SMART_ORDER_ROUTER_USERNAME:GITLAB_SMART_ORDER_ROUTER_TOKEN@github.com/Haust-Labs/haust-smart-order-router"
    ```

with your GitHub credentials. Use environment variables to store your credentials securely. For example:

    ```bash
    "@uniswap/smart-order-router": "git+https://<YOUR_GITHUB_USERNAME>:<YOUR_GITHUB_TOKEN>@github.com/Haust-Labs/haust-smart-order-router"
    ```
Replace <YOUR_GITHUB_USERNAME> and <YOUR_GITHUB_TOKEN> with your actual GitHub username and personal access token.

4. Install dependencies, requires NodeJS <=16.0.0:

    ```bash
    yarn
    ```

## Start the local development

5. Run the web:

    ```bash
    yarn start
    ```

## Project Structure

- `src/components/`: Reusable UI components for building the interface.
- `src/pages/`: Key DEX pages, including Swap, Add Liquidity, Remove Liquidity, and NFT views.
- `src/graphql/`: GraphQL queries for fetching token and NFT data.
- `src/hooks/`: Custom hooks for managing state and fetching data.
- `src/view/setting/`: Account settings and configuration.

## Technologies Used

- **React**: Frontend library for building user interfaces.
- **Zustand**: Lightweight state management library.
- **Styled-components**: A library for styling React components using tagged template literals.
- **TypeScript**: Static typing for JavaScript to enhance development experience.
- **uniswap/v2-sdk and uniswap/v3-sdk**: SDKs for integrating with Uniswap decentralized exchange protocols (V2 and V3), enabling interaction with liquidity pools and swaps.
- **Ethers**: A library for interacting with the Ethereum blockchain, used for managing wallets, sending transactions, and interacting with smart contracts.
- **GraphQL**: A query language for your API, allowing clients to request only the data they need.
- **Redux**: A predictable state container for JavaScript apps, used for managing application state.