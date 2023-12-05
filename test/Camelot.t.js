const { expect } = require("chai");
const hre = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { default: Safe, Web3Adapter } = require('@safe-global/protocol-kit')

describe("Counter contract", function () {
  async function CamelotFixture() {
    // const counter = await ethers.deployContract("Counter");
    // await counter.setNumber(0);

    //TODO eploy 2/3 safe like safe-tools
    // https://ethereum.stackexchange.com/a/116791
    const contractNetworks = {
        [chainId]: {
          multiSendAddress: '<MULTI_SEND_ADDRESS>',
          safeMasterCopyAddress: '<MASTER_COPY_ADDRESS>',
          safeProxyFactoryAddress: '<PROXY_FACTORY_ADDRESS>'
        }
      }
      
      const web3 = new Web3(window.ethereum)
      const ethAdapter = new Web3Adapter({
        web3,
        signerAddress: signer.address
      })
      const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks })
    //TODO deploy safe CreateCaller


    return {

    };
  }

  //TODO test deploy camelot at fixed address
  it("should deploy camelot at fixed address", async function () {
    const {  safe, createCaller    } = await loadFixture(CamelotFixture);


    // await counter.increment();
    // expect(await counter.number()).to.equal(1);
  });

  //TODO submit round-robin

  //TODO submit randomly

//   it("Should increment the number correctly", async function () {
//     const { counter } = await loadFixture(CamelotFixture);
//     await counter.increment();
//     expect(await counter.number()).to.equal(1);
//   });

//   // This is not a fuzz test because Hardhat does not support fuzzing yet.
//   it("Should set the number correctly", async function () {
//     const { counter } = await loadFixture(CamelotFixture);
//     await counter.setNumber(100);
//     expect(await counter.number()).to.equal(100);
//   });
});
