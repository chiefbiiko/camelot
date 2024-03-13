// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { OwnerManager } from "safe-contracts/base/OwnerManager.sol";
import { MPECDH } from "./MPECDH.sol";

/**
 * @dev SafeMPECDH facilitates multi-party ECDH for Safe signers.
 * Must be deployed through a safe.
 */
contract SafeMPECDH is MPECDH {
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
