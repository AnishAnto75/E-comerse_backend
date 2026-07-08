import mongoose from "mongoose";

const purchaseSchema = mongoose.Schema({
    supplier_id : { type : mongoose.SchemaTypes.ObjectId, ref : "Supplier", required : true },
    purchase_id: { type: String, unique: true, required: true},
    supplier_invoice_no : {type: String, required: true },
    invoice_date: {type: Date, required: true },
    delivery_date: {type: Date, required: true },
    products : [{
        product_id: {type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true},
        batch_no: { type: String, default: "" },
        free_received : {type: Number, default: 0, min: 0 },
        quantity_received : {type: Number, required: true, min: 1 },
        size: {type: String, default: ""},
        manufacture_date: { type: Date, default: null },
        expiry_date : { type: Date, default: null},
        best_before: { type: Number, default: "" },
        mrp: { type : Number, required: true, min: 0},
        purchase_cost : { type : Number, required: true ,min: 0},
        gst_percentage : { type : Number, required: true, min: 0 },
        other_expenses : { type : Number, required: true ,min: 0 },
        selling_price: { type : Number, required: true ,min: 0 },
        line_total: { type : Number, required: true ,min: 0 },
    }],
    payment_method: { type: String, enum: ["Cash", "UPI", "Card", "Bank Transfer", "Cheque", "Credit" ], default: "Cash"},
    payment_status: { type: String, enum: ["Paid","Partial","Pending"], required: true},

    sub_total_amount :  { type : Number, required: true },                  // with GST
    discount_received :  { type : Number, default: 0 },
    gst_amount :  { type : Number, required: true },
    grand_total :  { type : Number, required: true },                      // final amount paid
    
    paid_amount: { type: Number, required:true },
    balance_amount: {type: Number,required:true},
    payment_date:{ type:Date, default:null},
    added_by : { type : mongoose.SchemaTypes.ObjectId, ref : "Staff", required : true },
    deleted:{ type:Boolean, default:false},
},{timestamps: true})

purchaseSchema.index({ supplier_id: 1 });

purchaseSchema.index({ invoice_date: -1 });

purchaseSchema.index({ createdAt: -1 });

purchaseSchema.index({ payment_status: 1 });

purchaseSchema.index({ deleted: 1 });

purchaseSchema.index({ supplier_id: 1, supplier_invoice_no: 1 }, { unique: true });

purchaseSchema.index({"products.product_id": 1 });

const Purchase = mongoose.model ("Purchase", purchaseSchema)
export default Purchase
