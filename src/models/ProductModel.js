import mongoose from "mongoose"

const productSchema = mongoose.Schema({
    product_group: { type : mongoose.SchemaTypes.ObjectId, ref : "ProductGroup", required : true },
    product_category: { type : mongoose.SchemaTypes.ObjectId, ref : "ProductCategory", required : true },
    product_brand: { type : mongoose.SchemaTypes.ObjectId, ref : "ProductBrand", required : true },
    product_barcode: { type : String, required : true },
    product_name: { type : String, required : true, trim: true },
    product_UOM: { type: String, enum : ['gm','kg','ml','lit','pcs','cap'], required: true },
    product_net_unit: {type: Number, default: 1 },
    product_min_order_quantity : { type: Number, default: 1 },
    product_max_order_quantity : { type: Number, default: 999},
    product_hsn_code : { type : String, default: null },
    product_photo : {
        type: {
            url: {type: String, required: true},
            public_id: { type: String, default: ""},
        },
        required: true,
    },
    product_additional_photos : [
        { 
            url: { type: String, default: ""},
            public_id: { type: String, default: ""}
        }
    ],
    product_description : { type : String, default: null },
    product_highlights:{ type:[String], default:[] },
    product_added_by : { type : mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
    product_varient : [{
        product_id : { type: mongoose.SchemaTypes.ObjectId, ref: 'Product', required: true },
        varient_name : { type: String, required: true }
    }],
    product_review_id: { type : mongoose.SchemaTypes.ObjectId, ref : "ProductReview" },
    faqs: {
        type: [{
            question: { type: String, required: true},
            answer: { type: String, required: true}
        }],
        default: []
    },
    current_stock: { type: Number, default: 0 },
    latest_batch_details: {
        batch_no : { type: String, default: "" },
        size: {type: String, default: "" },
        manufacture_date: { type: Date, default: null},
        expiry_date: { type: Date, default: null },
        best_before: { type: Number, default: 0 },
        mrp: { type : Number, default: 0 },
        purchase_cost : { type : Number, default: 0 },                  // without gst
        gst_percentage : { type : Number, default: 0 },
        other_expenses : { type : Number, default: 0 },
        selling_price: { type : Number, default: 0 },
    },
    search_keywords: { type: [String], default: []},
    out_of_stock : { type: Boolean, default: false },
    status: { type: String, enum : ['active', 'inactive'], default: "active" },
    deleted : {type: Boolean, default: false},
},{ timestamps : true }
)

productSchema.index({product_barcode: 1, deleted: 1},{unique: true});

productSchema.index({
    product_name:"text",
    product_description: "text",
    search_keywords:"text",
});

productSchema.index({createdAt:-1});

const Product = mongoose.model("Product" , productSchema)
export default Product