import mongoose from "mongoose";

const orderSchema = mongoose.Schema({
    order_id : { type : String, unique: true, required : true },
    user_id : { type : mongoose.SchemaTypes.ObjectId, ref : 'User', required : true },
    total_mrp:{ type : Number, required : true, min: 1 },
    total_price:{ type : Number, required : true, min: 1 },
    delivery_charges : { type : Number, required : true, min: 0 },
    total_amount : {type : Number, required : true, min: 200},
    total_gst: { type: Number, required: true, min: 1 },
    total_quantity : {type : Number , required : true, min: 1},
    coupon: {
        type: {
            code: { type: String, default: "" },
            discount: { type: Number, default: 0, min: 0 },
            coupon_id: { type: mongoose.SchemaTypes.ObjectId, ref: "Coupon" }
        },
        default: undefined
    },
    delivery_address :{
        type: {
            name: { type: String, required: true, trim: true },
            phone_number: { type: String, required: true, trim: true },
            alternate_phone_number: { type: String, default: "", trim: true },
            house_no: { type: String, required: true, trim: true },
            area: { type: String, required: true, trim: true },
            landmark: { type: String, default: "",trim: true },
            city: { type: String, required: true, trim: true },
            district: { type: String, required: true, trim: true },
            state: { type: String, required: true, trim: true },
            pincode: { type: String, required: true, trim: true },
            address_type: { type: String, enum: ["home", "work"],},
        },
        immutable: true,
    },
    items :{
        type: [{
            product_id: {type : mongoose.SchemaTypes.ObjectId, ref: "Product" ,required : true},
            inventory_batch_id: {type : mongoose.SchemaTypes.ObjectId, required : true},
            product_barcode: {type : String, required : true},
            product_name: { type : String, required : true, trim: true },
            product_UOM: { type: String, enum : ['gm','kg','ml','lit','pcs','cap'], required: true },
            product_photo : {type: String, required: true },
            batch_no: { type: String, default: "" },
            size: {type: String, default: "" },
            manufacture_date: { type: Date, default: null},
            expiry_date: { type: Date, default: null },
            mrp: { type : Number, required: true, min: 0 },
            unit_price: { type : Number, required: true, min: 0 },
            subtotal: { type : Number, required: true, min: 0 },
            gst_percentage: { type : Number, required: true, min: 0 },
            quantity: {type: Number, required : true, min: 1 },
        }],
        immutable: true,
        validate: {
            validator: function (arr) { return Array.isArray(arr) && arr.length > 0 },
            message: "Order must contain at least one item."
        }
    },
    payment: {
        gateway: { type: String,enum: [ "", "Razorpay", "PhonePe", "Cashfree", "Stripe" ], default: "" },
        method : {type : String, enum: [ "COD", "UPI", "Card", "Net Banking" ], required : true},
        status: { type: String, enum: [ "Pending", "Paid", "Failed", "Refunded" ], default: "Pending" },
        transaction_id: { type: String, default: ""},
        paid_at: { type : Date },
        failed_at: { type : Date },
        refund: {
            type: {
                amount: { type : Number, min: 1 },
                status: { type: String, enum: ["Pending", "Completed", "Rejected"] },
                transaction_id: { type: String, default: "" },
                refunded_at: { type : Date }
            },
            default: undefined
        }
    },
    delivery_otp : {type : "String" , default: ""},
    current_status: { type: String, enum: [ "placed", "confirmed", "out", "delivered", "cancelled" ], default: "placed" },
    order_status: {
        placed:{
            status: { type: Boolean, default: true },
            date: { type : Date, default: Date.now }
        },
        confirmed:{
            status: { type: Boolean, default: false },
            date: { type : Date},
            confirmation_by : { type : mongoose.SchemaTypes.ObjectId, ref : 'Staff'}
        },
        out:{
            status: { type: Boolean, default: false },
            date: { type : Date },
            taken_by: { type : mongoose.SchemaTypes.ObjectId, ref : 'Staff'},
            confirmation_by: { type : mongoose.SchemaTypes.ObjectId, ref : 'Staff'}
        },
        delivered: {
            status: { type: Boolean, default: false },
            date: { type : Date },
            delivered_by: { type : mongoose.SchemaTypes.ObjectId, ref : 'Staff'},
            otp_verified: { type: Boolean }
        },
        cancelled: {
            status: { type: Boolean, default: false },
            date: {type : Date},
            cancelled_by: {type: String, enum: ["customer", "staff"]},
            cancelled_staff_id: {type: mongoose.SchemaTypes.ObjectId, ref: 'Staff'},
            reason: {type: String, maxlength: 500}
        }
    },
    rating: {
        type: {
            score: { type : Number,  min: 1, max: 5 },
            review: { type : String, maxlength: 1000, trim: true },
            reviewed_at: {type: Date}
        },
        default: undefined
    },
    history: { type: mongoose.Schema.Types.Mixed, default: {}}

},{
    timestamps : true
})

orderSchema.index({ user_id: 1, createdAt: -1 });

orderSchema.index({ "payment.status": 1 });

orderSchema.index({ current_status: 1 });

const Order = mongoose.model('Order' , orderSchema )
export default Order
