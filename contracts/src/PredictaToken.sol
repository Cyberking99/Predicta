// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PredictaToken
 * @notice ERC20 token for prediction market betting with claim functionality
 */
contract PredictaToken is ERC20, Ownable, Pausable {
    
    uint256 public constant CLAIM_AMOUNT = 1000 * 10**18; // 1000 tokens
    uint256 public constant MAX_CLAIMS = 10000; // Maximum number of claims
    
    uint256 public totalClaims;
    mapping(address => bool) public hasClaimed;
    
    event TokensClaimed(address indexed user, uint256 amount);
    
    constructor() ERC20("Predicta", "PDT") Ownable(msg.sender) {
        // Mint initial supply to owner
        _mint(msg.sender, 100_000_000 * 10**18); // 100M tokens
    }
    
    function claim() external whenNotPaused {
        require(!hasClaimed[msg.sender], "Already claimed");
        require(totalClaims < MAX_CLAIMS, "Max claims reached");
        require(balanceOf(address(this)) >= CLAIM_AMOUNT, "Insufficient contract balance");
        
        hasClaimed[msg.sender] = true;
        totalClaims++;
        
        _transfer(address(this), msg.sender, CLAIM_AMOUNT);
        
        emit TokensClaimed(msg.sender, CLAIM_AMOUNT);
    }
    
    function fundFaucet(uint256 amount) external onlyOwner {
        _transfer(msg.sender, address(this), amount);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
