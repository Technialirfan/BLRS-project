const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const rmAddress = "0xe0ff51FF1C089c14C636A8696a7081E2c6aAbb13";

  console.log("Adding officers to RoleManager at", rmAddress);
  const RoleManager = await ethers.getContractFactory("RoleManager");
  const roleManager = RoleManager.attach(rmAddress);

  const PATWARI_ROLE = await roleManager.PATWARI_ROLE();
  const TEHSILDAR_ROLE = await roleManager.TEHSILDAR_ROLE();
  const DC_ROLE = await roleManager.DC_ROLE();

  console.log("Adding Patwari...");
  await (await roleManager.addOfficer(
    deployer.address,
    "Amoy Patwari",
    "5430100000002",
    "patwari.quetta@blrs.gov.pk",
    "Quetta",
    PATWARI_ROLE
  )).wait(1);

  console.log("Adding Tehsildar...");
  await (await roleManager.addOfficer(
    deployer.address,
    "Amoy Tehsildar",
    "5430100000003",
    "tehsildar.quetta@blrs.gov.pk",
    "Quetta",
    TEHSILDAR_ROLE
  )).wait(1);

  console.log("Adding DC...");
  await (await roleManager.addOfficer(
    deployer.address,
    "Amoy DC",
    "5430100000004",
    "dc.quetta@blrs.gov.pk",
    "Quetta",
    DC_ROLE
  )).wait(1);

  console.log("Officers added successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
