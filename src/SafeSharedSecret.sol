// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Ownable } from "openzeppelin-contracts/access/Ownable.sol";
import { OwnerManager as SafeOwnerManager } from "safe-contracts/base/OwnerManager.sol";

contract SafeSharedSecret is Ownable {

    modifier onlySafeSigners (address _msgSender) {
        address[] memory _signers = SafeOwnerManager(_msgSender).getOwners();
        bool _isSigner = false;
        for (uint256 _i = 0; _i < _signers.length - 1; _i++) {
            if (_msgSender == _signers[_i]) {
                _isSigner = true;
                break;
            }
        }
        require(_isSigner,"only safe signers");
        _;
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
        //TODO
    }

    /**
     * Submits a key share.
     * @param _previous Number of predecessors
     * @param _share New key share
     */
    function submit(uint8 _previous, uint256 _share) external onlySafeSigners(msg.sender) {
        //TODO
    }

    /**
     * @return _shareAndPrevious (uint256 _share,uint8 _previous)
     */
    function next() external onlySafeSigners(msg.sender) returns (uint256, uint8) {
        //TODO
    }
}
