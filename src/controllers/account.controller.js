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

module.exports = {
    createAccountController
}
