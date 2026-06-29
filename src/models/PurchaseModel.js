import mongoose from "mongoose";

const purchaseSchema = mongoose.Schema({
    supplier_id : { type : mongoose.SchemaTypes.ObjectId, ref : "Supplier", required : true },
    invoice_no : {type: String, required: true },
    products : [{
        product_barcode: { type : String, required : true },
        batch_no: { type: String, default: null },
        quantity_recieved: {type: Number, required: true },
        size: {type: String, required: true},
        manufacture_date: { type: Date, default: null },
        expire_date: { type: Date, default: null},
        best_before: { type: Number, default: null },
        mrp: { type : Number, required: true },
        purchase_cost : { type : Number, required: true },
        gst : { type : Number, required: true },
        other_expences : { type : Number, required: true },
        price: { type : Number, required: true },
        total_purchase_cost: { type : Number, required: true },
    }],
    total_purchase_amount :  { type : Number, required: true },
    added_by : { type : mongoose.SchemaTypes.ObjectId, ref : "User", required : true }
},{timestamps: true})

const Purchase = mongoose.model ("Purchase", purchaseSchema)
export default Purchase
