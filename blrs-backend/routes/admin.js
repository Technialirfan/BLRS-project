const express = require("express");

const Officer = require("../models/Officer");
const Land = require("../models/Land");
const Dispute = require("../models/Dispute");
const AuditLog = require("../models/AuditLog");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");
const auditService = require("../services/auditService");
const {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  getPagination,
  sanitizeOfficer,
  toCSV,
} = require("../utils/helpers");
const { AUDIT_ACTIONS, ROLES } = require("../utils/constants");

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN));

router.get("/officers", async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const query = {};

    if (req.query.role && req.query.role !== "admin") {
      query.role = req.query.role;
    } else {
      query.role = { $ne: "admin" };
    }
    if (req.query.isActive !== undefined) {
      query.isActive = String(req.query.isActive) === "true";
    }
    if (req.query.district) query.assignedDistrict = req.query.district;

    if (req.query.search) {
      const regex = new RegExp(req.query.search, "i");
      query.$or = [{ fullName: regex }, { email: regex }, { cnic: regex }];
    }

    const [officers, total] = await Promise.all([
      Officer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Officer.countDocuments(query),
    ]);

    return res.json(
      createPaginatedResponse({
        message: "Officers fetched successfully",
        items: officers.map(sanitizeOfficer),
        total,
        page,
        limit,
        key: "officers",
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.post("/officers/create", async (req, res, next) => {
  try {
    const required = ["fullName", "cnic", "email", "role"];
    for (const field of required) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json(createErrorResponse(`${field} is required`));
      }
    }

    if (!["admin", "patwari", "tehsildar", "dc"].includes(req.body.role)) {
      return res.status(400).json(createErrorResponse("Invalid role"));
    }

    if (!/^\d{13}$/.test(req.body.cnic)) {
      return res.status(400).json(createErrorResponse("CNIC must be 13 digits"));
    }

    if (!/^\S+@\S+\.\S+$/.test(req.body.email)) {
      return res.status(400).json(createErrorResponse("Please provide valid email"));
    }

    const duplicate = await Officer.findOne({
      $or: [{ cnic: req.body.cnic }, { email: String(req.body.email).toLowerCase() }],
    });
    if (duplicate) {
      return res
        .status(400)
        .json(createErrorResponse("CNIC or email already exists in the system"));
    }

    const officer = await Officer.create({
      fullName: req.body.fullName,
      cnic: req.body.cnic,
      email: String(req.body.email).toLowerCase(),
      password: req.body.password || "Officer@2024",
      phone: req.body.phone || "",
      role: req.body.role,
      assignedDistrict: req.body.assignedDistrict || null,
      walletAddress: req.body.walletAddress || null,
      bio: req.body.bio || "",
      isActive: true,
    });

    await auditService.log(
      AUDIT_ACTIONS.OFFICER_CREATED,
      req.officer,
      {
        createdOfficerId: officer._id,
        createdOfficerEmail: officer.email,
        createdOfficerRole: officer.role,
      },
      {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

    return res.status(201).json(
      createSuccessResponse("Officer created successfully", {
        officer: sanitizeOfficer(officer),
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.put("/officers/:id/toggle", async (req, res, next) => {
  try {
    const officer = await Officer.findById(req.params.id);
    if (!officer) {
      return res.status(404).json(createErrorResponse("Officer not found"));
    }

    if (String(officer._id) === String(req.officer._id) && officer.isActive) {
      return res
        .status(400)
        .json(createErrorResponse("Admin cannot deactivate their own account"));
    }

    officer.isActive = !officer.isActive;
    await officer.save({ validateBeforeSave: false });

    await auditService.log(
      officer.isActive
        ? AUDIT_ACTIONS.OFFICER_ACTIVATED
        : AUDIT_ACTIONS.OFFICER_DEACTIVATED,
      req.officer,
      {
        targetOfficerId: officer._id,
        targetOfficerEmail: officer.email,
      },
      {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

    return res.json(
      createSuccessResponse(
        `Officer ${officer.isActive ? "activated" : "deactivated"} successfully`,
        {
          officer: sanitizeOfficer(officer),
        }
      )
    );
  } catch (error) {
    return next(error);
  }
});

router.put("/officers/:id/employment-status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["Active", "Retired", "Promoted", "Transferred", "Deceased"].includes(status)) {
      return res.status(400).json(createErrorResponse("Invalid employment status"));
    }

    const officer = await Officer.findById(req.params.id);
    if (!officer) {
      return res.status(404).json(createErrorResponse("Officer not found"));
    }

    if (String(officer._id) === String(req.officer._id) && status !== "Active") {
      return res.status(400).json(createErrorResponse("Admin cannot change their own employment status"));
    }

    officer.employmentStatus = status;
    officer.isActive = status === "Active";
    await officer.save({ validateBeforeSave: false });

    await auditService.log(
      AUDIT_ACTIONS.PROFILE_UPDATED,
      req.officer,
      {
        targetOfficerId: officer._id,
        action: "EMPLOYMENT_STATUS_UPDATED",
        status,
      },
      {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

    return res.json(createSuccessResponse(`Officer status updated to ${status}`));
  } catch (error) {
    return next(error);
  }
});

router.put("/officers/:id/reset-password", async (req, res, next) => {
  try {
    const officer = await Officer.findById(req.params.id);
    if (!officer) {
      return res.status(404).json(createErrorResponse("Officer not found"));
    }

    officer.password = "Officer@2024";
    await officer.save();

    await auditService.log(
      AUDIT_ACTIONS.PROFILE_UPDATED,
      req.officer,
      {
        targetOfficerId: officer._id,
        action: "PASSWORD_RESET",
      },
      {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

    return res.json(createSuccessResponse("Officer password reset successfully to Officer@2024"));
  } catch (error) {
    return next(error);
  }
});

router.put("/officers/:id/district", async (req, res, next) => {
  try {
    const { assignedDistrict } = req.body;
    if (!assignedDistrict) {
      return res.status(400).json(createErrorResponse("assignedDistrict is required"));
    }

    const officer = await Officer.findById(req.params.id);
    if (!officer) {
      return res.status(404).json(createErrorResponse("Officer not found"));
    }

    officer.assignedDistrict = assignedDistrict;
    await officer.save({ validateBeforeSave: false });

    await auditService.log(
      AUDIT_ACTIONS.PROFILE_UPDATED,
      req.officer,
      {
        targetOfficerId: officer._id,
        assignedDistrict,
      },
      {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

    return res.json(
      createSuccessResponse("Officer district updated successfully", {
        officer: sanitizeOfficer(officer),
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/audit-logs/export", async (req, res, next) => {
  try {
    const query = {};

    if (req.query.action) query.action = req.query.action;
    if (req.query.role) query.performedByRole = req.query.role;
    if (req.query.parcelId) query.targetParcelId = req.query.parcelId;

    if (req.query.startDate || req.query.endDate) {
      query.timestamp = {};
      if (req.query.startDate) query.timestamp.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.timestamp.$lte = new Date(req.query.endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .populate("performedBy", "fullName email role");

    const rows = logs.map((log) => ({
      timestamp: log.timestamp,
      action: log.action,
      performedBy: log.performedBy?.fullName || "",
      email: log.performedBy?.email || "",
      role: log.performedByRole,
      parcelId: log.targetParcelId || "",
      disputeId: log.targetDisputeId || "",
      txHash: log.txHash || "",
      ipAddress: log.ipAddress || "",
    }));

    const csv = toCSV(rows, [
      { key: "timestamp", label: "Timestamp" },
      { key: "action", label: "Action" },
      { key: "performedBy", label: "Performed By" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "parcelId", label: "Parcel ID" },
      { key: "disputeId", label: "Dispute ID" },
      { key: "txHash", label: "TX Hash" },
      { key: "ipAddress", label: "IP Address" },
    ]);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="blrs-audit-logs-${Date.now()}.csv"`
    );

    return res.send(csv);
  } catch (error) {
    return next(error);
  }
});

router.get("/audit-logs", async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const query = {};

    if (req.query.action) query.action = req.query.action;
    if (req.query.role) query.performedByRole = req.query.role;
    if (req.query.parcelId) query.targetParcelId = req.query.parcelId;
    if (req.query.disputeId) query.targetDisputeId = Number(req.query.disputeId);

    if (req.query.startDate || req.query.endDate) {
      query.timestamp = {};
      if (req.query.startDate) query.timestamp.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.timestamp.$lte = new Date(req.query.endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate("performedBy", "fullName email role assignedDistrict"),
      AuditLog.countDocuments(query),
    ]);

    return res.json(
      createPaginatedResponse({
        message: "Audit logs fetched successfully",
        items: logs,
        total,
        page,
        limit,
        key: "logs",
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const [
      totalLands,
      totalDisputes,
      totalOfficers,
      landsByStatus,
      disputesByStatus,
      landsByDistrict,
      landsByType,
      officersByRole,
      monthlyRegistrations,
      recentLogs,
      pendingApprovals,
      gisAreaStats,
    ] = await Promise.all([
      Land.countDocuments(),
      Dispute.countDocuments(),
      Officer.countDocuments(),
      Land.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Dispute.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Land.aggregate([
        { $group: { _id: "$district", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Land.aggregate([
        { $group: { _id: "$landType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Officer.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Land.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 5)),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      AuditLog.find().sort({ timestamp: -1 }).limit(5).populate("performedBy", "fullName email"),
      Land.find({ status: { $in: ["Pending", "Verified"] } }).sort({ createdAt: -1 }).limit(5),
      Land.aggregate([
        { $match: { status: "Registered" } },
        { $group: { _id: "$landType", totalAreaSqFt: { $sum: "$areaSqFt" } } },
        { $addFields: { totalArea: { $divide: ["$totalAreaSqFt", 43560] } } }
      ]),
    ]);

    // Calculate District Performance
    const districtStats = await Land.aggregate([
      {
        $group: {
          _id: "$district",
          registered: { $sum: { $cond: [{ $eq: ["$status", "Registered"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          disputed: { $sum: { $cond: [{ $eq: ["$status", "Disputed"] }, 1, 0] } },
        }
      }
    ]);
    
    const officerDistrictCounts = await Officer.aggregate([
      { $group: { _id: "$assignedDistrict", count: { $sum: 1 } } }
    ]);
    
    const districtPerformance = districtStats.map(d => {
      const officerCount = officerDistrictCounts.find(o => o._id === d._id)?.count || 0;
      const total = d.registered + d.pending + d.disputed;
      const score = total === 0 ? 0 : Math.round((d.registered / total) * 100);
      return {
        district: d._id || "Unassigned",
        registered: d.registered,
        pending: d.pending,
        disputed: d.disputed,
        officerCount,
        score
      };
    }).sort((a, b) => b.score - a.score);

    return res.json(
      createSuccessResponse("Admin stats fetched successfully", {
        totals: {
          lands: totalLands,
          disputes: totalDisputes,
          officers: totalOfficers,
        },
        landsByStatus,
        disputesByStatus,
        landsByDistrict,
        landsByType,
        officersByRole,
        monthlyRegistrations,
        recentLogs,
        pendingApprovals,
        districtPerformance,
        gisAreaStats,
      })
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
