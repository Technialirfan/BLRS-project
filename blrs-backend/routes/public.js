const express = require("express");

const Land = require("../models/Land");
const Officer = require("../models/Officer");
const Dispute = require("../models/Dispute");
const {
  createSuccessResponse,
  createErrorResponse,
  normalizeParcelId,
  truncateHash,
} = require("../utils/helpers");

const router = express.Router();

const toPublicLand = (land) => ({
  parcelId: land.parcelId,
  ownerName: land.ownerName,
  district: land.district,
  tehsil: land.tehsil,
  mouza: land.mouza,
  areaMarla: land.areaMarla,
  landType: land.landType,
  status: land.status,
  registeredAt: land.registeredAt,
  blockchainTxHash: land.blockchainTxHash,
  gisData: land.gisData,
});

router.get("/gis", async (req, res, next) => {
  try {
    const lands = await Land.find({ "gisData.coordinates": { $exists: true, $not: { $size: 0 } } })
      .select("parcelId status gisData");
    
    return res.json(createSuccessResponse("GIS data fetched", lands));
  } catch (error) {
    return next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const { cnic, parcelId } = req.query;

    if (!cnic && !parcelId) {
      return res
        .status(400)
        .json(createErrorResponse("Provide either cnic or parcelId in query"));
    }

    let lands = [];

    if (cnic) {
      if (!/^\d{13}$/.test(String(cnic))) {
        return res.status(400).json(createErrorResponse("CNIC must be 13 digits"));
      }

      lands = await Land.find({ ownerCNIC: String(cnic) })
        .sort({ createdAt: -1 })
        .select(
          "parcelId ownerName district tehsil mouza areaMarla landType status registeredAt blockchainTxHash gisData"
        );
    }

    if (parcelId) {
      const parcel = await Land.findOne({
        parcelId: normalizeParcelId(parcelId),
      }).select(
        "parcelId ownerName district tehsil mouza areaMarla landType status registeredAt blockchainTxHash gisData"
      );

      lands = parcel ? [parcel] : [];
    }

    return res.json(
      createSuccessResponse("Public search completed", {
        count: lands.length,
        lands: lands.map(toPublicLand),
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/land/:parcelId", async (req, res, next) => {
  try {
    const land = await Land.findOne({
      parcelId: normalizeParcelId(req.params.parcelId),
    }).select(
      "parcelId ownerName district tehsil mouza areaMarla landType status registeredAt blockchainTxHash"
    );

    if (!land) {
      return res.status(404).json(createErrorResponse("Land not found"));
    }

    return res.json(
      createSuccessResponse("Land fetched successfully", {
        land: toPublicLand(land),
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const [totalLands, totalRegistered, districts, activeOfficers, disputesResolved] = await Promise.all([
      Land.countDocuments(),
      Land.countDocuments({ status: "Registered" }),
      Land.distinct("district"),
      Officer.countDocuments({ employmentStatus: "Active", role: { $ne: "admin" } }),
      Dispute.countDocuments({ status: "Resolved" }),
    ]);

    return res.json(
      createSuccessResponse("Public stats fetched successfully", {
        totalLands,
        totalRegistered,
        totalDistricts: districts.length,
        activeOfficers,
        disputesResolved,
      })
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
