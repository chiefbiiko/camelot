const { keccak256 } = require('ethers')
const {
  generateKeyPairFromSeed,
  scalarMult: _scalarMult
} = require('@stablelib/x25519')

function hex(b) {
  return Buffer.from(b).toString('hex')
}

function buf(s) {
  return Buffer.from(s.replace('0x', ''), 'hex')
}

async function kdf(signer) {
  const seed = await signer
    .signMessage('CAMELOT_KDF_SEED')
    .then(signedMsg =>
      Buffer.from(keccak256(signedMsg).replace('0x', ''), 'hex')
    )
  return generateKeyPairFromSeed(seed)
}

function scalarMult(a, b) {
  if (typeof a === 'string') a = Buffer.from(a.replace('0x', ''), 'hex')
  if (typeof b === 'string') b = Buffer.from(b.replace('0x', ''), 'hex')
  return Buffer.from(_scalarMult(a, b))
}

async function choreo(mpx25519Address) {
  const MPX25519 = await ethers.getContractFactory('SafeMPX25519')
  const mpx255193 = MPX25519.attach(mpx25519Address)
  return {
    async step0(signer) {
      const kp = await kdf(signer)
      await mpx255193.connect(signer).step(kp.publicKey)
      await mpx255193.connect(signer).done()
    },
    async stepN(signer) {
      const [status, preKey] = await mpx255193.prep(signer.address)
      if (status !== 1n) throw Error('expected status 1 got ' + status)
      const kp = await kdf(signer)
      const newKey = scalarMult(kp.secretKey, preKey)
      await mpx255193.connect(signer).step(newKey)
      await mpx255193.connect(signer).done()
    },
    async stepX(signer) {
      const [status, preKey] = await mpx255193.prep(signer.address)
      if (status !== 0n) throw Error('expected status 0 got ' + status)
      const kp = await kdf(signer)
      return '0x' + hex(scalarMult(kp.secretKey, preKey))
    }
  }
}

module.exports = {
  hex,
  buf,
  kdf,
  scalarMult,
  choreo
}
