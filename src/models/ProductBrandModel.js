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
    brand_average_ratings:{ type:Number, default:1, min:1, max:5 },
    brand_total_reviews: { type: Number, default: 0, min: 0 },
    brand_reviews: [{
        user_id: { type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
        rating: { type: Number, min: 1, max: 5, required: true },
        review: { type: String, trim: true, default: "" },
        hidden: { type: Boolean, default: false },
        deleted: { type: Boolean, default: false }
    }],
    deleted : { type:Boolean, default:false},
    history: { type: mongoose.Schema.Types.Mixed, default: {}}
},{timestamps:true})

productBrandSchema.index(
    { brand_name: 1, deleted: 1 },
    { unique: true }
)
productBrandSchema.index({createdAt: -1})

const ProductBrand = mongoose.model ("ProductBrand", productBrandSchema)
export default ProductBrand