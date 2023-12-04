// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Test, console2 } from "forge-std/Test.sol";
import { SafeTestTools, SafeTestLib, SafeInstance } from "safe-tools/SafeTestTools.sol";
import { CreateCall } from "safe-contracts/libraries/CreateCall.sol";
import { Camelot } from "../src/Camelot.sol";

contract CamelotTest is Test, SafeTestTools {
    using SafeTestLib for SafeInstance;

    address constant SAFE = 0x584a697DC2b125117d232Fca046f6cDe5Edd0ba7;
    bytes32 constant SALT = 0xbff0e1d6be3df3bedf05c892f554fbea3c6ca2bb9d224bc3f3d3fbc3ec267d1c;
    // Camelot public counter;
    SafeInstance safe;
    CreateCall createCall;
    address camelot = makeAddr("camelot");

    function setUp() public {
        // camelot = new Camelot();
        // counter.setNumber(0);
        // 0x584a697DC2b125117d232Fca046f6cDe5Edd0ba7
        safe = _setupSafe();

        // vm.getCode("Camelot.sol");

        // address alice = address(0xA11c3);

        createCall = new CreateCall();
        // createCall.performCreate2(0, vm.getCode("Camelot.sol"), SALT);
        // /\ /\ /\ /\ /\ serialize this to bytes
        bytes memory _createCallData = abi.encodePacked(hex"4847be6f", uint256(0), vm.getCode("Camelot.sol"), SALT);



        // bytes memory _camelotCode = vm.getCode("Camelot.sol");

        safe.execTransaction({
            to: address(createCall) ,
            value: 0,
            data: _createCallData
        }); 

        // vm.etch(camelot, _camelotCode);

        // assertEq(alice.balance, 0.5 ether); // passes ✅
    }

    function test_noop() public {
        // counter.increment();
        // assertEq(counter.number(), 1);
        // uint256 _newNonce = safe.incrementNonce();
        // assertTrue(Camelot(camelot).safe() == address(safe.safe));
        // console2.log("%","hi hi hui hio hi hi");
        // console2.log("camelot safe",Camelot(camelot).safe());
        // assertTrue(Camelot(camelot).safe() == SAFE);
        assertTrue(camelot.code.length > 0);
        Camelot _camelot = Camelot(camelot);
        // assertTrue(_camelot.safe() == SAFE);
    }

    // function testFuzz_SetNumber(uint256 x) public {
    //     counter.setNumber(x);
    //     assertEq(counter.number(), x);
    // }
}
