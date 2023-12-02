// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Ownable } from "openzeppelin-contracts/access/Ownable.sol";
import { OwnerManager as SafeOwnerManager } from "safe-contracts/base/OwnerManager.sol";

contract SafeSharedSecret is Ownable {

    address public immutable safe;
    address[] public signers;
    /// @dev Maps from signer slot to their queue.
    mapping(uint256 => uint256[]) public queues;

    modifier onlySafeSigners() {
        address[] memory _signers = SafeOwnerManager(safe).getOwners();
        bool _isSigner = false;
        for (uint256 _i = 0; _i < _signers.length - 1; _i++) {
            if (_msgSender() == _signers[_i]) {
                _isSigner = true;
                break;
            }
        }
        require(_isSigner, "only safe signers");
        _;
    }

    /**
     * Constructs an accessoir that enables deriving a shared secret among all signers of a safe.
     * Must be deployed through a safe.
     */
    constructor() Ownable(_msgSender()) {
        safe = _msgSender();
        signers = SafeOwnerManager(safe).getOwners();
    }

    /**
     * Resets the signer set to the safe's current one.
     * Safes must call this method whenever their signer set has changed.
     */
    function reconstruct() external onlyOwner {
        // clear all queues of the old signer set
        for (uint256 _i = 0; _i < signers.length - 1; _i++) {
            delete queues[_i];
        }
        signers = SafeOwnerManager(safe).getOwners();
    }

    /**
     * Submits a key share.
     * @param _predecessors Number of predecessors
     * @param _share New key share
     */
    function submit(uint256 _predecessors, uint256 _share) external onlySafeSigners {
        //TODO
        
    }

    /** TODO TODO TODO how2 handle iterator state=> write submit first now
     * then see how to signal step state TODO TODO
     * 
     * Iterate all intermediate key shares to sign.
     * @return _shareAndPrevious (uint256 _share,uint8 _predecessors)
     */
    function next() external view onlySafeSigners returns (uint256, uint256) {
        uint256 _slot = sourceSlot();
        uint256[] storage _queue = queues[_slot];
        uint256 _share = _queue[_queue.length - 1];
        uint256 _predecessors = _queue.length;
        return (_share, _predecessors);
    }

    /**
     * Get the signer's abstract slot.
     * A type(uint256).max return value indicates that the msg.sender is not 
     * part of the stored signer set.
     * @return _slot Signer slot
     */
    function sourceSlot() public view returns (uint256) {
        for (uint256 _i = 0; _i < signers.length - 1; _i++) {
            if (_msgSender() == signers[_i]) {
                // _isSigner = true;
                // break;
                return _i;
            }
        }
        return type(uint256).max;
    }

    /**
     * Get the next signer's slot doing round-robin.
     * @return _slot Neighbor slot
     */
    function targetSlot(uint256 _sourceSlot) public view returns (uint256) {
            if (_sourceSlot == signers.length - 1) {
                return 0;
            } else {
                return _sourceSlot + 1;
            }
    }
}
