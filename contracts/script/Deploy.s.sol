// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PredictaToken.sol";
import "../src/PredictionMarketV2.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        address token = 0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b;

        // Deploy market contract
        PredictionMarketV2 market = new PredictionMarketV2(token);
        console.log("PredictionMarketV2 deployed at:", address(market));

        vm.stopBroadcast();
    }
}
