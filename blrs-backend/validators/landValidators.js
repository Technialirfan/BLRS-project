const { body, param } = require("express-validator");

const registerLandValidator = [
  body("parcelId")
    .isString()
    .notEmpty()
    .withMessage("Parcel ID is required")
    .customSanitizer((value) => String(value).toUpperCase()),
  body("ownerCNIC")
    .matches(/^\d{13}$/)
    .withMessage("Please enter a valid 13-digit CNIC"),
  body("ownerName")
    .isString()
    .isLength({ min: 3, max: 100 })
    .withMessage("Owner name must be 3 to 100 characters"),
  body("district").isString().notEmpty().withMessage("District is required"),
  body("tehsil").isString().notEmpty().withMessage("Tehsil is required"),
  body("mouza").isString().notEmpty().withMessage("Mouza is required"),
  body("landType")
    .isIn([
      "agricultural",
      "residential",
      "commercial",
      "tribal",
      "forest",
      "government",
      "barren",
    ])
    .withMessage("Invalid land type"),
  body("areaSqFt")
    .isFloat({ gt: 0 })
    .withMessage("Area must be greater than 0"),
  body("gpsLat").optional().isFloat({ min: -90, max: 90 }),
  body("gpsLng").optional().isFloat({ min: -180, max: 180 }),
];

const rejectLandValidator = [
  param("parcelId").isString().notEmpty(),
  body("reason")
    .isString()
    .isLength({ min: 10 })
    .withMessage("Rejection reason must be at least 10 characters"),
];

const initiateTransferValidator = [
  param("parcelId").isString().notEmpty(),
  body("newOwnerCNIC")
    .matches(/^\d{13}$/)
    .withMessage("Please enter a valid 13-digit CNIC"),
  body("newOwnerName")
    .isString()
    .isLength({ min: 3, max: 100 })
    .withMessage("New owner name must be 3 to 100 characters"),
];

module.exports = {
  registerLandValidator,
  rejectLandValidator,
  initiateTransferValidator,
};
