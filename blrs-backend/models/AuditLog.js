const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "LAND_REGISTERED",
        "LAND_VERIFIED",
        "LAND_APPROVED",
        "LAND_REJECTED",
        "TRANSFER_INITIATED",
        "TRANSFER_APPROVED",
        "TRANSFER_REJECTED",
        "DISPUTE_FILED",
        "DISPUTE_REVIEWED",
        "DISPUTE_RESOLVED",
        "DISPUTE_REJECTED",
        "OFFICER_CREATED",
        "OFFICER_DEACTIVATED",
        "OFFICER_ACTIVATED",
        "OFFICER_LOGIN",
        "OFFICER_LOGOUT",
        "DOCUMENT_UPLOADED",
        "PROFILE_UPDATED",
        "PASSWORD_CHANGED",
      ],
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      required: true,
    },
    performedByRole: {
      type: String,
      enum: ["admin", "patwari", "tehsildar", "dc"],
      required: true,
    },
    targetParcelId: { type: String, default: null },
    targetDisputeId: { type: Number, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    txHash: { type: String, default: null },
    blockNumber: { type: Number, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ performedBy: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ targetParcelId: 1 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);