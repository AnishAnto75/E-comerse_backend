import mongoose from "mongoose"

const posOrderItemSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    purchase_id: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", required: true },
    batch_no: { type: String, trim: true, maxlength: 100, default: "" },
    product_name: { type: String, required: true, trim: true, maxlength: 200 },
    product_barcode: { type: String, required: true, trim: true, maxlength: 100 },
    size: { type: Number, min: 0, default: null },
    uom: { type: String, required: true, trim: true, maxlength: 20 },
    quantity: { type: Number, required: true, min: [1, "Quantity must be at least 1"], validate: { validator: Number.isInteger, message: "Quantity must be a whole number"}},
    returned_quantity: { type: Number, default: 0, min: 0, validate: { validator: Number.isInteger, message: "Returned quantity must be a whole number" }},
    
    unit_purchase_cost: { type: Number, required: true, min: 0 },                   // purchase cost + gst + Other expense 
    total_cost: { type: Number, required: true, min: 0 },                           // unit_purchase_cost × quantity

    mrp: { type: Number, required: true, min: 0 },
    selling_price: { type: Number, required: true, min: 0 },
    discount_amount: { type: Number, default: 0, min: 0 },
    final_selling_price: { type: Number, required: true, min: 0 },
    gst_percentage: { type: Number, default: 0, min: 0, max: 100 },
    gst_amount: { type: Number, default: 0, min: 0 }, 
    total_amount: { type: Number, required: true, min: 0 }                          // final_selling_price × quantity
},{ _id: true}
)

const posOrderSchema = new mongoose.Schema({
        order_no: { type: String, required: true, unique: true, trim: true, uppercase: true, immutable: true, maxlength: 50, index: true },
        customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "POSCustomer", default: null, index: true},
        customer_snapshot: {
            customer_name: { type: String, trim: true, maxlength: 100, default: "" },
            phone: { type: String, trim: true, maxlength: 20, default: "" },
            email: { type: String, trim: true, lowercase: true, maxlength: 150, default: "" }
        },
        items: { type: [posOrderItemSchema], required: true, validate: {
            validator: function (items) { return Array.isArray(items) && items.length > 0 },
            message: "Order must contain at least one item"
        }},

        subtotal: { type: Number, required: true, min: 0 },                     // total selling Price
        total_discount: { type: Number, default: 0, min: 0 },
        total_gst: { type: Number, default: 0, min: 0 },
        other_charges: { type: Number, default: 0, min: 0 },                    // if any other charges included
        round_off: { type: Number, default: 0, min: -10, max: 10 },
        grand_total: { type: Number, required: true, min: 0 },                  // subtotal - discount - other charges

        total_cost: { type: Number, required: true, min: 0 },                   // total purchase cost
        gross_profit: { type: Number, required: true, min: 0 },                 // grand total - total cost

        payment: {
            payments: {
                type: [{
                    method: { type: String, enum: [ "cash", "upi", "card", "credit" ], required: true},
                    amount: { type: Number, required: true, min: [ 0.01, "Payment amount must be greater than 0" ]},
                    reference_no: { type: String, trim: true, maxlength: 100, default: "" }
                },{ _id: false }
                ],
                validate: {
                    validator: function (payments) { return ( Array.isArray(payments) && payments.length > 0 )},
                    message: "At least one payment method is required"
                }
            },
            total_paid: { type: Number, required: true, min: 0 },
            status: { type: String, enum: [ "paid", "partial", "unpaid" ], required: true }
        },
        
        // cancelled for if the staff acciedently billed it and cancelled the bill immediatly the bill will not consider
        status: { type: String, enum: [ "completed", "cancelled", "partially_returned", "returned" ], required: true, default: "completed", index: true },              
        sold_by: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, immutable: true, index: true },

        terminal_id: { type: String, trim: true, maxlength: 100, default: "" },                 // counter id

        notes: { type: String, trim: true, maxlength: 500, default: "" }
    }, { timestamps: true, versionKey: false}
)

posOrderSchema.index({ createdAt: -1 })
posOrderSchema.index({ customer_id: 1, createdAt: -1 })
posOrderSchema.index({ sold_by: 1, createdAt: -1 })
posOrderSchema.index({ status: 1, createdAt: -1 })
posOrderSchema.index({ "items.product_id": 1, createdAt: -1 })

const POSOrder = mongoose.model( "POSOrder", posOrderSchema )
export default POSOrder