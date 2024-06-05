require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      }
    }
  },
  networks:{
    hardhat:{
      chainId:31337,
    }
  }
}
