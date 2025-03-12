import Order from "../../models/OrderModel.js"
import Staff from "../../models/StaffModel.js"
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
    try {
        const {id} = req.params
        const staff_id = req.body.user._id

        const order = await Order.findOne({order_id : id})

        if(!order){ return apiErrorResponce(res, "Order Not Found", null, 404) } 
        if(order.order_status.canceled.status){return apiErrorResponce(res, "Order Is Canceled")}
        if(order.order_status.confirmed.status){return apiErrorResponce(res, "Order Is Already Confirmed")}

        order.order_status.confirmed.status = true,
        order.order_status.confirmed.date = new Date()
        order.order_status.confirmed.confirmation_by = staff_id
        await order.save()

        return apiSucessResponce(res , "Order Status Updated Sucessfully", order )

    } catch (error) {
        console.log("error in updateOrderStatus controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}

export const updateOrderStatusToOut = async(req , res)=>{
    try {
        const {id} = req.params
        const staff_id = req.body.user._id

        const taken_by = req.body.data?.taken_by
        if(!taken_by){return apiErrorResponce(res, "Invalid Credentials")}

        const validTakenBy = await Staff.findOne({staff_id : taken_by})
        if(!validTakenBy){return apiErrorResponce(res, "Delivery staff is Invalid")}

        const order = await Order.findOne({order_id : id})

        if(!order){ return apiErrorResponce(res, "Order Not Found", null, 404) }        
        if(order.order_status.canceled.status){return apiErrorResponce(res, "Order Is Canceled")}
        if(!order.order_status.confirmed.status){return apiErrorResponce(res, "Order Is Not Yet Confirmed")}
        if(order.order_status.out.status){return apiErrorResponce(res, "Order Is Already Out")}

        order.order_status.out.status = true
        order.order_status.out.date = new Date()
        order.order_status.out.taken_by = validTakenBy._id
        order.order_status.out.confirmation_by = staff_id
        await order.save()

        return apiSucessResponce(res , "Order Status Updated Sucessfully", order )

    } catch (error) {
        console.log("error in updateOrderStatus controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}

export const updateOrderStatusToDelivered = async(req , res)=>{
    try {
        const {id} = req.params
        const staff_id = req.body.user._id
        const order = await Order.findOne({order_id : id})

        if(!order){ return apiErrorResponce(res, "Order Not Found", null, 404) }        
        if(order.order_status.canceled.status){return apiErrorResponce(res, "Order Is Canceled")}
        if(!order.order_status.confirmed.status){return apiErrorResponce(res, "Order Is Not Yet Confirmed")}
        if(!order.order_status.out.status){return apiErrorResponce(res, "Order Is Not Yet to be Out for Delivery")}
        if(order.order_status.delivered.status){return apiErrorResponce(res, "Order Is Already Delivered")}

        order.order_status.delivered.status = true
        order.order_status.delivered.date = new Date()
        order.order_status.delivered.delivered_by = staff_id
        await order.save()

        return apiSucessResponce(res , "Order Status Updated Sucessfully", order )

    } catch (error) {
        console.log("error in updateOrderStatus controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}

export const updateOrderStatusToCanceled = async(req , res)=>{
    try {
        const {id} = req.params
        const staff_id = req.body.user._id

        const reason_for_cancel = req.body.data?.reason_for_cancel
        if(!reason_for_cancel){return apiErrorResponce(res, "Invalid Credentials")}

        const order = await Order.findOne({order_id : id})
        if(!order){ return apiErrorResponce(res, "Order Not Found", null, 404) }        

        if(order.order_status.delivered.status){return apiErrorResponce(res, "Can't cancel the because the order is already delivered")}
        if(order.order_status.canceled.status){return apiErrorResponce(res, "Order Is Already Canceled")}

        order.order_status.canceled.status = true
        order.order_status.canceled.date = new Date()
        order.order_status.canceled.canceled_by = 'staff'
        order.order_status.canceled.canceled_staff_id = staff_id
        order.order_status.canceled.reason_for_cancel = reason_for_cancel
        await order.save()
    
        return apiSucessResponce(res , "Order Status Updated Sucessfully", order )

    } catch (error) {
        console.log("error in updateOrderStatus controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}

export const updateOrderStatusToReturned = async(req , res)=>{
    try {
        const {id} = req.params
        const staff_id = req.body.user._id

        const order = await Order.findOne({order_id : id})
        if(!order){ return apiErrorResponce(res, "Order Not Found", null, 404) }        


        if(order.order_status.canceled.status){return apiErrorResponce(res, "The order is already canceled")}
        if(!order.order_status.delivered.status){return apiErrorResponce(res, "Can't return because the order is not yet to be delivered")}
        if(!order.order_status.return.status){return apiErrorResponce(res, "Customer not requested to return")}
        if(order.order_status.returned.status){return apiErrorResponce(res, "Order Is Already Returned")}

        order.order_status.returned.status = true
        order.order_status.returned.date = new Date()
        order.order_status.returned.pickeup_by = staff_id
        await order.save()

        return apiSucessResponce(res , "Order Status Updated Successfully", order )

    } catch (error) {
        console.log("error in updateOrderStatus controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}

export const rejectTheReturnOrder = async(req , res)=>{
    try {
        const {id} = req.params
        const staff_id = req.body.user._id
        const reason_for_rejection = req.body.data?.reason_for_rejection

        if(!reason_for_rejection){return apiErrorResponce(res, "Invalid Credentials", null, 404)}

        const order = await Order.findOne({order_id : id})
        if(!order){ return apiErrorResponce(res, "Order Not Found", null, 404) }        

        if(order.order_status.canceled.status){return apiErrorResponce(res, "The order is already canceled")}
        if(!order.order_status.delivered.status){return apiErrorResponce(res, "Can't deny the return because the order is not yet to be delivered")}
        // if(!order.order_status.return.status){return apiErrorResponce(res, "Customer not requested to return the order")}
        if(order.order_status.returned.status){return apiErrorResponce(res, "Can't deny the Order because the order is already returned")}

        order.order_status.returned.status = false
        order.order_status.returned.date = new Date()
        order.order_status.returned.rejected = true
        order.order_status.returned.rejected_by = 'staff'
        order.order_status.returned.rejected_staff_id = staff_id
        order.order_status.returned.reason_for_rejection = reason_for_rejection
        // await order.save()

        return apiSucessResponce(res , "Order Status Updated Successfully", order )

    } catch (error) {
        console.log("error in updateOrderStatus controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}
