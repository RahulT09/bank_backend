const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  createAccountController,
} = require("../controllers/account.controller");

const router = express.Router();

// a logged in user creats a account
router.post("/", authMiddleware.authMiddleware, createAccountController);

module.exports = router;
