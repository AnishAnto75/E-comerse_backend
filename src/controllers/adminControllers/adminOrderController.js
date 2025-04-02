import Order from "../../models/OrderModel.js"
import Staff from "../../models/StaffModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"

export const fetchAllOrders = async(req , res)=>{
    try {
        const orders = await Order.find()
        apiSucessResponce(res , "All Orders Fetched" , orders)
    } catch (error) {
        console.log("error in fetchAllOrders controller : " ,error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}

export const fetchAdminOrder = async(req , res)=>{
    try {
        const {order_id} = req.params
        const order = await Order.findOne({order_id})
        .populate({ path: ["user_id"], select:["email", "name", "user_id", "phoneNumber"], strictPopulate: false })
        .populate({ path: ["product_details.product_id"], model: "Product", select:['product_photos', "_id"], strictPopulate: false })

        apiSucessResponce(res , "Order Fetched Sucessfully" , order)
    } catch (error) {
        console.log("error in fetchAdminOrder controller : " ,error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
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

        return apiSucessResponce(res , "Order Confirmed", order.order_status )

    } catch (error) {
        console.log("error in updateOrderStatusToConfirmed controller : " ,error)
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

        return apiSucessResponce(res , "Order went out for delevery", order.order_status )

    } catch (error) {
        console.log("error in updateOrderStatusToOut controller : " ,error)
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
        if(!order.order_status.out.status){return apiErrorResponce(res, "Order Is Not Yet Out for Delivery")}
        if(order.order_status.delivered.status){return apiErrorResponce(res, "Order Is Already Delivered")}

        order.order_status.delivered.status = true
        order.order_status.delivered.date = new Date()
        order.order_status.delivered.delivered_by = staff_id
        await order.save()

        return apiSucessResponce(res , "Order Delivered", order.order_status )

    } catch (error) {
        console.log("error in updateOrderStatusToDelivered controller : " ,error)
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
    
        return apiSucessResponce(res , "Order Canceled", order.order_status )

    } catch (error) {
        console.log("error in updateOrderStatusToCanceled controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}

export const adminFetchDeliveryStaffByNameForOrderStatus = async(req, res)=>{
    try {
        const { username } = req.params;
        const deliveryStaffs = await Staff.find({staff_username : {$regex: username, $options: 'i'}, staff_type:"delivery", blocked: false, deleted: false})
        .select(['staff_id', 'staff_username']).limit(10)
        return apiSucessResponce(res, "Delivery Staff Found", deliveryStaffs)
    } catch (error) {
        console.log("error in adminFetchDeliveryStaffByNameForOrderStatus controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}

export const adminFetchDeliveryStaffByIdForOrderStatus = async(req, res)=>{
    try {
        const { id } = req.params;
        const deliveryStaffs = await Staff.findOne({staff_id : id , staff_type:"delivery", blocked: false, deleted: false}).select(['staff_id', 'staff_username']).limit(10)
        return apiSucessResponce(res, "Delivery Staff Found", deliveryStaffs)
    } catch (error) {
        console.log("error in adminFetchDeliveryStaffByIdForOrderStatus controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}

export const adminFetchForOrderPage = async(req , res)=>{
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).populate([{ path: ["user_id"], select:["email", "name"], strictPopulate: false }]).select(["order_id", "user_id", "order_status", "total_amount", "total_no_of_product", "createdAt" ])

        const pending_orders = orders.filter((order)=> !order.order_status.delivered.status && !order.order_status.canceled.status)

        const findDate = (date)=>{
            const a  = new Date(date)
            const b  = new Date()
            const createdDate = `${a.getDate()}-${a.getMonth()}-${a.getFullYear()}`
            const TodayDate = `${b.getDate()}-${b.getMonth()}-${b.getFullYear()}`
            return createdDate == TodayDate
        }
        const todays_order = orders.filter((order)=>findDate(order.order_status.placed.date))

        const data = { 
            total_orders : orders?.length,
            orders: orders,
            pending_orders : pending_orders.length,
            todays_order: todays_order.length
        }

        return apiSucessResponce(res , "Fetched Successfully" , data)
    } catch (error) {
        console.log("error in adminFetchForOrderPage controller : " ,error)
        return apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}

export const fetchAdminOrderByIdForOrderPage = async(req , res)=>{
    try {
        const {order_id} = req.params
        const order = await Order.findOne({order_id}).populate([{ path: ["user_id"], select:["name"], strictPopulate: false }]).select(["order_id", "user_id", "order_status", "total_amount", "total_no_of_product", "createdAt" ]).limit(15)

        return apiSucessResponce(res , "Order Fetched Successfully" , order)

    } catch (error) {
        console.log("Error in fetchAdminOrderById controller : " ,error)
        return apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}