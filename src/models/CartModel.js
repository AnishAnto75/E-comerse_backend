import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    products: [
        {
            product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            quantity: { type: Number, required: true, min: 1, default: 1 },
            added_at: { type: Date, default: Date.now }
        }
    ]
}, {
    timestamps: true,
});

export default mongoose.model("Cart", cartSchema);