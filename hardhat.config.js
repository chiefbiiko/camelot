/** @type import('hardhat/config').HardhatUserConfig */

require("@nomicfoundation/hardhat-foundry");

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 419
    }
  }
};
