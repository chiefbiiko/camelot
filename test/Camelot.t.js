const { expect } = require('chai')
const { ethers } = require('hardhat')
const {
  loadFixture
} = require('@nomicfoundation/hardhat-toolbox/network-helpers')
const { kdf, scalarMult } = require('../src')

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
  it('should yield all similar shared secrets', async function () {
    const { alice, bob, charlie, camelot23 } = await loadFixture(CamelotFixture)
    const signers = [alice, bob, charlie]

    async function _logQueues() {
      //DBG
      for (let i = 0; i < signers.length; i++) {
        console.log(
          'queue',
          i,
          'length',
          await camelot23.getQueue(i).then(q => q.length)
        )
      }
      console.log('==================')
    }

    // there are always signers.length - 1 rounds prefinal rounds
    // the output of the final round is the shared secret

    console.log('>>>>>>>1stround begin')
    for (const signer of signers) {
      const kp = await kdf(signer)
      await camelot23.connect(signer).submit(kp.publicKey)

      await _logQueues() //DBG
    }
    console.log('>>>>>>>1stround done')
    await _logQueues() //DBG

    console.log('>>>>>>>2ndround begin')
    for (const signer of signers) {
      const [status, share] = await camelot23.share(signer.address)
      if (status !== 1n) throw Error('expected status 1 got ' + status)
      const kp = await kdf(signer)
      const newShare = scalarMult(kp.secretKey, share)
      await camelot23.connect(signer).submit(newShare) //(1, newShare)

      await _logQueues() //DBG
    }
    console.log('>>>>>>>2ndround done')
    await _logQueues() //DBG

    // final
    for (const signer of signers) {
      const [status, share] = await camelot23.share(signer.address)
      if (status !== 0n) throw Error('expected status 0 got ' + status)
      else console.log('>>>>>> signer ended')
      console.log(">>> semifinal share", share)
      const kp = await kdf(signer)
      signer.sharedSecret ="0x"+ Buffer.from(scalarMult(kp.secretKey, share)).toString("hex")
    }

    const sharedSecrets = signers.map(s => s.sharedSecret)
    const expected = sharedSecrets[0]
    console.log('>>> shared secrets', sharedSecrets) //DBG
    expect(sharedSecrets.every(s => s === expected)).to.be.true
  })

  //TODO submit randomly
})
