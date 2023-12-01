// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract SafeSharedSecret {
    address public safe;

    modifier onlySafe {
        require(msg.sender == safe);
        _;
    }

    constructor(address _safe, address[] memory _signers) {
        safe = _safe;
        
    }

    function reconstruct(address _safe, address[] calldata _signers) external onlySafe {
        
    }

    // uint256 public number;

    // function setNumber(uint256 newNumber) public {
    //     number = newNumber;
    // }

    // function increment() public {
    //     number++;
    // }
}
