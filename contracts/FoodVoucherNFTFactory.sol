// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { FoodVoucherNFT } from './FoodVoucherNFT.sol';


contract FoodVoucherNFTFactory {

    constructor() {
        //[TODO]: 
    }

    function createNewFoodVoucherNFT() external returns (bool) {
        FoodVoucherNFT foodVoucherNFT = new FoodVoucherNFT();
    }

}
