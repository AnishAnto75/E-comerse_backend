import Transaction from "../../models/TransactionModel.js";
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js";

export const adminFetchTransactionsPage = async (req, res) => {
    try {

        const page = Math.max( parseInt(req.query.page) || 1, 1 )
        const limit = Math.min( Math.max(parseInt(req.query.limit) || 20, 1), 100 )
        const skip = (page - 1) * limit

        const type = req.query.type?.trim() && req.query.type.trim() !== "all" ? req.query.type.trim() : ""
        const category = req.query.category?.trim() && req.query.category.trim() !== "all" ? req.query.category.trim() : ""
        const payment_method = req.query.payment_method?.trim() && req.query.payment_method.trim() !== "all" ? req.query.payment_method.trim() : ""

        const allowedTypes = ["income", "expense"];
        const allowedPaymentMethods = [ "Cash", "UPI", "Card", "Bank Transfer", "Cheque", "Wallet", "Other" ]
        const allCategories = [ "Sales", "Refund Received", "Commission", "Interest", "Other Income", "Purchase", "Salary", "Rent", "Electricity", "Internet", "Fuel", "Packaging", "Marketing", "Maintenance", "Tax", "Miscellaneous" ]
        if (type && !allowedTypes.includes(type)) { return apiErrorResponce( res, "Invalid transaction type.", null, 400 )}
        if ( payment_method && !allowedPaymentMethods.includes(payment_method)) { return apiErrorResponce( res, "Invalid payment method.", null,400 )}
        if ( category && !allCategories.includes(category) ) { return apiErrorResponce( res, "Invalid transaction category.", null, 400 )}

        const match = {}
        if (type) { match.type = type }
        if (category) { match.category = category }
        if (payment_method) { match.payment_method = payment_method }

       
        const [totalTransactions, transactions] = await Promise.all([

            Transaction.countDocuments(match),

            Transaction.find(match)
                .select(` type category title amount payment_method reference_no order_id purchase_id notes transaction_date createdAt `)
                .sort({ createdAt : -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ])

        const totalPages = Math.ceil(totalTransactions / limit);

        const data = {
            transactions,
            pagination: {
                current_page: page,
                limit,
                total_transactions: totalTransactions,
                total_pages: totalPages,
                has_next_page: page < totalPages,
                has_previous_page: page > 1
            },
        }

        return apiSucessResponce( res, "Transactions page fetched successfully.", data, 200 )
    } catch (error) {
        console.error( "Error in adminFetchTransactionsPage:", error )
        return apiErrorResponce( res, "Internal Server Error", null, 500 )
    }
}