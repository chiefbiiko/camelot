/** @type import('hardhat/config').HardhatUserConfig */

require('@nomicfoundation/hardhat-foundry')
require('@nomicfoundation/hardhat-ethers')

module.exports = {
  solidity: '0.8.24',
  settings: {
    optimizer: {
      enabled: true,
      runs: 1
    }
  },
  networks: {
    hardhat: {
      chainId: 12345
    }
  }
}
