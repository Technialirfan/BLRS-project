const express = require("express");

const Dispute = require("../models/Dispute");
const Land = require("../models/Land");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");
const upload = require("../middleware/upload");
const validate = require("../middleware/validate");
const blockchainService = require("../services/blockchainService");
const ipfsService = require("../services/ipfsService");
const auditService = require("../services/auditService");
const {
  fileDisputeValidator,
  reviewDisputeValidator,
  resolveDisputeValidator,
  rejectDisputeValidator,
} = require("../validators/disputeValidators");
const {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  getPagination,
  normalizeParcelId,
} = require("../utils/helpers");
const { AUDIT_ACTIONS, ROLES } = require("../utils/constants");

const router = express.Router();

const canAccessParcel = (officer, land) => {
  if (officer.role === ROLES.ADMIN) return true;
  if (officer.role === ROLES.PATWARI) {
    return String(land.registeredByPatwari || "") === String(officer._id);
  }
  if (!officer.assignedDistrict) return true;
  return land.district === officer.assignedDistrict;
};

router.post(
  "/file",
  protect,
  upload.array("evidenceFiles", 8),
  fileDisputeValidator,
  validate,
  async (req, res, next) => {
    try {
      const parcelId = normalizeParcelId(req.body.parcelId);
      const land = await Land.findOne({ parcelId });

      if (!land) {
        return res.status(404).json(createErrorResponse("Parcel not found"));
      }

      if (!canAccessParcel(req.officer, land)) {
        return res.status(403).json(createErrorResponse("You are not authorized for this district"));
      }

      const normalizeToArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        return [value];
      };

      const inputHashes = normalizeToArray(req.body.evidenceHashes);
      const inputTypes = normalizeToArray(req.body.evidenceTypes);

      const uploadedHashes = [];
      for (const file of req.files || []) {
        const uploadRes = await ipfsService.uploadFile(file.path, file.originalname);
        uploadedHashes.push(uploadRes.ipfsHash);
      }

      const evidenceHashes = [...inputHashes, ...uploadedHashes];
      
      if (evidenceHashes.length === 0) {
        return res.status(400).json(createErrorResponse("At least one evidence file is required"));
      }

      const evidenceTypes = evidenceHashes.map((_, i) => {
        if (inputTypes[i]) return inputTypes[i];
        const fileIndex = i - inputHashes.length;
        if (fileIndex >= 0 && req.files && req.files[fileIndex]) {
          return req.files[fileIndex].mimetype || "document";
        }
        return "document";
      });

      const chainRes = await blockchainService.fileDispute({
        parcelId,
        claimantCNIC: req.body.claimantCNIC,
        claimantName: req.body.claimantName,
        claimantPhone: req.body.claimantPhone,
        disputeType: req.body.disputeType,
        description: req.body.description,
        evidenceHashes,
        evidenceTypes,
      });

      const dispute = await Dispute.create({
        parcelId,
        claimantCNIC: req.body.claimantCNIC,
        claimantName: req.body.claimantName,
        claimantPhone: req.body.claimantPhone || "",
        disputeType: req.body.disputeType,
        description: req.body.description,
        evidenceHashes,
        evidenceTypes,
        filedByOfficer: req.officer._id,
        blockchainTxHash: chainRes.txHash,
        blockchainDisputeId: chainRes.disputeId || null,
      });

      land.isDisputed = true;
      land.status = "Disputed";
      await land.save();

      await auditService.log(
        AUDIT_ACTIONS.DISPUTE_FILED,
        req.officer,
        {
          parcelId,
          disputeType: dispute.disputeType,
          claimantCNIC: dispute.claimantCNIC,
        },
        {
          parcelId,
          disputeId: dispute.disputeId,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

      return res.status(201).json(
        createSuccessResponse("Dispute filed successfully", {
          dispute,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
        })
      );
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
      query.filedByOfficer = req.officer._id;
    } else if ([ROLES.TEHSILDAR, ROLES.DC].includes(req.officer.role)) {
      if (req.officer.assignedDistrict) {
        const districtLandIds = await Land.find({ district: req.officer.assignedDistrict }).select(
          "parcelId"
        );
        query.parcelId = { $in: districtLandIds.map((l) => l.parcelId) };
      }
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.parcelId) {
      query.parcelId = normalizeParcelId(req.query.parcelId);
    }

    const [disputes, total] = await Promise.all([
      Dispute.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("filedByOfficer", "fullName role assignedDistrict")
        .populate("reviewedBy", "fullName role assignedDistrict")
        .populate("resolvedBy", "fullName role assignedDistrict"),
      Dispute.countDocuments(query),
    ]);

    return res.json(
      createPaginatedResponse({
        message: "Disputes fetched successfully",
        items: disputes,
        total,
        page,
        limit,
        key: "disputes",
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", protect, async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate("filedByOfficer", "fullName role assignedDistrict")
      .populate("reviewedBy", "fullName role assignedDistrict")
      .populate("resolvedBy", "fullName role assignedDistrict");

    if (!dispute) {
      return res.status(404).json(createErrorResponse("Dispute not found"));
    }

    const land = await Land.findOne({ parcelId: dispute.parcelId });
    if (land && !canAccessParcel(req.officer, land)) {
      return res.status(403).json(createErrorResponse("You are not authorized for this dispute"));
    }

    return res.json(createSuccessResponse("Dispute fetched successfully", { dispute, land }));
  } catch (error) {
    return next(error);
  }
});

router.put(
  "/:id/review",
  protect,
  authorize(ROLES.TEHSILDAR),
  reviewDisputeValidator,
  validate,
  async (req, res, next) => {
    try {
      const dispute = await Dispute.findById(req.params.id);
      if (!dispute) {
        return res.status(404).json(createErrorResponse("Dispute not found"));
      }

      const land = await Land.findOne({ parcelId: dispute.parcelId });
      if (land && !canAccessParcel(req.officer, land)) {
        return res.status(403).json(createErrorResponse("You are not authorized for this dispute"));
      }

      if (dispute.status !== "Filed") {
        return res
          .status(400)
          .json(createErrorResponse("Only Filed disputes can be marked under review"));
      }

      const chainRes = await blockchainService.markDisputeUnderReview(
        dispute.blockchainDisputeId || dispute.disputeId
      );

      dispute.status = "UnderReview";
      dispute.reviewedBy = req.officer._id;
      dispute.reviewedAt = new Date();
      dispute.blockchainTxHash = chainRes.txHash;
      await dispute.save();

      await auditService.log(
        AUDIT_ACTIONS.DISPUTE_REVIEWED,
        req.officer,
        {
          disputeId: dispute.disputeId,
          parcelId: dispute.parcelId,
        },
        {
          parcelId: dispute.parcelId,
          disputeId: dispute.disputeId,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

      return res.json(
        createSuccessResponse("Dispute moved to under review", {
          dispute,
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
  "/:id/resolve",
  protect,
  authorize(ROLES.DC, ROLES.TEHSILDAR),
  resolveDisputeValidator,
  validate,
  async (req, res, next) => {
    try {
      const dispute = await Dispute.findById(req.params.id);
      if (!dispute) {
        return res.status(404).json(createErrorResponse("Dispute not found"));
      }

      const land = await Land.findOne({ parcelId: dispute.parcelId });
      if (land && !canAccessParcel(req.officer, land)) {
        return res.status(403).json(createErrorResponse("You are not authorized for this dispute"));
      }

      if (land.landType === "Government") {
        if (req.officer.role !== ROLES.DC) {
          return res.status(403).json(createErrorResponse("Only DC can resolve disputes on Government land"));
        }
        if (dispute.status !== "UnderReview") {
          return res.status(400).json(createErrorResponse("Government land dispute must be under review before resolution"));
        }
      } else {
        // Private land (Residential, Commercial, Agricultural, etc)
        // Tehsildar or DC can resolve. DC could theoretically override, but standard is Tehsildar
        if (dispute.status !== "Filed" && dispute.status !== "UnderReview") {
          return res.status(400).json(createErrorResponse("Only Filed or UnderReview disputes can be resolved"));
        }
      }

      const isTehsildar = req.officer.role === ROLES.TEHSILDAR;
      const chainRes = await blockchainService.resolveDispute(
        dispute.blockchainDisputeId || dispute.disputeId,
        req.body.resolution,
        isTehsildar
      );

      dispute.status = "Resolved";
      dispute.resolution = req.body.resolution;
      dispute.resolvedBy = req.officer._id;
      dispute.resolvedAt = new Date();
      dispute.blockchainTxHash = chainRes.txHash;
      await dispute.save();

      if (land) {
        land.isDisputed = false;
        land.status = "Registered";
        land.blockchainTxHash = chainRes.txHash;
        if (chainRes.blockNumber) land.blockNumber = chainRes.blockNumber;
        await land.save();
      }

      await auditService.log(
        AUDIT_ACTIONS.DISPUTE_RESOLVED,
        req.officer,
        {
          disputeId: dispute.disputeId,
          parcelId: dispute.parcelId,
        },
        {
          parcelId: dispute.parcelId,
          disputeId: dispute.disputeId,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

      return res.json(
        createSuccessResponse("Dispute resolved successfully", {
          dispute,
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
  "/:id/reject",
  protect,
  authorize(ROLES.DC, ROLES.TEHSILDAR),
  rejectDisputeValidator,
  validate,
  async (req, res, next) => {
    try {
      const dispute = await Dispute.findById(req.params.id);
      if (!dispute) {
        return res.status(404).json(createErrorResponse("Dispute not found"));
      }

      const land = await Land.findOne({ parcelId: dispute.parcelId });
      if (land && !canAccessParcel(req.officer, land)) {
        return res.status(403).json(createErrorResponse("You are not authorized for this dispute"));
      }

      if (!["Filed", "UnderReview"].includes(dispute.status)) {
        return res
          .status(400)
          .json(createErrorResponse("Resolved disputes cannot be rejected"));
      }

      const chainRes = await blockchainService.rejectDispute(
        dispute.blockchainDisputeId || dispute.disputeId,
        req.body.reason
      );

      dispute.status = "Rejected";
      dispute.rejectionReason = req.body.reason;
      dispute.resolvedBy = req.officer._id;
      dispute.resolvedAt = new Date();
      dispute.blockchainTxHash = chainRes.txHash;
      await dispute.save();

      if (land) {
        land.isDisputed = false;
        land.status = "Registered";
        land.blockchainTxHash = chainRes.txHash;
        if (chainRes.blockNumber) land.blockNumber = chainRes.blockNumber;
        await land.save();
      }

      await auditService.log(
        AUDIT_ACTIONS.DISPUTE_REJECTED,
        req.officer,
        {
          disputeId: dispute.disputeId,
          parcelId: dispute.parcelId,
          reason: req.body.reason,
        },
        {
          parcelId: dispute.parcelId,
          disputeId: dispute.disputeId,
          txHash: chainRes.txHash,
          blockNumber: chainRes.blockNumber,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

      return res.json(
        createSuccessResponse("Dispute rejected successfully", {
          dispute,
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
