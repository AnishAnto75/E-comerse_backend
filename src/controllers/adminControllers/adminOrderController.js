import mongoose from "mongoose"
import Order from "../../models/OrderModel.js"
import Staff from "../../models/StaffModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"


export const fetchAdminOrder = async(req , res)=>{
    try {
        const {order_id} = req.params
        const order = await Order.findOne({order_id})
        .populate({ path: ["user_id"], select:["email", "name", "user_id", "phoneNumber"], strictPopulate: false })

        if(!order){
            throw new Error("Internal Server Error")
        }
        apiSucessResponce(res , "Order Fetched Sucessfully" , order)
    } catch (error) {
        console.log("error in fetchAdminOrder controller : " ,error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}

export const adminConfirmOrder = async (req, res) => {
    try {
        const { order_id } = req.params;
        const staffId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(order_id)) { return apiErrorResponce(res , "Invalid order id.") }

        const order = await Order.findOneAndUpdate( { _id: order_id, current_status: "placed" },
            {
                $set: {
                    current_status: "confirmed",
                    "order_status.confirmed.status": true,
                    "order_status.confirmed.date": new Date(),
                    "order_status.confirmed.confirmation_by": staffId
                }
            },
            { returnDocument: "after" }
        );

        if (!order) { return apiErrorResponce(res , "Order not found or already confirmed.", null, 404) }

        return apiSucessResponce(res , "Order confirmed successfully", order, 200 )

    } catch (error) {
        console.error("error in adminConfirmOrder Controller : ",error);

        return apiErrorResponce(res , "internal server error" , null , 500)

    }
}

export const adminFetchDeliveryStaffForOut = async (req, res) => {
    try {
        const { term } = req.params;
        
        if (!term?.trim()) { return apiErrorResponce(res, "Search term is required") }
        
        const search = term.trim();

        const staffs = await Staff.find({
            department: "delivery", status: "active", deleted: false, 
            $or: [
                { name: { $regex: `^${search}`, $options: "i" } },
                { staff_id: { $regex: `^${search}`, $options: "i" } },
                { phone_number: { $regex: `^${search}` } }
            ]
        }).select("_id staff_id name gender role phone_number photo").sort({ name: 1 }).limit(10).lean();

        return apiSucessResponce(res, "", staffs)

    } catch (error) {
        console.log("error in adminFetchDeliveryStaffForOut controller" , error)
        return apiErrorResponce(res , "internal Server Error", null, 500)
    }
};

export const adminUpdateOrderOut = async (req, res) => {
    try {
        const { order_id } = req.params;
        const { delivery_staff_id } = req.body;
        const staff_id = req.user._id

        if (!mongoose.Types.ObjectId.isValid(order_id)) { return apiErrorResponce(res, "Invalid order id.") }
        if (!mongoose.Types.ObjectId.isValid(delivery_staff_id)) { return apiErrorResponce(res, "Invalid delivery staff.") }

        const deliveryStaff = await Staff.findOne({ _id: delivery_staff_id, department: "delivery", status: "active", deleted: false }).select("_id");

        if (!deliveryStaff) { return apiErrorResponce(res, "Delivery staff not found.") }

        const delivery_otp = Math.floor(100000 + Math.random() * 900000);

        const order = await Order.findOneAndUpdate( { _id: order_id, current_status: "confirmed" },
            {
                $set: {
                    delivery_otp,
                    current_status: "out",

                    "order_status.out.status": true,
                    "order_status.out.date": new Date(),
                    "order_status.out.taken_by": delivery_staff_id,
                    "order_status.out.confirmation_by": staff_id,
                },
            },
            { returnDocument: "after" }
        );

        if (!order) { return apiErrorResponce( res, "Order not found or already moved to another status.") }

        return apiSucessResponce( res, "Order moved to out successfully.", order );

    } catch (error) {
        console.error("Error in adminUpdateOrderOut:", error);
        return apiErrorResponce(res, "Internal Server Error", null, 500);
    }
};










 //old
export const adminUpdateOrderToCancel = async(req , res)=>{
    try {
        const {id} = req.params
        const staff_id = req.user._id

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


export const fetchAllOrders = async(req , res)=>{
    try {
        const orders = await Order.find()
        apiSucessResponce(res , "All Orders Fetched" , orders)
    } catch (error) {
        console.log("error in fetchAllOrders controller : " ,error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
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