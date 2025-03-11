import User from "../../models/UserModel.js"

export const adminFetchAllUsers = async(req , res)=>{
    try {
        const users = await User.find({user_type : "user"})
        return res.status(200).send({message : "User Found Sucessfully" , data : users })
    } catch (error) {
        res.status(500).json({error , message : "internal server error"})
    }
}