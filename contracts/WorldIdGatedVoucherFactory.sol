// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

//@dev - World ID related modules
import { ByteHasher } from './worldcoin/helpers/ByteHasher.sol';
import { IWorldID } from './worldcoin/interfaces/IWorldID.sol';

import { WorldIdGatedVoucher } from './WorldIdGatedVoucher.sol';


contract WorldIdGatedVoucherFactory {
    using ByteHasher for bytes;

    ///////////////////////////////////////////////////////////////////////////////
    ///                                  ERRORS                                ///
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Thrown when attempting to reuse a nullifier
    error InvalidNullifier();

    /// @dev The WorldID instance that will be used for verifying proofs
    //IWorldID internal immutable worldId;

    /// @dev The WorldID group ID (1)
    uint256 internal immutable groupId = 1;

    /// @dev Whether a nullifier hash has been used already. Used to prevent double-signaling
    mapping(uint256 => bool) internal nullifierHashes;

    /**
     * @notice Constructor
     */
    constructor() {
        //[TODO]: 
    }

    /**
     * @notice Create a new WorldIdGatedVoucher
     * @param worldId The WorldID instance that will verify the proofs
     */ 
    function createNewWorldIdGatedVoucher(IWorldID worldId) external returns (bool) {
        WorldIdGatedVoucher worldIdGatedVoucher = new WorldIdGatedVoucher(worldId);
    }
}
