// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "ganache",
  networks: {
    ganache: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
      accounts: {
        mnemonic: "glue region flip fire useless grocery giraffe sand change between flash impact",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10
      }
    },
    loom: {
      url: "http://127.0.0.1:46658/rpc",
      chainId: 1337,
      accounts: process.env.LOOM_PRIVATE_KEY ? [process.env.LOOM_PRIVATE_KEY] : [],
    }
  },
  mocha: {
    timeout: 40000,
  }
};
