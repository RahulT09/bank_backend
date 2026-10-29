const express = require("express");
const accountModel = require("../models/account.model");

async function createAccountController(req, res) {
  try {
    const user = req.user;

    const account = await accountModel.create({
      user: user._id,
    });

    return res.status(201).json({
      account,
    });
  } catch (error) {}
}

async function getUserAllAccountController(req, res) {
  const account = await accountModel.find({ user: req.user._id });

  res.status(200).json({
    message: "Here are your all accounts",
    accounts: account,
    success: true,
  });
}

async function getAccountBalanceController(req, res) {
  const { accountId } = req.params;

  const account = await accountModel.findOne({
    _id: accountId,
    user: req.user._id,
  });

  if (!account) {
    return res.status(400).json({
      message: "Account not found",
    });
  }

  const balance = await account.getBalance();

  res.status(200).json({
    accountId: account._id,
    balance: balance,
  });
}

module.exports = {
  createAccountController,
  getUserAllAccountController,
  getAccountBalanceController,
};
