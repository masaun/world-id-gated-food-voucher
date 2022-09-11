// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { FoodVoucherNFT } from "../FoodVoucherNFT.sol";


/**
 * @title DataTypes
 */
library DataTypes {

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
        uint256 tokenId;  //@dev - Token ID of FoodVoucherNFT
        //uint256 amount;
    }

    /**
     * @notice - Enum of something type
     */ 
    enum SomethingType {
        SOMETHING_TYPE_1,
        SOMETHING_TYPE_2,
        SOMETHING_TYPE_3
    }

}
