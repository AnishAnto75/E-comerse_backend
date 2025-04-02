import User from "../../models/UserModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"

export const adminFetchAllCustomer = async(req , res)=>{
    try {
        const users = await User.find({user_type : "user"})
        return res.status(200).send({message : "User Found Successfully : " , data : users })
    } catch (error) {
        res.status(500).json({error , message : "internal server error"})
    }
}

export const adminFetchForCustomerPage = async(req, res)=>{
    try {
        const customers = await User.find({deleted : false , user_type : 'user'}).sort({ createdAt: -1 }).select(["user_id", "name", "email", "phoneNumber" , "blocked"]).limit(15)

        const blocked_customer = customers?.filter((customer)=> customer.blocked)

        const data = {
            customers : customers.slice(0, 15),
            total_customers : customers.length,
            blocked_customer : blocked_customer.length,
        }

        return apiSucessResponce(res, null, data)
    } catch (error) {
        console.log("error in adminFetchForCustomerPage controller : " , error)
        return apiErrorResponce(res , "Internal Server Error")
    }
}

export const fetchCustomerByIdForCustomerPage = async(req , res)=>{
    try {
        const {user_id} = req.params
        const customer = await User.findOne({user_id}).select(["user_id", "name", "email", "phoneNumber"]).limit(15)

        return apiSucessResponce(res , "Order Fetched Successfully" , customer)
    } catch (error) {
        console.log("error in fetchAdminOrderById controller : " ,error)
        return apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}

export const fetchAdminCustomer = async(req , res)=>{
    try {
        const {user_id} = req.params
        const customer = await User.findOne({user_id})
        // .populate({ path: ["user_id"], select:["email", "name", "user_id", "phoneNumber"], strictPopulate: false })
        // .populate({ path: ["product_details.product_id"], model: "Product", select:['product_photos', "_id"], strictPopulate: false })

        apiSucessResponce(res , "Order Fetched Sucessfully" , customer)
    } catch (error) {
        console.log("error in fetchAdminOrder controller : " ,error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}