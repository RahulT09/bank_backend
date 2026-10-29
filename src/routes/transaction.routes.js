const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");

const transactionController = require("../controllers/transaction.controller");

//to create a new transaction
// POST /api/trasaction

router.post(
  "/",
  authMiddleware.authMiddleware,
  transactionController.createTransaction,
);

router.post(
  "/system/initial-funds",
  authMiddleware.authSystemUserMiddleware,
  transactionController.createIntitialFundTransaction,
);

module.exports = router;