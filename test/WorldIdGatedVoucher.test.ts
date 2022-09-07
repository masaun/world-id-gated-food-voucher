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


/**
 * @notice - The unit test of the WorldIdGatedVoucher
 */ 
describe('WorldIdGatedVoucher', function () {
    //@dev - Variables of smart contract instances
    let worldIdGatedVoucher: WorldIdGatedVoucher

    //@dev - Variables of smart contract addresses
    let WORLD_ID_GATED_Voucher: string
     
    //@dev - Variables of wallet address
    let callerAddr: string

    this.beforeAll(async () => {
        await prepareWorldID()
    })

    beforeEach(async () => {
        const [signer] = await ethers.getSigners()
        const worldIDAddress = await setUpWorldID()
        const WorldIdGatedVoucher = await ethers.getContractFactory('WorldIdGatedVoucher')
        worldIdGatedVoucher = await WorldIdGatedVoucher.deploy(worldIDAddress)
        WORLD_ID_GATED_Voucher = worldIdGatedVoucher.address

        await worldIdGatedVoucher.deployed()

        callerAddr = await signer.getAddress()
    })

    it('Accepts and validates calls', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_Voucher, callerAddr)

        const tx = await worldIdGatedVoucher.claimVoucher(
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

        const tx = await worldIdGatedVoucher.claimVoucher(
            callerAddr,
            await getRoot(),
            nullifierHash,
            proof
        )

        await tx.wait()

        await expect(
            worldIdGatedVoucher.claimVoucher(callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidNullifier')

        // extra checks here
    })
    
    it('Rejects calls from non-members', async function () {
        await registerInvalidIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_Voucher, callerAddr)

        await expect(
            worldIdGatedVoucher.claimVoucher(callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })

    it('Rejects calls with an invalid signal', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_Voucher, callerAddr)

        await expect(
            worldIdGatedVoucher.claimVoucher(WORLD_ID_GATED_Voucher, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })

    it('Rejects calls with an invalid proof', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_Voucher, callerAddr)
        proof[0] = (BigInt(proof[0]) ^ BigInt(42)).toString()

        await expect(
            worldIdGatedVoucher.claimVoucher(callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })
})
