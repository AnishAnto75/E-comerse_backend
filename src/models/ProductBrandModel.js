import mongoose from "mongoose";

const productBrandSchema = mongoose.Schema({
    brand_name : { type:String, required : true, trim: true, lowercase: true},
    brand_description : { type:String , default: ""},
    brand_logo: { 
       type: {
            url: { type: String, required: true,},
            public_id: {type: String, default: "" },
        },
        required: true,
    },
    brand_ratings : [{
        user_id : { type: mongoose.SchemaTypes.ObjectId, ref: "User" , required: true },
        rating : { type : Number, enum : [1 , 2 , 3 , 4 , 5], required: true }
    }],
    brand_review : [{
        user_id : { type: mongoose.SchemaTypes.ObjectId, ref: "User" , required: true },
        review : { type: String, required: true }
    }],
    deleted : { type:Boolean, default:false}
},{timestamps:true})

productBrandSchema.index(
    {
        brand_name: 1,deleted: 1,
    },
    {
        unique: true,
    }
);

productBrandSchema.index({createdAt: -1});

const ProductBrand = mongoose.model ("ProductBrand", productBrandSchema)

export default ProductBrand