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
  // let kp = generateKeyPairFromSeed(seed)
  // kp.publicKey = buf2bigint(kp.publicKey)
  // kp.secretKey = buf2bigint(kp.secretKey)
  // return kp
  return generateKeyPairFromSeed(seed)
}

function scalarMult(a, b) {
  if (typeof a === "string") a = Buffer.from(a.replace("0x",""),"hex")
  if (typeof b === "string") b = Buffer.from(b.replace("0x",""),"hex")
  // return buf2bigint(_scalarMult(bigint2buf(a), bigint2buf(b)))
  return _scalarMult(a, b)
}

// function bigint2buf(b) {
//   let s = b.toString(16)
//   if (s.length % 2 > 0) s = '0' + s
//   s += "0".repeat(64 - s.length)
//   return Buffer.from(s, 'hex')
// }

// function buf2bigint(b) {
//   return BigInt('0x' + Buffer.from(b).reverse().toString('hex'))
// }

module.exports = {
  kdf,
  scalarMult,
  // bigint2buf,
  // buf2bigint
}
