import mongoose from "mongoose";

const productGroupSchema = new mongoose.Schema({
    group_name : { type:String, required : true, trim: true, lowercase: true},
    group_description : { type:String, default:''},
    group_image: { 
        type: {
            url: {type: String, required: true,},
            public_id: { type: String, default: "",},
        },
        required: true,
    },
    deleted : { type:Boolean, default:false},
    history: { type: mongoose.Schema.Types.Mixed, default: {}}

},{timestamps:true})


productGroupSchema.index(
    { group_name: 1, deleted: 1 },
    { unique: true }
);

productGroupSchema.index({
    createdAt: -1
});

const ProductGroup = mongoose.model ("ProductGroup", productGroupSchema)

export default ProductGroup
