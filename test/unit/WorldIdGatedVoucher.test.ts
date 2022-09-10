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
    let deployer: SignerWithAddress
    let issuer: SignerWithAddress
    let user1: SignerWithAddress

    //@dev - Wallet addresses
    let DEPLOYER: string
    let ISSUER: string
    let USER_1: string


    this.beforeAll(async () => {
        await prepareWorldID()
    })

    beforeEach(async () => {

        //[signer] = await ethers.getSigners()
        signers = await ethers.getSigners()
        deployer = signers[0]
        issuer = signers[1]  // issuer who issue FoodVoucherNFT and initially has this NFT
        user1 = signers[2]
        DEPLOYER = deployer.address
        ISSUER = issuer.address
        USER_1 = user1.address
        console.log(`Wallet address of deployer: ${ DEPLOYER }`)
        console.log(`Wallet address of issuer: ${ ISSUER }`)
        console.log(`Wallet address of user1: ${ USER_1 }`)
        
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

        //@dev - Mint a FoodVoucherNFT (tokenID=0)
        let tx = await foodVoucherNFT.mintFoodVoucherNFT(issuer.address)

        //@dev - Assign a caller address
        callerAddr = await deployer.getAddress()
        console.log(`callerAddr: ${ callerAddr }`)
    })

    it('Accepts and validates calls', async function () {
        //@dev - Create a new FoodVoucherProgram
        const groupId = 1
        const token = FOOD_VOUCHER_NFT
        const holder = issuer.address
        const amount = 1  //@dev - Quantity of FoodVoucherNFTs
        //const amount = ethers.utils.parseEther("1")
        let tx1 = await worldIdGatedVoucher.createFoodVoucherProgram(groupId, token, holder, amount)
        //let txReceipt = await tx1.wait()
        //console.log(`txReceipt of worldIdGatedVoucher#createFoodVoucherProgram(): ${ JSON.stringify(txReceipt, null, 2) }`)

        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId: number = 1

        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, callerAddr)

        const tx2 = await worldIdGatedVoucher.claimFoodVoucher(
            foodVoucherProgramId, 
            //WORLD_ID_GATED_VOUCHER, // receiver
            callerAddr,  // receiver
            await getRoot(),
            nullifierHash,
            proof
        )

        await tx2.wait()

        //@dev - Extra checks here


        //@dev - Check FoodVoucherNFT balance of each wallet addresses
        //const owner = callerAddr
        //const tokenId = 0
        //let owner = await foodVoucherNFT.ownerOf(tokenId)
        //let foodVoucherNFTBalance = await foodVoucherNFT.balanceOf(owner)
        //console.log(`##### FoodVoucherNFT balance of ${ owner }: ${ foodVoucherNFTBalance } #####`)
        //assertEq(token.balanceOf(address(this)), 1 ether);

        let foodVoucherNFTBalanceOfDeployer = await foodVoucherNFT.balanceOf(DEPLOYER)
        let foodVoucherNFTBalanceOfIssuer = await foodVoucherNFT.balanceOf(ISSUER)
        let foodVoucherNFTBalanceOfUser1 = await foodVoucherNFT.balanceOf(USER_1)
        console.log(`##### FoodVoucherNFT balance of deployer: ${ foodVoucherNFTBalanceOfDeployer } #####`)
        console.log(`##### FoodVoucherNFT balance of issuer: ${ foodVoucherNFTBalanceOfIssuer } #####`)
        console.log(`##### FoodVoucherNFT balance of user1: ${ foodVoucherNFTBalanceOfUser1 } #####`)
        //assertEq(token.balanceOf(address(this)), 1 ether);
    })

    it('Rejects duplicated calls', async function () {
        //@dev - Create a new FoodVoucherProgram
        const groupId = 1
        const token = FOOD_VOUCHER_NFT  // Food Voucher NFT
        const holder = issuer.address
        const amount = 1  //@dev - Quantity of FoodVoucherNFTs
        //const amount = ethers.utils.parseEther("1")
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

        await expect(
            worldIdGatedVoucher.claimFoodVoucher(foodVoucherProgramId, callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidNullifier')

        // extra checks here
    })
    
    it('Rejects calls from non-members', async function () {
        //@dev - Create a new FoodVoucherProgram
        const groupId = 1
        const token = FOOD_VOUCHER_NFT
        const holder = issuer.address
        const amount = 1  //@dev - Quantity of FoodVoucherNFTs
        //const amount = ethers.utils.parseEther("1")
        let tx1 = await worldIdGatedVoucher.createFoodVoucherProgram(groupId, token, holder, amount)
        //let txReceipt = await tx1.wait()
        //console.log(`txReceipt of worldIdGatedVoucher#createFoodVoucherProgram(): ${ JSON.stringify(txReceipt, null, 2) }`)

        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId: number = 1

        await registerInvalidIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, callerAddr)

        await expect(
            worldIdGatedVoucher.claimFoodVoucher(foodVoucherProgramId, callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })

    it('Rejects calls with an invalid signal', async function () {
        //@dev - Create a new FoodVoucherProgram
        const groupId = 1
        const token = FOOD_VOUCHER_NFT
        const holder = issuer.address
        const amount = 1  //@dev - Quantity of FoodVoucherNFTs
        //const amount = ethers.utils.parseEther("1")
        let tx1 = await worldIdGatedVoucher.createFoodVoucherProgram(groupId, token, holder, amount)
        //let txReceipt = await tx1.wait()
        //console.log(`txReceipt of worldIdGatedVoucher#createFoodVoucherProgram(): ${ JSON.stringify(txReceipt, null, 2) }`)

        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId: number = 1
        
        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, callerAddr)

        await expect(
            worldIdGatedVoucher.claimFoodVoucher(foodVoucherProgramId, WORLD_ID_GATED_VOUCHER, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })

    it('Rejects calls with an invalid proof', async function () {
        //@dev - Create a new FoodVoucherProgram
        const groupId = 1
        const token = FOOD_VOUCHER_NFT
        const holder = issuer.address
        const amount = 1  //@dev - Quantity of FoodVoucherNFTs
        //const amount = ethers.utils.parseEther("1")
        let tx1 = await worldIdGatedVoucher.createFoodVoucherProgram(groupId, token, holder, amount)
        //let txReceipt = await tx1.wait()
        //console.log(`txReceipt of worldIdGatedVoucher#createFoodVoucherProgram(): ${ JSON.stringify(txReceipt, null, 2) }`)

        //[TODO]: Get foodVoucherProgramId via SC
        let foodVoucherProgramId: number = 1

        await registerIdentity()

        const [nullifierHash, proof] = await getProof(WORLD_ID_GATED_VOUCHER, callerAddr)
        proof[0] = (BigInt(proof[0]) ^ BigInt(42)).toString()

        await expect(
            worldIdGatedVoucher.claimFoodVoucher(foodVoucherProgramId, callerAddr, await getRoot(), nullifierHash, proof)
        ).to.be.revertedWith('InvalidProof')

        // extra checks here
    })
})