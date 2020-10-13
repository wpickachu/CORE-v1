const HDWalletProvider = require("truffle-hdwallet-provider");
require("dotenv").config();

module.exports = {
  networks: {
    development: {
      protocol: "http",
      host: "localhost",
      port: 7545,
      gas: 5000000,
      gasPrice: 5e9,
      network_id: "*",
    },
    kovan: {
      provider: () =>
        new HDWalletProvider(
          process.env.MNEMONIC,
          `https://kovan.infura.io/v3/${process.env.INFURA_APIKEY}`
        ),
      network_id: 42,
      gas: 4600000,
    },
    mainnet: {
      provider: () =>
        new HDWalletProvider(
          process.env.MNEMONIC,
          `https://mainnet.infura.io/v3/${process.env.INFURA_APIKEY}`
        ),
      network_id: 1,
      gas: 9999999,
      gasPrice: 100000000000,
    },
  },
  compilers: {
    solc: {
      version: "0.6.12",
      docker: false,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: "byzantium",
      },
    },
  },
};
