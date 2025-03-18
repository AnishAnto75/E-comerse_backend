import mongoose from "mongoose";

const carouselSchema = mongoose.Schema({
    products: [{
        product_id: { type: mongoose.SchemaTypes.ObjectId, ref: 'Product', required: true},
        image: {type: String, required: true}
    }],
    heading: {type: String, required: true}
})
const cardSchema = mongoose.Schema({
    product_id: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Product', required: true}],
    heading: {type: String, required: true}
})
const categorySchema = mongoose.Schema({
    category_id :[{type: mongoose.SchemaTypes.ObjectId, ref: 'ProductCategory', required: true}],
    heading: {type: String, required: true}
})
const groupSchema = mongoose.Schema({
    group_id :{type: mongoose.SchemaTypes.ObjectId, ref: 'ProductGroup', required: true},
    heading: {type: String, required: true}
})

const BannerSchema = mongoose.Schema({
    banner_id: {type: String, enum:["BAN1", "BAN2", "BAN3", "BAN4", "BAN5"], immutable:true, unique: true},
    banner_location: {type:String, enum:["top", "center1", "center2", "center3", "down"], immutable:true, unique: true},
    banner_type: {type:String, enum:["carousel", "card", "group", "category"], default: null},
    card: cardSchema,
    carousel: carouselSchema,
    category : categorySchema,
    group : groupSchema,
    status: {type: Boolean, default: false },
    hidden: {type: Boolean, default: false },
},{timestamps: true})

const Banner = mongoose.model("Banner", BannerSchema)
export default Banner