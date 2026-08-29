const userModel = require('../models/account.model')
const jwt = require('jsonwebtoken')

async function authMiddleware(req,res,next){
    const token = req.cookies.token || req.headers.authorization.split(" ")[1]

    if(!token){
        return res.status(401).json({
            message:"Unauthorized access, token is missing",

        })

        try {
            
        } catch (error) {
            
        }
    }
} 