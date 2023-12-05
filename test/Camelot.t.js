const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Camelot contract", function () {
  async function deploy(contractName, ...args) {
    const factory = await ethers.getContractFactory(contractName);
    const instance = await factory.deploy(...args);
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

    const salt = ethers.keccak256(Buffer.from("CAMELOT", "utf8"));

    const create2CamelotAddress = ethers.getCreate2Address(
      await createCall.contract.getAddress(),
      salt,
      ethers.keccak256(camelotCode)
    );

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

  //WIP
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
