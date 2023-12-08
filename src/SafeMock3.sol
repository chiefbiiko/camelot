// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { OwnerManager as SafeOwnerManager } from "safe-contracts/base/OwnerManager.sol";
import { MPX25519 } from "./MPX25519.sol";

contract SafeMock3 is SafeOwnerManager {
    address public mpx25519;

    constructor(address[] memory _owners) {
        require(_owners.length == 3);
        setupOwners(_owners, 2);
    }

    function deployMPX25519() public {
        mpx25519 = address(new MPX25519());
    }
}
