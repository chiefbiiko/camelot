// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OwnerManager as SafeOwnerManager } from "safe-contracts/base/OwnerManager.sol";
import { SafeMPX25519 } from "./SafeMPX25519.sol";

contract SafeMock5 is SafeOwnerManager {
    address public safeMPX25519;

    constructor(address[] memory _owners) {
        require(_owners.length == 5);
        setupOwners(_owners, 3);
    }

    function deploySafeMPX25519() public {
        safeMPX25519 = address(new SafeMPX25519());
    }
}
