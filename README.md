## World ID-gated Food Voucher🎫🆔 for refugees who live in African countries 🌍
### Overview
- There are still issues that refugees could not access foods easily.
  - In case of refugees in africa such as refugees who live in Eastern Africa are suffering food crisis due to COVID-19 pandemic.
    https://www.wfp.org/news/food-rations-cut-refugees-eastern-africa-coronavirus-stretches-resources

<br>

- This is a smart contract that support refugees to be able to access (purchase) essential foods more efficiently and securely in order to reduce hunger by utilizing `World ID-gated voucher` .

<br>

### Specifications
- This smart contract is a extended-contract of the World ID Starter Kit (Hardhat version): https://github.com/worldcoin/world-id-starter-hardhat

<br>

### Test
- Unit test of the WorldIdGatedVoucher.sol
```
npm run test-unit:WorldIdGatedVoucher
```

<br>

- Scenario test of the WorldIdGatedVoucher.sol
```
npm run test-scenario:WorldIdGatedVoucher
```

<br>

### Resources
- Worldcoin: 
  - World ID:

<br>

- Relevant articles:
  - WFP (The United Nations World Food Programme):  
    - Food rations cut for refugees in Eastern Africa as coronavirus stretches resources  
      https://www.wfp.org/news/food-rations-cut-refugees-eastern-africa-coronavirus-stretches-resources  

    - Blockchain Against Hunger: Harnessing Technology In Support Of Syrian Refugees  
      https://www.wfp.org/news/blockchain-against-hunger-harnessing-technology-support-syrian-refugees  

    - WFP Chief: International Community Must Continue to Support Growing Humanitarian Crisis in Bangladesh  
      https://www.wfp.org/news/wfp-chief-international-community-must-continue-support-growing-humanitarian-crisi  

<br>

<hr>

# World ID Starter Kit (Smart Contracts w/ Hardhat)

**Easiest** way to get started with World ID **on-chain**. This repository contains the minimum requirements to build web3 dApps with [World ID](#-about-world-id), allowing you to easily add sybil-resistance and uniqueness features to your dApp.

> This repository contains the smart contract code, and is built with the [Hardhat](https://hardhat.org) toolkit. We also have a Foundry version in the [world-id-starter](https://github.com/worldcoin/world-id-starter) repository.

## 🏃 Getting started

Start with the `verifyAndExecute` function on the [`Contract.sol`](contracts/Contract.sol) file, which contains the basic World ID logic. You can rename this function as you choose (for example, we use `claim` on our airdrop example).

### Setting your Action ID

The action ID (also called "external nullifier") makes sure that the proof your contract receives was generated for it (more on [Action IDs](https://id.worldcoin.org/docs/about/glossary#action-id)). A sensible default is to use the address of your contract (which will always be unique), but feel free to update if you have a unique use-case. You should be changing the `abi.encodePacked(address(this)).hashToField()` line, updating the parameters inside the `encodePacked` call.

> Note: Make sure you're passing the correct Action ID when initializing the JS widget! The generated proof will be invalid otherwise.

### Setting your signal

The signal adds an additional layer of protection to the World ID ZKP, it makes sure that the input provided to the contract is the one the person who generated the proof intended (more on [signals](https://id.worldcoin.org/docs/about/glossary#signal)). By default this contract expects an address (`receiver`), but you can update it to be any arbitrary string.

To update the signal, you should change the `input` on the `abi.encodePacked(input).hashToField()` line. You should provide the exact same string when initializing the JS widget, to make sure the proof includes them.

> Note: The `hashToField` part is really important, as validation will fail otherwise even with the right parameters. Make sure to include it!

### About nullifiers

_Nullifiers_ are what enforces uniqueness in World ID. You can generate multiple proofs for a given signal and action ID, but they will all have the same nullifier. Note how, in the `verifyAndExecute` function we first check if the given nullifier has already been used (and revert if so), then mark it as used after the proof is verified.

If your use-case doesn't require uniqueness, you can use them as "anonymous identifiers", linking users between different signals (for example, allowing them to change which address they've verified in a social network). To do this, update the `nullifierHashes` mapping to point to some sort of identifier instead of a boolean. See [this project](https://github.com/m1guelpf/lens-humancheck/blob/main/src/HumanCheck.sol) as an example.

## 🗝 Usage instructions

1. End users will need a verified identity, which can be obtained through our [Simulator](https://simulator.worldcoin.org) ([see docs for more info](https://id.worldcoin.org/test)). In production, this would be obtained by verifying with an orb.

2. Use the [JS widget](https://id.worldcoin.org/docs/js) to prompt the user with verification (make sure you're providing the correct [signal](#setting-your-signal) and [action ID](#setting-your-action-id)). Upon acceptance, you'll get a `merkle_root`, `nullifier_hash` and `proof`.

3. The ZKP (attribute `proof`) is a `uint256[8]` array and your smart contract expects it that way. For easier handling, the JS widget will return the proof encoded. Unpack your proof before sending it to your smart contract. 

```js
import { defaultAbiCoder as abi } from "@ethers/utils";
const unpackedProof = abi.decode(["uint256[8]"], proof)[0];
// You can now pass your unpackedProof to your smart contract
```

4. Use the obtained parameters, along with any inputs your contract needs (which [should be included in the signal](#setting-your-signal)), to call your smart contract!

## 🧑‍💻 Development & testing

This repository uses the [Hardhat](https://hardhat.org) smart contract toolkit. You'll also need [Node.js](https://nodejs.org) v14 in order to build, run the tests and deploy your contract.

Once you have node installed, you can run `npm install` from the base directory to install all dependencies, and run the automated tests with `npm run test`.

### Running the test suite

This repository includes automated tests, which you can use to make sure your contract is working as expected before deploying it. Of course, any modifications you've made to the `Contract.sol` file will need to be reflected on the tests as well to make them work.

If you've changed the type of the external nullifier, or the signal, you should look over the `src/test/helpers/InteractsWithWorldID.ts` file and update them there as well.

Once you've done this, you can run the tests with `npm run test`.

<!-- WORLD-ID-SHARED-README-TAG:START - Do not remove or modify this section directly -->
<!-- WORLD-ID-SHARED-README-TAG:END -->
