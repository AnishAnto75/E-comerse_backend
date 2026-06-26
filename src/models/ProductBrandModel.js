import mongoose from "mongoose";

const productBrandSchema = mongoose.Schema({
    Brand_name : { type:String, required : true, unique: true},
    Brand_description : { type:String},
    Brand_logo: { type:String },
    Brand_ratings : [{
        user_id : { type: mongoose.SchemaTypes.ObjectId, ref: "User" , required: true },
        review : { type : Number, enum : [1 , 2 , 3 , 4 , 5], required: true }
    }],
    Brand_review : [{
        user_id : { type: mongoose.SchemaTypes.ObjectId, ref: "User" , required: true },
        review : { type: String, required: true }
    }],
    deleted : { type:Boolean, default:false}
},{timestamps:true})

const ProductBrand = mongoose.model ("ProductBrand", productBrandSchema)

export default ProductBrand