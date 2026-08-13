import mongoose from "mongoose"
import Order from "../../models/OrderModel.js"
import Staff from "../../models/StaffModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import Transaction from "../../models/TransactionModel.js"

export const adminFetchOrderPage = async (req, res) => {
    try {

        const page = Math.max( parseInt(req.query.page) || 1, 1)
        const limit = Math.min( Math.max(parseInt(req.query.limit) || 20, 1), 100 )
        const skip = (page - 1) * limit;

        const status = req.query.status?.trim();

        const match = { }
        if (status && status !== "all") {
            if (!["placed", "confirmed", "out", "delivered", "cancelled"].includes(status)) { return apiErrorResponce( res, "Invalid supplier status",null, 400 )}
            match.current_status = status;
        }

        // Pending order counts
        const pendingOrders = await Order.aggregate([
            { $match: { current_status: { $in: ["placed", "confirmed", "out"] } } },
            {
                $group: {
                    _id: null,
                    placed: { $sum: { $cond: [ { $eq: ["$current_status", "placed"] }, 1, 0]}},
                    confirmed: { $sum: { $cond: [ { $eq: ["$current_status", "confirmed"] }, 1 , 0 ]}},
                    out: { $sum: { $cond: [ { $eq: ["$current_status", "out"] }, 1, 0 ]}}
                }
            }
        ])
        const pendingOrderData = pendingOrders[0] || {
            placed: 0,
            confirmed: 0,
            out: 0
        }

        // Recent orders
        const orders = await Order.find(match)
            .select(` _id order_id total_amount total_quantity items.length delivery_address.name delivery_address.phone_number payment.method payment.status current_status rating.score createdAt `)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()

        const totalOrders = await Order.countDocuments(match);
        const totalPages = Math.ceil( totalOrders / limit )

        const data = {
            pendingOrders: [
                {
                    name: "Pending Orders",
                    placed: pendingOrderData.placed,
                    confirmed: pendingOrderData.confirmed,
                    out: pendingOrderData.out
                }
            ],
            orders,
            pagination: {
                current_page: page,
                limit,
                total_orders: totalOrders,
                total_pages: totalPages,
                has_next_page: page < totalPages,
                has_previous_page: page > 1
            }
        }

        return apiSucessResponce( res, "order data successfully.", data, 200)

    } catch (error) {
        console.error( "Error in adminFetchOrderPage:", error );
        return apiErrorResponce( res, "Internal Server Error", null, 500 );
    }
};

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

export const adminOutOrder = async (req, res) => {
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

export const adminDeliverOrder = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { order_id } = req.params;
        const { delivery_otp } = req.body;
        const staffId = req.user?._id;

        if (!order_id?.trim()) { return apiErrorResponce(res, "Order ID is required.", 400) }
        if (!delivery_otp?.trim()) { return apiErrorResponce(res, "Delivery OTP is required.", 400) }
        if (!staffId) { return apiErrorResponce( res, "Delivery staff authentication required.", 401 ) }

        session.startTransaction();

        const staff = await Staff.findOne({ _id: staffId, deleted: false, department: "delivery" }).select("_id name role").session(session);
        if (!staff) { await session.abortTransaction(); return apiErrorResponce( res, "Invalid delivery staff.", 403 ) }

        const order = await Order.findOne({ order_id: order_id.trim() }).session(session);

        if (!order) { await session.abortTransaction(); return apiErrorResponce( res, "Order not found.", 404 ) }
        if (order.current_status !== "out") { await session.abortTransaction(); return apiErrorResponce( res, `Order cannot be delivered because its status is "${order.current_status}".`, 400 ) }

        const assignedStaff = order.order_status?.out?.taken_by;
        if (!assignedStaff) { await session.abortTransaction(); return apiErrorResponce( res, "No delivery staff has been assigned to this order.", 400 ) }
        if (assignedStaff.toString() !== staff._id.toString() ) { await session.abortTransaction(); return apiErrorResponce( res, "This order is assigned to another delivery staff.", 403) }

        if (!order.delivery_otp) { await session.abortTransaction(); return apiErrorResponce( res, "Delivery OTP is not available for this order.", 400 ) }
        if (order.delivery_otp !== delivery_otp.trim()) { await session.abortTransaction(); return apiErrorResponce( res, "Invalid delivery OTP.", 400);}

        const deliveredAt = new Date();

        order.current_status = "delivered";
        order.order_status.delivered = {
            status: true,
            date: deliveredAt,
            delivered_by: staff._id,
            otp_verified: true
        };

        order.delivery_otp = "";

        if (order.payment.method === "COD") {

            order.payment.status = "Paid";
            order.payment.paid_at = deliveredAt;

            const transaction = new Transaction({
                type: "income",
                category: "Sales",
                title: `Sale - Order ${order.order_id}`,
                amount: order.total_amount,
                payment_method: "Cash",
                reference_no: order.order_id,
                order_id: order._id,
                notes: "COD payment collected on delivery.",
                transaction_date: deliveredAt,
            });

            await transaction.save({ session });
        }

        await order.save({ session });
        await session.commitTransaction();
        return apiSucessResponce( res, "Order delivered successfully.", order, 200);

    } catch (error) {
        if (session.inTransaction()) { await session.abortTransaction() }
        console.log( "Error in adminDeliverOrder controller:", error);
        return apiErrorResponce( res, "Internal Server Error", null, 500);
    } finally { await session.endSession() }
};

