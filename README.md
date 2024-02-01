# MPECDH

Multi-party [ECDH](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange#Operation_with_more_than_two_parties
)

Facilitates deriving a shared secret among an arbitrarily sized set of peers. 

`MPECDH` is an abstract contract requiring a 

```sol
function _getSigners()
    internal
    view
    override
    returns (address[] memory _signers);
```

impl. There is a concrete [`SafeMPECDH`](./src/SafeMPECDH.sol) contract for use with Safes.

## Usage

1. Deploy a `SafeMPECDH` instance via Safe

2. Run the bootstrap ceremony with all signers (`step0` & `stepN`)

3. Then each signer can derive the shared secret separately (`stepX`)

```js
const { ceremony } = require("./src/index")7

const mpecdhAddress = "0x1234..."
const signers = [alice, bob, charlie] = await ethers.getSigners()

const choreo = await ceremony(mpecdhAddress)
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
```

![MPECDH Trio](./MPECDH.png)
