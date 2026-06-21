const { body } = require("express-validator");

const loginValidator = [
  body("email").isEmail().withMessage("Please provide valid email"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

const updateProfileValidator = [
  body("fullName")
    .optional()
    .isString()
    .isLength({ min: 3, max: 100 })
    .withMessage("Full name must be 3 to 100 characters"),
  body("phone")
    .optional()
    .matches(/^03\d{9}$/)
    .withMessage("Phone must start with 03 and be 11 digits"),
  body("bio")
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage("Bio cannot exceed 200 characters"),
  body("walletAddress")
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage("Invalid wallet address"),
];

const changePasswordValidator = [
  body("currentPassword")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Current password is required"),
  body("newPassword")
    .isString()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters"),
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Confirm password must match new password"),
];

module.exports = {
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
};
