const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

function readAddress(item) {
  return typeof item === "string" ? item : item.address;
}

async function verifyWithDelay(address, args = []) {
  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments: args,
    });
    console.log(`Verified: ${address}`);
  } catch (error) {
    if (
      String(error.message || "").toLowerCase().includes("already verified") ||
      String(error.message || "").toLowerCase().includes("already been verified")
    ) {
      console.log(`Already verified: ${address}`);
      return;
    }
    throw error;
  }
}

async function main() {
  const network = hre.network.name;
  if (network !== "amoy") {
    throw new Error("verify.js should be run with --network amoy");
  }

  const deploymentPath = path.join(__dirname, "../deployments/amoy.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("deployments/amoy.json not found. Run deploy:amoy first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contracts = deployment.contracts;

  const rm = readAddress(contracts.RoleManager);
  const lr = readAddress(contracts.LandRegistry);
  const dr = readAddress(contracts.DisputeResolution);
  const lt = readAddress(contracts.LandToken);

  console.log("Verifying RoleManager...");
  await verifyWithDelay(rm, [deployment.deployer]);

  console.log("Verifying LandRegistry...");
  await verifyWithDelay(lr, [rm]);

  console.log("Verifying DisputeResolution...");
  await verifyWithDelay(dr, [rm, lr]);

  console.log("Verifying LandToken...");
  await verifyWithDelay(lt, [rm]);

  console.log("All contracts verified.");
}

main().catch((error) => {
  console.error("Verification failed:", error);
  process.exit(1);
});