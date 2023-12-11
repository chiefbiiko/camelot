// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OwnerManager } from "safe-contracts/base/OwnerManager.sol";
import { MPX25519 } from "./MPX25519.sol";

/**
 * @dev SafeMPX25519 facilitates multi-party X25519 for Safe signers.
 * Must be deployed through a safe.
 */
contract SafeMPX25519 is MPX25519 {
    /**
     * @dev Gets a Safe's current set of signers.
     * @return _signers Array of signer addresses
     */
    function _getSigners()
        internal
        view
        override
        returns (address[] memory _signers)
    {
        return OwnerManager(master).getOwners();
    }
}
