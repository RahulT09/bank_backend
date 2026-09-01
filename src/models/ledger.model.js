const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, "Ledger must be associated with an account"],
      index: true,
      immutable: true,
    },
    amount: {
      type: Number,
      required: true,
      immutable: true,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "transaction",
      required: true,
      immutable: true,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ["CREDIT", "DEBIT"],
        message: "Type can be either credit or debit",
      },
      required: true,
      immutable: true,
    },
  },
  {
    timestamps: true,
  },
);

function preventLedgerModification() {
  throw new error(
    "Ledger entries are immutable and cannot be modified or deleted",
  );
}

ledgerSchema.pre("findOneAndUpdate", preventLedgerModification);
ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("deleteOne", preventLedgerModification);
ledgerSchema.pre("remove", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);
ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("findOneAndReplace", preventLedgerModification);

const ledgerModel = mongoose.model("Ledger", ledgerSchema);

module.exports = ledgerModel;
