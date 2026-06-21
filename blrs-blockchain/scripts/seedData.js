const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

function readAddress(item) {
  return typeof item === "string" ? item : item.address;
}

async function main() {
  const network = hre.network.name;
  console.log("\nSeeding data on network:", network);

  const deploymentFile = path.join(
    __dirname,
    "../deployments",
    network === "localhost" ? "localhost.json" : "amoy.json"
  );

  if (!fs.existsSync(deploymentFile)) {
    console.error("No deployment found. Run deploy script first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const signers = await ethers.getSigners();

  const patwariSigner = network === "localhost" ? signers[1] : signers[0];
  const tehsildarSigner = network === "localhost" ? signers[2] : signers[0];
  const dcSigner = network === "localhost" ? signers[3] : signers[0];

  const landRegistryAddress = readAddress(deployment.contracts.LandRegistry);
  const landTokenAddress = readAddress(deployment.contracts.LandToken);

  const landRegistryPatwari = await ethers.getContractAt(
    "LandRegistry",
    landRegistryAddress,
    patwariSigner
  );

  const landRegistryTehsildar = await ethers.getContractAt(
    "LandRegistry",
    landRegistryAddress,
    tehsildarSigner
  );

  const landRegistryDc = await ethers.getContractAt(
    "LandRegistry",
    landRegistryAddress,
    dcSigner
  );

  const landToken = await ethers.getContractAt("LandToken", landTokenAddress, dcSigner);

  console.log("\nSeeding QTA-2024-001 (full workflow)...");
  await (
    await landRegistryPatwari.registerLand(
      "QTA-2024-001",
      "5430155667788",
      "Khan Muhammad Baloch",
      "Khan Muhammad Baloch",
      "Quetta",
      "Quetta",
      "Brewery Road",
      1800,
      1,
      "QmXyz123abcdef456ghijkl789mnopqr012stuvwx345yz",
      30179800,
      67008900
    )
  ).wait();

  await (await landRegistryTehsildar.verifyLand("QTA-2024-001")).wait();

  await (
    await landToken.mintLandCertificate(
      dcSigner.address,
      "QTA-2024-001",
      "5430155667788",
      "Khan Muhammad Baloch",
      "Quetta",
      1800,
      "Residential",
      "ipfs://QmTokenMetadata001"
    )
  ).wait();

  await (await landRegistryDc.approveLand("QTA-2024-001", 1)).wait();

  console.log("Seeding QTA-2024-002 (verified)...");
  await (
    await landRegistryPatwari.registerLand(
      "QTA-2024-002",
      "5430166778899",
      "Bibi Zainab Bugti",
      "Bibi Zainab Bugti",
      "Quetta",
      "Quetta",
      "Sariab Road",
      4500,
      0,
      "QmAbc456defghi789jklmno012pqrstu345vwxyz678abc",
      30195000,
      67020000
    )
  ).wait();

  await (await landRegistryTehsildar.verifyLand("QTA-2024-002")).wait();

  console.log("Seeding GWD-2024-001 (pending)...");
  await (
    await landRegistryPatwari.registerLand(
      "GWD-2024-001",
      "5330177889900",
      "Haji Dost Muhammad Gichki",
      "Haji Dost Muhammad Gichki",
      "Gwadar",
      "Gwadar",
      "Marine Drive",
      9000,
      2,
      "QmDef789ghijkl012mnopqr345stuvwx678yzabc901def",
      25126400,
      62322500
    )
  ).wait();

  console.log("\nSeed data complete.");
  console.log("QTA-2024-001 => Registered (NFT #1)");
  console.log("QTA-2024-002 => Verified");
  console.log("GWD-2024-001 => Pending");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});