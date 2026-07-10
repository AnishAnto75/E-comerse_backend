import mongoose from "mongoose";

const recentActivitySchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    activity_type: { type: String,
        enum: [
            "product",
            "purchase",
            "supplier",
            "customer",
            "order",
            "inventory",
            "brand",
            "category",
            "group",
            "user"
        ],
        required: true
    },
    action: { type: String,
        enum: [
            "created",
            "updated",
            "deleted",
            "restored",
            "stock_added",
            "stock_removed",
            "status_changed",
            "login",
            "logout"
        ],
        required: true
    },
    title: {type: String, required: true, trim: true },
    description: { type: String, default: ""},
    reference_id: { type: mongoose.Schema.Types.ObjectId, required: true},
    reference_model: { type: String,
        enum: [
            "Product",
            "Purchase",
            "Supplier",
            "Order",
            "Customer",
            "ProductInventory",
            "ProductBrand",
            "ProductCategory",
            "ProductGroup",
            "User"
        ],
        required: true
    },
    metadata: { type: mongoose.Schema.Types.Mixed,default: {}}

}, { timestamps: true });

recentActivitySchema.index({ createdAt: -1 });
recentActivitySchema.index({ user_id: 1 });
recentActivitySchema.index({ activity_type: 1 });

const RecentActivity = mongoose.model("RecentActivity", recentActivitySchema);

export default RecentActivity