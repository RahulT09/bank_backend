const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  createAccountController,
  getUserAllAccountController,
  getAccountBalanceController
} = require("../controllers/account.controller");

const router = express.Router();

// a logged in user creats a account
router.post("/create-acc", authMiddleware.authMiddleware, createAccountController);

//fetch all accounts of a user
router.get("/", authMiddleware.authMiddleware, getUserAllAccountController);

//fetch balance /api/accounts/balance/:accountId
router.get(
  "/balance/:accountId",
  authMiddleware.authMiddleware,
  getAccountBalanceController
);

module.exports = router;
