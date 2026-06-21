const mongoose = require("mongoose");

const DisputeSchema = new mongoose.Schema(
  {
    disputeId: { type: Number, unique: true },
    parcelId: { type: String, required: true, ref: "Land" },
    claimantCNIC: {
      type: String,
      required: true,
      match: [/^\d{13}$/, "CNIC must be 13 digits"],
    },
    claimantName: { type: String, required: true, trim: true },
    claimantPhone: { type: String, trim: true },
    disputeType: {
      type: String,
      enum: ["ownership_claim", "boundary", "fraud", "inheritance", "other"],
      required: true,
    },
    description: {
      type: String,
      required: true,
      minlength: [50, "Description must be at least 50 characters"],
    },
    evidenceHashes: [{ type: String }],
    evidenceTypes: [{ type: String }],
    status: {
      type: String,
      enum: ["Filed", "UnderReview", "Resolved", "Rejected"],
      default: "Filed",
    },
    resolution: { type: String, default: null },
    rejectionReason: { type: String, default: null },
    filedByOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      required: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      default: null,
    },
    blockchainTxHash: { type: String, default: null },
    blockchainDisputeId: { type: Number, default: null },
    filedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

DisputeSchema.pre("save", async function (next) {
  if (this.isNew) {
    const lastDispute = await this.constructor.findOne({}, {}, { sort: { disputeId: -1 } });
    this.disputeId = lastDispute ? lastDispute.disputeId + 1 : 1;
  }
  return next();
});

DisputeSchema.index({ parcelId: 1 });
DisputeSchema.index({ status: 1 });
DisputeSchema.index({ claimantCNIC: 1 });

module.exports = mongoose.model("Dispute", DisputeSchema);
