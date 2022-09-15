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

//@dev - Smart contract instances
import { WorldIdGatedVoucher, FoodVoucherNFT } from "../../typechain"

//@dev - Helper of ethers.js for retrieving eventLogs emitted, etc.
import { getEventLog } from "../ethersjs-helper/ethersjsHelper"
import { toWei } from "../ethersjs-helper/ethersjsHelper"
import { fromWei } from "../ethersjs-helper/ethersjsHelper"


/**
 * @notice - The unit test of the WorldIdGatedVoucher
 */ 
describe('Unit test - WorldIdGatedVoucher', function () {
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
    let refugee: SignerWithAddress

    //@dev - Wallet addresses
    let DEPLOYER: string
    let ISSUER: string
    let REFUGEE: string


    this.beforeAll(async () => {
        await prepareWorldID()
    })

    beforeEach(async () => {

        //[signer] = await ethers.getSigners()
        signers = await ethers.getSigners()
        deployer = signers[0]
        issuer = signers[1]  // issuer who issue FoodVoucherNFT and initially has this NFT
        refugee = signers[2]
        DEPLOYER = deployer.address
        ISSUER = issuer.address
        REFUGEE = refugee.address
        console.log(`Wallet address of deployer: ${ DEPLOYER }`)
        console.log(`Wallet address of issuer: ${ ISSUER }`)
        console.log(`Wallet address of refugee: ${ REFUGEE }\n`)
        
        const worldIDAddress = await setUpWorldID()
        console.log(`WorldID deployed-address: ${ worldIDAddress }\n`)

        //@dev - Deploy the WorldIdGatedVoucher.sol
        const WorldIdGatedVoucher = await ethers.getContractFactory('WorldIdGatedVoucher')
        worldIdGatedVoucher = await WorldIdGatedVoucher.deploy(worldIDAddress)
        WORLD_ID_GATED_VOUCHER = worldIdGatedVoucher.address
        console.log(`\nDeployed-address of the WorldIdGatedVoucher.sol: ${ WORLD_ID_GATED_VOUCHER }\n`)
        await worldIdGatedVoucher.deployed()

        //@dev - Deploy a FoodVoucherNFT.sol
        const FoodVoucherNFT = await ethers.getContractFactory('FoodVoucherNFT')
        foodVoucherNFT = await FoodVoucherNFT.deploy(ISSUER)
        FOOD_VOUCHER_NFT = foodVoucherNFT.address
        console.log(`Deployed-address of the FoodVoucherNFT.sol: ${ FOOD_VOUCHER_NFT }\n`)
        await foodVoucherNFT.deployed()

        //@dev - Mint a FoodVoucherNFT (tokenID=0)
        let tx = await foodVoucherNFT.connect(issuer).mintFoodVoucherNFT(ISSUER)

        //@dev - Assign a caller address (that is a claimer address)
        //callerAddr = REFUGEE
        //console.log(`callerAddr: ${ callerAddr }`)
    })

    it('Check FoodVoucherNFT balance of each wallet addresses before claiming', async function () {
        //let foodVoucherNFTBalanceOfDeployer = await foodVoucherNFT.balanceOf(DEPLOYER)
        let foodVoucherNFTBalanceOfIssuer = await foodVoucherNFT.balanceOf(ISSUER)
        let foodVoucherNFTBalanceOfrefugee = await foodVoucherNFT.balanceOf(REFUGEE)
        //console.log(`\n##### FoodVoucherNFT balance of deployer: ${ foodVoucherNFTBalanceOfDeployer } #####`)
        console.log(`\n##### FoodVoucherNFT balance of issuer: ${ foodVoucherNFTBalanceOfIssuer } #####`)
        console.log(`##### FoodVoucherNFT balance of refugee: ${ foodVoucherNFTBalanceOfrefugee } #####`)
        //expect(foodVoucherNFTBalanceOfDeployer).to.equal(0)
        expect(foodVoucherNFTBalanceOfIssuer).to.equal(1)
        expect(foodVoucherNFTBalanceOfrefugee).to.equal(0)
    })

    it('Accepts and validates calls', async function () {
        //@dev - Create a new FoodVoucherProgram
        const groupId = 1
        const token = FOOD_VOUCHER_NFT
        const holder = issuer.address
        const tokenId = 0  //@dev - TokenID of FoodVoucherNFTs
        let tx1 = await worldIdGatedVoucher.connect(issuer).createFoodVoucherProgram(groupId, token, holder, tokenId)
        //let txReceipt = await tx1.wait()
        //console.log(`txReceipt of worldIdGatedVoucher#createFoodVoucherProgram(): ${ JSON.stringify(txReceipt, null, 2) }`)

        //@dev - Assign Food Voucher Program Id
        let foodVoucherProgramId: number = 1

        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, REFUGEE)

        //@dev - A issuer approve the WorldIdGatedVoucher contract to spend tokenID of FoodVoucherNFT
        let tx2 = await foodVoucherNFT.connect(issuer).approve(WORLD_ID_GATED_VOUCHER, tokenId);

        const tx3 = await worldIdGatedVoucher.connect(refugee).claimFoodVoucher(
            foodVoucherProgramId, 
            REFUGEE,  // receiver
            await getRoot(),
            nullifierHash,
            proof
        )

        await tx3.wait()

        //@dev - Extra checks here

        //@dev - Check FoodVoucherNFT balance of each wallet addresses
        //let foodVoucherNFTBalanceOfDeployer = await foodVoucherNFT.balanceOf(DEPLOYER)
        let foodVoucherNFTBalanceOfIssuer = await foodVoucherNFT.balanceOf(ISSUER)
        let foodVoucherNFTBalanceOfrefugee = await foodVoucherNFT.balanceOf(REFUGEE)
        //console.log(`\n##### FoodVoucherNFT balance of deployer: ${ foodVoucherNFTBalanceOfDeployer } #####`)
        console.log(`\n##### FoodVoucherNFT balance of issuer: ${ foodVoucherNFTBalanceOfIssuer } #####`)
        console.log(`##### FoodVoucherNFT balance of refugee: ${ foodVoucherNFTBalanceOfrefugee } #####`)
        //expect(foodVoucherNFTBalanceOfDeployer).to.equal(0)
        expect(foodVoucherNFTBalanceOfIssuer).to.equal(0)
        expect(foodVoucherNFTBalanceOfrefugee).to.equal(1)
    })

    it('Rejects duplicated calls', async function () {
        //@dev - Create a new FoodVoucherProgram
        const groupId = 1
        const token = FOOD_VOUCHER_NFT
        const holder = issuer.address
        const tokenId = 0  //@dev - TokenID of FoodVoucherNFTs
        let tx1 = await worldIdGatedVoucher.connect(issuer).createFoodVoucherProgram(groupId, token, holder, tokenId)
        //let txReceipt = await tx1.wait()
        //console.log(`txReceipt of worldIdGatedVoucher#createFoodVoucherProgram(): ${ JSON.stringify(txReceipt, null, 2) }`)

        //@dev - Assign Food Voucher Program Id
        let foodVoucherProgramId: number = 1

        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, REFUGEE)

        //@dev - A issuer approve the WorldIdGatedVoucher contract to spend tokenID of FoodVoucherNFT
        let tx2 = await foodVoucherNFT.connect(issuer).approve(WORLD_ID_GATED_VOUCHER, tokenId);

        const tx3 = await worldIdGatedVoucher.connect(refugee).claimFoodVoucher(
            foodVoucherProgramId, 
            REFUGEE,  // receiver
            await getRoot(),
            nullifierHash,
            proof
        )

        await tx3.wait()

        await expect(
            worldIdGatedVoucher.claimFoodVoucher(foodVoucherProgramId, REFUGEE, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidNullifier')

        // extra checks here
    })
    
    it('Rejects calls from non-members', async function () {
        //@dev - Create a new FoodVoucherProgram
        const groupId = 1
        const token = FOOD_VOUCHER_NFT
        const holder = ISSUER
        const tokenId = 0  //@dev - TokenID of FoodVoucherNFTs
        let tx1 = await worldIdGatedVoucher.connect(issuer).createFoodVoucherProgram(groupId, token, holder, tokenId)
        //let txReceipt = await tx1.wait()

        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId: number = 1

        await registerInvalidIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, REFUGEE)

        await expect(
            worldIdGatedVoucher.claimFoodVoucher(foodVoucherProgramId, REFUGEE, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')
    })

    it('Rejects calls with an invalid signal', async function () {
        //@dev - Create a new FoodVoucherProgram
        const groupId = 1
        const token = FOOD_VOUCHER_NFT
        const holder = ISSUER
        const tokenId = 0  //@dev - TokenID of FoodVoucherNFTs
        let tx1 = await worldIdGatedVoucher.connect(issuer).createFoodVoucherProgram(groupId, token, holder, tokenId)
        //let txReceipt = await tx1.wait()

        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId: number = 1
        
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, REFUGEE)

        await expect(
            worldIdGatedVoucher.claimFoodVoucher(foodVoucherProgramId, WORLD_ID_GATED_VOUCHER, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })

    it('Rejects calls with an invalid proof', async function () {
        //@dev - Create a new FoodVoucherProgram
        const groupId = 1
        const token = FOOD_VOUCHER_NFT
        const holder = ISSUER
        const tokenId = 0  //@dev - TokenID of FoodVoucherNFTs
        let tx1 = await worldIdGatedVoucher.connect(issuer).createFoodVoucherProgram(groupId, token, holder, tokenId)
        //let txReceipt = await tx1.wait()

        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId: number = 1

        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, REFUGEE)
        proof[0] = (BigInt(proof[0]) ^ BigInt(42)).toString()

        await expect(
            worldIdGatedVoucher.claimFoodVoucher(foodVoucherProgramId, REFUGEE, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })
})
