const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const rmAddress = "0xe0ff51FF1C089c14C636A8696a7081E2c6aAbb13";

  console.log("Setting up officers for RoleManager at", rmAddress);
  const RoleManager = await ethers.getContractFactory("RoleManager");
  const roleManager = RoleManager.attach(rmAddress);

  // Generate 3 fresh wallets
  const patwariWallet = ethers.Wallet.createRandom().connect(ethers.provider);
  const tehsildarWallet = ethers.Wallet.createRandom().connect(ethers.provider);
  const dcWallet = ethers.Wallet.createRandom().connect(ethers.provider);

  console.log("Patwari:", patwariWallet.address);
  console.log("Tehsildar:", tehsildarWallet.address);
  console.log("DC:", dcWallet.address);

  // Fund them with 0.05 Sepolia ETH each so they can pay gas for backend transactions
  console.log("\nFunding wallets with 0.05 SepETH...");
  const fundAmount = ethers.parseEther("0.05");
  
  await (await deployer.sendTransaction({ to: patwariWallet.address, value: fundAmount })).wait(1);
  await (await deployer.sendTransaction({ to: tehsildarWallet.address, value: fundAmount })).wait(1);
  await (await deployer.sendTransaction({ to: dcWallet.address, value: fundAmount })).wait(1);

  const PATWARI_ROLE = await roleManager.PATWARI_ROLE();
  const TEHSILDAR_ROLE = await roleManager.TEHSILDAR_ROLE();
  const DC_ROLE = await roleManager.DC_ROLE();

  console.log("\nAdding Patwari to Contract...");
  await (await roleManager.addOfficer(
    patwariWallet.address,
    "Sepolia Patwari",
    "5430100000002",
    "patwari@sepolia.blrs.gov.pk",
    "Quetta",
    PATWARI_ROLE
  )).wait(1);

  console.log("Adding Tehsildar to Contract...");
  await (await roleManager.addOfficer(
    tehsildarWallet.address,
    "Sepolia Tehsildar",
    "5430100000003",
    "tehsildar@sepolia.blrs.gov.pk",
    "Quetta",
    TEHSILDAR_ROLE
  )).wait(1);

  console.log("Adding DC to Contract...");
  await (await roleManager.addOfficer(
    dcWallet.address,
    "Sepolia DC",
    "5430100000004",
    "dc@sepolia.blrs.gov.pk",
    "Quetta",
    DC_ROLE
  )).wait(1);

  console.log("\nOfficers added successfully!");

  // Output env variables for the backend
  console.log("\n--- COPY THESE TO YOUR .env ---");
  console.log("PATWARI_PRIVATE_KEY=" + patwariWallet.privateKey);
  console.log("TEHSILDAR_PRIVATE_KEY=" + tehsildarWallet.privateKey);
  console.log("DC_PRIVATE_KEY=" + dcWallet.privateKey);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
