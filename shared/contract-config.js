module.exports = {
  "networks": {
    "local": {
      "name": "Local Development",
      "rpcUrl": "http://localhost:12537",
      "chainId": 2030,
      "currency": {
        "name": "Conflux",
        "symbol": "CFX",
        "decimals": 18
      }
    },
    "testnet": {
      "name": "Conflux Testnet",
      "rpcUrl": "https://test.confluxrpc.com",
      "chainId": 1,
      "currency": {
        "name": "Conflux",
        "symbol": "CFX",
        "decimals": 18
      }
    },
    "mainnet": {
      "name": "Conflux Mainnet",
      "rpcUrl": "https://main.confluxrpc.com",
      "chainId": 1029,
      "currency": {
        "name": "Conflux",
        "symbol": "CFX",
        "decimals": 18
      }
    }
  },
  "contracts": {},
  "generatedAt": "2025-09-28T11:13:44.722Z"
};