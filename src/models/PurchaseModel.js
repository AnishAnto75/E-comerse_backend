import mongoose from "mongoose";

const purchaseSchema = mongoose.Schema({
    supplier_id : { type : mongoose.SchemaTypes.ObjectId, ref : "Supplier", required : true },
    invoice_no : {type: String, required: true },
    products : [{
        product_barcode: { type : String, required : true },
        product_name: { type : String, required : true },
        batch_no: [{ type: String, required: true }],
        quantity_recieved: {type: Number, required: true },
        quantity: {type: String, required: true},
        manufacture_date: { type: Date, required: true },
        expire_date: { type: Date, required: true },
        best_before: { type: Number, default: null },
        mrp: { type : Number, required: true },
        price: { type : Number, required: true },
        purchase_cost : { type : Number, required: true },
        gst: { type : Number, required: true },
        other_expences: { type : Number, default: 0 },
    }],
    total_purchase_amount :  { type : Number, required: true },
    payment_done : {type: Boolean, required: true},
    added_by : { type : mongoose.SchemaTypes.ObjectId, ref : "User", required : true }
},{timestamps: true})

const Purchase = mongoose.model ("Purchase", purchaseSchema)
export default Purchase