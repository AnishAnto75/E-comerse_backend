import mongoose from "mongoose"

const transactionSchema = new mongoose.Schema(
{
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String,
        enum: [
            // Income
            "Sales", "Refund Received", "Commission", "Interest", "Other Income",

            // Expense
            "Purchase", "Salary", "Rent", "Electricity", "Internet", "Fuel", "Packaging", "Marketing", "Maintenance", "Tax", "Miscellaneous"
        ],
        required: true
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    payment_method: {
        type: String,
        enum: [ "Cash", "UPI", "Card", "Bank Transfer", "Cheque", "Wallet", "Other" ],
        required: true
    },
    reference_no: {type: String, default: null },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null},
    purchase_id: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase",  default: null },
    notes: { type: String, required: true },
    transaction_date: { type: Date, required: true },
    performed_by: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", },
    metadata : { type: mongoose.Schema.Types.Mixed, default: {} }
},{
    timestamps: true
})

transactionSchema.index(
    { order_id: 1, category: 1 },
    {
        unique: true,
        partialFilterExpression: {
            order_id: { $type: "objectId" },
            category: "Sales"
        }
    }
)

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction