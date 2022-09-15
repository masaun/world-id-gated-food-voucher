# World ID-gated Food Voucher🎫🆔 for food rations for refugees
## Overview 
- There has been the problem of food crisis for refugees.
  - There are refugees in africa, for example, there are refugees who is suffering food crisis due to COVID-19 pandemic. It lead refugees to serious hunger, etc.  
    https://www.wfp.org/news/food-rations-cut-refugees-eastern-africa-coronavirus-stretches-resources
  - Therefore, organizations (such as NPOs, NGOs, etc) that is responsible of food rations for refugees has required to verify refugees (of identity, qualification, etc) more speedy and securely.

<br>

- This smart contract is used for supporting to solve the problem of food ration for refugees like above (that is related to the Zero Hunger of SDGs 2).
  - This smart contract utilize [World ID](https://github.com/worldcoin/world-id-starter#-about-world-id) as a gate for checking qualification who can claim food voucher and verifying it.
    - `World ID` genarate a proof based on the zero knowledge proof (ZKP) technology. 
    - Only refugees who are registered with World ID and has a proof generated can claim food voucher NFTs.
    - By using World ID-gated voucher via this smart contract, organizations (such as NPOs, NGOs, etc) that is resposible for food rations for refugees verify thier qualifications more efficient and more secure and more transparent. 
  - World ID-based verification that is used in this smart contract might be a good alternative verification solution instead of the way based on [biometric verification](https://medium.com/world-food-programme-insight/the-full-circuit-how-wfp-is-enabling-biometric-verification-in-uganda-823da0bf6ba7).
     

<br>

- Remarks:
  - `World ID` is a protocol that lets you prove a human is doing an action only once without revealing any personal data. Stop bots, stop abuse.
    - World ID uses a device called the `Orb` which takes a picture of a person's iris to verify they are a unique and alive human. The protocol uses `Zero-knowledge proofs (ZKPs)` so no traceable information is ever public.  
    - World ID is meant for on-chain web3 apps, traditional cloud applications, and even IRL verifications.  
      (Source from: https://github.com/worldcoin/world-id-starter#-about-world-id )

<br>

## Diagram of workflow
- Diagram of entire workflow of this smart contract
  ![diagram_20220913](https://user-images.githubusercontent.com/19357502/189883101-0984e3d1-f532-4d53-88cd-2ee61f00a305.jpeg)

<br>

## Test
- Scenario test of the WorldIdGatedVoucher.sol  (<=This scenario test show entire workflow of this smart contract)
```
npm run test-scenario:WorldIdGatedVoucher
```

<br>

- Unit test of the WorldIdGatedVoucher.sol
```
npm run test-unit:WorldIdGatedVoucher
```

<br>

## Demo
- This link of video demo is for showing entire workflow of this smart contract by executing the Scenario test of the WorldIdGatedVoucher.sol  
  https://youtu.be/9GfcEO4l-JI  

<br>

## Resources
- Worldcoin: https://worldcoin.org/the-worldcoin-protocol
  - World ID: https://github.com/worldcoin/world-id-starter#-about-world-id 
  - World ID Starter Kit (Hardhat version): https://github.com/worldcoin/world-id-starter-hardhat

<br>

- Relevant articles of food ration for refugees:
  - WFP (The United Nations World Food Programme):  
    - Food rations cut for refugees in Eastern Africa as coronavirus stretches resources  
      https://www.wfp.org/news/food-rations-cut-refugees-eastern-africa-coronavirus-stretches-resources  

    - Blockchain Against Hunger: Harnessing Technology In Support Of Syrian Refugees  
      https://www.wfp.org/news/blockchain-against-hunger-harnessing-technology-support-syrian-refugees  

    - WFP Chief: International Community Must Continue to Support Growing Humanitarian Crisis in Bangladesh  
      https://www.wfp.org/news/wfp-chief-international-community-must-continue-support-growing-humanitarian-crisi  
