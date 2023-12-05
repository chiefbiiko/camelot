const { expect } = require("chai")
const { ethers } = require("hardhat")
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers")

describe("Camelot contract", function () {
  async function deploy(contractName, ...args) {
    const factory = await ethers.getContractFactory(contractName)
    const instance = await factory.deploy(...args)
    return { contract: instance, abi: instance.interface }
  }

  async function CamelotFixture() {
    const [alice, bob, charlie, dave, eve, ferdie] = await ethers.getSigners()
    const safeMock23 = await deploy("SafeMock23", [alice, bob, charlie])
    const safeMock35 = await deploy("SafeMock35", [
      alice,
      bob,
      charlie,
      dave,
      eve,
    ])

    await safeMock23.contract.connect(alice).deployCamelot()
    await safeMock35.contract.connect(alice).deployCamelot()

    const Camelot = await ethers.getContractFactory("Camelot")
    const camelot23 = Camelot.attach(await safeMock23.contract.camelot())
    const camelot35 = Camelot.attach(await safeMock35.contract.camelot())

    return {
      alice,
      bob,
      charlie,
      dave,
      eve,
      ferdie,
      safeMock23,
      safeMock35,
      camelot23,
      camelot35,
    }
  }

  it("should have deployed camelots", async function () {
    const { camelot23, camelot35 } =
      await loadFixture(CamelotFixture)

    const camelot23Code = await ethers.provider
      .getCode(await camelot23.getAddress())
      .then(c => c.replace("0x", ""))
    const camelot35Code = await ethers.provider
      .getCode(await camelot35.getAddress())
      .then(c => c.replace("0x", ""))

    expect(camelot23Code.length).to.be.greaterThan(0)
    expect(camelot35Code.length).to.be.greaterThan(0)
  })

  //WIP
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
})
