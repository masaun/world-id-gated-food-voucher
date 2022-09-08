import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import {
    getProof,
    getRoot,
    prepareWorldID,
    registerIdentity,
    registerInvalidIdentity,
    setUpWorldID,
} from './worldcoin/helpers/InteractsWithWorldID'

import { WorldIdGatedVoucher, Semaphore, IncrementalBinaryTree, Hashes } from "../typechain"


/**
 * @notice - The unit test of the WorldIdGatedVoucher
 */ 
describe('WorldIdGatedVoucher', function () {
    //@dev - Variables of smart contract instances
    let worldIdGatedVoucher: WorldIdGatedVoucher
    let semaphore: Semaphore

    //@dev - Variables of smart contract addresses
    let WORLD_ID_GATED_VOUCHER: string
    let SEMAPHORE: string
     
    //@dev - Variables of wallet address
    let callerAddr: string

    this.beforeAll(async () => {
        await prepareWorldID()
    })

    beforeEach(async () => {
        const [signer] = await ethers.getSigners()
        const worldIDAddress = await setUpWorldID()

        //@dev - Deploy the WorldIdGatedVoucher.sol
        const WorldIdGatedVoucher = await ethers.getContractFactory('WorldIdGatedVoucher')
        worldIdGatedVoucher = await WorldIdGatedVoucher.deploy(worldIDAddress)
        WORLD_ID_GATED_VOUCHER = worldIdGatedVoucher.address
        console.log(`Deployed-address of the WorldIdGatedVoucher.sol: ${ WORLD_ID_GATED_VOUCHER }`)
        await worldIdGatedVoucher.deployed()

        //@dev - Deploy the library of the Hashes.sol#PoseidonT3
        const Hashes = await ethers.getContractFactory("PoseidonT3")
        const hashes = await Hashes.deploy()
        const HASHES = hashes.address
        await hashes.deployed()

        //@dev - Deploy the library of the IncrementalBinaryTree.sol
        const IncrementalBinaryTree = await ethers.getContractFactory("IncrementalBinaryTree")
        const incrementalBinaryTree = await IncrementalBinaryTree.deploy()
        const INCREMENTAL_BINARY_TREE = incrementalBinaryTree.address
        await incrementalBinaryTree.deployed({
            libraries: {
                Hashes: HASHES
            },
        })

        //@dev - Deploy the Semaphore.sol
        const Semaphore = await ethers.getContractFactory('Semaphore', {
            libraries: {
                IncrementalBinaryTree: INCREMENTAL_BINARY_TREE
            },
        })
        semaphore = await Semaphore.deploy()
        SEMAPHORE = semaphore.address
        console.log(`Deployed-address of the Semaphore.sol: ${ SEMAPHORE }`)
        await semaphore.deployed()

        //@dev - Assign caller address
        callerAddr = await signer.getAddress()
    })

    it('Accepts and validates calls', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_Voucher, callerAddr)

        const tx = await worldIdGatedVoucher.claimFoodVoucherNFT(
            callerAddr,
            await getRoot(),
            nullifierHash,
            proof
        )

        await tx.wait()

        // extra checks here
    })

    it('Rejects duplicated calls', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_Voucher, callerAddr)

        const tx = await worldIdGatedVoucher.claimFoodVoucherNFT(
            callerAddr,
            await getRoot(),
            nullifierHash,
            proof
        )

        await tx.wait()

        await expect(
            worldIdGatedVoucher.claimFoodVoucherNFT(callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidNullifier')

        // extra checks here
    })
    
    it('Rejects calls from non-members', async function () {
        await registerInvalidIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_Voucher, callerAddr)

        await expect(
            worldIdGatedVoucher.claimFoodVoucherNFT(callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })

    it('Rejects calls with an invalid signal', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_Voucher, callerAddr)

        await expect(
            worldIdGatedVoucher.claimFoodVoucherNFT(WORLD_ID_GATED_Voucher, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })

    it('Rejects calls with an invalid proof', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_Voucher, callerAddr)
        proof[0] = (BigInt(proof[0]) ^ BigInt(42)).toString()

        await expect(
            worldIdGatedVoucher.claimFoodVoucherNFT(callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })
})
