import jwt from 'jsonwebtoken'
import User from '../models/UserModel.js'
import { apiErrorResponce, apiSucessResponce } from '../utils/apiResponce.js'

const renewToken = async (req, res , next) => {
    
    const accessTokenExpirationTime = '10m'
    
    const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY
    const REFRESH_TOKEN_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET_KEY

    try {
        const refreshtoken = req.cookies.refreshToken;
        if(!refreshtoken) { return apiErrorResponce(res, "No Refresh token")}

        jwt.verify(refreshtoken, REFRESH_TOKEN_SECRET_KEY , async(error , decoded)=>{
            if (error){
                console.log("Error in renew token middleware :",error)
                return apiErrorResponce(res, "Invalid Refresh Token")
            }
            const selectedValues = ['_id', "user_type", "email", "name", "order_id", "blocked", "address", 'cart']
            const user = await User.findOne({email: decoded.email, deleted: false})
            if(!user){ 
                res.clearCookie('refreshToken')
                res.clearCookie('accessToken')
                return res.status(400).send({message : "No User Found"})
            } 
            const accessToken = jwt.sign({email : user.email}, ACCESS_TOKEN_SECRET_KEY , {expiresIn: accessTokenExpirationTime} )
            res.cookie('accessToken', accessToken, {maxAge: 600000})

            user._doc.cart = user.cart
            req.user = user
            next()            
        })
    } catch (error) {
        console.log("Error in renewToken middleware", error)
        apiErrorResponce(res , "internal server error" , error)
    }
}

const verifyUser = async(req, res, next) => {

    try {
        const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY

        const accesstoken = req.cookies.accessToken;
        if(!accesstoken) {renewToken(req, res , next); return} 
    
        const token = jwt.verify(accesstoken, ACCESS_TOKEN_SECRET_KEY )
        if(!token) { return apiErrorResponce(res, "Invalid Token")}

        const selectedValues = ['_id', "user_type", "email", "name", "order_id", "blocked", "address", 'cart']
        let user = await User.findOne({email: token.email, deleted: false})
        if(!user){ 
            res.clearCookie('refreshToken')
            res.clearCookie('accessToken')
            return res.status(400).send({message : "No User Found"})
        } 

        user._doc.cart = user.cart
        req.user = user
        next()

    } catch (error) {
        console.log("Error in verifyUser middleware", error)
        apiErrorResponce(res , "internal server error" , error)
    }
}

export default verifyUser