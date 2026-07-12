import jwt from 'jsonwebtoken'
import { cookieOption } from './cookieOption.js'

const generatingAuthToken = (res , email) =>{

    const accessTokenExpirationTime = '10m'
    const refreshTokenExpirationTime = '7d'

    const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY
    const REFRESH_TOKEN_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET_KEY

    if (!ACCESS_TOKEN_SECRET_KEY || !REFRESH_TOKEN_SECRET_KEY) {
        throw new Error("JWT secret keys are missing");
    }

    const accessToken = jwt.sign({email}, ACCESS_TOKEN_SECRET_KEY , {expiresIn: accessTokenExpirationTime})
    const refreshToken = jwt.sign({email}, REFRESH_TOKEN_SECRET_KEY , {expiresIn: refreshTokenExpirationTime})

    res.cookie('accessToken', accessToken, {
        ...cookieOption,
        maxAge: 10 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
        ...cookieOption,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    return
}

export default generatingAuthToken