const hre = require("hardhat");

async function main() {
  console.log("Fetching recent blockchain transactions...\n");
  
  const latestBlockNumber = await hre.ethers.provider.getBlockNumber();
  const blocksToFetch = Math.min(latestBlockNumber, 50); // Fetch up to last 50 blocks
  
  console.log(`Latest Block Number on Local Network: ${latestBlockNumber}`);
  console.log("==================================================");
  
  let foundTxs = 0;

  for (let i = latestBlockNumber; i > latestBlockNumber - blocksToFetch; i--) {
    const block = await hre.ethers.provider.getBlock(i);
    
    if (block && block.transactions.length > 0) {
      console.log(`\nBlock #${block.number} | Mined: ${new Date(block.timestamp * 1000).toLocaleString()}`);
      
      for (const txHash of block.transactions) {
        const tx = await hre.ethers.provider.getTransactionReceipt(txHash);
        const gasUsed = tx ? tx.gasUsed.toString() : "Unknown";
        
        console.log(`  -> Hash:     ${txHash}`);
        console.log(`  -> Gas Used: ${gasUsed}`);
        foundTxs++;
      }
      console.log("--------------------------------------------------");
    }
  }

  if (foundTxs === 0) {
    console.log("No transactions found in the recent blocks.");
  } else {
    console.log(`\nTotal transactions found in last ${blocksToFetch} blocks: ${foundTxs}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
