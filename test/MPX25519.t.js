const { expect } = require('chai')
const { ethers } = require('hardhat')
const {
  loadFixture
} = require('@nomicfoundation/hardhat-toolbox/network-helpers')
const { kdf, scalarMult, choreo, hex, buf } = require('../src')

async function deploy(contractName, ...args) {
  return ethers.getContractFactory(contractName).then(f => f.deploy(...args))
}

// async function _logQueues() {
//   //DBG
//   for (let i = 0; i < signers.length; i++) {
//     console.log(
//       'queue',
//       i,
//       'length',
//       await safeMPX255193.getQueue(i).then(q => q.length)
//     )
//   }
//   console.log('==================')
// }

describe('MPX25519', function () {
  async function MPX25519Fixture() {
    const [alice, bob, charlie, dave, eve, ferdie] = await ethers.getSigners()
    const safeMock3 = await deploy('SafeMock3', [alice, bob, charlie])
    const safeMock5 = await deploy('SafeMock5', [
      alice,
      bob,
      charlie,
      dave,
      eve
    ])

    await safeMock3.connect(alice).deploySafeMPX25519()
    await safeMock5.connect(alice).deploySafeMPX25519()

    const SafeMPX25519 = await ethers.getContractFactory('SafeMPX25519')
    const safeMPX255193 = SafeMPX25519.attach(await safeMock3.safeMPX25519())
    const safeMPX255195 = SafeMPX25519.attach(await safeMock5.safeMPX25519())

    const G = new Uint8Array(32)
    G[0] = 9

    return {
      alice,
      bob,
      charlie,
      dave,
      eve,
      ferdie,
      safeMock3,
      safeMock5,
      safeMPX255193,
      safeMPX255195,
      G
    }
  }

  it('should have deployed MPX25519 through Safe', async function () {
    const { safeMPX255193, safeMPX255195 } = await loadFixture(MPX25519Fixture)

    const safeMPX255193Code = await ethers.provider
      .getCode(await safeMPX255193.getAddress())
      .then(c => c.replace('0x', ''))
    const safeMPX255195Code = await ethers.provider
      .getCode(await safeMPX255195.getAddress())
      .then(c => c.replace('0x', ''))

    expect(safeMPX255193Code.length).to.be.greaterThan(0)
    expect(safeMPX255195Code.length).to.be.greaterThan(0)

    const signers3 = await safeMPX255193.getSigners()
    expect(signers3.length).to.equal(3)
  })

  it('pk inspection', async function () {
    const { alice, G } = await loadFixture(MPX25519Fixture)

    const a = await kdf(alice)
    const aG = scalarMult(a.secretKey, G)

    expect(aG).to.deep.equal(a.publicKey)
  })

  it('poc', async function () {
    const { alice, bob, charlie } = await loadFixture(MPX25519Fixture)

    const a = await kdf(alice)
    const b = await kdf(bob)
    const c = await kdf(charlie)

    const aG = a.publicKey
    const bG = b.publicKey
    const cG = c.publicKey

    const aGb = scalarMult(b.secretKey, aG)
    const bGc = scalarMult(c.secretKey, bG)
    const cGa = scalarMult(a.secretKey, cG)

    const aGbc = hex(scalarMult(c.secretKey, aGb))
    const bGca = hex(scalarMult(a.secretKey, bGc))
    const cGab = hex(scalarMult(b.secretKey, cGa))

    expect(aGbc).to.equal(bGca)
    expect(bGca).to.equal(cGab)
  })

  it('poc via contract', async function () {
    const { alice, bob, charlie, safeMPX255193 } =
      await loadFixture(MPX25519Fixture)

    const a = await kdf(alice)
    const b = await kdf(bob)
    const c = await kdf(charlie)

    await safeMPX255193.connect(alice).step(a.publicKey)
    await safeMPX255193.connect(alice).done()

    await safeMPX255193.connect(bob).step(b.publicKey)
    await safeMPX255193.connect(bob).done()

    await safeMPX255193.connect(charlie).step(c.publicKey)
    await safeMPX255193.connect(charlie).done()

    const aG = await safeMPX255193.prep(bob.address).then(([_, k]) => buf(k))
    const aGb = scalarMult(b.secretKey, aG)
    await safeMPX255193.connect(bob).step(aGb)
    await safeMPX255193.connect(bob).done()

    const bG = await safeMPX255193
      .prep(charlie.address)
      .then(([_, k]) => buf(k))
    const bGc = scalarMult(c.secretKey, bG)
    await safeMPX255193.connect(charlie).step(bGc)
    await safeMPX255193.connect(charlie).done()

    const cG = await safeMPX255193.prep(alice.address).then(([_, k]) => buf(k))
    const cGa = scalarMult(a.secretKey, cG)
    await safeMPX255193.connect(alice).step(cGa)
    await safeMPX255193.connect(alice).done()

    const _aGb = await safeMPX255193
      .prep(charlie.address)
      .then(([_, k]) => buf(k))
    const aGbc = hex(scalarMult(c.secretKey, _aGb))

    const _bGc = await safeMPX255193
      .prep(alice.address)
      .then(([_, k]) => buf(k))
    const bGca = hex(scalarMult(a.secretKey, _bGc))

    const _cGa = await safeMPX255193.prep(bob.address).then(([_, k]) => buf(k))
    const cGab = hex(scalarMult(b.secretKey, _cGa))

    expect(aGbc).to.equal(bGca)
    expect(bGca).to.equal(cGab)
  })

  it('should yield all similar shared secrets after a threesome ceremony', async function () {
    const { alice, bob, charlie, safeMPX255193 } =
      await loadFixture(MPX25519Fixture)
    const signers = [alice, bob, charlie]

    const ceremony = await choreo(await safeMPX255193.getAddress())
    for (const signer of signers) {
      await ceremony.step0(signer)
    }
    for (let i = 0; i < signers.length - 2; i++) {
      for (const signer of signers) {
        await ceremony.stepN(signer)
      }
    }
    for (const signer of signers) {
      signer.sharedSecret = await ceremony.stepX(signer)
    }

    const sharedSecrets = signers.map(s => s.sharedSecret)
    const expected = sharedSecrets[0]
    expect(sharedSecrets.every(s => s === expected)).to.be.true
  })

  //TODO test 5
  //TODO submit randomly
  //TODO test submit twice (to correct)
  //TODO test reconstruct
})
