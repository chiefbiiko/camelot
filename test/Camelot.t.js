const { expect } = require("chai");
const { ethers, web3 } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {
  SafeFactory,
  Web3Adapter,
} = require("@safe-global/protocol-kit");
const chainId = require("../hardhat.config.js").networks.hardhat.chainId;

function getCreateCall() {}
function getFactory() {}
function getMultiSend() {}

describe("Counter contract", function () {
    async function deploy(contractName, ...args) {
        const factory = await ethers.getContractFactory(contractName)
        const instance = await factory.deploy(...args)
        // return instance//.deployed()
        // console.log(">>>>>>>instance.interface",instance.interface)
        return { contract: instance, abi: instance.interface }
      }

  async function CamelotFixture() {
    const [alice, bob, charlie, dave, eve, ferdie] = await ethers.getSigners();

    // GnosisSafeProxyFactory
    const safeProxyFactory = await deploy('_SafeProxyFactory')
    // const multiSend = await deploy('_MultiSend')
    // const createCall = await deploy('_CreateCall')
    // console.log(">>>>> safeProxyFactory addr", await safeProxyFactory.contract.getAddress())
    // console.log(">>>>> safeProxyFactory abi",  safeProxyFactory.abi)
    // console.log(">>>>> multiSend abi",  multiSend.abi)
    // console.log(">>>>> createCall abi",  createCall.abi)

    //TODO eploy 2/3 safe like safe-tools
    // https://ethereum.stackexchange.com/a/116791
    const contractNetworks = {
      [String(chainId)]: {
        // multiSendAddress: "<MULTI_SEND_ADDRESS>",
        // safeMasterCopyAddress: "<MASTER_COPY_ADDRESS>",
        // safeProxyFactoryAddress: "<PROXY_FACTORY_ADDRESS>",

        safeProxyFactoryAddress: await safeProxyFactory.contract.getAddress(),
        safeProxyFactoryAbi: safeProxyFactory.abi,
        // multiSendAddress: await multiSend.contract.getAddress(),
        // multiSendAbi: multiSend.abi,
        // createCallAddress: await createCall.contract.getAddress(),
        // createCallAbi: createCall.abi,
      },
    };
    console.log(">>>>> contractNetworks chainId", chainId)
    const ethAdapter = new Web3Adapter({ web3, signerAddress: alice })
    console.log(">>>>> ethAdapter chainId", await ethAdapter.getChainId())
    const safeFactory = await SafeFactory.create({
      ethAdapter,
      contractNetworks,
    });


    return {
      alice,
      bob,
      charlie,
      dave,
      eve,
      ferdie,
    };
  }

  //TODO test deploy camelot at fixed address
  it("should deploy camelot at fixed address", async function () {
    const { safe, createCaller } = await loadFixture(CamelotFixture);
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
