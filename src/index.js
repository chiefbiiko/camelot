const { keccak256 } = require("ethers");

const PRIME = 115792089237316195423570985008687907853269984665640564039457584007908834671663n
const GENERATOR = 60007469361611451595808076307103981948066675035911483428688400614800034609601690612527903279981446538331562636035761922566837056280671244382574348564747448n

function modExp(a, b, m) {
    let result = 1n;
    while (b > 0n) {
      if (b & 1n) {
        result = (result * a) % m;
      }
      a = (a * a) % m;
      b >>= 1n;
    }
    return result;
}

async function kdf(signer) {
  return await signer.signMessage('CAMELOT_KDF_SEED').then(msg => BigInt(keccak256(msg)))
}

module.exports = {
  kdf,
  modExp,
  PRIME,
  GENERATOR
}
