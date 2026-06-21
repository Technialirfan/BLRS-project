// const express = require("express");

// const Officer = require("../models/Officer");
// const { protect, generateToken } = require("../middleware/auth");
// const validate = require("../middleware/validate");
// const auditService = require("../services/auditService");
// const {
//   loginValidator,
//   updateProfileValidator,
//   changePasswordValidator,
// } = require("../validators/authValidators");
// const {
//   sanitizeOfficer,
//   createSuccessResponse,
//   createErrorResponse,
//   pick,
// } = require("../utils/helpers");
// const { AUDIT_ACTIONS } = require("../utils/constants");

// const router = express.Router();

// router.post("/login", loginValidator, validate, async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     const officer = await Officer.findOne({ email: String(email).toLowerCase() }).select(
//       "+password"
//     );

//     if (!officer || !(await officer.comparePassword(password))) {
//       return res.status(401).json(createErrorResponse("Invalid email or password"));
//     }

//     if (!officer.isActive) {
//       return res
//         .status(401)
//         .json(
//           createErrorResponse(
//             "Your account has been deactivated. Contact administrator."
//           )
//         );
//     }

//     officer.lastLogin = new Date();
//     await officer.save({ validateBeforeSave: false });

//     const token = generateToken(officer._id);

//     await auditService.log(
//       AUDIT_ACTIONS.OFFICER_LOGIN,
//       officer,
//       { email: officer.email },
//       {
//         ipAddress: req.ip,
//         userAgent: req.get("user-agent"),
//       }
//     );

//     return res.json(
//       createSuccessResponse("Login successful", {
//         token,
//         officer: sanitizeOfficer(officer),
//       })
//     );
//   } catch (error) {
//     return next(error);
//   }
// });

// router.post("/logout", protect, async (req, res, next) => {
//   try {
//     await auditService.log(
//       AUDIT_ACTIONS.OFFICER_LOGOUT,
//       req.officer,
//       { email: req.officer.email },
//       {
//         ipAddress: req.ip,
//         userAgent: req.get("user-agent"),
//       }
//     );

//     return res.json(createSuccessResponse("Logout successful"));
//   } catch (error) {
//     return next(error);
//   }
// });

// router.get("/me", protect, async (req, res) => {
//   return res.json(
//     createSuccessResponse("Profile fetched successfully", {
//       officer: sanitizeOfficer(req.officer),
//     })
//   );
// });

// router.put(
//   "/profile",
//   protect,
//   updateProfileValidator,
//   validate,
//   async (req, res, next) => {
//     try {
//       const updates = pick(req.body, [
//         "fullName",
//         "phone",
//         "bio",
//         "walletAddress",
//       ]);

//       const officer = await Officer.findById(req.officer._id);
//       if (!officer) {
//         return res.status(404).json(createErrorResponse("Officer not found"));
//       }

//       Object.assign(officer, updates);
//       await officer.save();

//       await auditService.log(
//         AUDIT_ACTIONS.PROFILE_UPDATED,
//         officer,
//         { updatedFields: Object.keys(updates) },
//         {
//           ipAddress: req.ip,
//           userAgent: req.get("user-agent"),
//         }
//       );

//       return res.json(
//         createSuccessResponse("Profile updated successfully", {
//           officer: sanitizeOfficer(officer),
//         })
//       );
//     } catch (error) {
//       return next(error);
//     }
//   }
// );

// router.put(
//   "/password",
//   protect,
//   changePasswordValidator,
//   validate,
//   async (req, res, next) => {
//     try {
//       const { currentPassword, newPassword } = req.body;

//       const officer = await Officer.findById(req.officer._id).select("+password");
//       if (!officer) {
//         return res.status(404).json(createErrorResponse("Officer not found"));
//       }

//       const isCurrentValid = await officer.comparePassword(currentPassword);
//       if (!isCurrentValid) {
//         return res
//           .status(400)
//           .json(createErrorResponse("Current password is incorrect"));
//       }

//       if (currentPassword === newPassword) {
//         return res
//           .status(400)
//           .json(
//             createErrorResponse("New password must be different from current password")
//           );
//       }

//       officer.password = newPassword;
//       await officer.save();

//       const token = generateToken(officer._id);

//       await auditService.log(
//         AUDIT_ACTIONS.PASSWORD_CHANGED,
//         officer,
//         { email: officer.email },
//         {
//           ipAddress: req.ip,
//           userAgent: req.get("user-agent"),
//         }
//       );

//       return res.json(
//         createSuccessResponse("Password changed successfully", {
//           token,
//         })
//       );
//     } catch (error) {
//       return next(error);
//     }
//   }
// );

// module.exports = router;


// new code by chatgpt after fixing errors

const express = require("express");

const Officer = require("../models/Officer");
const { protect, generateToken } = require("../middleware/auth");
const validate = require("../middleware/validate");
const auditService = require("../services/auditService");

