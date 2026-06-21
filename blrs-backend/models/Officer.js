const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const OfficerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    cnic: {
      type: String,
      required: [true, "CNIC is required"],
      unique: true,
      trim: true,
      match: [/^\d{13}$/, "CNIC must be exactly 13 digits"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^03\d{9}$/, "Phone must start with 03 and be 11 digits"],
    },
    role: {
      type: String,
      enum: ["admin", "patwari", "tehsildar", "dc"],
      required: [true, "Role is required"],
    },
    assignedDistrict: {
      type: String,
      trim: true,
      default: null,
    },
    walletAddress: {
      type: String,
      trim: true,
      default: null,
      match: [/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"],
    },
    bio: {
      type: String,
      maxlength: 200,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    employmentStatus: {
      type: String,
      enum: ["Active", "Retired", "Promoted", "Transferred", "Deceased"],
      default: "Active",
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    passwordChangedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

OfficerSchema.index({ role: 1, assignedDistrict: 1 });

OfficerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

OfficerSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  return next();
});

OfficerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

OfficerSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTime;
  }
  return false;
};

OfficerSchema.virtual("formattedCNIC").get(function () {
  if (this.cnic && this.cnic.length === 13) {
    return `${this.cnic.slice(0, 5)}-${this.cnic.slice(5, 12)}-${this.cnic.slice(12)}`;
  }
  return this.cnic;
});

module.exports = mongoose.model("Officer", OfficerSchema);
