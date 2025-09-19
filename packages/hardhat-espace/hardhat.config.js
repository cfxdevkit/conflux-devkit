require("@nomicfoundation/hardhat-toolbox-viem");
require("@nomicfoundation/hardhat-ignition-viem");

const { mnemonic } = require("./secrets.json");

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      metadata: {
        bytecodeHash: "none",
      },
      outputSelection: {
        "*": {
          "*": ["storageLayout"],
        },
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      mining: {
        auto: true,
        interval: 1000,
      },
      gasPrice: "auto",
      gas: "auto",
      allowUnlimitedContractSize: false,
    },
    cfxlocal: {
      url: "http://localhost:8545",
      accounts: {
        mnemonic: mnemonic || "test test test test test test test test test test test junk",
        count: 10,
      },
      chainId: 2030,
      timeout: 20000,
      gasMultiplier: 1.2,
    },
    cfxtestnet: {
      url: "https://evmtestnet.confluxrpc.com",
      accounts: {
        mnemonic: mnemonic || "test test test test test test test test test test test junk",
        count: 10,
      },
      chainId: 71,
      timeout: 20000,
      gasMultiplier: 1.2,
    },
    cfxmainnet: {
      url: "https://evm.confluxrpc.com",
      accounts: {
        mnemonic: mnemonic || "test test test test test test test test test test test junk",
        count: 10,
      },
      chainId: 1030,
      timeout: 20000,
      gasMultiplier: 1.2,
    },
  },
  etherscan: {
    apiKey: {
      cfxtestnet: "your-conflux-scan-api-key",
      cfxmainnet: "your-conflux-scan-api-key",
    },
    customChains: [
      {
        network: "cfxtestnet",
        chainId: 71,
        urls: {
          apiURL: "https://evmapi-testnet.confluxscan.net/api",
          browserURL: "https://evmtestnet.confluxscan.net",
        },
      },
      {
        network: "cfxmainnet",
        chainId: 1030,
        urls: {
          apiURL: "https://evmapi.confluxscan.net/api",
          browserURL: "https://evm.confluxscan.net",
        },
      },
    ],
  },
  mocha: {
    timeout: 40000,
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    excludeContracts: ["mocks/"],
  },
};