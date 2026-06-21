const PinataSDK = require("@pinata/sdk");

let pinata;

const initIPFS = async () => {
  try {
    if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_API_KEY) {
      console.warn("IPFS (Pinata) keys not configured. Using fallback mode.");
      return;
    }

    pinata = new PinataSDK({
      pinataApiKey: process.env.PINATA_API_KEY,
      pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY,
    });

    const result = await pinata.testAuthentication();
    if (result.authenticated) {
      console.log("IPFS (Pinata) Connected");
    }
  } catch (error) {
    console.warn("IPFS (Pinata) not connected:", error.message);
    console.warn("Documents will use fallback fake hashes in development.");
  }
};

const getPinata = () => pinata;

module.exports = { initIPFS, getPinata };