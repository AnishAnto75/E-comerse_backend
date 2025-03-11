import mongoose from "mongoose";

const productGroupSchema = mongoose.Schema({
    category_id : [{ type: mongoose.Schema.Types.ObjectId, ref : "ProductCategory" }],
    group_name : { type:String, required : true, unique: true},
    group_description : { type:String},
    group_image: { type:String},
    deleted : { type:Boolean, default:false}
},{timestamps:true})

const ProductGroup = mongoose.model ("ProductGroup", productGroupSchema)

export default ProductGroup
