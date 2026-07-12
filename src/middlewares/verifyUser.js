import jwt from 'jsonwebtoken'
import User from '../models/UserModel.js'
import { apiErrorResponce, apiSucessResponce } from '../utils/apiResponce.js'
import { cookieOption } from '../utils/cookieOption.js'

const renewToken = async (req, res , next) => {
    
    const accessTokenExpirationTime = '10m'
    
    const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY
    const REFRESH_TOKEN_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET_KEY

    try {
        const refreshtoken = req.cookies.refreshToken;
        if(!refreshtoken) { return apiErrorResponce(res, "No Refresh token")}

        const decoded = jwt.verify(refreshtoken, REFRESH_TOKEN_SECRET_KEY)

        const user = await User.findOne({email: decoded.email, deleted: false}).select(" _id email name user_id status DOB gender").lean()
        if(!user){ 
            res.clearCookie('refreshToken', cookieOption)
            res.clearCookie('accessToken', cookieOption)
            return apiErrorResponce(res, "No User Found", 404)
        }
        if (user.status == "blocked") {
            res.clearCookie("accessToken", cookieOption);
            res.clearCookie("refreshToken", cookieOption);
            return apiErrorResponce(res, "Account blocked", 403);
        }
        const accessToken = jwt.sign({email : user.email}, ACCESS_TOKEN_SECRET_KEY , {expiresIn: accessTokenExpirationTime} )
        res.cookie('accessToken', accessToken, {
            ...cookieOption,
            maxAge: 10 * 60 * 1000,
        })

        req.user = user
        return next()            
    
    } catch (error) {
        console.log("Error in renewToken middleware", error)

        if ( error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
            res.clearCookie("accessToken", cookieOption);
            res.clearCookie("refreshToken", cookieOption);
            return apiErrorResponce(res, "Unauthorized", 401);
        }

        return apiErrorResponce(res, "Internal Server Error");
    }
}

const verifyUser = async(req, res, next) => {

    try {
        const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY

        const accesstoken = req.cookies.accessToken;
        if(!accesstoken) {renewToken(req, res , next); return} 
    
        const token = jwt.verify(accesstoken, ACCESS_TOKEN_SECRET_KEY )

        let user = await User.findOne({email: token.email, deleted: false}).select(" _id email name user_id status DOB gender").lean()
        if(!user){ 
            res.clearCookie('refreshToken', cookieOption)
            res.clearCookie('accessToken', cookieOption)
            return apiErrorResponce(res, "No User Found", 404)
        }
        if (user.status == "blocked") {
            res.clearCookie("accessToken", cookieOption);
            res.clearCookie("refreshToken", cookieOption);
            return apiErrorResponce(res, "Account blocked", 403);
        }

        req.user = user
        return next()

    } catch (error) {
        console.log("Error in verifyUser middleware", error)
        if (error.name === "TokenExpiredError") { 
            return renewToken(req, res, next);
        }
        if (error.name === "JsonWebTokenError") { return apiErrorResponce(res, "Unauthorized", 401);}
        return apiErrorResponce(res , "internal server error" , error)
    }
}

export default verifyUser