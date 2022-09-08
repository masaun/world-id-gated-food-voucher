import { expect } from 'chai'
import { ethers } from 'hardhat'
import { BigNumber, ContractReceipt, ContractTransaction, Contract } from 'ethers'
import {
    getProof,
    getRoot,
    prepareWorldID,
    registerIdentity,
    registerInvalidIdentity,
    setUpWorldID,
} from './worldcoin/helpers/InteractsWithWorldID'

import { WorldIdGatedVoucher, Semaphore, IncrementalBinaryTree, PoseidonT3 } from "../typechain"


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
    })

    it('Accepts and validates calls', async function () {
        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId: BigNumber = 0

        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, callerAddr)

        const tx = await worldIdGatedVoucher.claimFoodVoucherNFT(
            foodVoucherProgramId, 
            callerAddr,  // receiver
            await getRoot(),
            nullifierHash,
            proof
        )

        await tx.wait()

        // extra checks here
    })

    it('Rejects duplicated calls', async function () {
        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId = 0

        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, callerAddr)

        const tx = await worldIdGatedVoucher.claimFoodVoucherNFT(
            foodVoucherProgramId, 
            callerAddr,  // receiver
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
        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId = 0

        await registerInvalidIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, callerAddr)

        await expect(
            worldIdGatedVoucher.claimFoodVoucherNFT(foodVoucherProgramId, callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })

    it('Rejects calls with an invalid signal', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, callerAddr)

        await expect(
            worldIdGatedVoucher.claimFoodVoucherNFT(WORLD_ID_GATED_VOUCHER, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })

    it('Rejects calls with an invalid proof', async function () {
        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId = 0

        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, callerAddr)
        proof[0] = (BigInt(proof[0]) ^ BigInt(42)).toString()

        await expect(
            worldIdGatedVoucher.claimFoodVoucherNFT(foodVoucherProgramId, callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })
})
