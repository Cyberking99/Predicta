// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import {Predicta} from "../src/Predicta.sol";

contract CreateEvents is Script {
    Predicta market = Predicta(0x89F95b6084E0c6002d83acf994a9b3e913B1e1AA);

    // Example allowed tokens
    address usdc = 0x01C5C0122039549AD1493B8220cABEdD739BC44E;
    address cusd = 0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b;
    
    function run() external {
        vm.startBroadcast();
        
        // 1 — Bitcoin > 100k
        market.createEvent(
            "Will Bitcoin close above $100,000 on December 1, 2025?",
            "This event resolves based on BTC/USD closing price on December 1, 2025 (UTC).",
            _toArray("Yes", "No"),
            "public",
            4,
            "",
            1764547200,     // Dec 1, 2025
            usdc
        );
        
        // 2 — Man City vs Tottenham
        market.createEvent(
            "Who will win the Premier League match: Man City vs Tottenham (Dec 1, 2025)?",
            "Match result for the EPL game between Manchester City and Tottenham.",
            _toArray("Manchester City", "Tottenham", "Draw"),
            "public",
            2,
            "",
            1764536400,     
            cusd
        );

        // 3 — Taylor Swift new single
        market.createEvent(
            "Will Taylor Swift release a new single before December 10, 2025?",
            "Resolution based on an official release on Spotify, Apple Music, or YouTube.",
            _toArray("Yes", "No"),
            "public",
            3,
            "",
            1765324800,
            cusd
        );

        // 4 — US budget bill
        market.createEvent(
            "Will the U.S. government pass the 2025 federal budget before Dec 15, 2025?",
            "Resolves when the budget bill is officially signed into law.",
            _toArray("Yes", "No"),
            "public",
            1,
            "",
            1765718400,
            cusd
        );

        // 5 — SpaceX Starship test
        market.createEvent(
            "Will SpaceX conduct a successful Starship orbital flight test before Dec 20, 2025?",
            "A 'successful' test means reaching orbit and completing the planned mission profile.",
            _toArray("Yes", "No"),
            "public",
            0,
            "",
            1766100000,
            usdc
        );

        vm.stopBroadcast();
    }

    // ------------------------------
    // Array Helpers
    // ------------------------------

    function _toArray(string memory a, string memory b)
        internal
        pure
        returns (string[] memory arr)
    {
        arr = new string[](2);
        arr[0] = a;
        arr[1] = b;
    }

    function _toArray(string memory a, string memory b, string memory c)
        internal
        pure
        returns (string[] memory arr)
    {
        arr = new string[](3);
        arr[0] = a;
        arr[1] = b;
        arr[2] = c;
    }
}
