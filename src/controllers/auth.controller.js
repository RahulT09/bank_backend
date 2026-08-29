const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");
const emailService = require("../services/email.service");

async function userRegisterControl(req, res) {
  const { email, name, password } = req.body;

  const isExists = await userModel.findOne({
    email: email,
  });

  if (isExists) {
    return res.status(422).json({
      message: "User with this email already exists",
      status: "Failed",
    });
  }

  const user = await userModel.create({
    email,
    name,
    password,
  });

  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "3d" },
  );

  res.cookie("JWT_token", token);

  res.status(201).json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });

  await emailService.registrationEmail(user.email, user.name);
}

async function userLoginController(req, res) {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password is required",
      });
    }

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { user: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "3d" },
    );

    res.cookie("JWT_TOKEN", token);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server erroe",
      error: error.message,
    });
  }
}

module.exports = {
  userRegisterControl,
  userLoginController,
};
