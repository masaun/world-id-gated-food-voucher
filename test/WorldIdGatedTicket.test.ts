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
 * @notice - The unit test of the WorldIdGatedTicket
 */ 
describe('WorldIdGatedTicket', function () {
    //@dev - Variables of smart contract instances
    let worldIdGatedTicket: WorldIdGatedTicket

    //@dev - Variables of smart contract addresses
    let WORLD_ID_GATED_TICKET: string
     
    //@dev - Variables of wallet address
    let callerAddr: string

    this.beforeAll(async () => {
        await prepareWorldID()
    })

    beforeEach(async () => {
        const [signer] = await ethers.getSigners()
        const worldIDAddress = await setUpWorldID()
        const WorldIdGatedTicket = await ethers.getContractFactory('WorldIdGatedTicket')
        worldIdGatedTicket = await WorldIdGatedTicket.deploy(worldIDAddress)
        WORLD_ID_GATED_TICKET = worldIdGatedTicket.address

        await worldIdGatedTicket.deployed()

        callerAddr = await signer.getAddress()
    })

    it('Accepts and validates calls', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_TICKET, callerAddr)

        const tx = await worldIdGatedTicket.claimTicket(
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

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_TICKET, callerAddr)

        const tx = await worldIdGatedTicket.claimTicket(
            callerAddr,
            await getRoot(),
            nullifierHash,
            proof
        )

        await tx.wait()

        await expect(
            worldIdGatedTicket.claimTicket(callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidNullifier')

        // extra checks here
    })
    it('Rejects calls from non-members', async function () {
        await registerInvalidIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_TICKET, callerAddr)

        await expect(
            worldIdGatedTicket.claimTicket(callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })
    it('Rejects calls with an invalid signal', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_TICKET, callerAddr)

        await expect(
            worldIdGatedTicket.claimTicket(WORLD_ID_GATED_TICKET, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })
    it('Rejects calls with an invalid proof', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_TICKET, callerAddr)
        proof[0] = (BigInt(proof[0]) ^ BigInt(42)).toString()

        await expect(
            worldIdGatedTicket.claimTicket(callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })
})
