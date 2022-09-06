// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { ByteHasher } from './worldcoin/helpers/ByteHasher.sol';
import { IWorldID } from './worldcoin/interfaces/IWorldID.sol';

contract WorldIdGatedTicketFactory {
    using ByteHasher for bytes;

    ///////////////////////////////////////////////////////////////////////////////
    ///                                  ERRORS                                ///
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Thrown when attempting to reuse a nullifier
    error InvalidNullifier();

    /// @dev The WorldID instance that will be used for verifying proofs
    IWorldID internal immutable worldId;

    /// @dev The WorldID group ID (1)
    uint256 internal immutable groupId = 1;

    /// @dev Whether a nullifier hash has been used already. Used to prevent double-signaling
    mapping(uint256 => bool) internal nullifierHashes;

    /// @param _worldId The WorldID instance that will verify the proofs
    constructor(IWorldID _worldId) {
        worldId = _worldId;
    }

}
