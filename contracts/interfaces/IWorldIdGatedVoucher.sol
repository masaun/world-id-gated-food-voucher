// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { FoodVoucherNFT } from "../FoodVoucherNFT.sol";

import { DataTypes } from '../libraries/DataTypes.sol';


/**
 * @title - The interface of WorldID-Gated Voucher contract
 */
interface IWorldIdGatedVoucher {

    ///////////////////////////////////////////////////////////////////////////////
    ///                                  ERRORS                                ///
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Thrown when trying to create or update FoodVoucherProgram details without being the manager
    error Unauthorized();

    /// @notice Thrown when attempting to reuse a nullifier
    error InvalidNullifier();

    /// @notice Thrown when attempting to claim a non-existant FoodVoucherProgram
    error InvalidFoodVoucherProgram();


    ///////////////////////////////////////////////////////////////////////////////
    ///                                  EVENTS                                ///
    //////////////////////////////////////////////////////////////////////////////

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


    ///////////////////////////////////////////////////////////////////////////////
    ///                                 STRUCTS                                ///
    //////////////////////////////////////////////////////////////////////////////

    // /// @notice Stores the details for a specific foodVoucherProgram
    // /// @param groupId The ID of the Semaphore group that will be eligible to claim this foodVoucherProgram
    // /// @param token The ERC20 token that will be foodVoucherProgramped to eligible participants
    // /// @param manager The address that manages this foodVoucherProgram, which is allowed to update the foodVoucherProgram details.
    // /// @param holder The address holding the tokens that will be foodVoucherProgramped
    // /// @param amount The amount of tokens that each participant will receive upon claiming
    // struct FoodVoucherProgram {
    //     uint256 groupId;
    //     FoodVoucherNFT token;
    //     address manager;
    //     address holder;
    //     uint256 tokenId;  //@dev - Token ID of FoodVoucherNFT
    //     //uint256 amount;
    // }


    ///////////////////////////////////////////////////////////////////////////////
    ///                    CREATE FOOD VOUTUER PROGRAM LOGIC                    ///
    ///////////////////////////////////////////////////////////////////////////////

    /// @notice Create a new FoodVoucherProgram
    /// @param groupId The ID of the Semaphore group that will be eligible to claim this FoodVoucherProgram
    /// @param token The FoodVoucherNFT that will be FoodVoucherProgram to eligible participants
    /// @param holder The address holding the tokens that will be FoodVoucherProgram
    /// @param tokenId The token ID of FoodVoucherNFT that each participant will receive upon claiming
    function createFoodVoucherProgram(
        uint256 groupId,
        FoodVoucherNFT token,
        address holder,
        uint256 tokenId
        //uint256 amount
    ) external;


    ///////////////////////////////////////////////////////////////////////////////
    ///                               CLAIM LOGIC                               ///
    ///////////////////////////////////////////////////////////////////////////////

    /// @notice - Verify and execute task
    /// @param receiver The wallet address of Voucher receiver
    /// @param root The of the Merkle tree, returned by the SDK.
    /// @param nullifierHash The nullifier for this proof, preventing double signaling, returned by the SDK.
    /// @param proof The zero knowledge proof that demostrates the claimer is registered with World ID, returned by the SDK.
    /// @dev Feel free to rename this method however you want! We've used `claim`, `verify` or `execute` in the past.
    function claimFoodVoucher(
        uint256 foodVoucherProgramId,
        address receiver,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external;


    //////////////////////////////////////////////////////////////////////////////
    ///                               CONFIG LOGIC                             ///
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Update the details for a given foodVoucherProgram, for addresses that haven't claimed already. Can only be called by the foodVoucherProgram creator
    /// @param foodVoucherProgramId The id of the foodVoucherProgram to update
    /// @param foodVoucherProgram The new details for the foodVoucherProgram
    function updateDetails(uint256 foodVoucherProgramId, DataTypes.FoodVoucherProgram calldata foodVoucherProgram) external;

}
