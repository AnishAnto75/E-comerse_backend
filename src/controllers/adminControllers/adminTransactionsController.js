import Transaction from "../../models/TransactionModel.js";
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js";

export const adminCreateTransaction = async (req, res) => {
    try {

        const { type, category, amount, payment_method, reference_no, notes, transaction_date } = req.body

        const validTypes = ["income", "expense"];
        const validIncomes = [ "Refund Received", "Commission", "Interest", "Other Income" ]
        const validExpenses = [ "Rent", "Electricity", "Internet", "Fuel", "Packaging", "Marketing", "Maintenance", "Tax", "Miscellaneous" ]
        const validPaymentMethods = [ "Cash", "UPI", "Card", "Bank Transfer", "Cheque", "Wallet", "Other" ]
        const transactionTitles = {
            "Refund Received": "Refund Received",
            "Commission": "Commission Received",
            "Interest": "Interest Received",
            "Other Income": "Other Income Received",

            "Rent": "Rent Paid",
            "Electricity": "Electricity Bill Paid",
            "Internet": "Internet Bill Paid",
            "Fuel": "Fuel Expense",
            "Packaging": "Packaging Expense",
            "Marketing": "Marketing Expense",
            "Maintenance": "Maintenance Expense",
            "Tax": "Tax Paid",
            "Miscellaneous": "Miscellaneous Expense"
        }

        const cleanType = typeof type === "string" ? type.trim() : ""
        const cleanCategory = typeof category === "string" ? category.trim() : ""
        const cleanPaymentMethod = typeof payment_method === "string" ? payment_method.trim() : ""
        const cleanReferenceNo = typeof reference_no === "string" ? reference_no.trim() : ""
        const cleanNotes = typeof notes === "string" ? notes.trim() : ""
        const transactionAmount = Number(amount)

        if ( !cleanType ) { return apiErrorResponce( res, "Transaction type is required.", null, 400 )}
        if ( !validTypes.includes(cleanType)) { return apiErrorResponce( res, "Invalid transaction type.", null, 400 )}
        if ( !cleanCategory ) { return apiErrorResponce( res, "Transaction category is required.", null, 400 )}
        if ( cleanType === "income" && !validIncomes.includes(cleanCategory)) { return apiErrorResponce( res, "Invalid income category.", null, 400 )}
        if ( cleanType === "expense" && !validExpenses.includes(cleanCategory)) { return apiErrorResponce( res, "Invalid expense category.", null, 400 )}
        if ( amount === undefined || amount === null || amount === "" || !Number.isFinite(transactionAmount) || transactionAmount <= 0 ) { return apiErrorResponce( res, "Valid transaction amount is required.", null, 400 )}
        if ( !cleanPaymentMethod ) { return apiErrorResponce( res, "Payment method is required.", null, 400 )}
        if ( !validPaymentMethods.includes(cleanPaymentMethod)) { return apiErrorResponce( res, "Invalid payment method.", null, 400 )}
        if ( !cleanNotes ) { return apiErrorResponce( res, "Notes is required.", null, 400 )}
        if ( !transaction_date) { return apiErrorResponce( res, "Transaction date is required.", null, 400 )}

        const transactionDate = new Date(transaction_date)
        if ( Number.isNaN(transactionDate.getTime())) { return apiErrorResponce( res, "Invalid transaction date.", null, 400 )}

        const title = transactionTitles[cleanCategory]
        if (!title) { return apiErrorResponce( res, "Transaction title configuration not found.", null, 400 )}

        const transaction = await Transaction.create({
            type: cleanType,
            category: cleanCategory,
            title,
            amount: transactionAmount,
            payment_method: cleanPaymentMethod,
            reference_no: cleanReferenceNo || null,
            notes: cleanNotes,
            transaction_date: transactionDate,
            performed_by: req.user._id
        })

        return apiSucessResponce( res, "Transaction created successfully.", transaction, 201 )

    } catch (error) {
        console.error( "Error in adminCreateTransaction:", error )
        if (error.code === 11000) { return apiErrorResponce( res, "Duplicate transaction.", null, 409 )}
        return apiErrorResponce( res, "Internal Server Error", null, 500)
    }
}

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