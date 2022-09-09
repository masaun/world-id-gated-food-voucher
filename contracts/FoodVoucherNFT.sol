// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

//import { ERC721 } from '@rari-capital/solmate/src/tokens/ERC721.sol';
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";


contract FoodVoucherNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter; // Token ID is counted from 0

    constructor() ERC721("Food Voucher NFT", "FOOD_VOUCHER_NFT") {
        //[TODO]: 
    }

    /**
     * @notice - Mint a new FoodVoucherNFT 
     * @dev - Token ID is counted from 0
     */
    function mintFoodVoucherNFT(address to) external onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);

        _tokenIdCounter.increment();
    }

}
