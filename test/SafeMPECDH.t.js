const { expect } = require('chai')
const { ethers } = require('hardhat')
const {
  loadFixture
} = require('@nomicfoundation/hardhat-toolbox/network-helpers')
const { kdf, scalarMult, ceremony, hex, buf } = require('../src')

async function deploy(contractName, ...args) {
  return ethers.getContractFactory(contractName).then(f => f.deploy(...args))
}

describe('SafeMPECDH', function () {
  async function MPX25519Fixture() {
    const [alice, bob, charlie, dave, eve, ferdie] = await ethers.getSigners()
    const safeMock3 = await deploy('SafeMock', [alice, bob, charlie], 2)
    const safeMock5 = await deploy(
      'SafeMock',
      [alice, bob, charlie, dave, eve],
      3
    )

    await safeMock3.connect(alice).deploySafeMPECDH()
    await safeMock5.connect(alice).deploySafeMPECDH()

    const SafeMPECDH = await ethers.getContractFactory('SafeMPECDH')
    const safeMPECDH3 = SafeMPECDH.attach(await safeMock3.safeMPECDH())
    const safeMPECDH5 = SafeMPECDH.attach(await safeMock5.safeMPECDH())

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
      safeMPECDH3,
      safeMPECDH5,
      G
    }
  }

  it('should have deployed SafeMPECDH through Safe', async function () {
    const { safeMPECDH3, safeMPECDH5 } = await loadFixture(MPX25519Fixture)

    const safeMPECDH3Code = await ethers.provider
      .getCode(await safeMPECDH3.getAddress())
      .then(c => c.replace('0x', ''))
    const safeMPECDH5Code = await ethers.provider
      .getCode(await safeMPECDH5.getAddress())
      .then(c => c.replace('0x', ''))

    expect(safeMPECDH3Code.length).to.be.greaterThan(0)
    expect(safeMPECDH5Code.length).to.be.greaterThan(0)

    const signers3 = await safeMPECDH3.getSigners()
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
    const { alice, bob, charlie, safeMPECDH3 } =
      await loadFixture(MPX25519Fixture)

    const a = await kdf(alice)
    const b = await kdf(bob)
    const c = await kdf(charlie)

    await safeMPECDH3.connect(alice).step(a.publicKey)

    await safeMPECDH3.connect(bob).step(b.publicKey)

    await safeMPECDH3.connect(charlie).step(c.publicKey)

    const aG = await safeMPECDH3.prep(bob.address).then(([_, k]) => buf(k))
    const aGb = scalarMult(b.secretKey, aG)
    await safeMPECDH3.connect(bob).step(aGb)

    const bG = await safeMPECDH3.prep(charlie.address).then(([_, k]) => buf(k))
    const bGc = scalarMult(c.secretKey, bG)
    await safeMPECDH3.connect(charlie).step(bGc)

    const cG = await safeMPECDH3.prep(alice.address).then(([_, k]) => buf(k))
    const cGa = scalarMult(a.secretKey, cG)
    await safeMPECDH3.connect(alice).step(cGa)

    const _aGb = await safeMPECDH3
      .prep(charlie.address)
      .then(([_, k]) => buf(k))
    const aGbc = hex(scalarMult(c.secretKey, _aGb))

    const _bGc = await safeMPECDH3.prep(alice.address).then(([_, k]) => buf(k))
    const bGca = hex(scalarMult(a.secretKey, _bGc))

    const _cGa = await safeMPECDH3.prep(bob.address).then(([_, k]) => buf(k))
    const cGab = hex(scalarMult(b.secretKey, _cGa))

    expect(aGbc).to.equal(bGca)
    expect(bGca).to.equal(cGab)
  })

  it('should yield a shared secret after a threesome ceremony', async function () {
    const { alice, bob, charlie, safeMPECDH3 } =
      await loadFixture(MPX25519Fixture)
    const signers = [alice, bob, charlie]

    const choreo = await ceremony(await safeMPECDH3.getAddress())
    for (const signer of signers) {
      await choreo.step0(signer)
    }
    for (let i = 0; i < signers.length - 2; i++) {
      for (const signer of signers) {
        await choreo.stepN(signer)
      }
    }
    for (const signer of signers) {
      signer.sharedSecret = await choreo.stepX(signer)
    }

    const expected = signers[0].sharedSecret
    expect(signers.every(s => s.sharedSecret === expected)).to.be.true
  })

  it('should yield a shared secret after a fivesome ceremony', async function () {
    const { alice, bob, charlie, dave, eve, safeMPECDH5 } =
      await loadFixture(MPX25519Fixture)
    const signers = [alice, bob, charlie, dave, eve]

    const choreo = await ceremony(await safeMPECDH5.getAddress())
    for (const signer of signers) {
      await choreo.step0(signer)
    }
    for (let i = 0; i < signers.length - 2; i++) {
      for (const signer of signers) {
        await choreo.stepN(signer)
      }
    }
    for (const signer of signers) {
      signer.sharedSecret = await choreo.stepX(signer)
    }

    const expected = signers[0].sharedSecret
    expect(signers.every(s => s.sharedSecret === expected)).to.be.true
  })

  //WONTFIX=>> step correction wont be possibl
  it.skip('should allow correcting a step', async function () {
    const { alice, bob, charlie, safeMPECDH3 } =
      await loadFixture(MPX25519Fixture)

    const a = await kdf(alice)
    const b = await kdf(bob)
    const c = await kdf(charlie)

    await safeMPECDH3.connect(alice).step(a.publicKey)
    await safeMPECDH3.connect(alice).done()

    await safeMPECDH3.connect(bob).step(b.publicKey)
    await safeMPECDH3.connect(bob).done()

    await safeMPECDH3.connect(charlie).step(c.publicKey)
    await safeMPECDH3.connect(charlie).done()

    const aG = await safeMPECDH3.prep(bob.address).then(([_, k]) => buf(k))
    const aGb = scalarMult(b.secretKey, aG)
    await safeMPECDH3.connect(bob).step(Buffer.alloc(32))
    await safeMPECDH3.connect(bob).step(aGb)
    await safeMPECDH3.connect(bob).done()

    const bG = await safeMPECDH3.prep(charlie.address).then(([_, k]) => buf(k))
    const bGc = scalarMult(c.secretKey, bG)
    await safeMPECDH3.connect(charlie).step(bGc)
    await safeMPECDH3.connect(charlie).done()

    const cG = await safeMPECDH3.prep(alice.address).then(([_, k]) => buf(k))
    const cGa = scalarMult(a.secretKey, cG)
    await safeMPECDH3.connect(alice).step(cGa)
    await safeMPECDH3.connect(alice).done()

    const _aGb = await safeMPECDH3
      .prep(charlie.address)
      .then(([_, k]) => buf(k))
    const aGbc = hex(scalarMult(c.secretKey, _aGb))

    const _bGc = await safeMPECDH3.prep(alice.address).then(([_, k]) => buf(k))
    const bGca = hex(scalarMult(a.secretKey, _bGc))

    const _cGa = await safeMPECDH3.prep(bob.address).then(([_, k]) => buf(k))
    const cGab = hex(scalarMult(b.secretKey, _cGa))

    expect(aGbc).to.equal(bGca)
    expect(bGca).to.equal(cGab)
  })

  //TODO test submit randomly
  //TODO test reconstruct
})
