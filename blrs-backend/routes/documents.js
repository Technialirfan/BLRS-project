const express = require("express");

const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const ipfsService = require("../services/ipfsService");
const auditService = require("../services/auditService");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../utils/helpers");
const { AUDIT_ACTIONS } = require("../utils/constants");

const router = express.Router();

router.post("/upload", protect, upload.single("document"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(createErrorResponse("Document file is required"));
    }

    const uploadRes = await ipfsService.uploadFile(req.file.path, req.file.originalname);
    const ipfsUrl = ipfsService.getIPFSUrl(uploadRes.ipfsHash);

    await auditService.log(
      AUDIT_ACTIONS.DOCUMENT_UPLOADED,
      req.officer,
      {
        fileName: req.file.originalname,
        ipfsHash: uploadRes.ipfsHash,
        isFake: uploadRes.isFake,
      },
      {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

    return res.status(201).json(
      createSuccessResponse("Document uploaded successfully", {
        ipfsHash: uploadRes.ipfsHash,
        ipfsUrl,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        isFake: uploadRes.isFake,
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/:hash", protect, async (req, res) => {
  const ipfsUrl = ipfsService.getIPFSUrl(req.params.hash);
  return res.json(
    createSuccessResponse("Document URL generated successfully", {
      ipfsUrl,
      hash: req.params.hash,
    })
  );
});

module.exports = router;
