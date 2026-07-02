// generateWallets.js
const { ethers } = require("ethers");

console.log("==========================================");
console.log("🚀 BLRS Wallet Generation Script");
console.log("==========================================\n");

const roles = ["Deployer / Admin", "Patwari", "Tehsildar", "DC"];

roles.forEach(role => {
    // This function mathematically creates a completely new, secure Ethereum wallet
    const wallet = ethers.Wallet.createRandom();

    console.log(`[${role} Wallet]`);
    console.log(`Public Address : ${wallet.address}`);
    console.log(`Private Key    : ${wallet.privateKey}`);
    console.log("------------------------------------------");
});

console.log("\n✅ Copy these Private Keys into your backend .env file!");
console.log("✅ Send Sepolia ETH to the Public Addresses using a Faucet to pay for gas fees.");
