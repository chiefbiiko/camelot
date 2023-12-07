// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import { OwnerManager as SafeOwnerManager } from "safe-contracts/base/OwnerManager.sol";
import { MPX25519 } from "./MPX25519.sol";

contract SafeMock35 is SafeOwnerManager {
    address public camelot;

    constructor(address[] memory _owners) {
        require(_owners.length == 5);
        setupOwners(_owners, 3);
    }

    function deployMPX25519() public {
        camelot = address(new MPX25519());
    }
}
