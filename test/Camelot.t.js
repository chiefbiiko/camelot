const { expect } = require('chai')
const { ethers } = require('hardhat')
const {
  loadFixture
} = require('@nomicfoundation/hardhat-toolbox/network-helpers')
const { kdf, modExp, GENERATOR, PRIME } = require('../src')

async function deploy(contractName, ...args) {
  return ethers.getContractFactory(contractName).then(f => f.deploy(...args))
}

describe('Camelot contract', function () {
  async function CamelotFixture() {
    const [alice, bob, charlie, dave, eve, ferdie] = await ethers.getSigners()
    const safeMock23 = await deploy('SafeMock23', [alice, bob, charlie])
    const safeMock35 = await deploy('SafeMock35', [
      alice,
      bob,
      charlie,
      dave,
      eve
    ])

    await safeMock23.connect(alice).deployCamelot()
    await safeMock35.connect(alice).deployCamelot()

    const Camelot = await ethers.getContractFactory('Camelot')
    const camelot23 = Camelot.attach(await safeMock23.camelot())
    const camelot35 = Camelot.attach(await safeMock35.camelot())

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
      camelot35
    }
  }

  it('should have deployed camelots', async function () {
    const { camelot23, camelot35 } = await loadFixture(CamelotFixture)

    const camelot23Code = await ethers.provider
      .getCode(await camelot23.getAddress())
      .then(c => c.replace('0x', ''))
    const camelot35Code = await ethers.provider
      .getCode(await camelot35.getAddress())
      .then(c => c.replace('0x', ''))

    expect(camelot23Code.length).to.be.greaterThan(0)
    expect(camelot35Code.length).to.be.greaterThan(0)

    const signers23 = await camelot23.getSigners()
    expect(signers23.length).to.be.greaterThan(0)
  })
  //WIP
  it('should do round-robin', async function () {
    const { alice, bob, charlie, camelot23 } = await loadFixture(CamelotFixture)
    const signers = [alice, bob, charlie]

    // there are always signers.length - 1 rounds prefinal rounds
    // the output of the final round is the shared secret

    console.log(">>>>>>> allowed signers", await camelot23.getSigners())
    console.log(">>>>>>> actual signers", signers.map(s => s.address))

    // first round
    for (const signer of signers) {
      const share = modExp(GENERATOR, await kdf(signer), PRIME)
      await camelot23.connect(signer).submit(0, share)
    }

    // second round - semifinal
    for (const signer of signers) {
      const [status, predecessors, share] = await camelot23.share(
        signer.address
      )
      console.log("typeof status", typeof status)
      console.log("typeof predecessors", typeof predecessors)
      console.log("typeof share", typeof share)
      return 
      if (status !== 1) throw Error('expected status 1 got', status)
      const newShare = modExp(share, await kdf(signer), PRIME)
      await camelot23.connect(signer).submit(predecessors, newShare)
    }

    // final
    for (const signer of signers) {
      const [status, _predecessors, share] = await camelot23.share(
        signer.address
      )
      if (status !== 0) throw Error('expected status 0 got', status)
      signer.camelotSecret = modExp(share, await kdf(signer), PRIME)
    }

    console.log('>>> camelot secrets', ...signers.map(s => s.camelotSecret))
    //  expect() //TODO
  })

  //TODO submit randomly
})
