// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { OwnerManager } from "safe-contracts/base/OwnerManager.sol";
import { MPECDH } from "./MPECDH.sol";

/// @dev SafeMPECDH facilitates multi-party ECDH for Safe signers.
contract SafeMPECDH is MPECDH {
    /**
     * @dev MPECDH ctor.
     * @param _master Safe address
     */
    constructor(address _master) MPECDH(_master) {}

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
