import jwt from 'jsonwebtoken'

const generatingAuthToken = (res , email) =>{

    const accessTokenExpirationTime = '10m'
    const refreshTokenExpirationTime = '7d'

    const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY
    const REFRESH_TOKEN_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET_KEY

    const accessToken = jwt.sign({email}, ACCESS_TOKEN_SECRET_KEY , {expiresIn: accessTokenExpirationTime})
    const refreshToken = jwt.sign({email}, REFRESH_TOKEN_SECRET_KEY , {expiresIn: refreshTokenExpirationTime})

    res.cookie('accessToken', accessToken, {maxAge: 600000})
    res.cookie('refreshToken', refreshToken, 
        {maxAge: 1000*60*60*24*7 , httpOnly: true, secure: true, sameSite: 'strict'})
    return
}

export default generatingAuthToken