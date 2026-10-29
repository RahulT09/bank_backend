const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

async function authMiddleware(req, res, next) {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized access, token is missing",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.user);

    req.user = user;

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized access, token is missing",
    });
  }
}

async function authSystemUserMiddleware(req, res, next) {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization) {
    const [scheme, credentials] = req.headers.authorization.trim().split(/\s+/);

    if (scheme?.toLowerCase() === "bearer") {
      token = credentials;
    }
  }

  if (typeof token !== "string" || token.split(".").length !== 3) {
    return res.status(401).json({
      message: "Missing or malformed JWT",
      success: false,
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    const user = await userModel.findById(decoded.user).select("+systemUser");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
        success: false,
      });
    }

    if (user.systemUser !== true) {
      return res.status(403).json({
        message: "Forbidden access",
        success: false,
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    console.error("Authentication error:", error.name, error.message);

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired token",
        success: false,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
}

module.exports = { authMiddleware, authSystemUserMiddleware };
