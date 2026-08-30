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

module.exports = { authMiddleware };
