// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PredictaToken.sol";
import "../src/PredictionMarketV2.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy token
        PredictaToken token = new PredictaToken();
        console.log("PredictaToken deployed at:", address(token));
        
        // Deploy market contract
        PredictionMarketV2 market = new PredictionMarketV2(address(token));
        console.log("PredictionMarketV2 deployed at:", address(market));
        
        // Fund the token contract for faucet
        uint256 faucetAmount = 10_000_000 * 10**18; // 10M tokens
        token.transfer(address(token), faucetAmount);
        console.log("Funded faucet with:", faucetAmount);
        
        vm.stopBroadcast();
    }
}
