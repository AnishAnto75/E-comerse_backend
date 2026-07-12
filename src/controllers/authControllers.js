import User from "../models/UserModel.js"
import Staff from "../models/StaffModel.js"
import bcrypt from 'bcrypt'
import generatingAuthToken from "../utils/GeneratingAuthToken.js"
import { apiErrorResponce, apiSucessResponce } from "../utils/apiResponce.js"
import { generateRandom12DigitNumber } from "../utils/generateRandomNumber.js"
import { cookieOption } from "../utils/cookieOption.js"
import mongoose from "mongoose"
import RecentActivity from "../models/RecentActivityModel.js"

export const signUp = async(req , res) =>{

    const session = await mongoose.startSession();

    const data = req.body.data
    if(!data){return apiErrorResponce(res, "Invalid Credentials")}

    const { email , name , password, gender } = data
    if (!email || !name || !password || !gender){return apiErrorResponce(res, "Invalid Credentials")}

    const validGender = ['male', 'female', 'other']
    if(!validGender.includes(gender)){return apiErrorResponce(res, "Invalid Credentials")}

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) { return apiErrorResponce(res, "Invalid Email")}
    
    const normalizedName = name.trim();
    if (normalizedName.length < 2) {return apiErrorResponce(res, "Invalid Name")}

    try {
        session.startTransaction();
        const existingUser = await User.findOne({email : normalizedEmail}).session(session);
        if (existingUser){ 
            await session.abortTransaction();
            return apiErrorResponce(res, "Email already registered")
        }       
        
        const hashedPassword = await bcrypt.hash(password , 10)
        
        const user_id = `USR${generateRandom12DigitNumber()}`
        
        const newUser = await User.create( [{ user_id, email: normalizedEmail, password: hashedPassword, name: normalizedName, gender }], { session });

        await RecentActivity.create(
            [{
                user_id: newUser[0]._id,
                activity_type: "user",
                action: "created",
                title: "New User Registered",
                description: `${normalizedName} created a new account.`,
                reference_id: newUser[0]._id,
                reference_model: "User",
                metadata: {
                    email: normalizedEmail,
                    name: normalizedName
                },
            }],
            { session }
        );

        await session.commitTransaction();
        generatingAuthToken(res, normalizedEmail)
        const user = { name: newUser[0].name, email: newUser[0].email}

        return apiSucessResponce(res , "Signed Up Successfully", {user} , 201)

    } catch (error) {

        await session.abortTransaction();
        console.log("Error in signUp controller :",error)
        if (error.code === 11000) { return apiErrorResponce(res, "Email already exists" )}
        return apiErrorResponce(res, "Internal Server Error")

    } finally { session.endSession();}
}

export const login = async(req , res) =>{
    try {
        const data = req.body.data
        if(!data){return apiErrorResponce(res, "Invalid Credentials")}        

        const {email, password} = data
        
        if (!email || !password ){return apiErrorResponce(res, "Invalid Credentials")}

        const normalizedEmail = data.email.trim().toLowerCase();
        
        const user = await User.findOne({email: normalizedEmail})
        if(!user){return apiErrorResponce(res, "Invalid Credentials")}
        
        const comparedPassword = await bcrypt.compare(password , user.password)
        if(!comparedPassword){return apiErrorResponce(res, "Invalid Credentials")}

        generatingAuthToken(res, normalizedEmail)
        return apiSucessResponce(res , "Loged in Successfully", {
            user: {
                name: user.name,
                email: user.email
            }
        })

    } catch (error) {
        console.log("Error in login controller :",error)
        return apiErrorResponce(res, "Internal Server Error")
    }
}

export const getUser = (req , res) =>{
    try {
        return apiSucessResponce(res, "User fetched Successfully", {user: req.user})
    } catch (error) {
        console.log("Error in getUser controller :",error)
        return apiErrorResponce(res, "Internal Server Error")
    }
}

export const logout = (req , res) =>{
    try{

        res.clearCookie('refreshToken', cookieOption);
        res.clearCookie('accessToken' , cookieOption);
        
        return apiSucessResponce(res, "Log out sucessfully")
    } catch (error) {
        console.log("Error in logout controller :",error)
        return apiErrorResponce(res, "Internal Server Error")
    }
} 
