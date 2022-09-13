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
import { WorldIdGatedVoucher, FoodVoucherNFT, FoodVoucherNFTFactory } from "../../typechain"

//@dev - Helper of ethers.js for retrieving eventLogs emitted, etc.
import { getEventLog } from "../ethersjs-helper/ethersjsHelper"
import { toWei } from "../ethersjs-helper/ethersjsHelper"
import { fromWei } from "../ethersjs-helper/ethersjsHelper"


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
    let refugee: SignerWithAddress

    //@dev - Wallet addresses
    let DEPLOYER: string
    let ISSUER: string
    let REFUGEE: string

    this.beforeAll(async () => {
        await prepareWorldID()
    })

    before(async () => {
    //beforeEach(async () => {
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
        console.log(`Wallet address of refugee: ${ REFUGEE }`)

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

    it('Mint a FoodVoucherNFT (tokenID=0) to issuer', async function () {
        let tx1 = await foodVoucherNFT.connect(deployer).mintFoodVoucherNFT(ISSUER)
    })

    it('Check FoodVoucherNFT balance of each wallet addresses before claiming - Issuer should has a FoodVoucherNFT. refugee should not has a FoodVoucherNFT', async function () {
        let foodVoucherNFTBalanceOfDeployer = await foodVoucherNFT.balanceOf(DEPLOYER)
        let foodVoucherNFTBalanceOfIssuer = await foodVoucherNFT.balanceOf(ISSUER)
        let foodVoucherNFTBalanceOfrefugee = await foodVoucherNFT.balanceOf(REFUGEE)
        console.log(`##### FoodVoucherNFT balance of deployer: ${ foodVoucherNFTBalanceOfDeployer } #####`)
        console.log(`##### FoodVoucherNFT balance of issuer: ${ foodVoucherNFTBalanceOfIssuer } #####`)
        console.log(`##### FoodVoucherNFT balance of refugee: ${ foodVoucherNFTBalanceOfrefugee } #####`)
        expect(foodVoucherNFTBalanceOfDeployer).to.equal(0)
        expect(foodVoucherNFTBalanceOfIssuer).to.equal(1)
        expect(foodVoucherNFTBalanceOfrefugee).to.equal(0)
    })

    it('createFoodVoucherProgram() - An issuer create a FoodVoucherProgram / Then, claimFoodVoucher() - refugee claim a FoodVoucherNFT', async function () {
        //@dev - refugee is assigned as a caller address (that is also a claimer address)
        callerAddr = REFUGEE
        console.log(`callerAddr: ${ callerAddr }`)
        expect(callerAddr).to.equal(REFUGEE)

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

        const tx3 = await worldIdGatedVoucher.connect(refugee).claimFoodVoucher(
            foodVoucherProgramId, 
            callerAddr,  // receiver
            await getRoot(),
            nullifierHash,
            proof
        )

        await tx3.wait()

        //@dev - Extra checks here
    })

    it('Check FoodVoucherNFT balance of each wallet addresses after claiming - refugee should has a FoodVoucherNFT. Issuer should not has a FoodVoucherNFT', async function () {
        let foodVoucherNFTBalanceOfDeployer = await foodVoucherNFT.balanceOf(DEPLOYER)
        let foodVoucherNFTBalanceOfIssuer = await foodVoucherNFT.balanceOf(ISSUER)
        let foodVoucherNFTBalanceOfrefugee = await foodVoucherNFT.balanceOf(REFUGEE)
        console.log(`##### FoodVoucherNFT balance of deployer: ${ foodVoucherNFTBalanceOfDeployer } #####`)
        console.log(`##### FoodVoucherNFT balance of issuer: ${ foodVoucherNFTBalanceOfIssuer } #####`)
        console.log(`##### FoodVoucherNFT balance of refugee: ${ foodVoucherNFTBalanceOfrefugee } #####`)
        expect(foodVoucherNFTBalanceOfDeployer).to.equal(0)
        expect(foodVoucherNFTBalanceOfIssuer).to.equal(0)
        expect(foodVoucherNFTBalanceOfrefugee).to.equal(1)
    })
})
