import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({

    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    phone_number: { type: String, required: true, trim: true },
    alternate_phone_number: { type: String, default: "", trim: true },
    house_no: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    landmark: { type: String, default: "",trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    address_type: { type: String, enum: ["home", "work"], default: "home",},
    is_default: { type: Boolean, default: false },
    history: { type: mongoose.Schema.Types.Mixed, default: {}}
    
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