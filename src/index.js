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

async function ceremony(mpecdhAddress) {
  const MPECDH = await ethers.getContractFactory('SafeMPECDH')
  const mpecdh = MPECDH.attach(mpecdhAddress)
  return {
    async blocking() {
      return mpecdh.blocking()
    },
    async status(signer) {
      const [status] = await mpecdh.prep(signer.address)
      return Number(status)
    },
    async step0(signer) {
      const kp = await kdf(signer)
      await mpecdh.connect(signer).step(kp.publicKey)
    },
    async stepN(signer) {
      const [status, preKey] = await mpecdh.prep(signer.address)
      if (status !== 1n) {
        throw Error('expected status 1 got ' + status)
      }
      const kp = await kdf(signer)
      const newKey = scalarMult(kp.secretKey, preKey)
      await mpecdh.connect(signer).step(newKey)
    },
    async stepX(signer) {
      const [status, preKey] = await mpecdh.prep(signer.address)
      if (status !== 0n) {
        throw Error('expected status 0 got ' + status)
      }
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
  ceremony
}
