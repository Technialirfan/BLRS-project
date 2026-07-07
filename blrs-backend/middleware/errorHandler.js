const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists in the system`;
    statusCode = 400;
  }

  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    statusCode = 400;
  }

  if (err.name === "CastError") {
    message = "Invalid ID format";
    statusCode = 400;
  }

  if (err.name === "JsonWebTokenError") {
    message = "Invalid token";
    statusCode = 401;
  }

  // Parse ugly Blockchain revert errors into beautiful frontend messages
  if (message.includes("execution reverted:")) {
    const revertMatch = message.match(/reverted: "([^"]+)"/);
    if (revertMatch && revertMatch[1]) {
      // Extract just the clean reason, e.g. "Only DC can resolve Govt land"
      let cleanMsg = revertMatch[1];
      if (cleanMsg.includes(": ")) {
        cleanMsg = cleanMsg.split(": ")[1]; // Remove contract name prefix like "DisputeResolution: "
      }
      message = cleanMsg;
    } else {
      message = "Blockchain transaction rejected by smart contract logic.";
    }
    statusCode = 400;
  }

  if (process.env.NODE_ENV === "development") {
    console.error("ERROR:", err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;