export const adminCancelOrder = async (req, res) => {

    const session = await mongoose.startSession();

    try {

        const { order_id } = req.params;
        const { reason } = req.body;
        const staffId = req.user?._id;

        if (!order_id?.trim()) { return apiErrorResponce( res, "Order ID is required.", 400 ) }
        if (!staffId) { return apiErrorResponce( res, "Staff authentication required.", 401 ) }
        if (!reason?.trim()) { return apiErrorResponce( res, "Cancellation reason is required.", 400 ) }
        if ( reason.trim().length > 500 ) { return apiErrorResponce( res, "Cancellation reason cannot exceed 500 characters.", 400) }

        session.startTransaction();

        const staff = await Staff.findOne({ _id: staffId, deleted: false, status: "active" }) .select("_id name department role").session(session)
        if (!staff) { await session.abortTransaction(); return apiErrorResponce( res, "Invalid or inactive staff.", 403 ) }

        const order = await Order.findOne({ order_id: order_id.trim() }).session(session);

        if (!order) { await session.abortTransaction(); return apiErrorResponce( res, "Order not found.", 404 )}
        if (order.current_status === "cancelled") { await session.abortTransaction(); return apiErrorResponce( res, "Order is already cancelled.", 400 )}
        if (order.current_status === "delivered") { await session.abortTransaction(); return apiErrorResponce( res, "Delivered orders cannot be cancelled.",400) }

        if (order.current_status === "out") {
            const assignedStaff = order.order_status?.out?.taken_by;
            if (!assignedStaff) { await session.abortTransaction(); return apiErrorResponce( res, "No delivery staff is assigned to this order.", 400 ) }
            if ( staff.department === "delivery" && assignedStaff.toString() !== staff._id.toString() ) { await session.abortTransaction(); return apiErrorResponce( res, "This order is assigned to another delivery staff.", 403 )}
        }

        if ( !["placed", "confirmed", "out"].includes(order.current_status)) { await session.abortTransaction(); return apiErrorResponce( res, `Order cannot be cancelled because its status is "${order.current_status}".`,400 )}

        order.current_status = "cancelled";

        order.order_status.cancelled = {
            status: true,
            date: new Date(),
            cancelled_by: "staff",
            cancelled_staff_id: staff._id,
            reason: reason.trim()
        };

        order.delivery_otp = "";

        if ( order.payment.method !== "COD" && order.payment.status === "Paid" ) {
            order.payment.refund = {
                amount: order.total_amount,
                status: "Pending",
                transaction_id: ""
            };
        }

        await order.save({ session });
        await session.commitTransaction();
        return apiSucessResponce( res, "Order cancelled successfully.", order, 200 )

    } catch (error) {
        if (session.inTransaction()) { await session.abortTransaction();}
        console.error( "Error in adminCancelOrder:", error);
        return apiErrorResponce( res, "Internal Server Error", null, 500 )
    } finally {
        await session.endSession();
    }
};


// testing controllers
export const fetchAllAdminOrder = async(req , res)=>{
    try {
        const order = await Order.find()

        if(!order){
            throw new Error("Internal Server Error")
        }
        apiSucessResponce(res , "Orders Fetched Sucessfully" , order)
    } catch (error) {
        console.log("error in fetchAllAdminOrder controller : " ,error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}
