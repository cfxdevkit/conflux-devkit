import "@nomicfoundation/hardhat-ignition-viem";
import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Hardhat local development
    hardhat: {
      chainId: 31337,
    },
    
    // Conflux eSpace (EVM-compatible) networks
    confluxESpaceLocal: {
      url: "http://localhost:8545",
      chainId: 2030, // Local testnet EVM
      accounts: [
        // Test account private key (derived from test mnemonic)
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
      ],
    },
    confluxESpaceTestnet: {
      url: "https://evmtestnet.confluxrpc.com",
      chainId: 71, // Testnet EVM
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    confluxESpaceMainnet: {
      url: "https://evm.confluxrpc.com",
      chainId: 1030, // Mainnet EVM
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    
    // Conflux Core Space networks (for reference, not directly used by Hardhat)
    confluxCoreLocal: {
      url: "http://localhost:12537",
      chainId: 2029, // Local testnet Core
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    confluxCoreTestnet: {
      url: "https://test.confluxrpc.com",
      chainId: 1, // Testnet Core
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    confluxCoreMainnet: {
      url: "https://main.confluxrpc.com",
      chainId: 1029, // Mainnet Core
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  ignition: {
    requiredConfirmations: 1,
    blockConfirmations: 1,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
