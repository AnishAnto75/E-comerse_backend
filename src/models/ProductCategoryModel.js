import mongoose from "mongoose";

const productCategorySchema = mongoose.Schema({
    category_name : { type:String, required : true, trim: true, lowercase: true},
    category_description : { type:String , default: ""},    
    group_id : { type: mongoose.Schema.Types.ObjectId, ref : "ProductGroup", required: true },
    category_image: { 
        type: {
            url: { type: String, required: true,},
            public_id: {type: String, default: "" },
        },
        required: true,
    },
    deleted : { type:Boolean, default:false}
},{timestamps:true})


productCategorySchema.index(
    {
        group_id: 1, category_name: 1, deleted: 1,
    },
    { 
        unique: true,
    }
);

productCategorySchema.index({
    group_id: 1,
    deleted: 1,
    category_name: 1
});

const ProductCategory = mongoose.model ("ProductCategory", productCategorySchema)

export default ProductCategory