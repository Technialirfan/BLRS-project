const express = require("express");

const Land = require("../models/Land");
const Officer = require("../models/Officer");
const crypto = require("crypto");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");
const upload = require("../middleware/upload");
const validate = require("../middleware/validate");
const blockchainService = require("../services/blockchainService");
const ipfsService = require("../services/ipfsService");
const auditService = require("../services/auditService");
const {
  registerLandValidator,
  rejectLandValidator,
  initiateTransferValidator,
} = require("../validators/landValidators");
const {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  getPagination,
  normalizeParcelId,
} = require("../utils/helpers");
const { AUDIT_ACTIONS, ROLES, LAND_STATUSES } = require("../utils/constants");

const router = express.Router();

const checkDistrictAccess = (officer, land) => {
  if (officer.role === ROLES.ADMIN) return true;
  if (officer.role === ROLES.PATWARI) {
    const patwariId = land.registeredByPatwari?._id || land.registeredByPatwari;
    return String(patwariId || "") === String(officer._id);
  }
  if (!officer.assignedDistrict) return true;
  return land.district === officer.assignedDistrict;
};

router.post(
  "/register",
  protect,
  authorize(ROLES.PATWARI),
  upload.single("primaryDoc"),
  registerLandValidator,
  validate,
  async (req, res, next) => {
    try {
      const parcelId = normalizeParcelId(req.body.parcelId);
      const existing = await Land.findOne({ parcelId });
      if (existing) {
        return res.status(400).json(createErrorResponse("Parcel ID already exists"));
      }

      let primaryDocHash = req.body.primaryDocHash;
      if (req.file) {
        const uploadRes = await ipfsService.uploadFile(req.file.path, req.file.originalname);
        primaryDocHash = uploadRes.ipfsHash;
      }

      if (!primaryDocHash) {
        return res
          .status(400)
          .json(createErrorResponse("Primary document is required (file or primaryDocHash)"));
      }

      const allDocHashes = Array.isArray(req.body.allDocHashes) ? req.body.allDocHashes : [primaryDocHash];
      const docTypes = Array.isArray(req.body.docTypes) ? req.body.docTypes : ["Primary Document"];

      const landInput = {
        ...req.body,
        parcelId,
        primaryDocHash,
      };

      let geoJsonHash = "";
      if (req.body.gisData && req.body.gisData.coordinates) {
        const geoJsonString = JSON.stringify(req.body.gisData);
        geoJsonHash = crypto.createHash("sha256").update(geoJsonString).digest("hex");
      }

      // Blockchain interaction removed at Patwari step (moves to DC step)

      const land = await Land.create({
        parcelId,
        ownerCNIC: req.body.ownerCNIC,
        ownerName: req.body.ownerName,
        district: req.body.district,
        tehsil: req.body.tehsil,
        mouza: req.body.mouza,
        propertyType: req.body.propertyType || "Private",
        areaSqFt: req.body.areaSqFt ? Number(req.body.areaSqFt) : null,
        landType: req.body.landType,
        primaryDocHash,
        allDocHashes,
        docTypes,
        gpsLat: req.body.gpsLat,
        gpsLng: req.body.gpsLng,
        gisData: req.body.gisData,
        centerPoint: req.body.centerPoint,
        calculatedArea: req.body.calculatedArea,
        geoJsonHash,
        gisMetadataCID: req.body.gisMetadataCID,
        blockchainTxHash: "Pending...",
        blockNumber: 0,
        registeredByPatwari: req.officer._id,
        registeredByPatwariName: req.officer.fullName,
        registeredAt: new Date(),
        ownershipHistory: [
          {
            fromCNIC: "0000000000000",
            toCNIC: req.body.ownerCNIC,
            fromName: "Origin",
            toName: req.body.ownerName,
            transferDocHash: primaryDocHash,
            transferredBy: req.officer._id,
            transferType: "initial_registration",
            blockchainTxHash: "Pending...",
          },
        ],
      });

      await auditService.log(
        AUDIT_ACTIONS.LAND_REGISTERED,
        req.officer,
        {
          parcelId,
          ownerName: land.ownerName,
          ownerCNIC: land.ownerCNIC,
        },
        {
          parcelId,
          txHash: "Pending...",
          blockNumber: 0,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

      return res.status(201).json(
        createSuccessResponse("Land registered successfully", {
          land,
          txHash: "Pending...",
          blockNumber: 0,
        })
      );
    } catch (error) {
      return next(error);
    }
  }
);

// NEW: Route for mobile GPS live survey
router.put(
  "/:id/survey",
  protect,
  authorize(ROLES.PATWARI),
  async (req, res, next) => {
    try {
      const land = await Land.findById(req.params.id);
      if (!land) {
        return res.status(404).json(createErrorResponse("Land record not found"));
      }

      if (land.status !== "SurveyPending") {
        return res.status(400).json(createErrorResponse("Land is not in SurveyPending status"));
      }

      if (!checkDistrictAccess(req.officer, land)) {
        return res.status(403).json(createErrorResponse("Unauthorized to survey this district"));
      }

      const { gisData, areaSqFt, centerPoint } = req.body;

      if (!gisData || !areaSqFt) {
        return res.status(400).json(createErrorResponse("gisData and areaSqFt are required to complete survey"));
      }

      // Update the land record
      land.gisData = gisData;
      land.areaSqFt = Number(areaSqFt);
      if (centerPoint) land.centerPoint = centerPoint;
      
      // Calculate the hash of the new geometry for security
      const geoJsonString = JSON.stringify(gisData);
      land.geoJsonHash = crypto.createHash("sha256").update(geoJsonString).digest("hex");
      
      // Move status forward to Pending (ready for Tehsildar)
      land.status = "Pending";
      
      await land.save();

      await auditService.log(
        "LAND_SURVEY_COMPLETED",
        req.officer,
        { parcelId: land.parcelId },
        { areaSqFt, ipAddress: req.ip }
      );

      return res.json(createSuccessResponse("Field survey completed successfully", { land }));
    } catch (error) {
      return next(error);
    }
  }
);

router.get("/all", protect, async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const query = {};

    if (req.officer.role === ROLES.PATWARI) {
      query.registeredByPatwari = req.officer._id;
    } else if ([ROLES.TEHSILDAR, ROLES.DC].includes(req.officer.role)) {
      if (req.officer.assignedDistrict) {
        query.district = req.officer.assignedDistrict;
      }
    }

    if (req.query.status && LAND_STATUSES.includes(req.query.status)) {
      query.status = req.query.status;
    }

    if (req.query.landType) {
      query.landType = req.query.landType;
    }

    if (req.officer.role === ROLES.ADMIN && req.query.district) {
      query.district = req.query.district;
    }

    if (req.query.search) {
      const regex = new RegExp(req.query.search, "i");
      query.$or = [
        { parcelId: regex },
        { ownerName: regex },
        { ownerCNIC: regex },
        { tehsil: regex },
        { mouza: regex },
      ];
    }

    const [lands, total] = await Promise.all([
      Land.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("registeredByPatwari", "fullName role assignedDistrict")
        .populate("verifiedByTehsildar", "fullName role assignedDistrict")
        .populate("approvedByDC", "fullName role assignedDistrict"),
      Land.countDocuments(query),
    ]);

    return res.json(
      createPaginatedResponse({
        message: "Lands fetched successfully",
        items: lands,
        total,
        page,
        limit,
        key: "lands",
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/stats/dashboard", protect, async (req, res, next) => {
  try {
    const baseQuery = {};
    if (req.officer.role === ROLES.PATWARI) {
      baseQuery.registeredByPatwari = req.officer._id;
    } else if ([ROLES.TEHSILDAR, ROLES.DC].includes(req.officer.role)) {
      if (req.officer.assignedDistrict) baseQuery.district = req.officer.assignedDistrict;
    }

    const [
      total,
      pending,
      verified,
      registered,
      rejected,
      transferPending,
      disputed,
      byType,
      byDistrict,
    ] = await Promise.all([
      Land.countDocuments(baseQuery),
      Land.countDocuments({ ...baseQuery, status: "Pending" }),
      Land.countDocuments({ ...baseQuery, status: "Verified" }),
      Land.countDocuments({ ...baseQuery, status: "Registered" }),
      Land.countDocuments({ ...baseQuery, status: "Rejected" }),
      Land.countDocuments({ ...baseQuery, status: "TransferPending" }),
      Land.countDocuments({ ...baseQuery, status: "Disputed" }),
      Land.aggregate([
        { $match: baseQuery },
        { $group: { _id: "$landType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Land.aggregate([
        { $match: baseQuery },
        { $group: { _id: "$district", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return res.json(
      createSuccessResponse("Dashboard stats fetched successfully", {
        total,
        statuses: {
          pending,
          verified,
          registered,
          rejected,
          transferPending,
          disputed,
        },
        byType,
        byDistrict,
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/:parcelId/history", protect, async (req, res, next) => {
  try {
    const parcelId = normalizeParcelId(req.params.parcelId);
    const land = await Land.findOne({ parcelId }).populate(
      "ownershipHistory.transferredBy",
      "fullName role"
    );

    if (!land) {
      return res.status(404).json(createErrorResponse("Land not found"));
    }

    if (!checkDistrictAccess(req.officer, land)) {
      return res.status(403).json(createErrorResponse("You are not authorized for this record"));
    }

    return res.json(
      createSuccessResponse("Ownership history fetched successfully", {
        parcelId,
        history: land.ownershipHistory,
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/:parcelId", protect, async (req, res, next) => {
  try {
    const parcelId = normalizeParcelId(req.params.parcelId);
    const land = await Land.findOne({ parcelId })
      .populate("registeredByPatwari", "fullName role assignedDistrict email")
      .populate("verifiedByTehsildar", "fullName role assignedDistrict email")
      .populate("approvedByDC", "fullName role assignedDistrict email")
      .populate("ownershipHistory.transferredBy", "fullName role");

    if (!land) {
      return res.status(404).json(createErrorResponse("Land not found"));
    }

    if (!checkDistrictAccess(req.officer, land)) {
      return res.status(403).json(createErrorResponse("You are not authorized for this record"));
    }

    return res.json(createSuccessResponse("Land fetched successfully", { land }));
  } catch (error) {
    return next(error);
  }
});

router.put(
  "/:parcelId",
  protect,
  authorize(ROLES.PATWARI, ROLES.ADMIN),
  upload.array("newDocs"),
  async (req, res, next) => {
    try {
      const parcelId = normalizeParcelId(req.params.parcelId);
      const land = await Land.findOne({ parcelId });
      if (!land) return res.status(404).json(createErrorResponse("Land not found"));
      if (!checkDistrictAccess(req.officer, land)) {
        return res.status(403).json(createErrorResponse("You are not authorized for this record"));
      }
      if (land.status === "Registered") {
        return res.status(400).json(createErrorResponse("Cannot edit a registered land."));
      }

      const { ownerName, ownerCNIC, district, tehsil, mouza, propertyType, areaSqFt, areaMarla, areaKanal, areaAcre, landType } = req.body;
      if (ownerName) land.ownerName = ownerName;
      if (ownerCNIC) land.ownerCNIC = ownerCNIC;
      if (district) land.district = district;
      if (tehsil) land.tehsil = tehsil;
      if (mouza) land.mouza = mouza;
      if (propertyType) land.propertyType = propertyType;
      if (areaSqFt) land.areaSqFt = areaSqFt;
      if (areaMarla) land.areaMarla = areaMarla;
      if (areaKanal) land.areaKanal = areaKanal;
      if (areaAcre) land.areaAcre = areaAcre;
      if (landType) land.landType = landType;

      // Handle Document Edits
      let retainedDocHashes = [];
      let retainedDocTypes = [];
      
      if (req.body.retainedDocHashes) {
        retainedDocHashes = Array.isArray(req.body.retainedDocHashes) ? req.body.retainedDocHashes : [req.body.retainedDocHashes];
        retainedDocTypes = Array.isArray(req.body.retainedDocTypes) ? req.body.retainedDocTypes : [req.body.retainedDocTypes];
      }

      // Unpin removed documents
      if (land.allDocHashes && land.allDocHashes.length > 0) {
        for (const oldHash of land.allDocHashes) {
          if (!retainedDocHashes.includes(oldHash)) {
            try {
              await ipfsService.unpinFile(oldHash);
            } catch (err) {
              console.error(`Failed to unpin ${oldHash}:`, err.message);
            }
          }
        }
      }

      // Upload new documents
      const newDocHashes = [];
      const newDocTypes = [];
      if (req.files && req.files.length > 0) {
        let types = req.body.newDocTypes || [];
        if (!Array.isArray(types)) types = [types];

        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const uploadRes = await ipfsService.uploadFile(file.path, file.originalname);
          newDocHashes.push(uploadRes.ipfsHash);
          newDocTypes.push(types[i] || "Supporting Document");
        }
      }

      const finalDocHashes = [...retainedDocHashes, ...newDocHashes];
      const finalDocTypes = [...retainedDocTypes, ...newDocTypes];

      if (finalDocHashes.length > 0) {
        land.allDocHashes = finalDocHashes;
        land.docTypes = finalDocTypes;
        land.primaryDocHash = finalDocHashes[0]; // Set the first one as primary
      } else {
        return res.status(400).json(createErrorResponse("At least one document is required."));
      }

      await land.save();
      return res.json(createSuccessResponse("Land updated successfully", { land }));
    } catch (error) {
      return next(error);
    }
  }
);

router.delete(
  "/:parcelId",
  protect,
  authorize(ROLES.PATWARI, ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const parcelId = normalizeParcelId(req.params.parcelId);
      const land = await Land.findOne({ parcelId });
      if (!land) return res.status(404).json(createErrorResponse("Land not found"));
      if (!checkDistrictAccess(req.officer, land)) {
        return res.status(403).json(createErrorResponse("You are not authorized for this record"));
      }
      if (land.status === "Registered") {
        return res.status(400).json(createErrorResponse("Cannot delete a registered land. Revoke it instead."));
      }

      // Unpin all associated files from IPFS before deleting
      if (land.allDocHashes && land.allDocHashes.length > 0) {
        for (const hash of land.allDocHashes) {
          await ipfsService.unpinFile(hash);
        }
      } else if (land.primaryDocHash) {
        await ipfsService.unpinFile(land.primaryDocHash);
      }

      if (land.gisMetadataCID) {
        await ipfsService.unpinFile(land.gisMetadataCID);
      }

      await Land.deleteOne({ parcelId });
      return res.json(createSuccessResponse("Land deleted successfully"));
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  "/:parcelId/verify",
  protect,
  authorize(ROLES.TEHSILDAR),
  async (req, res, next) => {
    try {
      const parcelId = normalizeParcelId(req.params.parcelId);
      const land = await Land.findOne({ parcelId });

      if (!land) {
        return res.status(404).json(createErrorResponse("Land not found"));
      }

      if (!checkDistrictAccess(req.officer, land)) {
        return res.status(403).json(createErrorResponse("You are not authorized for this district"));
      }

      if (land.status !== "Pending") {
        return res
          .status(400)
          .json(createErrorResponse("Only Pending land can be verified"));
      }

      if (land.propertyType === "Private") {
        // Full workflow executed by Tehsildar for Private Land
        await blockchainService.registerLand(land);
        await blockchainService.verifyLand(parcelId);
        const chainRes = await blockchainService.approveLandAndMintNFT(
          parcelId,
          land,
          req.body.ownerWallet || process.env.DEPLOYER_WALLET || "0x000000000000000000000000000000000000dEaD",
          true
        );

        land.status = "Registered";
        land.verifiedByTehsildar = req.officer._id;
        land.verifiedByTehsildarName = req.officer.fullName;
        land.verifiedAt = new Date();
        land.approvedByTehsildar = req.officer._id;
        land.approvedByTehsildarName = req.officer.fullName;
        land.approvedAt = new Date();
        land.nftTokenId = chainRes.nftTokenId;
        land.blockchainTxHash = chainRes.txHash;
        land.blockNumber = chainRes.blockNumber;
        await land.save();

        await auditService.log(
          AUDIT_ACTIONS.LAND_APPROVED,
          req.officer,
          { parcelId, nftTokenId: chainRes.nftTokenId, autoApproved: true },
          {
            parcelId,
            txHash: chainRes.txHash,
            blockNumber: chainRes.blockNumber,
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
          }
        );

        return res.json(
          createSuccessResponse("Private Land verified and approved successfully", {
            land,
            txHash: chainRes.txHash,
            blockNumber: chainRes.blockNumber,
            nftTokenId: chainRes.nftTokenId,
            mintTxHash: chainRes.mintTxHash,
          })
        );
      }

      // Government Land Logic: Blockchain interaction moved to DC step
      land.status = "Verified";
      land.verifiedByTehsildar = req.officer._id;
      land.verifiedByTehsildarName = req.officer.fullName;
      land.verifiedAt = new Date();
      land.blockchainTxHash = "Pending...";
      land.blockNumber = 0;
      await land.save();

      await auditService.log(
        AUDIT_ACTIONS.LAND_VERIFIED,
        req.officer,
        { parcelId },
        {
          parcelId,
          txHash: "Pending...",
          blockNumber: 0,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

      return res.json(
        createSuccessResponse("Land verified successfully", {
          land,
          txHash: "Pending...",
          blockNumber: 0,
        })
      );
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  "/:parcelId/approve",
  protect,
  authorize(ROLES.DC),
  async (req, res, next) => {
    try {
      const parcelId = normalizeParcelId(req.params.parcelId);
      const land = await Land.findOne({ parcelId });

      if (!land) {
        return res.status(404).json(createErrorResponse("Land not found"));
      }

      if (!checkDistrictAccess(req.officer, land)) {
        return res.status(403).json(createErrorResponse("You are not authorized for this district"));
      }

      if (land.status !== "Verified") {
        return res
          .status(400)
          .json(createErrorResponse("Only Verified land can be approved"));
      }

      if (land.propertyType === "Private") {
        return res
          .status(400)
          .json(createErrorResponse("Private lands do not require DC approval"));
      }

      // Synchronously execute the full blockchain workflow (Patwari -> Tehsildar -> DC)
      await blockchainService.registerLand(land);
      await blockchainService.verifyLand(parcelId);
      const chainRes = await blockchainService.approveLandAndMintNFT(
        parcelId,
        land,
        req.body.ownerWallet
      );

      land.status = "Registered";
      land.approvedByDC = req.officer._id;
      land.approvedByDCName = req.officer.fullName;
      land.approvedAt = new Date();
      land.nftTokenId = chainRes.nftTokenId;
      land.blockchainTxHash = chainRes.txHash;
      land.blockNumber = chainRes.blockNumber;
      await land.save();

      await auditService.log(
        AUDIT_ACTIONS.LAND_APPROVED,
        req.officer,
        { parcelId, nftTokenId: chainRes.nftTokenId },
        {
          parcelId,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

      return res.json(
        createSuccessResponse("Land approved successfully", {
          land,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
          nftTokenId: chainRes.nftTokenId,
          mintTxHash: chainRes.mintTxHash,
        })
      );
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  "/:parcelId/reject",
  protect,
  authorize(ROLES.TEHSILDAR, ROLES.DC),
  rejectLandValidator,
  validate,
  async (req, res, next) => {
    try {
      const parcelId = normalizeParcelId(req.params.parcelId);
      const { reason } = req.body;
      const land = await Land.findOne({ parcelId });

      if (!land) {
        return res.status(404).json(createErrorResponse("Land not found"));
      }

      if (!checkDistrictAccess(req.officer, land)) {
        return res.status(403).json(createErrorResponse("You are not authorized for this district"));
      }

      let chainRes;
      if (req.officer.role === ROLES.TEHSILDAR) {
        if (land.status !== "Pending") {
          return res
            .status(400)
            .json(createErrorResponse("Tehsildar can reject only Pending land"));
        }
        chainRes = await blockchainService.rejectLandByTehsildar(parcelId, reason);
      } else {
        if (land.status !== "Verified") {
          return res
            .status(400)
            .json(createErrorResponse("DC can reject only Verified land"));
        }
        chainRes = await blockchainService.rejectLandByDC(parcelId, reason);
      }

      land.status = "Rejected";
      land.rejectionReason = reason;
      land.blockchainTxHash = chainRes.txHash;
      land.blockNumber = chainRes.blockNumber;
      await land.save();

      await auditService.log(
        AUDIT_ACTIONS.LAND_REJECTED,
        req.officer,
        { parcelId, reason },
        {
          parcelId,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

      return res.json(
        createSuccessResponse("Land rejected successfully", {
          land,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
        })
      );
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  "/:parcelId/revoke",
  protect,
  authorize(ROLES.ADMIN, ROLES.DC),
  async (req, res, next) => {
    try {
      const parcelId = normalizeParcelId(req.params.parcelId);
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json(createErrorResponse("Reason is required for revocation"));
      }

      const land = await Land.findOne({ parcelId });
      if (!land) return res.status(404).json(createErrorResponse("Land not found"));

      if (land.status !== "Registered") {
        return res.status(400).json(createErrorResponse("Only Registered land can be revoked"));
      }

      land.status = "Suspended";
      land.suspensionReason = reason;
      await land.save();

      await auditService.log(
        AUDIT_ACTIONS.LAND_REJECTED, // mapping revocation to rejected action type for now
        req.officer,
        { parcelId, reason, action: "REVOKED" },
        {
          parcelId,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

      return res.json(createSuccessResponse("Land registration suspended/revoked successfully", { land }));
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/:parcelId/transfer/initiate",
  protect,
  authorize(ROLES.PATWARI),
  upload.single("transferDocument"),
  initiateTransferValidator,
  validate,
  async (req, res, next) => {
    try {
      const parcelId = normalizeParcelId(req.params.parcelId);
      const land = await Land.findOne({ parcelId });

      if (!land) {
        return res.status(404).json(createErrorResponse("Land not found"));
      }

      if (!checkDistrictAccess(req.officer, land)) {
        return res.status(403).json(createErrorResponse("You are not authorized for this record"));
      }

      if (land.status !== "Registered") {
        return res
          .status(400)
          .json(createErrorResponse("Only Registered land can be transferred"));
      }

      if (land.isDisputed) {
        return res
          .status(400)
          .json(createErrorResponse("Cannot transfer disputed land"));
      }

      let transferDocHash = req.body.transferDocHash;
      if (req.file) {
        const uploadRes = await ipfsService.uploadFile(req.file.path, req.file.originalname);
        transferDocHash = uploadRes.ipfsHash;
      }

      if (!transferDocHash) {
        return res
          .status(400)
          .json(
            createErrorResponse(
              "Transfer document is required (file or transferDocHash)"
            )
          );
      }

      const transferData = {
        newOwnerCNIC: req.body.newOwnerCNIC,
        newOwnerName: req.body.newOwnerName,
        transferDocHash,
      };

      const chainRes = await blockchainService.initiateTransfer(parcelId, transferData);

      land.status = "TransferPending";
      land.pendingTransferCNIC = transferData.newOwnerCNIC;
      land.pendingTransferName = transferData.newOwnerName;
      land.pendingTransferDocHash = transferData.transferDocHash;
      land.transferInitiatedAt = new Date();
      land.blockchainTxHash = chainRes.txHash;
      land.blockNumber = chainRes.blockNumber;
      await land.save();

      await auditService.log(
        AUDIT_ACTIONS.TRANSFER_INITIATED,
        req.officer,
        { parcelId, newOwnerCNIC: transferData.newOwnerCNIC },
        {
          parcelId,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

      return res.json(
        createSuccessResponse("Transfer initiated successfully", {
          land,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
        })
      );
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  "/:parcelId/transfer/approve",
  protect,
  authorize(ROLES.TEHSILDAR, ROLES.DC),
  async (req, res, next) => {
    try {
      const parcelId = normalizeParcelId(req.params.parcelId);
      const land = await Land.findOne({ parcelId });

      if (!land) {
        return res.status(404).json(createErrorResponse("Land not found"));
      }

      if (req.officer.role === ROLES.TEHSILDAR && land.propertyType !== "Private") {
        return res.status(403).json(createErrorResponse("Tehsildar can only approve private land transfers"));
      }

      if (!checkDistrictAccess(req.officer, land)) {
        return res.status(403).json(createErrorResponse("You are not authorized for this district"));
      }

      if (land.status !== "TransferPending") {
        return res
          .status(400)
          .json(createErrorResponse("Land transfer is not pending"));
      }

      const oldOwnerCNIC = land.ownerCNIC;
      const oldOwnerName = land.ownerName;
      const transferDocHash = land.pendingTransferDocHash || "";

      const chainRes = await blockchainService.approveTransfer(parcelId);

      land.ownerCNIC = land.pendingTransferCNIC;
      land.ownerName = land.pendingTransferName;
      land.status = "Registered";
      land.pendingTransferCNIC = null;
      land.pendingTransferName = null;
      land.pendingTransferDocHash = null;
      land.transferInitiatedAt = null;
      land.blockchainTxHash = chainRes.txHash;
      land.blockNumber = chainRes.blockNumber;

      land.ownershipHistory.push({
        fromCNIC: oldOwnerCNIC,
        toCNIC: land.ownerCNIC,
        fromName: oldOwnerName,
        toName: land.ownerName,
        transferDocHash,
        transferredBy: req.officer._id,
        transferType: "transfer",
        blockchainTxHash: chainRes.txHash,
      });

      await land.save();

      await auditService.log(
        AUDIT_ACTIONS.TRANSFER_APPROVED,
        req.officer,
        {
          parcelId,
          fromCNIC: oldOwnerCNIC,
          toCNIC: land.ownerCNIC,
        },
        {
          parcelId,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

      return res.json(
        createSuccessResponse("Transfer approved successfully", {
          land,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
        })
      );
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  "/:parcelId/transfer/reject",
  protect,
  authorize(ROLES.DC),
  async (req, res, next) => {
    try {
      const parcelId = normalizeParcelId(req.params.parcelId);
      const reason = req.body.reason;

      if (!reason || String(reason).trim().length < 10) {
        return res
          .status(400)
          .json(createErrorResponse("Reason must be at least 10 characters"));
      }

      const land = await Land.findOne({ parcelId });
      if (!land) {
        return res.status(404).json(createErrorResponse("Land not found"));
      }

      if (!checkDistrictAccess(req.officer, land)) {
        return res.status(403).json(createErrorResponse("You are not authorized for this district"));
      }

      if (land.status !== "TransferPending") {
        return res
          .status(400)
          .json(createErrorResponse("Land transfer is not pending"));
      }

      const chainRes = await blockchainService.rejectTransfer(parcelId, reason);

      land.status = "Registered";
      land.pendingTransferCNIC = null;
      land.pendingTransferName = null;
      land.pendingTransferDocHash = null;
      land.transferInitiatedAt = null;
      land.blockchainTxHash = chainRes.txHash;
      land.blockNumber = chainRes.blockNumber;
      await land.save();

      await auditService.log(
        AUDIT_ACTIONS.TRANSFER_REJECTED,
        req.officer,
        { parcelId, reason },
        {
          parcelId,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

      return res.json(
        createSuccessResponse("Transfer rejected successfully", {
          land,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
        })
      );
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/:parcelId/documents",
  protect,
  authorize(ROLES.PATWARI),
  upload.single("document"),
  async (req, res, next) => {
    try {
      const parcelId = normalizeParcelId(req.params.parcelId);
      const docType = req.body.docType || "Supporting Document";
      const land = await Land.findOne({ parcelId });

      if (!land) {
        return res.status(404).json(createErrorResponse("Land not found"));
      }

      if (!checkDistrictAccess(req.officer, land)) {
        return res.status(403).json(createErrorResponse("You are not authorized for this record"));
      }

      let docHash = req.body.docHash;
      if (req.file) {
        const uploadRes = await ipfsService.uploadFile(req.file.path, req.file.originalname);
        docHash = uploadRes.ipfsHash;
      }

      if (!docHash) {
        return res
          .status(400)
          .json(createErrorResponse("Document is required (file or docHash)"));
      }

      const chainRes = await blockchainService.addDocument(parcelId, docHash, docType);

      land.allDocHashes.push(docHash);
      land.docTypes.push(docType);
      land.blockchainTxHash = chainRes.txHash;
      land.blockNumber = chainRes.blockNumber;
      await land.save();

      await auditService.log(
        AUDIT_ACTIONS.DOCUMENT_UPLOADED,
        req.officer,
        {
          parcelId,
          docType,
        },
        {
          parcelId,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

      return res.status(201).json(
        createSuccessResponse("Document added successfully", {
          parcelId,
          docHash,
          docType,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
        })
      );
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;

