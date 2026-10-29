const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailServices = require("../services/email.service");
const mongoose = require("mongoose");
const account = require("../models/account.model");

/**
 * the 10 step transfer flow
 *
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

  let transaction;
  try {
    //5. create trasaction(pending)
    const session = await mongoose.startSession();
    session.startTransaction();

    transaction = await transactionModel.create(
      {
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING",
      },
      { session },
    );

    const debitLedgerEntry = await ledgerModel.create(
      {
        account: fromAccount,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
      { session },
    );

    const creditLedgerEntry = await ledgerModel.create(
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
      { session },
    );

    // transaction.status = "COMPLETED";
    // await transaction.save({ session });

    await transactionModel.findOneAndUpdate(
      { _id: transaction._id },
      { status: "COMPLETED" },
      { session },
    );  

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    return res.status(400).json({
      message: "Transaction is pending ",
    });
  }

  //send email notification

  await emailServices.sendTransactionEmail(
    req.user.userEmail,
    req.user.name,
    req.user.amount,
    req.user.toAccount,
  );

  return res.status(200).json({
    message: "Transaction completed successfully",
    transaction: transaction,
    success: true,
  });
}

async function createIntitialFundTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || amount === undefined || !idempotencyKey) {
    return res.status(400).json({
      success: false,
      message: "toAccount, amount, and idempotencyKey are required",
    });
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Amount must be a positive number",
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Check for a previously processed request.
    const existingTransaction = await transactionModel
      .findOne({ idempotencyKey })
      .session(session);

    if (existingTransaction) {
      await session.abortTransaction();

      return res.status(200).json({
        success: true,
        message: "Transaction already exists",
        transaction: existingTransaction,
      });
    }

    // Find the destination account inside the session.
    const toUserAccount = await accountModel
      .findById(toAccount)
      .session(session);

    if (!toUserAccount) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid destination account",
      });
    }

    // Find the system user's account.
    const fromUserAccount = await accountModel
      .findOne({ user: req.user._id })
      .session(session);

    if (!fromUserAccount) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "System user account not found",
      });
    }

    // Create and save the transaction.
    const transaction = new transactionModel({
      fromAccount: fromUserAccount._id,
      toAccount: toUserAccount._id,
      amount: numericAmount,
      idempotencyKey,
      status: "PENDING",
    });

    await transaction.save({ session });

    // Create both ledger entries in the same transaction.
    await ledgerModel.create(
      [
        {
          account: fromUserAccount._id,
          amount: numericAmount,
          transaction: transaction._id,
          type: "DEBIT",
        },
        {
          account: toUserAccount._id,
          amount: numericAmount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session, ordered: true },
    );

    // TODO: Update both account balances here using your
    // actual balance field names and appropriate atomic updates.

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Initial funds transaction completed successfully",
      transaction,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Initial fund transaction failed:", {
      message: error.message,
      code: error.code,
      codeName: error.codeName,
      errorLabels: error.errorLabels,
    });

    return res.status(500).json({
      success: false,
      message: "Initial funds transaction failed",
    });
  } finally {
    await session.endSession();
  }
}

module.exports = {
  createTransaction,
  createIntitialFundTransaction,
};
