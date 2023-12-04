// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import { Ownable } from "openzeppelin-contracts/access/Ownable.sol";
import { OwnerManager as SafeOwnerManager } from "safe-contracts/base/OwnerManager.sol";

contract SafeSharedSecret is Ownable {
    enum Round { End, Ok, Idle }

    address public immutable safe;
    address[] public signers;
    mapping(uint256 => uint256[]) public queues; // slot=>shares

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
        uint256 _targetSlot = targetSlot(sourceSlot(_msgSender()));
        require(_targetSlot != type(uint256).max, "no such slot");
        if (queues[_targetSlot].length == _predecessors){
            queues[_targetSlot].push(_share);
        }
    }

    /** 
     * Iterate all intermediate key shares to sign.
     * Round.End status 2 means there are no more prefinal rounds for given
     * signer.
     * @return  _status ,_share,_predecessors
     */
    function next() external view onlySafeSigners returns (Round _status, uint256 _share, uint256 _predecessors) {
        uint256 _sourceSlot = sourceSlot(_msgSender());
        uint256 _targetSlot = targetSlot(_sourceSlot);
        require(_targetSlot != type(uint256).max, "no such slot");
        if (queues[_targetSlot].length == queues[_sourceSlot].length) {
            uint256[] storage _source = queues[_sourceSlot];
            return (Round.Ok, _source[_source.length - 1], _source.length);
        } else if (queues[_targetSlot].length == signers.length - 1) {
            return (Round.End, 0, 0);
        } else {
            return (Round.Idle, 0, 0);
        }
    }

    /**
     * Gets the seminfinal key share of a signer ready for the 
     * last modular exponentiation.
     * @param _signer Signer address
     * @return _share Semifinal share
     */
    function semifinal(address _signer) public view returns (uint256 _share) {
        uint256 _sourceSlot = sourceSlot(_signer);
        uint256[] storage _source = queues[_sourceSlot];
        require(_source.length == signers.length - 1, "semifinal share not yet available");
        return _source[_source.length - 1];
    }

    /**
     * Get the signer's abstract slot.
     * A type(uint256).max return value indicates that the msg.sender is not 
     * part of the stored signer set.
     * @param _signer Signer address
     * @return _slot Signer slot
     */
    function sourceSlot(address _signer) public view returns (uint256 _slot) {
        for (uint256 _i = 0; _i < signers.length - 1; _i++) {
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
     * @return _slot Neighbor slot
     */
    function targetSlot(uint256 _sourceSlot) public view returns (uint256 _slot) {
        if (_sourceSlot == type(uint256).max || _sourceSlot >= signers.length) {
            return type(uint256).max;
        } else if (_sourceSlot == signers.length - 1) {
            return 0;
        } else {
            return _sourceSlot + 1;
        }
    }
}
