const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.officer.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.officer.role}' is not authorized to access this route. Required: ${roles.join(", ")}`,
      });
    }
    return next();
  };
};

const districtCheck = (req, res, next) => {
  const { role, assignedDistrict } = req.officer;

  if (role === "admin") return next();

  const requestedDistrict =
    req.body.district || req.params.district || req.query.district;

  if (requestedDistrict && requestedDistrict !== assignedDistrict) {
    return res.status(403).json({
      success: false,
      message: `You can only access records for your assigned district: ${assignedDistrict}`,
    });
  }

  return next();
};

module.exports = { authorize, districtCheck };