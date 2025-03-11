import Order from "../../models/OrderModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"

export const fetchAllOrders = async(req , res)=>{
    try {
        const orders = await Order.find()
        apiSucessResponce(res , "All Orders Fetched" , orders)
    } catch (error) {
        console.log("error in fetchAllOrders controller : " ,error)
        apiErrorResponce(res , "internal server error" , null , 500)
    }
}

export const fetchAdminOrder = async(req , res)=>{
    try {
        const {id} = req.params
        const order = await Order.findOne({order_id : id})
        if(!order){
            return apiErrorResponce(res, "Order Not Found", null, 404)
        }
        apiSucessResponce(res , "Order Fetched Sucessfully" , order)
    } catch (error) {
        console.log("error in fetchAdminOrder controller : " ,error)
        apiErrorResponce(res , "internal server error" , null , 500)
    }
}

export const updateOrderStatusToConfirmed = async(req , res)=>{
    const {id} = req.params
    const admin_id = req.body.user._id
    try {
        const order = await Order.findOne({order_id : id})
        if(!order){ return apiErrorResponce(res, "Order Not Found", null, 404) }        

        return apiSucessResponce(res , "Order Status Updated Sucessfully", order )

    } catch (error) {
        console.log("error in updateOrderStatus controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}

export const updateOrderStatusToOut = async(req , res)=>{
    const {id} = req.params
    const admin_id = req.body.user._id
    try {
        const order = await Order.findOne({order_id : id})
        if(!order){ return apiErrorResponce(res, "Order Not Found", null, 404) }        

        return apiSucessResponce(res , "Order Status Updated Sucessfully", order )

    } catch (error) {
        console.log("error in updateOrderStatus controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}

export const updateOrderStatusToDelivered = async(req , res)=>{
    const {id} = req.params
    const admin_id = req.body.user._id
    try {
        const order = await Order.findOne({order_id : id})
        if(!order){ return apiErrorResponce(res, "Order Not Found", null, 404) }        

        return apiSucessResponce(res , "Order Status Updated Sucessfully", order )

    } catch (error) {
        console.log("error in updateOrderStatus controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}

export const updateOrderStatusToCanceled = async(req , res)=>{
    const {id} = req.params
    const admin_id = req.body.user._id
    try {
        const order = await Order.findOne({order_id : id})
        if(!order){ return apiErrorResponce(res, "Order Not Found", null, 404) }        

        return apiSucessResponce(res , "Order Status Updated Sucessfully", order )

    } catch (error) {
        console.log("error in updateOrderStatus controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}

export const updateOrderStatusToReturned = async(req , res)=>{
    const {id} = req.params
    const admin_id = req.body.user._id
    try {
        const order = await Order.findOne({order_id : id})
        if(!order){ return apiErrorResponce(res, "Order Not Found", null, 404) }        

        return apiSucessResponce(res , "Order Status Updated Sucessfully", order )

    } catch (error) {
        console.log("error in updateOrderStatus controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}
