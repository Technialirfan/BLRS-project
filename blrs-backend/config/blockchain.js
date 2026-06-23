const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const loadABI = (contractName) => {
  const abiPath = path.join(__dirname, "../contracts/abis", `${contractName}.json`);

  if (!fs.existsSync(abiPath)) {
    console.warn(`ABI not found: ${contractName}.json`);
    return [];
  }

  const artifact = JSON.parse(fs.readFileSync(abiPath, "utf8"));
  return artifact.abi || artifact;
};

const RoleManagerABI = loadABI("RoleManager");
const LandRegistryABI = loadABI("LandRegistry");
const DisputeResolutionABI = loadABI("DisputeResolution");
const LandTokenABI = loadABI("LandToken");

const CONTRACT_ADDRESSES = {
  roleManager: "0xEFaF31B21211128b92Eb8ED90B569fE882632b1e",
  landRegistry: "0xcBcb3eB0b965aa973fA916997D699db8739c67BB",
  disputeResolution: "0x567D6eEC3458f0af993f98133Bb3a3df3449Bcdf",
  landToken: "0x44cb9A8fAE194e3338b7b51d11A88AD2cc8909EF",
};

let provider;
let signers = {};
let contracts = {};

const initBlockchain = async () => {
  try {
    provider = new ethers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545"
    );

    const network = await provider.getNetwork();
    console.log(`Blockchain Connected: ${network.name} (${network.chainId})`);

    const mkWallet = (pk) => (pk ? new ethers.Wallet(pk, provider) : null);

    signers = {
      deployer: mkWallet(process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY_DEPLOYER),
      patwari: mkWallet(process.env.PATWARI_PRIVATE_KEY || process.env.PRIVATE_KEY_PATWARI),
      tehsildar: mkWallet(process.env.TEHSILDAR_PRIVATE_KEY || process.env.PRIVATE_KEY_TEHSILDAR),
      dc: mkWallet(process.env.DC_PRIVATE_KEY || process.env.PRIVATE_KEY_DC),
    };

    const readContracts = {
      roleManager: new ethers.Contract(
        CONTRACT_ADDRESSES.roleManager,
        RoleManagerABI,
        provider
      ),
      landRegistry: new ethers.Contract(
        CONTRACT_ADDRESSES.landRegistry,
        LandRegistryABI,
        provider
      ),
      disputeResolution: new ethers.Contract(
        CONTRACT_ADDRESSES.disputeResolution,
        DisputeResolutionABI,
        provider
      ),
      landToken: new ethers.Contract(
        CONTRACT_ADDRESSES.landToken,
        LandTokenABI,
        provider
      ),
    };

    const maybeContract = (address, abi, signer) =>
      signer ? new ethers.Contract(address, abi, signer) : null;

    contracts = {
      landRegistryPatwari: maybeContract(
        CONTRACT_ADDRESSES.landRegistry,
        LandRegistryABI,
        signers.patwari
      ),
      landRegistryTehsildar: maybeContract(
        CONTRACT_ADDRESSES.landRegistry,
        LandRegistryABI,
        signers.tehsildar
      ),
      landRegistryDC: maybeContract(
        CONTRACT_ADDRESSES.landRegistry,
        LandRegistryABI,
        signers.dc
      ),
      landTokenDC: maybeContract(
        CONTRACT_ADDRESSES.landToken,
        LandTokenABI,
        signers.dc
      ),
      landTokenTehsildar: maybeContract(
        CONTRACT_ADDRESSES.landToken,
        LandTokenABI,
        signers.tehsildar
      ),
      disputePatwari: maybeContract(
        CONTRACT_ADDRESSES.disputeResolution,
        DisputeResolutionABI,
        signers.patwari
      ),
      disputeTehsildar: maybeContract(
        CONTRACT_ADDRESSES.disputeResolution,
        DisputeResolutionABI,
        signers.tehsildar
      ),
      disputeDC: maybeContract(
        CONTRACT_ADDRESSES.disputeResolution,
        DisputeResolutionABI,
        signers.dc
      ),
      roleManagerAdmin: maybeContract(
        CONTRACT_ADDRESSES.roleManager,
        RoleManagerABI,
        signers.deployer
      ),
      ...readContracts,
    };

    console.log("Smart contracts initialized");
    return { provider, signers, contracts };
  } catch (error) {
    console.error("Blockchain initialization failed:", error.message);
    console.log("Run hardhat node in blrs-blockchain to enable blockchain operations.");
    return null;
  }
};

const getContracts = () => contracts;
const getProvider = () => provider;
const getSigners = () => signers;

module.exports = { initBlockchain, getContracts, getProvider, getSigners };