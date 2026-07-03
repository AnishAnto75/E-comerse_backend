import mongoose from "mongoose"

const productInventorySchema = mongoose.Schema({
    product_id : { type: mongoose.SchemaTypes.ObjectId, ref: "Product" , required: true },
    product_barcode: { type : String, unique: true, required : true },
    product_low_in_stock : { type: Number, default: 0 },
    product_total_stock : { type: Number, default: 0 },
    product_stock : [{
        purchase_id : { type: mongoose.SchemaTypes.ObjectId, ref: "Purchase" , required: true },
        batch_no: { type: String },
        stock: {type: Number, min:[0, 'Must be at least 0, got {VALUE}'], required: true },
        size: {type: String, required: true},
        manufacture_date: { type: Date},
        expire_date: { type: Date },
        best_before: { type: Number },
        mrp: { type : Number, required: true },
        purchase_cost : { type : Number, required: true },
        gst : { type : Number, required: true },
        other_expences : { type : Number, required: true },
        price: { type : Number, required: true },
    }],
},{ timestamps : true }
)

const ProductInventory = mongoose.model("ProductInventory" , productInventorySchema)
export default ProductInventory