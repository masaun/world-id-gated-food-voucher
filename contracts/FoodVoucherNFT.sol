// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

//import { ERC721 } from '@rari-capital/solmate/src/tokens/ERC721.sol';
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract FoodVoucherNFT is ERC721, Ownable {

    constructor() ERC721("Food Voucher NFT", "FOOD_VOUCHER_NFT") {
        //[TODO]: 
    }

    function mintFoodVoucherNFT(address to, uint256 tokenId) external onlyOwner {
        _safeMint(to, tokenId);
    }

}
