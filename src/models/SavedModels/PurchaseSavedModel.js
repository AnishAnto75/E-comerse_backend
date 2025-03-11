import mongoose from "mongoose";

const purchaseSavedSchema = mongoose.Schema({
    supplier_id : { type : mongoose.SchemaTypes.ObjectId, ref : "Supplier", default : null },
    invoice_no : {type: String, default : null },
    products : [{
        product_barcode: { type : String, default : null },
        product_name: { type : String, default : null },
        batch_no: [{ type: String, default : null }],
        quantity_recieved: {type: Number, default : null },
        quantity: {type: String, default : null},
        manufacture_date: { type: Date, default : null },
        expire_date: { type: Date, default : null },
        best_before: { type: Number, default: null },
        mrp: { type : Number, default : null },
        price: { type : Number, default : null },
        purchase_cost : { type : Number, default : null },
        gst: { type : Number, default : null },
        other_expences : { type : Number, default: 0 },
    }],
    total_purchase_amount :  { type : Number, default : null },
    payment_done : {type: Boolean, default : null},
    added_by : { type : mongoose.SchemaTypes.ObjectId, ref : "User", required : true }
},{timestamps:true})

const SavedPurchaseEntry = mongoose.model ("SavedPurchaseEntry", purchaseSavedSchema)
export default SavedPurchaseEntry