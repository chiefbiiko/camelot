/** @type import('hardhat/config').HardhatUserConfig */

require("@nomicfoundation/hardhat-foundry");
require("@nomicfoundation/hardhat-ethers");
require("@nomiclabs/hardhat-web3");

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 12345
    }
  }
};
