// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import { Ownable } from "openzeppelin-contracts/access/Ownable.sol";
import { OwnerManager as SafeOwnerManager } from "safe-contracts/base/OwnerManager.sol";
import "forge-std/console2.sol";//TMP

contract MPX25519 is Ownable {
    enum Step { End, Ok, Idle }

    address public immutable safe;
    address[] public signers;
    mapping(uint256 => bytes32[]) public queues; // slot=>shares
    mapping(uint256 => uint256) public processed; //slot=>ctr

    /**
     * Only allows the safe's current signer set.
     */
    modifier onlySafeSigners() {
        address[] memory _signers = SafeOwnerManager(safe).getOwners();
        bool _isSigner = false;
        for (uint256 _i = 0; _i < _signers.length; _i++) {
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
     * Returns a list of Safe signers.
     * @return _signers Array of Safe signers.
     */
    function getSigners() public view returns (address[] memory _signers) {
        return signers;
    }

    /**
     * Returns an internal queue. Exposed for debugging only.
     * @param _slot Signer slot
     * @return _signers Array of intermediate keys.
     */
    function getQueue(uint256 _slot) public view returns (bytes32[] memory) {
        return queues[_slot];
    }

    /**
     * Resets the signer set to the safe's current one.
     * Safes must call this method whenever their signer set has changed.
     */
    function reconstruct() external onlyOwner {
        for (uint256 _i = 0; _i < signers.length; _i++) {
            delete queues[_i];
        }
        signers = SafeOwnerManager(safe).getOwners();
    }

    /** 
     * Iterate all intermediate keys to process.
     * Step.End status 0 means there are no more steps for given signer.
     * @param _signer Signer address
     * @return _status ,_key
     */
    function prep(address _signer) external view returns (Step _status, bytes32 _key) {
        uint256 _sourceSlot = source(_signer);
        uint256 _targetSlot = target(_sourceSlot);
        require(_targetSlot != type(uint256).max, "no such slot");
        if (queues[_targetSlot].length == signers.length - 1) {
            return (Step.End, queues[_sourceSlot][processed[_sourceSlot] - 1]);
        } else if (queues[_targetSlot].length <= queues[_sourceSlot].length) {
            return (Step.Ok, queues[_sourceSlot][processed[_sourceSlot] - 1]);
        } else {
            return (Step.Idle, 0);
        }
    }

    /**
     * Submits a key share.
     * @param _key New key
     */
    function step(bytes32 _key) external onlySafeSigners {
        uint256 _sourceSlot = source(_msgSender());
        uint256 _processed = processed[_sourceSlot];
        for (uint256 _i = 0; _i < signers.length; _i++) {
            if (_i != _sourceSlot) {
                require(processed[_i] == _processed || processed[_i] - 1 == _processed, "previous round not yet complete");
            }
        }
        uint256 _targetSlot = target(_sourceSlot);
        require(_targetSlot != type(uint256).max, "no such slot");
        if (queues[_targetSlot].length < signers.length - 1) {
            queues[_targetSlot].push(_key);
        }
    }

    /** 
     * Signals that a signer has completed a step.
     */
    function done() external onlySafeSigners {
        processed[source(_msgSender())] += 1;
    }

    /**
     * Get the signer's abstract slot.
     * A type(uint256).max return value indicates that the msg.sender is not 
     * part of the stored signer set.
     * @param _signer Signer address
     * @return _slot Signer slot
     */
    function source(address _signer) public view returns (uint256 _slot) {
        for (uint256 _i = 0; _i < signers.length; _i++) {
            if (_signer == signers[_i]) {
                return _i;
            }
        }
        return type(uint256).max;
    }

    /**
     * Get the next signer's slot doing round-robin.
     * A type(uint256).max return value indicates that _sourceSlot is not 
     * among the stored signer set.
     * @param _sourceSlot Source slot
     * @return _slot Neighbor slot
     */
    function target(uint256 _sourceSlot) public view returns (uint256 _slot) {
        if (_sourceSlot == type(uint256).max || _sourceSlot >= signers.length) {
            return type(uint256).max;
        } else if (_sourceSlot == signers.length - 1) {
            return 0;
        } else {
            return _sourceSlot + 1;
        }
    }
}
