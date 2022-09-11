// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { DataTypes } from './DataTypes.sol';


library Events {

    /// @notice Emitted when an FoodVoucherProgram is created
    /// @param foodVoucherProgramId The id of the foodVoucherProgram
    /// @param foodVoucherProgram The foodVoucherProgram details
    event FoodVoucherProgramCreated(uint256 foodVoucherProgramId, DataTypes.FoodVoucherProgram foodVoucherProgram);

    /// @notice Emitted when an foodVoucherProgram is successfully claimed
    /// @param receiver The address that received the foodVoucherProgram
    event FoodVoucherProgramClaimed(uint256 indexed foodVoucherProgramId, address receiver);

    /// @notice Emitted when the foodVoucherProgramped amount is changed
    /// @param foodVoucherProgramId The id of the foodVoucherProgram getting updated
    /// @param foodVoucherProgram The new details for the foodVoucherProgram
    event FoodVoucherProgramUpdated(uint256 indexed foodVoucherProgramId, DataTypes.FoodVoucherProgram foodVoucherProgram);

}
