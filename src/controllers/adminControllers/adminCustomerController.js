import User from "../../models/UserModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"


export const adminFetchCustomersPage = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1)
        const limit = Math.min( Math.max(parseInt(req.query.limit) || 20, 1), 100 )
        const skip = (page - 1) * limit

        const status = req.query.status?.trim()
        const search = req.query.search?.trim()

        const match = { deleted: false };
        if (status && status !== "all") { match.status = status }
        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const searchRegex = { $regex: escapedSearch, $options: "i" }
            match.$or = [
                { user_id: searchRegex }, 
                { email: searchRegex },
                { phoneNumber: searchRegex }
            ]
        }

        const summaryResult = await User.aggregate([
            { $match: { deleted: false }},
            { $group: {
                _id: null,
                total_customers: { $sum: 1 },
                active_customers: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0 ]}},
                inactive_customers: { $sum: { $cond: [ { $eq: ["$status", "inactive"] }, 1, 0 ]}},
                blocked_customers: { $sum: { $cond: [{ $eq: ["$status", "blocked"] }, 1, 0 ]}}
            }},
            { $project: {
                _id: 0,
                total_customers: 1,
                active_customers: 1,
                inactive_customers: 1,
                blocked_customers: 1
            }}
        ])

        const summary = summaryResult[0] || {
            total_customers: 0,
            active_customers: 0,
            inactive_customers: 0,
            blocked_customers: 0
        };

        const totalCustomers = await User.countDocuments(match)
        const totalPages = Math.ceil(totalCustomers / limit)

        const customers = await User.find( match )
            .select( "user_id email name gender DOB phoneNumber status score createdAt" )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()

        const data = { 
            summary, 
            customers,
            pagination: {
                current_page: page,
                limit,
                total_customers: totalCustomers,
                total_pages: totalPages,
                has_next_page: page < totalPages,
                has_previous_page: page > 1
            }
        }

        return apiSucessResponce( res, "Customers fetched successfully", data, 200 )

    } catch (error) {
        console.error("Error in adminFetchCustomers:", error)
        return apiErrorResponce( res, "Internal Server Error", null, 500 )
    }
}

export const adminFetchCustomerPreviewPage = async (req, res) => {
    try {

        const { user_id } = req.params
        if (!user_id?.trim()) { return apiErrorResponce( res, "User ID is required", null, 400 )}

        const customer = await User.aggregate([
            { $match: { user_id: user_id.trim(), deleted: false }},
            { $lookup: {
                from: "orders",
                let: { customerId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $and: [ 
                        { $eq: [ "$user_id", "$$customerId" ]},
                        { $ne: [ "$current_status", "cancelled" ]}
                    ]}}},
                    { $group: {
                        _id: null,
                        total_orders: { $sum: 1 },
                        total_spending: { $sum: "$total_amount" },
                        last_ordered: { $max: "$createdAt"}
                    }}
                ],
                as: "order_stats"
            }},
            { $unwind: { path: "$order_stats", preserveNullAndEmptyArrays: true }},
            { $project: {
                _id: 0,
                user_id: 1,
                email: 1,
                name: 1,
                gender: 1,
                DOB: 1,
                phoneNumber: 1,
                status: 1,
                score: 1,
                createdAt: 1,
                total_orders: { $ifNull: [ "$order_stats.total_orders", 0]},
                total_spending: { $ifNull: [ "$order_stats.total_spending", 0]},
                last_ordered: { $ifNull: [ "$order_stats.last_ordered", null ]}}
            }
        ])

        if (!customer.length) { return apiErrorResponce( res, "Customer not found", null, 404 )}
        return apiSucessResponce( res, "Customer fetched successfully", customer[0], 200 )

    } catch (error) {
        console.error( "Error in adminFetchCustomer:", error )
        return apiErrorResponce( res, "Internal Server Error", null, 500 )
    }
};
















// 


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
        const customers = await User.find({deleted : false , blocked : false, user_type : 'user'}).sort({ createdAt: -1 }).select(["user_id", "name", "email", "phoneNumber", "gender"])

        const data = {
            customers : customers.slice(0, 15),
            total_customers : customers.length,
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

        apiSucessResponce(res , "Order Fetched Sucessfully" , customer)
    } catch (error) {
        console.log("error in fetchAdminOrder controller : " ,error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}

export const adminBlockUser = async(req , res)=>{
    try {
        const {user_id} = req.params
        const customer = await User.findOne({user_id})
        customer.blocked = true
        await customer.save()

        apiSucessResponce(res , "adminBlockUser Successfully" , customer)
    } catch (error) {
        console.log("error in fetchAdminOrder controller : " ,error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}

export const adminUnBlockUser = async(req , res)=>{
    try {
        const {user_id} = req.params
        const customer = await User.findOne({user_id})
        customer.blocked = false
        await customer.save()

        apiSucessResponce(res , "adminBlockUser Successfully" , customer)
    } catch (error) {
        console.log("error in fetchAdminOrder controller : " ,error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}

