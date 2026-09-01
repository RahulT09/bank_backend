const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailServices = require("../services/email.service");
const mongoose = require("mongoose");

/**
 * the 10 step transfer flow
 * 1. validate request
 * 2. validate idempotency key
 * 3. check acc status
 * 4. derive sender balance from ledger
 * 5. create trasaction(pending)
 * 6. create debit ledger entry
 * 7. create credit ledger enty
 * 8. mark transaction COMPLETED
 * 9. commit mongo session
 * 10. send email notification
 */

async function createTransaction(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  //validate request

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      success: false,
      message:
        "sender account, reciever account, amount and idempotency key are required",
    });
  }

  const senderAccount = await accountModel.findOne({
    _id: fromAccount,
  });

  const recieverAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!senderAccount || !recieverAccount) {
    return res.status(404).json({
      message: "Invalid sender's or reciever's account",
    });
  }

  // validate idempotency key
  const isTransactionAlreadyExists = transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === "COMPLETED") {
      return res.status(200).json({
        message: "Transaction already processed",
      });
    }

    if (isTransactionAlreadyExists.status === "PENDING") {
      return res.status(200).json({
        message: "Transaction is still processing",
      });
    }

    if (isTransactionAlreadyExists.status === "FAILED") {
      return res.status(500).json({
        message: "Transaction failed. please try again",
      });
    }
    if (isTransactionAlreadyExists.status === "REVERSED") {
      return res.status(500).json({
        message: "Transaction reversed. please try again",
      });
    }
  }

  //check account status
  if (senderAccount.status !== "ACTIVE" || recieverAccount !== "ACTIVE") {
    return res.status(400).json({
      message:
        "Both sender's and reciever's account should be ACTIVE to process transaction",
    });
  }

  //derive balance from ledger
  const balance = await senderAccount.getBalance();
  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient Balance.Your current balance is ${balance}. Requested amount is ${amount}`,
    });
  }

  //5. create trasaction(pending)
  const session = await mongoose.startSession();
  session.startTransaction();
}
