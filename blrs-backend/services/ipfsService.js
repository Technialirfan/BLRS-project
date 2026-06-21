const fs = require("fs");
const path = require("path");
const { getPinata } = require("../config/ipfs");

class IPFSService {
  async uploadFile(filePath, fileName) {
    const pinata = getPinata();

    if (!pinata) {
      let hashToReturn;
      if (filePath && fs.existsSync(filePath)) {
        // Fallback: keep the file locally so it can be served
        hashToReturn = "local-" + path.basename(filePath);
      } else {
        hashToReturn =
          "Qm" +
          Array.from({ length: 44 }, () =>
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789"[
              Math.floor(Math.random() * 58)
            ]
          ).join("");
      }

      return { success: true, ipfsHash: hashToReturn, isFake: true };
    }

    try {
      const readableStream = fs.createReadStream(filePath);
      const result = await pinata.pinFileToIPFS(readableStream, {
        pinataMetadata: {
          name: fileName || path.basename(filePath),
          keyvalues: {
            system: "BLRS",
            type: "land-document",
          },
        },
        pinataOptions: { cidVersion: 0 },
      });

      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return { success: true, ipfsHash: result.IpfsHash, isFake: false };
    } catch (error) {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  async uploadJSON(jsonData, name) {
    const pinata = getPinata();

    if (!pinata) {
      return {
        success: true,
        ipfsHash: `QmFakeMetadata${Date.now()}`,
        isFake: true,
      };
    }

    try {
      const result = await pinata.pinJSONToIPFS(jsonData, {
        pinataMetadata: { name: name || "blrs-metadata" },
      });
      return { success: true, ipfsHash: result.IpfsHash, isFake: false };
    } catch (error) {
      throw new Error(`IPFS JSON upload failed: ${error.message}`);
    }
  }

  async unpinFile(hash) {
    const pinata = getPinata();
    if (!pinata) return { success: true, isFake: true }; // Local mock

    if (hash && hash.startsWith("Qm")) {
      try {
        await pinata.unpin(hash);
        return { success: true };
      } catch (error) {
        console.error(`Failed to unpin ${hash} from IPFS:`, error.message);
        return { success: false, error: error.message };
      }
    }
    return { success: true };
  }

  getIPFSUrl(hash) {
    return `${process.env.IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/"}${hash}`;
  }
}

module.exports = new IPFSService();
