import mongoose from "mongoose";

const recentActivitySchema = new mongoose.Schema({
    performed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
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
            "staff"
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
            "stock_altered",
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
            "Staff"
        ],
        required: true
    },
    metadata : { type: mongoose.Schema.Types.Mixed, default: {}},
    viewed: { type: Boolean, default: false},
    viewed_at: {type: Date, default: null},
    viewed_by : { type : mongoose.SchemaTypes.ObjectId, ref : "Staff" },    

    deleted:{ type: Boolean, default: false},

}, { timestamps: true });

recentActivitySchema.index({ createdAt: -1 });
recentActivitySchema.index({ performed_by: 1 });
recentActivitySchema.index({ viewed: 1, createdAt: -1 });
recentActivitySchema.index({ activity_type: 1, createdAt: -1 });
recentActivitySchema.index({ action: 1, createdAt: -1 });
recentActivitySchema.index({ deleted: 1, createdAt: -1 });

const RecentActivity = mongoose.model("RecentActivity", recentActivitySchema);

export default RecentActivity