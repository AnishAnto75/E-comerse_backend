import mongoose from "mongoose";

const productCategorySchema = mongoose.Schema({
    category_name : { type:String, required : true, unique: true},
    category_description : { type:String},    
    group_id : { type: mongoose.Schema.Types.ObjectId, ref : "ProductGroup" },
    category_image: { type:String },
    deleted : { type:Boolean, default:false}
},{timestamps:true})

const ProductCategory = mongoose.model ("ProductCategory", productCategorySchema)

export default ProductCategory