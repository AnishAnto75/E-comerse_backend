import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({

    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    full_name: { type: String, required: true, trim: true },
    mobile_number: { type: String, required: true, trim: true },
    alternate_mobile_number: { type: String, default: "", trim: true },
    house_no: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    landmark: { type: String, default: "",trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, default: "India" },
    pincode: { type: String, required: true, trim: true },
    address_type: { type: String, enum: ["Home", "Work"], default: "Home",},
    is_default: { type: Boolean, default: false }

}, {
    timestamps: true
});

addressSchema.index(
    {
        user_id: 1,
        is_default: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            is_default: true
        }
    }
);

addressSchema.index({ user_id: 1 });

export default mongoose.model("Address", addressSchema);