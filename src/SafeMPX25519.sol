// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { OwnerManager as SafeOwnerManager } from "safe-contracts/base/OwnerManager.sol";
import { MPX25519 } from "./MPX25519.sol";

/// @dev SafeMPX25519 facilitates multi-party X25519 for Safe signers.
contract SafeMPX25519 is MPX25519 {
    /// @dev Safe.
    address public safe;

    /**
     * @dev Constructs an accessoir that enables deriving a shared secret 
     * among all signers of a safe. Must be deployed through a safe.
     */
    constructor() {
        safe = _msgSender();
    }

    /**
     * @dev Get a Safe's current set of signers.
     * @return _signers
     */
    function _getSigners() internal override view returns (address[] memory _signers) {
         _signers = SafeOwnerManager(safe).getOwners();
    }
}
