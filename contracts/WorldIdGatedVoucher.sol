// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { ByteHasher } from './worldcoin/helpers/ByteHasher.sol';
import { IWorldID } from './worldcoin/interfaces/IWorldID.sol';

//import { Semaphore } from "@worldcoin/world-id-contracts/src/Semaphore.sol";

import { FoodVoucherNFT } from "./FoodVoucherNFT.sol";

import { IWorldIdGatedVoucher } from "./interfaces/IWorldIdGatedVoucher.sol";

import { DataTypes } from './libraries/DataTypes.sol';
import { Events } from './libraries/Events.sol';
import { Errors } from './libraries/Errors.sol';


/**
 * @title - World ID gated Voucher contract
 */ 
contract WorldIdGatedVoucher is IWorldIdGatedVoucher {
    using ByteHasher for bytes;


    ///////////////////////////////////////////////////////////////////////////////
    ///                              CONFIG STORAGE                            ///
    //////////////////////////////////////////////////////////////////////////////

    /// @dev The WorldID instance that will be used for managing groups and verifying proofs
    IWorldID internal immutable worldId;

    /// @dev The WorldID group ID (1)
    //uint256 internal immutable groupId = 1;

    /// @dev Whether a nullifier hash has been used already. Used to prevent double-signaling
    mapping(uint256 => bool) internal nullifierHashes;

    uint256 internal nextFoodVoucherProgramId = 1;
    mapping(uint256 => DataTypes.FoodVoucherProgram) public getFoodVoucherPrograms;


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
    /// @param token The FoodVoucherNFT that will be FoodVoucherProgram to eligible participants
    /// @param holder The address holding the tokens that will be FoodVoucherProgram
    /// @param tokenId The token ID of FoodVoucherNFT that each participant will receive upon claiming
    function createFoodVoucherProgram(
        uint256 groupId,
        FoodVoucherNFT token,
        address holder,
        uint256 tokenId
        //uint256 amount
    ) public override {
        DataTypes.FoodVoucherProgram memory foodVoucherProgram = DataTypes.FoodVoucherProgram({
            groupId: groupId,
            token: token,
            manager: msg.sender,
            holder: holder,
            tokenId: tokenId
            //amount: amount
        });

        getFoodVoucherPrograms[nextFoodVoucherProgramId] = foodVoucherProgram;
        emit Events.FoodVoucherProgramCreated(nextFoodVoucherProgramId, foodVoucherProgram);

        ++nextFoodVoucherProgramId;  // This ID's counting is started from 1
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
    ) public override {
        //@dev - first, we make sure this person hasn't done this before
        if (nullifierHashes[nullifierHash]) revert InvalidNullifier();
        //if (nullifierHashes[nullifierHash]) revert Errors.InvalidNullifier();

        DataTypes.FoodVoucherProgram memory foodVoucherProgram = getFoodVoucherPrograms[foodVoucherProgramId];
        if (foodVoucherProgramId == 0 || foodVoucherProgramId >= nextFoodVoucherProgramId) revert Errors.InvalidFoodVoucherProgram();
        //if (foodVoucherProgramId == 0 || foodVoucherProgramId >= nextFoodVoucherProgramId) revert InvalidFoodVoucherProgram();

        //@dev - then, we verify they're registered with WorldID, and the input they've provided is correct
        worldId.verifyProof(
            root,
            foodVoucherProgram.groupId,
            abi.encodePacked(receiver).hashToField(),
            nullifierHash,
            abi.encodePacked(address(this)).hashToField(),  // [Test]: Success
            //abi.encodePacked(address(this), foodVoucherProgramId).hashToField(), // Fail (Reverted with "InvalidProof")
            proof
        );

        // finally, we record they've done this, so they can't do it again (proof of uniqueness)
        nullifierHashes[nullifierHash] = true;
        emit Events.FoodVoucherProgramClaimed(foodVoucherProgramId, receiver);

        //[TODO]: your logic here, make sure to emit some kind of event afterwards!
        uint256 tokenId = 0; //[TODO]: Replace
        FoodVoucherNFT foodVoucherNFT = foodVoucherProgram.token;
        foodVoucherNFT.transferFrom(foodVoucherProgram.holder, receiver, tokenId);
        //SafeTransferLib.safeTransferFrom(airdrop.token, airdrop.holder, receiver, airdrop.amount);
    }


    //////////////////////////////////////////////////////////////////////////////
    ///                               CONFIG LOGIC                             ///
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Update the details for a given foodVoucherProgram, for addresses that haven't claimed already. Can only be called by the foodVoucherProgram creator
    /// @param foodVoucherProgramId The id of the foodVoucherProgram to update
    /// @param foodVoucherProgram The new details for the foodVoucherProgram
    function updateDetails(uint256 foodVoucherProgramId, DataTypes.FoodVoucherProgram calldata foodVoucherProgram) public override {
        if (getFoodVoucherPrograms[foodVoucherProgramId].manager != msg.sender) revert Unauthorized();
        //if (getFoodVoucherPrograms[foodVoucherProgramId].manager != msg.sender) revert Errors.Unauthorized();

        getFoodVoucherPrograms[foodVoucherProgramId] = foodVoucherProgram;

        emit Events.FoodVoucherProgramUpdated(foodVoucherProgramId, foodVoucherProgram);
    }

}