const {
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
} = require("../validators/authValidators");

const {
  sanitizeOfficer,
  createSuccessResponse,
  createErrorResponse,
  pick,
} = require("../utils/helpers");

const { AUDIT_ACTIONS } = require("../utils/constants");

const router = express.Router();


// =============================
// 🔐 REGISTER (FOR TESTING ONLY)
// =============================
router.post("/register", async (req, res, next) => {
  try {
    const { fullName, cnic, email, password, role } = req.body;

    if (!fullName || !cnic || !email || !password || !role) {
      return res
        .status(400)
        .json(createErrorResponse("All fields are required"));
    }

    const existing = await Officer.findOne({
      $or: [
        { email: String(email).toLowerCase() },
        { cnic: String(cnic) },
      ],
    });

    if (existing) {
      return res
        .status(400)
        .json(createErrorResponse("Officer already exists"));
    }

    const officer = await Officer.create({
      fullName,
      cnic,
      email: String(email).toLowerCase(),
      password,
      role,
    });

    await auditService.log(
      AUDIT_ACTIONS.OFFICER_CREATED || "OFFICER_CREATED",
      officer,
      { email: officer.email },
      {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

    return res.status(201).json(
      createSuccessResponse("Officer registered successfully", {
        officer: sanitizeOfficer(officer),
      })
    );
  } catch (error) {
    return next(error);
  }
});


// =============================
// 🔑 LOGIN
// =============================
router.post("/login", loginValidator, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const officer = await Officer.findOne({
      email: String(email).toLowerCase(),
    }).select("+password");

    if (!officer || !(await officer.comparePassword(password))) {
      return res.status(401).json(
        createErrorResponse("Invalid email or password")
      );
    }

    if (!officer.isActive) {
      return res.status(401).json(
        createErrorResponse(
          "Your account has been deactivated. Contact administrator."
        )
      );
    }

    officer.lastLogin = new Date();
    await officer.save({ validateBeforeSave: false });

    const token = generateToken(officer._id);

    await auditService.log(
      AUDIT_ACTIONS.OFFICER_LOGIN,
      officer,
      { email: officer.email },
      {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

    return res.json(
      createSuccessResponse("Login successful", {
        token,
        officer: sanitizeOfficer(officer),
      })
    );
  } catch (error) {
    return next(error);
  }
});


// =============================
// 🚪 LOGOUT
// =============================
router.post("/logout", protect, async (req, res, next) => {
  try {
    await auditService.log(
      AUDIT_ACTIONS.OFFICER_LOGOUT,
      req.officer,
      { email: req.officer.email },
      {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

    return res.json(createSuccessResponse("Logout successful"));
  } catch (error) {
    return next(error);
  }
});


// =============================
// 👤 GET PROFILE
// =============================
router.get("/me", protect, async (req, res) => {
  return res.json(
    createSuccessResponse("Profile fetched successfully", {
      officer: sanitizeOfficer(req.officer),
    })
  );
});


// =============================
// ✏️ UPDATE PROFILE
// =============================
router.put(
  "/profile",
  protect,
  updateProfileValidator,
  validate,
  async (req, res, next) => {
    try {
      const updates = pick(req.body, [
        "fullName",
        "phone",
        "bio",
        "walletAddress",
      ]);

      const officer = await Officer.findById(req.officer._id);

      if (!officer) {
        return res
          .status(404)
          .json(createErrorResponse("Officer not found"));
      }

      Object.assign(officer, updates);
      await officer.save();

      await auditService.log(
        AUDIT_ACTIONS.PROFILE_UPDATED,
        officer,
        { updatedFields: Object.keys(updates) },
        {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

      return res.json(
        createSuccessResponse("Profile updated successfully", {
          officer: sanitizeOfficer(officer),
        })
      );
    } catch (error) {
      return next(error);
    }
  }
);


// =============================
// 🔒 CHANGE PASSWORD
// =============================
router.put(
  "/password",
  protect,
  changePasswordValidator,
  validate,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const officer = await Officer.findById(req.officer._id).select("+password");

      if (!officer) {
        return res
          .status(404)
          .json(createErrorResponse("Officer not found"));
      }

      const isCurrentValid = await officer.comparePassword(currentPassword);

      if (!isCurrentValid) {
        return res
          .status(400)
          .json(createErrorResponse("Current password is incorrect"));
      }

      if (currentPassword === newPassword) {
        return res
          .status(400)
          .json(
            createErrorResponse(
              "New password must be different from current password"
            )
          );
      }

      officer.password = newPassword;
      await officer.save();

      const token = generateToken(officer._id);

      await auditService.log(
        AUDIT_ACTIONS.PASSWORD_CHANGED,
        officer,
        { email: officer.email },
        {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

      return res.json(
        createSuccessResponse("Password changed successfully", {
          token,
        })
      );
    } catch (error) {
      return next(error);
    }
  }
);


module.exports = router;