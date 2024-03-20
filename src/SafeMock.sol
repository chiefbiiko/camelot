// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { OwnerManager as SafeOwnerManager } from "safe-contracts/base/OwnerManager.sol";
import { SafeMPECDH } from "./SafeMPECDH.sol";

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

    function performCreate2(
        uint256 value,
        bytes memory deploymentData,
        bytes32 salt
    ) public returns (address newContract) {
        /* solhint-disable no-inline-assembly */
        /// @solidity memory-safe-assembly
        assembly {
            newContract := create2(
                value,
                add(0x20, deploymentData),
                mload(deploymentData),
                salt
            )
        }
        /* solhint-enable no-inline-assembly */
        require(newContract != address(0), "Could not deploy contract");
        // emit ContractCreation(newContract);
    }
}
