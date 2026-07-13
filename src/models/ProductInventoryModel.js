import mongoose from "mongoose"

const productInventorySchema = mongoose.Schema({
    product_id : { type: mongoose.SchemaTypes.ObjectId, ref: "Product", unique: true , required: true },    
    product_low_in_stock : { type: Number, default: 1 },
    product_total_stock : { type: Number, default: 0 },
    product_stock : [{
        purchase_id : { type: mongoose.SchemaTypes.ObjectId, ref: "Purchase" , required: true },
        batch_no: { type: String, default: "" },
        stock: {type: Number, min:[0, 'Must be at least 0, got {VALUE}'], required: true },
        size: {type: String, default: "" },
        manufacture_date: { type: Date, default: null},
        expiry_date: { type: Date, default: null },
        best_before: { type: Number, default: "" },
        mrp: { type : Number, required: true, min: 0 },
        purchase_cost : { type : Number, required: true, min: 0 },                  // without gst
        gst_percentage : { type : Number, required: true, min: 0 },
        other_expenses : { type : Number, required: true, min: 0 },
        unit_purchase_cost : { type : Number, required: true, min: 0 },              // with gst and other expenses
        selling_price: { type : Number, required: true, min: 0 },
    },{
        timestamps: true
    }],
},{ timestamps : true }
)

const ProductInventory = mongoose.model("ProductInventory" , productInventorySchema)
export default ProductInventory