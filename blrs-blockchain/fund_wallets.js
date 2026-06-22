require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
  
  // The user's main private key from .env
  const mainPK = process.env.PRIVATE_KEY;
  if (!mainPK) {
    throw new Error("PRIVATE_KEY not found in .env");
  }

  const deployer = new ethers.Wallet(mainPK, provider);
  const balance = await provider.getBalance(deployer.address);
  console.log(`Deployer Wallet: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.2")) {
    throw new Error("Insufficient balance to fund 3 wallets");
  }

  console.log("\nGenerating 3 new officer wallets...");
  const patwari = ethers.Wallet.createRandom().connect(provider);
  const tehsildar = ethers.Wallet.createRandom().connect(provider);
  const dc = ethers.Wallet.createRandom().connect(provider);

  const newWallets = [
    { name: "Patwari", wallet: patwari },
    { name: "Tehsildar", wallet: tehsildar },
    { name: "DC", wallet: dc }
  ];

  const fundAmount = ethers.parseEther("0.05");

  for (const w of newWallets) {
    console.log(`\nFunding ${w.name} Wallet: ${w.wallet.address}...`);
    const tx = await deployer.sendTransaction({
      to: w.wallet.address,
      value: fundAmount
    });
    console.log(`Tx Hash: ${tx.hash}`);
    await tx.wait();
    console.log(`Funded ${w.name} with 0.05 ETH`);
    console.log(`PRIVATE_KEY_${w.name.toUpperCase()}=${w.wallet.privateKey}`);
  }

  console.log("\nAll wallets funded successfully!");
}

main().catch(console.error);
