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
} from '../worldcoin/helpers/InteractsWithWorldID'

import { WorldIdGatedVoucher, FoodVoucherNFT, FoodVoucherNFTFactory } from "../../typechain"


/**
 * @notice - The scenario test of the WorldIdGatedVoucher
 */ 
describe('Scenario test - WorldIdGatedVoucher', function () {
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
    let deployer: SignerWithAddress
    let issuer: SignerWithAddress
    let user1: SignerWithAddress
    let user2: SignerWithAddress
    let user3: SignerWithAddress

    //@dev - Wallet addresses
    let DEPLOYER: string
    let ISSUER: string
    let USER_1: string
    let USER_2: string
    let USER_3: string


    this.beforeAll(async () => {
        await prepareWorldID()
    })

    before(async () => {
    //beforeEach(async () => {
        //[signer] = await ethers.getSigners()
        signers = await ethers.getSigners()
        deployer = signers[0]
        issuer = signers[1]  // issuer who issue FoodVoucherNFT and initially has this NFT
        user1 = signers[2]
        user2 = signers[3]
        user3 = signers[4]

        DEPLOYER = deployer.address
        ISSUER = issuer.address
        USER_1 = user1.address
        USER_2 = user2.address
        USER_3 = user3.address
        console.log(`Wallet address of deployer: ${ DEPLOYER }`)
        console.log(`Wallet address of issuer: ${ ISSUER }`)
        console.log(`Wallet address of user1: ${ USER_1 }`)
        console.log(`Wallet address of user2: ${ USER_2 }`)
        console.log(`Wallet address of user3: ${ USER_3 }`)
        
        const worldIDAddress = await setUpWorldID()
        console.log(`WorldID deployed-address: ${ worldIDAddress }`)

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
    })

    it('Mint a FoodVoucherNFT (tokenID=0, 1, 2) to issuer', async function () {
        let tx1 = await foodVoucherNFT.connect(deployer).mintFoodVoucherNFT(ISSUER)
        let tx2 = await foodVoucherNFT.connect(deployer).mintFoodVoucherNFT(ISSUER)
        let tx3 = await foodVoucherNFT.connect(deployer).mintFoodVoucherNFT(ISSUER)
    })

    it('Check FoodVoucherNFT balance of each wallet addresses before claiming', async function () {
        let foodVoucherNFTBalanceOfDeployer = await foodVoucherNFT.balanceOf(DEPLOYER)
        let foodVoucherNFTBalanceOfIssuer = await foodVoucherNFT.balanceOf(ISSUER)
        let foodVoucherNFTBalanceOfUser1 = await foodVoucherNFT.balanceOf(USER_1)
        let foodVoucherNFTBalanceOfUser2 = await foodVoucherNFT.balanceOf(USER_2)
        let foodVoucherNFTBalanceOfUser3 = await foodVoucherNFT.balanceOf(USER_3)
        console.log(`##### FoodVoucherNFT balance of deployer: ${ foodVoucherNFTBalanceOfDeployer } #####`)
        console.log(`##### FoodVoucherNFT balance of issuer: ${ foodVoucherNFTBalanceOfIssuer } #####`)
        console.log(`##### FoodVoucherNFT balance of user1: ${ foodVoucherNFTBalanceOfUser1 } #####`)
        console.log(`##### FoodVoucherNFT balance of user2: ${ foodVoucherNFTBalanceOfUser2 } #####`)
        console.log(`##### FoodVoucherNFT balance of user3: ${ foodVoucherNFTBalanceOfUser3 } #####`)
        expect(foodVoucherNFTBalanceOfDeployer).to.equal(0)
        expect(foodVoucherNFTBalanceOfIssuer).to.equal(3)
        expect(foodVoucherNFTBalanceOfUser1).to.equal(0)
        expect(foodVoucherNFTBalanceOfUser2).to.equal(0)
        expect(foodVoucherNFTBalanceOfUser3).to.equal(0)
    })

    it('createFoodVoucherProgram() - An issuer create a FoodVoucherProgram / Then, claimFoodVoucher() - User1 claim a FoodVoucherNFT', async function () {
        //@dev - User1 is assigned as a caller address (that is also a claimer address)
        callerAddr = USER_1
        console.log(`callerAddr: ${ callerAddr }`)

        //@dev - Create a new FoodVoucherProgram
        const groupId = 1
        const token = FOOD_VOUCHER_NFT
        const holder = ISSUER
        const tokenId: number = 0  //@dev - TokenID of FoodVoucherNFTs
        let tx1 = await worldIdGatedVoucher.connect(issuer).createFoodVoucherProgram(groupId, token, holder, tokenId)

        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId: number = 1

        //@dev - WorldId.addMember()
        await registerIdentity()

        //@dev - get proof
        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, callerAddr)

        //@dev - A issuer approve the WorldIdGatedVoucher contract to spend tokenID of FoodVoucherNFT
        let tx2 = await foodVoucherNFT.connect(issuer).approve(WORLD_ID_GATED_VOUCHER, tokenId);

        const tx3 = await worldIdGatedVoucher.connect(user1).claimFoodVoucher(
            foodVoucherProgramId, 
            callerAddr,  // receiver
            await getRoot(),
            nullifierHash,
            proof
        )

        await tx3.wait()

        //@dev - Extra checks here
    })

    it('createFoodVoucherProgram() - An issuer create a FoodVoucherProgram / Then, claimFoodVoucher() - User2 claim a FoodVoucherNFT', async function () {
        //@dev - User2 is assigned as a caller address (that is also a claimer address)
        callerAddr = USER_2
        console.log(`callerAddr: ${ callerAddr }`)

        //@dev - Create a new FoodVoucherProgram
        const groupId = 2
        const token = FOOD_VOUCHER_NFT
        const holder = ISSUER
        const tokenId: number = 1  //@dev - TokenID of FoodVoucherNFTs
        let tx1 = await worldIdGatedVoucher.connect(issuer).createFoodVoucherProgram(groupId, token, holder, tokenId)

        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId: number = 1

        //@dev - WorldId.addMember()
        await registerIdentity()

        //@dev - get proof
        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, callerAddr)

        //@dev - A issuer approve the WorldIdGatedVoucher contract to spend tokenID of FoodVoucherNFT
        let tx2 = await foodVoucherNFT.connect(issuer).approve(WORLD_ID_GATED_VOUCHER, tokenId);

        const tx3 = await worldIdGatedVoucher.connect(user1).claimFoodVoucher(
            foodVoucherProgramId, 
            callerAddr,  // receiver
            await getRoot(),
            nullifierHash,
            proof
        )

        await tx3.wait()

        //@dev - Extra checks here
    })

    it('createFoodVoucherProgram() - An issuer create a FoodVoucherProgram / Then, claimFoodVoucher() - User3 claim a FoodVoucherNFT', async function () {
        //@dev - User2 is assigned as a caller address (that is also a claimer address)
        callerAddr = USER_3
        console.log(`callerAddr: ${ callerAddr }`)

        //@dev - Create a new FoodVoucherProgram
        const groupId = 3
        const token = FOOD_VOUCHER_NFT
        const holder = ISSUER
        const tokenId: number = 2  //@dev - TokenID of FoodVoucherNFTs
        let tx1 = await worldIdGatedVoucher.connect(issuer).createFoodVoucherProgram(groupId, token, holder, tokenId)

        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId: number = 1

        //@dev - WorldId.addMember()
        await registerIdentity()

        //@dev - get proof
        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, callerAddr)

        //@dev - A issuer approve the WorldIdGatedVoucher contract to spend tokenID of FoodVoucherNFT
        let tx2 = await foodVoucherNFT.connect(issuer).approve(WORLD_ID_GATED_VOUCHER, tokenId);

        const tx3 = await worldIdGatedVoucher.connect(user1).claimFoodVoucher(
            foodVoucherProgramId, 
            callerAddr,  // receiver
            await getRoot(),
            nullifierHash,
            proof
        )

        await tx3.wait()

        //@dev - Extra checks here
    })

    it('Check FoodVoucherNFT balance of each wallet addresses after claiming', async function () {
        let foodVoucherNFTBalanceOfDeployer = await foodVoucherNFT.balanceOf(DEPLOYER)
        let foodVoucherNFTBalanceOfIssuer = await foodVoucherNFT.balanceOf(ISSUER)
        let foodVoucherNFTBalanceOfUser1 = await foodVoucherNFT.balanceOf(USER_1)
        let foodVoucherNFTBalanceOfUser2 = await foodVoucherNFT.balanceOf(USER_2)
        let foodVoucherNFTBalanceOfUser3 = await foodVoucherNFT.balanceOf(USER_3)
        console.log(`##### FoodVoucherNFT balance of deployer: ${ foodVoucherNFTBalanceOfDeployer } #####`)
        console.log(`##### FoodVoucherNFT balance of issuer: ${ foodVoucherNFTBalanceOfIssuer } #####`)
        console.log(`##### FoodVoucherNFT balance of user1: ${ foodVoucherNFTBalanceOfUser1 } #####`)
        console.log(`##### FoodVoucherNFT balance of user2: ${ foodVoucherNFTBalanceOfUser2 } #####`)
        console.log(`##### FoodVoucherNFT balance of user3: ${ foodVoucherNFTBalanceOfUser3 } #####`)
        expect(foodVoucherNFTBalanceOfDeployer).to.equal(0)
        expect(foodVoucherNFTBalanceOfIssuer).to.equal(0)
        expect(foodVoucherNFTBalanceOfUser1).to.equal(1)
        expect(foodVoucherNFTBalanceOfUser2).to.equal(0)
        expect(foodVoucherNFTBalanceOfUser3).to.equal(0)
    })
})
