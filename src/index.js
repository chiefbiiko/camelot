const ethers = require('ethers')
const { x25519, hashToCurve } = require('@noble/curves/ed25519')
const { default: Safe, EthersAdapter } = require("@safe-global/protocol-kit")
const { default: SafeApiKit } = require("@safe-global/api-kit")

function generateKeyPairFromSeed(seed) {
  const p = hashToCurve(seed)
  const priv = bigint2buf(p.x, 32)
  return {
    secretKey: priv,
    publicKey: x25519.scalarMultBase(priv)
  }
}

function bigint2buf(b, len) {
  if (typeof b !== 'bigint') {
    b = BigInt(b)
  }
  const out = Buffer.alloc(len)
  for (let i = len - 1; i >= 0; --i) {
    out[i] = Number(b & 255n)
    b >>= 8n
  }
  return out
}

function hex(b) {
  return Buffer.from(b).toString('hex')
}

function buf(s) {
  return Buffer.from(s.replace('0x', ''), 'hex')
}

async function kdf(signer) {
  const seed = await signer
    .signMessage('MPECDH_KDF_SEED')
    .then(signedMsg =>
      Buffer.from(ethers.keccak256(signedMsg).replace('0x', ''), 'hex')
    )
  return generateKeyPairFromSeed(seed)
}

function scalarMult(a, b) {
  if (typeof a === 'string') a = Buffer.from(a.replace('0x', ''), 'hex')
  if (typeof b === 'string') b = Buffer.from(b.replace('0x', ''), 'hex')
  return Buffer.from(x25519.scalarMult(a, b))
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

async function proposeDeploySafeMPECDH(safeAddress, signer) {
  const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: signer })
  const safeSigner = await Safe.create({ ethAdapter, safeAddress })
  //TOD-O
  // const rawData = new ethers.Interface([
  //   "function signMessage(bytes calldata _data)"
  // ]).encodeFunctionData("signMessage", [Buffer.from(process.env.MSG, "utf8")])
  const safeTransactionData = {
    // to: SIGN_MSG_LIB, TODO
    data: rawData,
    operation: 0, // call
    value: 0
  }
  const safeTx = await safeSigner.createTransaction({
    transactions: [safeTransactionData]
  })
  const apiKit = new SafeApiKit({ chainId: 100 })
  // Deterministic hash based on transaction parameters
  const safeTxHash = await safeSigner.getTransactionHash(safeTx)
  // Sign transaction to verify that the transaction is coming from owner 1
  const senderSignature = await safeSigner.signHash(safeTxHash)
  await apiKit.proposeTransaction({
    safeAddress,
    safeTransactionData: safeTx.data,
    safeTxHash,
    senderAddress: signer.address,
    senderSignature: senderSignature.data
  })
}

module.exports = {
  hex,
  buf,
  kdf,
  scalarMult,
  ceremony
}
