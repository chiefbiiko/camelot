// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { OwnerManager as SafeOwnerManager } from "safe-contracts/base/OwnerManager.sol";
import { SafeMPECDH } from "../SafeMPECDH.sol";

contract SafeMock is SafeOwnerManager {
    address public safeMPECDH;

    constructor(address[] memory _owners, uint256 _treshold) {
        setupOwners(_owners, _treshold);
    }

    function deployMPECDH() public {
        safeMPECDH = address(new SafeMPECDH(address(this)));
    }

    function reconstructMPECDH() public {
        SafeMPECDH(safeMPECDH).reconstruct();
    }
}
