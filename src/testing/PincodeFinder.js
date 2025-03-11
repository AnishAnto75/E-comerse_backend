import mongoose from "mongoose";

const productSchema = mongoose.Schema({
    product_group: { type : mongoose.SchemaTypes.ObjectId, ref : "ProductGroup", required : true },
    product_category: { type : mongoose.SchemaTypes.ObjectId, ref : "ProductCategory", required : true },
    product_brand: { type : String, required : true },
    product_barcode: { type : String, unique: true, required : true },
    product_name: { type : String, required : true },
    product_unit: {type: String, enum : ['gm','kg','ml','lit','pcs','cap'], default: 'gm' },
    product_stock : [{
        batch_no: [{ type: String, required: true }],
        stock: {type: Number, required: true },
        quantity: {type: String, required: true},
        manufacture_date: { type: Date, required: true },
        expire_date: { type: Date, required: true },
        best_before: { type: Number, required: true },
        mrp: { type : Number, required: true },
        price: { type : Number, required: true },
        purchase_cost : { type : Number, default: null },
        other_expences : { type : Number, default: null },
    }],
    product_total_stock : {type: Number, default: 0},
    product_total_stock_sold : {type: Number, default: 0}, 
    product_offer: {
        unit : {type : Number, default: null },
        discounted_price : {type : Number, default: null}
    },
    product_net_unit: {type: Number, default: 1 },
    product_out_of_stock : { type: Boolean, default: false },
    product_min_order_quantity : { type: Number, default: 1 },
    product_max_order_quantity : { type: Number, default: null},
    product_low_in_stock : { type: Number, default: 0 },
    product_photos : { type : String, default: null },
    product_additional_photos : [{type: String, default: null }],
    product_hsn_code : { type : Number, default: null },
    product_gst : { type : Number, default: null },
    product_description : { type : String, default: null } ,
    product_highlights : [{ type : String, default: null }],
    product_added_by : { type : mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
    product_ratings : [{
        user_id : { type: mongoose.SchemaTypes.ObjectId, ref: "User" , required: true },
        review : { type : Number, enum : [1 , 2 , 3 , 4 , 5], required: true }
    }],
    product_review : [{
        user_id : { type: mongoose.SchemaTypes.ObjectId, ref: "User" , required: true },
        review : { type: String, required: true }
    }],
    product_varient : [{
        product_id : { type: mongoose.SchemaTypes.ObjectId, ref: 'Product', required: true },
        Vatient_Name : { type: String, required: true }
    }],
    FAQ : [{
        question : {type: String, required: true },
        answer : {type: String, required: true }
    }],
    hidden : {type: Boolean, default: false},
    deleted : {type: Boolean, default: false},
},{ timestamps : true }
)

const Product = mongoose.model("Product" , productSchema)

export default Product

