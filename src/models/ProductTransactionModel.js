import mongoose from "mongoose"

const productTransactionSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    purchase_id: { type: mongoose.Schema.Types.ObjectId, ref : "Purchase" },
    batch_no: { type: String, default: "" },
    transaction_type: { type: String,
        enum: [ 
            "sale",
            "return",
            "stock_in",
            "stock_out",
            "adjustment"
        ],
        required: true,
        index: true
    },
    source: { type: String, enum: [ "pos", "online", "admin", "purchase", "return" ], required: true, index: true },
    quantity: { type: Number, required: true, min: [1, "Quantity cannot be 0"]},
    selling_price: { type: Number, min: 0 },
    purchase_cost: { type: Number, min: 0 },
    total_amount: { type: Number, min: 0 },
    reference_id: { type: mongoose.Schema.Types.ObjectId },
    reference_type: { type: String, enum: [ "Order", "POSOrder", "Purchase" ] },
    reference_no: { type: String, default: "" },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    note: { type: String, default: "" }
}, { timestamps: true}
)

productTransactionSchema.index({ product_id: 1, createdAt: -1 })
productTransactionSchema.index({ purchase_id: 1, createdAt: -1 })
productTransactionSchema.index({ source: 1, transaction_type: 1, createdAt: -1 })

const ProductTransaction = mongoose.model( "ProductTransaction", productTransactionSchema )
export default ProductTransaction