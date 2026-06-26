import mongoose from "mongoose"

const productSchema = mongoose.Schema({
    product_group: { type : mongoose.SchemaTypes.ObjectId, ref : "ProductGroup", required : true },
    product_category: { type : mongoose.SchemaTypes.ObjectId, ref : "ProductCategory", required : true },
    product_brand: { type : mongoose.SchemaTypes.ObjectId, ref : "ProductBrand", required : true },
    product_barcode: { type : String, unique: true, required : true },
    product_name: { type : String, required : true },
    product_inventory_id: { type : mongoose.SchemaTypes.ObjectId, ref : "ProductInventory" },
    product_UOM: { type: String, enum : ['gm','kg','ml','lit','pcs','cap'], required: true },
    product_net_unit: {type: Number, default: 1 },
    product_min_order_quantity : { type: Number, default: 1 },
    product_max_order_quantity : { type: Number, default: 999},
    product_hsn_code : { type : Number, default: null },
    product_photos : { type : String, default: null },
    product_additional_photos : [{type: String, default: null }],
    product_description : { type : String, default: null },
    product_highlights : [{ type : String, default: null }],
    product_added_by : { type : mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
    product_review_id : { type: mongoose.SchemaTypes.ObjectId, ref: "ProductReview" , required: true },
    product_varient : [{
        product_id : { type: mongoose.SchemaTypes.ObjectId, ref: 'Product', required: true },
        varient_name : { type: String, required: true }
    }],
    FAQ : [{
        question : {type: String, required: true },
        answer : {type: String, required: true }
    }],
    out_of_stock : { type: Boolean, default: false },
    hidden : {type: Boolean, default: false},
    deleted : {type: Boolean, default: false},
},{ timestamps : true }
)

const Product = mongoose.model("Product" , productSchema)
export default Product