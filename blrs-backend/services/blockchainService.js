const { getContracts, getSigners } = require("../config/blockchain");

class BlockchainService {
  _getContract(contractKey) {
    const contracts = getContracts();
    const contract = contracts[contractKey];
    if (!contract) {
      throw new Error(
        `Contract '${contractKey}' is not initialized. Check blockchain node, .env addresses, and private keys.`
      );
    }
    return contract;
  }

  _buildReceipt(receipt) {
    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : undefined,
    };
  }

  async registerLand(landData) {
    try {
      const contract = this._getContract("landRegistryPatwari");

      const gpsLat = Number.isFinite(Number(landData.gpsLat))
        ? Math.round(Number(landData.gpsLat) * 1e6)
        : 0;
      const gpsLng = Number.isFinite(Number(landData.gpsLng))
        ? Math.round(Number(landData.gpsLng) * 1e6)
        : 0;

      const landTypeMap = {
        agricultural: 0,
        residential: 1,
        commercial: 2,
        tribal: 3,
        forest: 4,
        government: 5,
        barren: 6,
      };

      const tx = await contract.registerLand(
        landData.parcelId,
        landData.ownerCNIC,
        landData.ownerName,
        "",
        landData.district,
        landData.tehsil,
        landData.mouza,
        Number(landData.areaSqFt),
        landTypeMap[landData.landType] ?? 0,
        landData.primaryDocHash,
        gpsLat,
        gpsLng,
        landData.geoJsonHash || "",
        landData.gisMetadataCID || ""
      );

      const receipt = await tx.wait();
      return this._buildReceipt(receipt);
    } catch (error) {
      throw new Error(`Blockchain registerLand failed: ${error.message}`);
    }
  }

  async addDocument(parcelId, docHash, docType = "Supporting Document") {
    try {
      const contract = this._getContract("landRegistryPatwari");
      const tx = await contract.addDocument(parcelId, docHash, docType);
      const receipt = await tx.wait();
      return this._buildReceipt(receipt);
    } catch (error) {
      throw new Error(`Blockchain addDocument failed: ${error.message}`);
    }
  }

  async verifyLand(parcelId) {
    try {
      const contract = this._getContract("landRegistryTehsildar");
      const tx = await contract.verifyLand(parcelId);
      const receipt = await tx.wait();
      return this._buildReceipt(receipt);
    } catch (error) {
      throw new Error(`Blockchain verifyLand failed: ${error.message}`);
    }
  }

  async approveLandAndMintNFT(parcelId, landData, ownerWallet, isTehsildar = false) {
    try {
      const landRegistry = isTehsildar ? this._getContract("landRegistryTehsildar") : this._getContract("landRegistryDC");
      const landToken = isTehsildar ? this._getContract("landTokenTehsildar") : this._getContract("landTokenDC");
      const signers = getSigners();
      const signer = isTehsildar ? signers.tehsildar : signers.dc;

      const tokenURI = `ipfs://blrs-metadata-${parcelId}`;
      const nonce = await signer.getNonce("latest");
      const mintTx = await landToken.mintLandCertificate(
        ownerWallet || signer.address,
        parcelId,
        landData.ownerCNIC,
        landData.ownerName,
        landData.district,
        Number(landData.areaSqFt),
        landData.landType,
        tokenURI,
        { nonce }
      );
      const mintReceipt = await mintTx.wait();

      let tokenId = 1;
      // Fallback: If parseLog fails, try to fetch totalMinted from contract
      try {
        const count = await landToken.totalMinted();
        tokenId = Number(count);
      } catch (err) {
        // Fallback to 1 if it fails
      }

      for (const log of mintReceipt.logs || []) {
        try {
          const parsed = landToken.interface.parseLog(log);
          if (parsed && parsed.name === "LandTokenMinted") {
            tokenId = Number(parsed.args.tokenId);
            break;
          }
        } catch (_err) {
          // ignored
        }
      }

      const approveTx = await landRegistry.approveLand(parcelId, tokenId, { nonce: nonce + 1 });
      const approveReceipt = await approveTx.wait();

      return {
        ...this._buildReceipt(approveReceipt),
        nftTokenId: tokenId,
        mintTxHash: mintReceipt.hash,
      };
    } catch (error) {
      throw new Error(`Blockchain approveLand failed: ${error.message}`);
    }
  }

  async rejectLandByTehsildar(parcelId, reason) {
    try {
      const contract = this._getContract("landRegistryTehsildar");
      const tx = await contract.rejectLandByTehsildar(parcelId, reason);
      const receipt = await tx.wait();
      return this._buildReceipt(receipt);
    } catch (error) {
      throw new Error(`Blockchain rejectLandByTehsildar failed: ${error.message}`);
    }
  }

  async rejectLandByDC(parcelId, reason) {
    try {
      const contract = this._getContract("landRegistryDC");
      const tx = await contract.rejectLandByDC(parcelId, reason);
      const receipt = await tx.wait();
      return this._buildReceipt(receipt);
    } catch (error) {
      throw new Error(`Blockchain rejectLandByDC failed: ${error.message}`);
    }
  }

  async initiateTransfer(parcelId, transferData) {
    try {
      const contract = this._getContract("landRegistryPatwari");
      const tx = await contract.initiateTransfer(
        parcelId,
        transferData.newOwnerCNIC,
        transferData.newOwnerName,
        "",
        transferData.transferDocHash
      );
      const receipt = await tx.wait();
      return this._buildReceipt(receipt);
    } catch (error) {
      throw new Error(`Blockchain initiateTransfer failed: ${error.message}`);
    }
  }

  async approveTransfer(parcelId, isTehsildar = false) {
    try {
      const contract = isTehsildar ? this._getContract("landRegistryTehsildar") : this._getContract("landRegistryDC");
      const tx = await contract.approveTransfer(parcelId);
      const receipt = await tx.wait();
      return this._buildReceipt(receipt);
    } catch (error) {
      throw new Error(`Blockchain approveTransfer failed: ${error.message}`);
    }
  }

  async rejectTransfer(parcelId, reason) {
    try {
      const contract = this._getContract("landRegistryDC");
      const tx = await contract.rejectTransfer(parcelId, reason);
      const receipt = await tx.wait();
      return this._buildReceipt(receipt);
    } catch (error) {
      throw new Error(`Blockchain rejectTransfer failed: ${error.message}`);
    }
  }

  async fileDispute(disputeData) {
    try {
      const contract = this._getContract("disputePatwari");
      const disputeTypeMap = {
        ownership_claim: 0,
        boundary: 1,
        fraud: 2,
        inheritance: 3,
        other: 4,
      };

      const tx = await contract.fileDispute(
        disputeData.parcelId,
        disputeData.claimantCNIC,
        disputeData.claimantName,
        disputeData.claimantPhone || "",
        disputeTypeMap[disputeData.disputeType] ?? 4,
        disputeData.description,
        disputeData.evidenceHashes || [],
        disputeData.evidenceTypes || []
      );

      const receipt = await tx.wait();
      let disputeId;
      for (const log of receipt.logs || []) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === "DisputeFiled") {
            disputeId = Number(parsed.args.disputeId);
            break;
          }
        } catch (_err) {
          // ignored
        }
      }

      return {
        ...this._buildReceipt(receipt),
        disputeId,
      };
    } catch (error) {
      throw new Error(`Blockchain fileDispute failed: ${error.message}`);
    }
  }

  async markDisputeUnderReview(disputeId) {
    try {
      const contract = this._getContract("disputeTehsildar");
      const tx = await contract.markUnderReview(disputeId);
      const receipt = await tx.wait();
      return this._buildReceipt(receipt);
    } catch (error) {
      throw new Error(`Blockchain markUnderReview failed: ${error.message}`);
    }
  }

  async resolveDispute(disputeId, resolution, isTehsildar = false) {
    try {
      const contract = isTehsildar ? this._getContract("disputeTehsildar") : this._getContract("disputeDC");
      const tx = await contract.resolveDispute(disputeId, resolution);
      const receipt = await tx.wait();
      return this._buildReceipt(receipt);
    } catch (error) {
      throw new Error(`Blockchain resolveDispute failed: ${error.message}`);
    }
  }

  async rejectDispute(disputeId, reason, isTehsildar = false) {
    try {
      const contract = isTehsildar ? this._getContract("disputeTehsildar") : this._getContract("disputeDC");
      const tx = await contract.rejectDispute(disputeId, reason);
      const receipt = await tx.wait();
      return this._buildReceipt(receipt);
    } catch (error) {
      throw new Error(`Blockchain rejectDispute failed: ${error.message}`);
    }
  }

  async getLandFromChain(parcelId) {
    try {
      const contract = this._getContract("landRegistry");
      return await contract.getLand(parcelId);
    } catch (_error) {
      return null;
    }
  }

  async getLandsByOwnerCNIC(cnic) {
    try {
      const contract = this._getContract("landRegistry");
      return await contract.getOwnerByCNIC(cnic);
    } catch (_error) {
      return [];
    }
  }
}

module.exports = new BlockchainService();
