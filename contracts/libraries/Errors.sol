// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;


library Errors {

    /// @notice Thrown when trying to create or update FoodVoucherProgram details without being the manager
    error Unauthorized();

    /// @notice Thrown when attempting to reuse a nullifier
    error InvalidNullifier();

    /// @notice Thrown when attempting to claim a non-existant FoodVoucherProgram
    error InvalidFoodVoucherProgram();

}
