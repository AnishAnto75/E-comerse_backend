import mongoose from "mongoose"

const productReviewSchema = mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, unique: true},
    product_average_ratings:{ type:Number, default:0, min:0, max:5 },
    product_total_reviews:{ type:Number, default: 0 },
    product_user_review : [{
        user_id : { type: mongoose.SchemaTypes.ObjectId, ref: "User" , required: true },
        ratings : { type : Number, enum : [1 , 2 , 3 , 4 , 5], required: true },
        review : { type: String, required: true },
        hidden : {type: Boolean, default: false},
        deleted : {type: Boolean, default: false},
    }],
},{ timestamps : true }
)

const ProductReview = mongoose.model("ProductReview" , productReviewSchema)
export default ProductReview