import User from "../models/UserModel.js"
import Staff from "../models/StaffModel.js"
import bcrypt from 'bcrypt'
import generatingAuthToken from "../utils/GeneratingAuthToken.js"
import { apiErrorResponce, apiSucessResponce } from "../utils/apiResponce.js"

export const signUp = async(req , res) =>{
    try {
        const data = req.body.data
        if(!data){return apiErrorResponce(res, "Invalid Credentials")}

        const { email , name , password, gender } = data
        if (!email || !name || !password || !gender){return apiErrorResponce(res, "Invalid Credentials")}

        const validGender = ['male', 'female', 'other']
        if(!validGender.includes(gender)){return apiErrorResponce(res, "Invalid Credentials")}

        const existingUser = await User.findOne({email})        
        if (existingUser){ return apiErrorResponce(res, "User Already Loged in")}       
        
        const existingStaff = await Staff.findOne({staff_email: email})
        if (existingStaff){ return apiErrorResponce(res, "User Already Loged in")}       

        const hashedPassword = await bcrypt.hash(password , 10)

        const user_id = `USR${generateRandom12DigitNumber()}`

        const newUser = new User({ user_id, email , password : hashedPassword , name, gender})
        await newUser.save()

        return apiSucessResponce(res , "Signed Up Successfully", newUser, 201)

    } catch (error) {
        console.log("Error in signUp controller :",error)
        return apiErrorResponce(res, "Internal Server Error")
    }
}

export const login = async(req , res) =>{
    try {
        const data = req.body.data
        if(!data){return apiErrorResponce(res, "Invalid Credentials")}

        const { email , password } = data
        if (!email || !password ){return apiErrorResponce(res, "Invalid Credentials")}

        const user = await User.findOne({email})
        if(!user){return apiErrorResponce(res, "Invalid Credentials")}

        const comparedPassword = await bcrypt.compare(password , user.password)
        if(!comparedPassword){return apiErrorResponce(res, "Invalid Credentials")}

        generatingAuthToken(res, email)
        return apiSucessResponce(res , "Loged in Successfully")

    } catch (error) {
        console.log("Error in login controller :",error)
        return apiErrorResponce(res, "Internal Server Error")
    }
}

export const getUser = (req , res) =>{
    try {
        const data = req.body.user
        if(!data){return apiErrorResponce(res, "Invalid Credentials")}

        return apiSucessResponce(res, "fetched", data)
    } catch (error) {
        console.log("Error in getUser controller :",error)
        return apiErrorResponce(res, "Internal Server Error")
    }
}

export const logout = (req , res) =>{
    try{
        res.clearCookie('refreshToken', {httpOnly: true});
        res.clearCookie('accessToken' , {httpOnly : true});
        
        return apiSucessResponce(res, "Log out sucessfully")
    } catch (error) {
        console.log("Error in logout controller :",error)
        return apiErrorResponce(res, "Internal Server Error")
    }
} 
