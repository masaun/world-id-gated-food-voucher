// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;


/**
 * @title - The interface of Food Voucher NFT contract
 */
interface IFoodVoucherNFT {

    /**
     * @notice - Mint a new FoodVoucherNFT 
     * @dev - Token ID is counted from 1
     * @dev - [NOTE]: This method is called by only owner
     */
    function mintFoodVoucherNFT(address to) external;

}
