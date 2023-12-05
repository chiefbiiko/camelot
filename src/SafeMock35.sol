// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import { OwnerManager as SafeOwnerManager } from "safe-contracts/base/OwnerManager.sol";
import { Camelot } from "./Camelot.sol";

contract SafeMock35 is SafeOwnerManager {
    address public camelot;

    constructor(address[] memory _owners) {
        require(_owners.length == 5);
        setupOwners(_owners, 3);
    }

    function deployCamelot() public {
        camelot = address(new Camelot());
    }
}
