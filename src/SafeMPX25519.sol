// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { OwnerManager as SafeOwnerManager } from "safe-contracts/base/OwnerManager.sol";
import { MPX25519 } from "./MPX25519.sol";

/**
 * @dev SafeMPX25519 facilitates multi-party X25519 for Safe signers.
 * Must be deployed through a safe.
 */
contract SafeMPX25519 is MPX25519 {
    /**
     * @dev Gets a Safe's current set of signers.
     * @return _signers
     */
    function _getSigners()
        internal
        view
        override
        returns (address[] memory _signers)
    {
        _signers = SafeOwnerManager(super.owner()).getOwners();
    }
}
