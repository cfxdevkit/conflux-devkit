require("@civex/hardhat-cive");
require("hardhat-gas-reporter");

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
      url: "http://localhost:12537",
      accounts: {
        mnemonic: mnemonic || "test test test test test test test test test test test junk",
        count: 10,
      },
      chainId: 2030,
      timeout: 20000,
      gasMultiplier: 1.2,
    },
    cfxtest: {
      url: "https://test.confluxrpc.com",
      accounts: {
        mnemonic: mnemonic || "test test test test test test test test test test test junk",
        count: 10,
      },
      chainId: 1,
      timeout: 20000,
      gasMultiplier: 1.2,
    },
    cfx: {
      url: "https://main.confluxrpc.com",
      accounts: {
        mnemonic: mnemonic || "test test test test test test test test test test test junk",
        count: 10,
      },
      chainId: 1030,
      timeout: 20000,
      gasMultiplier: 1.2,
    },
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