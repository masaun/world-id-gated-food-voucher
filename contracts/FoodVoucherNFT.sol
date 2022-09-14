// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

//import { ERC721 } from '@rari-capital/solmate/src/tokens/ERC721.sol';
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";

import { IFoodVoucherNFT } from "./interfaces/IFoodVoucherNFT.sol";


/**
 * @title - The Food Voucher NFT contract (ERC721)
 */
contract FoodVoucherNFT is IFoodVoucherNFT, ERC721, AccessControl {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter; // Token ID is counted from 1

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    constructor(address issuer) ERC721("Food Voucher NFT", "FOOD_VOUCHER_NFT") {
        _setupRole(ISSUER_ROLE, issuer);
    }

    /**
     * @notice - Mint a new FoodVoucherNFT 
     * @dev - Token ID is counted from 1
     */
    function mintFoodVoucherNFT(address to) external override onlyRole(ISSUER_ROLE) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
    }

    /**
     * @notice - Supports interface for overriding both ERC721 and AccessControl
     */ 
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

}
