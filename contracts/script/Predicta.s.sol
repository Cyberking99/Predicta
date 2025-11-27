// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Predicta} from "../src/Predicta.sol";

contract PredictaScript is Script {
    Predicta public predicta;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        predicta = new Predicta(100);

        console.log("Predicta deployed at: ", address(predicta));
        
        predicta.addCategory("Politics", "Events on politics");
        predicta.addCategory("Sports", "Events on sports");
        predicta.addCategory("Entertainments", "Events on entertainments");
        predicta.addCategory("Crypto", "Events on crypto");
        predicta.addToken(0x01C5C0122039549AD1493B8220cABEdD739BC44E);
        
        vm.stopBroadcast();
    }
}
