// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { ByteHasher } from './worldcoin/helpers/ByteHasher.sol';
import { IWorldID } from './worldcoin/interfaces/IWorldID.sol';

//import { Semaphore } from "@worldcoin/world-id-contracts/src/Semaphore.sol";

import { FoodVoucherNFT } from "./FoodVoucherNFT.sol";


/**
 * @title - World ID gated Voucher contract
 */ 
contract WorldIdGatedVoucher {
    using ByteHasher for bytes;

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
    event FoodVoucherProgramCreated(uint256 foodVoucherProgramId, FoodVoucherProgram foodVoucherProgram);

    /// @notice Emitted when an foodVoucherProgram is successfully claimed
    /// @param receiver The address that received the foodVoucherProgram
    event FoodVoucherProgramClaimed(uint256 indexed foodVoucherProgramId, address receiver);

    /// @notice Emitted when the foodVoucherProgramped amount is changed
    /// @param foodVoucherProgramId The id of the foodVoucherProgram getting updated
    /// @param foodVoucherProgram The new details for the foodVoucherProgram
    event FoodVoucherProgramUpdated(uint256 indexed foodVoucherProgramId, FoodVoucherProgram foodVoucherProgram);


    ///////////////////////////////////////////////////////////////////////////////
    ///                                 STRUCTS                                ///
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Stores the details for a specific foodVoucherProgram
    /// @param groupId The ID of the Semaphore group that will be eligible to claim this foodVoucherProgram
    /// @param token The ERC20 token that will be foodVoucherProgramped to eligible participants
    /// @param manager The address that manages this foodVoucherProgram, which is allowed to update the foodVoucherProgram details.
    /// @param holder The address holding the tokens that will be foodVoucherProgramped
    /// @param amount The amount of tokens that each participant will receive upon claiming
    struct FoodVoucherProgram {
        uint256 groupId;
        FoodVoucherNFT token;
        address manager;
        address holder;
        uint256 amount;
    }


    ///////////////////////////////////////////////////////////////////////////////
    ///                              CONFIG STORAGE                            ///
    //////////////////////////////////////////////////////////////////////////////

    /// @dev The WorldID instance that will be used for managing groups and verifying proofs
    IWorldID internal immutable worldId;

    /// @dev Whether a nullifier hash has been used already. Used to prevent double-signaling
    mapping(uint256 => bool) internal nullifierHashes;

    uint256 internal nextFoodVoucherProgramId = 1;
    mapping(uint256 => FoodVoucherProgram) public getFoodVoucherProgram;


    ///////////////////////////////////////////////////////////////////////////////
    ///                               CONSTRUCTOR                              ///
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Deploys a WorldIDFoodVoucherProgram instance
    /// @param _worldId The WorldID instance that will manage groups and verify proofs
    constructor(IWorldID _worldId) {
        worldId = _worldId;
    }


    ///////////////////////////////////////////////////////////////////////////////
    ///                    CREATE FOOD VOUTUER PROGRAM LOGIC                    ///
    ///////////////////////////////////////////////////////////////////////////////

    /// @notice Create a new FoodVoucherProgram
    /// @param groupId The ID of the Semaphore group that will be eligible to claim this FoodVoucherProgram
    /// @param token The ERC20 token that will be FoodVoucherProgram to eligible participants
    /// @param holder The address holding the tokens that will be foodVoucherProgramped
    /// @param amount The amount of tokens that each participant will receive upon claiming
    function createFoodVoucherProgram(
        uint256 groupId,
        FoodVoucherNFT token,
        address holder,
        uint256 amount
    ) public {
        FoodVoucherProgram memory foodVoucherProgram = FoodVoucherProgram({
            groupId: groupId,
            token: token,
            manager: msg.sender,
            holder: holder,
            amount: amount
        });

        getFoodVoucherProgram[nextFoodVoucherProgramId] = foodVoucherProgram;
        emit FoodVoucherProgramCreated(nextFoodVoucherProgramId, foodVoucherProgram);

        ++nextFoodVoucherProgramId;
    }


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
    ) public {
        // first, we make sure this person hasn't done this before
        if (nullifierHashes[nullifierHash]) revert InvalidNullifier();

        FoodVoucherProgram memory foodVoucherProgram = getFoodVoucherProgram[foodVoucherProgramId];
        if (foodVoucherProgramId == 0 || foodVoucherProgramId >= nextFoodVoucherProgramId) revert InvalidFoodVoucherProgram();

        // then, we verify they're registered with WorldID, and the input they've provided is correct
        worldId.verifyProof(
            root,
            foodVoucherProgram.groupId,
            abi.encodePacked(receiver).hashToField(),
            nullifierHash,
            abi.encodePacked(address(this), foodVoucherProgramId).hashToField(),
            proof
        );

        // finally, we record they've done this, so they can't do it again (proof of uniqueness)
        nullifierHashes[nullifierHash] = true;
        emit FoodVoucherProgramClaimed(foodVoucherProgramId, receiver);

        //[TODO]: your logic here, make sure to emit some kind of event afterwards!
        //SafeTransferLib.safeTransferFrom(airdrop.token, airdrop.holder, receiver, airdrop.amount);
    }


    //////////////////////////////////////////////////////////////////////////////
    ///                               CONFIG LOGIC                             ///
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Update the details for a given foodVoucherProgram, for addresses that haven't claimed already. Can only be called by the foodVoucherProgram creator
    /// @param foodVoucherProgramId The id of the foodVoucherProgram to update
    /// @param foodVoucherProgram The new details for the foodVoucherProgram
    function updateDetails(uint256 foodVoucherProgramId, FoodVoucherProgram calldata foodVoucherProgram) public {
        if (getFoodVoucherProgram[foodVoucherProgramId].manager != msg.sender) revert Unauthorized();

        getFoodVoucherProgram[foodVoucherProgramId] = foodVoucherProgram;

        emit FoodVoucherProgramUpdated(foodVoucherProgramId, foodVoucherProgram);
    }

}
