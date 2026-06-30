const mongoose = require("mongoose");

const OwnershipHistorySchema = new mongoose.Schema(
  {
    fromCNIC: { type: String, default: "0000000000000" },
    toCNIC: { type: String, required: true },
    fromName: { type: String, default: "Origin" },
    toName: { type: String, required: true },
    transferDocHash: { type: String },
    transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: "Officer" },
    timestamp: { type: Date, default: Date.now },
    transferType: {
      type: String,
      enum: ["initial_registration", "transfer"],
      default: "initial_registration",
    },
    blockchainTxHash: { type: String },
  },
  { _id: false }
);

const LandSchema = new mongoose.Schema(
  {
    parcelId: {
      type: String,
      required: [true, "Parcel ID is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    blockchainTxHash: { type: String, default: null },
    blockNumber: { type: Number, default: null },

    ownerCNIC: {
      type: String,
      required: [true, "Owner CNIC is required"],
      trim: true,
      match: [/^\d{13}$/, "CNIC must be 13 digits"],
    },
    ownerName: { type: String, required: true, trim: true },

    district: { type: String, required: true, trim: true },
    tehsil: { type: String, required: true, trim: true },
    mouza: { type: String, required: true, trim: true },

    propertyType: {
      type: String,
      enum: ["Private", "Government"],
      default: "Private",
    },

    areaSqFt: {
      type: Number,
      default: null,
    },
    areaMarla: { type: Number },
    areaKanal: { type: Number },
    areaAcre: { type: Number },
    landType: {
      type: String,
      enum: [
        "agricultural",
        "residential",
        "commercial",
        "tribal",
        "forest",
        "government",
        "barren",
      ],
      required: true,
    },

    gisData: {
      type: { type: String, enum: ['Polygon'] },
      coordinates: { type: [[[Number]]] },
    },
    centerPoint: {
      lat: { type: Number },
      lng: { type: Number },
    },
    calculatedArea: {
      sqft: { type: Number },
      marla: { type: Number },
      kanal: { type: Number },
      acre: { type: Number },
    },
    geoJsonHash: { type: String },
    gisMetadataCID: { type: String },

    primaryDocHash: { type: String, required: true },
    allDocHashes: [{ type: String }],
    docTypes: [{ type: String }],

    gpsLat: { type: Number },
    gpsLng: { type: Number },

    status: {
      type: String,
      enum: [
        "SurveyPending",
        "Pending",
        "Verified",
        "Registered",
        "Rejected",
        "TransferPending",
        "Disputed",
        "Suspended",
      ],
      default: "SurveyPending",
    },
    isDisputed: { type: Boolean, default: false },
    rejectionReason: { type: String, default: null },
    suspensionReason: { type: String, default: null },

    pendingTransferCNIC: { type: String, default: null },
    pendingTransferName: { type: String, default: null },
    pendingTransferDocHash: { type: String, default: null },
    transferInitiatedAt: { type: Date, default: null },

    nftTokenId: { type: Number, default: null },

    registeredByPatwari: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      default: null,
    },
    registeredByPatwariName: { type: String, default: null },
    verifiedByTehsildar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      default: null,
    },
    verifiedByTehsildarName: { type: String, default: null },
    verifiedAt: { type: Date, default: null },

    approvedByTehsildar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      default: null,
    },
    approvedByTehsildarName: { type: String, default: null },

    approvedByDC: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      default: null,
    },
    approvedByDCName: { type: String, default: null },

    registeredAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },

    ownershipHistory: [OwnershipHistorySchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

LandSchema.index({ ownerCNIC: 1 });
LandSchema.index({ district: 1, status: 1 });
LandSchema.index({ status: 1 });
LandSchema.index({ landType: 1 });
LandSchema.index({ gisData: "2dsphere" });

LandSchema.pre("save", function (next) {
  if (this.areaSqFt) {
    this.areaMarla = parseFloat((this.areaSqFt / 225).toFixed(2));
    this.areaKanal = parseFloat((this.areaSqFt / 4500).toFixed(3));
    this.areaAcre = parseFloat((this.areaSqFt / 43560).toFixed(4));
  }
  return next();
});

module.exports = mongoose.model("Land", LandSchema);
