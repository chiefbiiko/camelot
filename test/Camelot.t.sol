// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Test, console2 } from "forge-std/Test.sol";
import { SafeTestTools, SafeTestLib } from "safe-tools/SafeTestTools.sol";
// import { Camelot } from "../src/Camelot.sol";

contract CamelotTest is Test, SafeTestTools {
    using SafeTestLib for SafeInstance;

    Camelot public counter;

    function setUp() public {
        // camelot = new Camelot();
        // counter.setNumber(0);
        // 0x584a697DC2b125117d232Fca046f6cDe5Edd0ba7
        SafeInstance memory safe = _setupSafe();

        // vm.getCode("Camelot.sol");

        // address alice = address(0xA11c3);

        safe.execTransaction({
            to: address(0),
            value: 0,//0.5 ether,
            data: vm.getCode("Camelot.sol")
        }); // send .5 eth to alice

        // assertEq(alice.balance, 0.5 ether); // passes ✅
    }

    function test_noop() public {
        // counter.increment();
        // assertEq(counter.number(), 1);
        uint256 _newNonce = safe.incrementNonce();
    }

    // function testFuzz_SetNumber(uint256 x) public {
    //     counter.setNumber(x);
    //     assertEq(counter.number(), x);
    // }
}
