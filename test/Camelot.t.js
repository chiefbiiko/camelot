const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
// const {
//   SafeFactory,
//   Web3Adapter,
// } = require("@safe-global/protocol-kit");
// const chainId = require("../hardhat.config.js").networks.hardhat.chainId;

// function getCreateCall() {}
// function getFactory() {}
// function getMultiSend() {}
// chai.use(require("ethereum-waffle").solidity)
// const { expect }  = chai

describe("Camelot contract", function () {
  async function deploy(contractName, ...args) {
    const factory = await ethers.getContractFactory(contractName);
    const instance = await factory.deploy(...args);
    // return instance//.deployed()
    // console.log(">>>>>>>instance.interface",instance.interface)
    return { contract: instance, abi: instance.interface };
  }

  async function CamelotFixture() {
    const [alice, bob, charlie, dave, eve, ferdie] = await ethers.getSigners();
    const safeMock23 = await deploy("SafeMock23", [alice, bob, charlie]);
    const safeMock35 = await deploy("SafeMock35", [
      alice,
      bob,
      charlie,
      dave,
      eve,
    ]);
    const createCall = await deploy("_CreateCall");
    const camelotCode = await ethers
      .getContractFactory("Camelot")
      .then((c) => c.bytecode);
    // console.log("singleton adddr", singleton.address)
    // const safeProxyFactory = await deploy('_SafeProxyFactory')
    // const multiSend = await deploy('_MultiSend')
    // const createCall = await deploy('_CreateCall')
    // console.log(">>>>> safeProxyFactory addr", await safeProxyFactory.contract.getAddress())
    // console.log(">>>>> safeProxyFactory abi",  safeProxyFactory.abi)
    // console.log(">>>>> multiSend abi",  multiSend.abi)
    // console.log(">>>>> createCall abi",  createCall.abi)

    //TODO eploy 2/3 safe like safe-tools
    // proxyFactory.createProxyWithNonce(
    //     address(singleton),
    //     initData,
    //     advancedParams.saltNonce == 0
    //         ? uint256(keccak256(abi.encode("SAFE_TEST_TOOLS", instances.length)))
    //         : advancedParams.saltNonce
    // )

    const salt = ethers.keccak256(Buffer.from("CAMELOT", "utf8"));

    const create2CamelotAddress = ethers.getCreate2Address(
      await createCall.contract.getAddress(),
      salt,
      ethers.keccak256(camelotCode)
    );

    /*
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
    */

    return {
      alice,
      bob,
      charlie,
      dave,
      eve,
      ferdie,
      safeMock23,
      safeMock35,
      createCall,
      camelotCode,
      salt,
      create2CamelotAddress,
    };
  }

  //TODO test deploy camelot at fixed address
  it("should deploy camelot at fixed address", async function () {
    const {
      alice,
      bob,
      charlie,
      safeMock23,
      createCall,
      camelotCode,
      salt,
      create2CamelotAddress,
    } = await loadFixture(CamelotFixture);
    // console.log(">>>>> createCall.address",  await createCall.contract.getAddress())

    //call reatecall eprfmoreCreate2 camelotCode
    let deployedCamelotCode = await ethers.provider
      .getCode(create2CamelotAddress)
      .then((c) => c.replace("0x", ""));
    expect(deployedCamelotCode.length).to.equal(0);

    await safeMock23.contract
      .connect(alice)
      .exec(
        await createCall.contract.getAddress(),
        createCall.abi.encodeFunctionData("performCreate2", [
          0,
          camelotCode,
          salt,
        ]),
        7_000_000
      )
      .then((r) => r.wait());

    deployedCamelotCode = await ethers.provider
      .getCode(create2CamelotAddress)
      .then((c) => c.replace("0x", ""));
      console.log(">>>>>>deployedCamelotCode",deployedCamelotCode)
    expect(deployedCamelotCode.length).to.be.greaterThan(0);
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
