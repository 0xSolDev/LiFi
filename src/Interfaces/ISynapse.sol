// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ISynapse {
    function zapAndDepositAndSwap(
        address to,
        uint256 chainId,
        IERC20 token,
        uint256[] calldata liquidityAmounts,
        uint256 minToMint,
        uint256 liqDeadline,
        uint8 tokenIndexFrom,
        uint8 tokenIndexTo,
        uint256 minDy,
        uint256 swapDeadline
    ) external;

    function depositETHAndSwap(
        address to,
        uint256 chainId,
        uint256 amount,
        uint8 tokenIndexFrom,
        uint8 tokenIndexTo,
        uint256 minDy,
        uint256 deadline
    ) external payable;
}
