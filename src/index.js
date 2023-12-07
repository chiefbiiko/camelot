const { keccak256 } = require('ethers')
const {
  generateKeyPairFromSeed,
  scalarMult: _scalarMult
} = require('@stablelib/x25519')

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
  return _scalarMult(a, b)
}

module.exports = {
  kdf,
  scalarMult
}
