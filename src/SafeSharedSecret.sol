// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Ownable } from "openzeppelin-contracts/access/Ownable.sol";

contract SafeSharedSecret is Ownable {
    //TODO read signers form safe
    modifier onlySigners (msgSender) {

        bool isSigner = msgSender included in signers.

        require(isSigner,"onlySafeSigners");
        _
    }

    /**
     * Constructs an accessoir that enables deriving a shared secret among all signers of a safe.
     * Must be deployed through a safe.
     * @param _signers Safe signers
     */
    //TODO read signers form safe
    constructor( address[] memory _signers) Ownable(msg.sender) {
        // safe = _safe;

    }

    /**
     * Clears existing storage entries and initializes a new set of signers.
     * @param _signers Updated set of safe signers
     */
    function reconstruct(address[] calldata _signers) external onlyOwner {
        
    }

    function submit(uint8 previous, uint256 _share) external {}

    function next() external {}
}
