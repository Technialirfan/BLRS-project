const AuditLog = require("../models/AuditLog");

class AuditService {
  async log(action, officer, details = {}, extras = {}) {
    try {
      if (!officer || !officer._id || !officer.role) return;

      await AuditLog.create({
        action,
        performedBy: officer._id,
        performedByRole: officer.role,
        targetParcelId: extras.parcelId || null,
        targetDisputeId: extras.disputeId || null,
        details,
        txHash: extras.txHash || null,
        blockNumber: extras.blockNumber || null,
        ipAddress: extras.ipAddress || null,
        userAgent: extras.userAgent || null,
      });
    } catch (error) {
      console.error("Audit log failed:", error.message);
    }
  }
}

module.exports = new AuditService();
