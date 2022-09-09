import { expect } from 'chai'
import { ethers } from 'hardhat'
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address"
import { BigNumber, ContractReceipt, ContractTransaction, Contract } from 'ethers'
import {
    getProof,
    getRoot,
    prepareWorldID,
    registerIdentity,
    registerInvalidIdentity,
    setUpWorldID,
} from './worldcoin/helpers/InteractsWithWorldID'

import { WorldIdGatedVoucher, FoodVoucherNFT, FoodVoucherNFTFactory } from "../typechain"


/**
 * @notice - The unit test of the WorldIdGatedVoucher
 */ 
describe('WorldIdGatedVoucher', function () {
    //@dev - Variables of smart contract instances
    let worldIdGatedVoucher: WorldIdGatedVoucher
    let foodVoucherNFT: FoodVoucherNFT

    //@dev - Variables of smart contract addresses
    let WORLD_ID_GATED_VOUCHER: string
    let FOOD_VOUCHER_NFT: string

    //@dev - Variables of wallet address
    let callerAddr: string

    //@dev - Signers
    let signers: SignerWithAddress[]
    let signer: SignerWithAddress
    let user1: SignerWithAddress
    let user2: SignerWithAddress


    this.beforeAll(async () => {
        await prepareWorldID()
    })

    beforeEach(async () => {

        //[signer] = await ethers.getSigners()
        signers = await ethers.getSigners()
        signer = signers[0]
        user1 = signers[1]
        user2 = signers[2]
        
        const worldIDAddress = await setUpWorldID()

        //@dev - Deploy the WorldIdGatedVoucher.sol
        const WorldIdGatedVoucher = await ethers.getContractFactory('WorldIdGatedVoucher')
        worldIdGatedVoucher = await WorldIdGatedVoucher.deploy(worldIDAddress)
        WORLD_ID_GATED_VOUCHER = worldIdGatedVoucher.address
        console.log(`Deployed-address of the WorldIdGatedVoucher.sol: ${ WORLD_ID_GATED_VOUCHER }`)
        await worldIdGatedVoucher.deployed()

        //@dev - [TODO]: At the end of implementation, this deployment part should be replaced with a method defined in the FoodVoucherNFTFactory.sol
        //@dev - Deploy a FoodVoucherNFT.sol
        const FoodVoucherNFT = await ethers.getContractFactory('FoodVoucherNFT')
        foodVoucherNFT = await FoodVoucherNFT.deploy()
        FOOD_VOUCHER_NFT = foodVoucherNFT.address
        console.log(`Deployed-address of the FoodVoucherNFT.sol: ${ FOOD_VOUCHER_NFT }`)
        await foodVoucherNFT.deployed()

        //@dev - Mint a FoodVoucherNFT (tokenID=0)
        let tx = await foodVoucherNFT.mintFoodVoucherNFT(user1.address)

        //@dev - Assign a caller address
        callerAddr = await signer.getAddress()
        console.log(`callerAddr: ${ callerAddr }`)
    })

    it('Accepts and validates calls', async function () {
        //@dev - Create a new FoodVoucherProgram
        const groupId = 1
        const token = FOOD_VOUCHER_NFT
        const holder = user1.address
        const amount = ethers.utils.parseEther("1")
        let tx1 = await worldIdGatedVoucher.createFoodVoucherProgram(groupId, token, holder, amount)
        //let txReceipt = await tx1.wait()
        //console.log(`txReceipt of worldIdGatedVoucher#createFoodVoucherProgram(): ${ JSON.stringify(txReceipt, null, 2) }`)

        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId: number = 1

        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, callerAddr)

        const tx2 = await worldIdGatedVoucher.claimFoodVoucher(
            foodVoucherProgramId, 
            callerAddr,  // receiver
            await getRoot(),
            nullifierHash,
            proof
        )

        await tx2.wait()

        // extra checks here
    })

    it('Rejects duplicated calls', async function () {
        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId = 0

        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, callerAddr)

        const tx = await worldIdGatedVoucher.claimFoodVoucher(
            foodVoucherProgramId, 
            callerAddr,  // receiver
            await getRoot(),
            nullifierHash,
            proof
        )

        await tx.wait()

        await expect(
            worldIdGatedVoucher.claimFoodVoucher(callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidNullifier')

        // extra checks here
    })
    
    it('Rejects calls from non-members', async function () {
        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId = 0

        await registerInvalidIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, callerAddr)

        await expect(
            worldIdGatedVoucher.claimFoodVoucher(foodVoucherProgramId, callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })

    it('Rejects calls with an invalid signal', async function () {
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, callerAddr)

        await expect(
            worldIdGatedVoucher.claimFoodVoucher(WORLD_ID_GATED_VOUCHER, await getRoot(), nullifierHash, proof)
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
            worldIdGatedVoucher.claimFoodVoucher(foodVoucherProgramId, callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })
})
