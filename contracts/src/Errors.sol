// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library ErrorsLib {
    error ZeroAddressNotAllowed();
    error Unauthorized(address caller);
    error AlreadyInitialized();
    error InvalidAmount(uint256 amount);
    error InsufficientBalance(uint256 available, uint256 required);
    error TransferFailed(address from, address to, uint256 amount);
    error NotOwner(address caller);
    error NotAuthorizedUpgrade(address caller);
    error InvalidInput(string reason);
    error FeeExceed();
    error InvalidCategory();
    error TokenNotAllowed();
    error CreatorStakeNotSet();
    error InvalidToken();
    error TokenNotFound();
}