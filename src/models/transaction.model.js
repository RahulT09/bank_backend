const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, "Transaction must be associated with an account"],
      index: true,
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, "Transaction must be associated with an account"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
        message: "status can be either pending,complete,failed or reversed",
      },
      default: "PENDING",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required to make a transaction"],
      min: [1, "Transaction amount should not be less than 1"],
    },
    idempotencyKey: {
      type: String,
      required: [true, "Idempotency key is required to make a transaction"],
      index: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

const transactionModel = mongoose.model("Transaction", transactionSchema);

module.exports = transactionModel;
