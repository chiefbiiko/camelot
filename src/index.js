const { keccak256 } = require('ethers')
const { generateKeyPairFromSeed, scalarMult: _scalarMult } = require("@stablelib/x25519")

const PRIME = 2n**255n - 19n
  // 115792089237316195423570985008687907853269984665640564039457584007908834671663n
const GENERATOR = 9n
  // 60007469361611451595808076307103981948066675035911483428688400614800034609601690612527903279981446538331562636035761922566837056280671244382574348564747448n
  // 286650441496909734516720688912544350032790572785058722254415355376215376009112n

// function modExp(a, b, m) {
//   let result = 1n
//   while (b > 0n) {
//     if (b & 1n) {
//       result = (result * a) % m
//     }
//     a = (a * a) % m
//     b >>= 1n
//   }
//   return result
// }

async function kdf(signer) {
  // return await signer
  //   .signMessage('CAMELOT_KDF_SEED')
  //   .then(msg => BigInt(keccak256(msg)))
  const seed =await signer.signMessage('CAMELOT_KDF_SEED').then(signedMsg => Buffer.from(keccak256(signedMsg).replace("0x",""),"hex"))
  return generateKeyPairFromSeed(seed)
}

function scalarMult(a, b) {
  // const _a = bigint2buf(a)
  // const _b = bigint2buf(b)
  // const r = _scalarMult(bigint2buf(a), bigint2buf(b))
  return buf2bigint(_scalarMult(bigint2buf(a), bigint2buf(b)))
}

function bigint2buf(b) {
  let s = b.toString(16)
  if (s.length % 2 > 0) s = "0" + s
  return Buffer.from(s, "hex")
}

function buf2bigint(b) {
  return BigInt("0x"+Buffer.from(b).toString("hex"))
}

module.exports = {
  kdf,
  scalarMult,
  // modExp,
  // PRIME,
  // GENERATOR
}
