const express = require('express')
const router = express.Router();
const authController = require("../controllers/auth.controller");



// POST api/auth/registrer
router.post("/register",authController.userRegisterControl)

//POST api/auth/login
router.post("/login",authController.userLoginController)

module.exports = router;