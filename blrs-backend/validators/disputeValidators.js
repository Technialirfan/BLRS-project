const { body, param } = require("express-validator");

const fileDisputeValidator = [
  body("parcelId")
    .isString()
    .notEmpty()
    .withMessage("Parcel ID is required")
    .customSanitizer((value) => String(value).toUpperCase()),
  body("claimantCNIC")
    .matches(/^\d{13}$/)
    .withMessage("Please enter a valid 13-digit CNIC"),
  body("claimantName")
    .isString()
    .isLength({ min: 3, max: 100 })
    .withMessage("Claimant name must be 3 to 100 characters"),
  body("claimantPhone")
    .optional()
    .matches(/^03\d{9}$/)
    .withMessage("Phone must start with 03 and be 11 digits"),
  body("disputeType")
    .isIn(["ownership_claim", "boundary", "fraud", "inheritance", "other"])
    .withMessage("Invalid dispute type"),
  body("description")
    .isString()
    .isLength({ min: 50 })
    .withMessage("Description must be at least 50 characters"),
];

const reviewDisputeValidator = [
  param("id").isMongoId().withMessage("Invalid dispute ID"),
];

const resolveDisputeValidator = [
  param("id").isMongoId().withMessage("Invalid dispute ID"),
  body("resolution")
    .isString()
    .isLength({ min: 20 })
    .withMessage("Resolution must be at least 20 characters"),
];

const rejectDisputeValidator = [
  param("id").isMongoId().withMessage("Invalid dispute ID"),
  body("reason")
    .isString()
    .isLength({ min: 10 })
    .withMessage("Reason must be at least 10 characters"),
];

module.exports = {
  fileDisputeValidator,
  reviewDisputeValidator,
  resolveDisputeValidator,
  rejectDisputeValidator,
};