const mongoose = require("mongoose");

const tokenBlackListSchema = new mongoose.Schema(
  {
    token: {
      type: string,
      required: [true, "Token is required to blacklist"],
      unique: [true, "Token already blacklisted"],
    },
    blacklistedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { timestamps: true },
);

tokenBlacListSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 3 },
); // Set the expiration time to 1 hour (3600 seconds)

const tokenBlackListModel = mongoose.model(
  "tokenBlackList",
  tokenBlackListSchema,
);

module.exports = tokenBlackListModel;
