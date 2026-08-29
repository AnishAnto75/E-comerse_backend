import mongoose from "mongoose"


// INVENTORY BATCH
const inventoryBatchSchema = new mongoose.Schema({
    batch_no: { type: String, default: "", trim: true },
    size: { type: Number, default: null },
    manufacture_date: { type: Date, default: null },
    expiry_date: { type: Date, default: null},
    best_before: { type: Number, default: 0, min: [0, "Best before cannot be negative."] },

    quantity: { type: Number, required: true, min: [0, "Quantity cannot be negative."] },
    reserved_quantity: { type: Number, default: 0, min: [0, "Reserved quantity cannot be negative."] },

    // PRICE
    mrp: { type: Number, required: true, min: [0, "MRP cannot be negative."] },
    purchase_cost: { type: Number, required: true, min: [0, "Purchase cost cannot be negative."]},
    gst_percentage: { type: Number, default: 0, min: [0, "GST percentage cannot be negative."], max: [100, "GST percentage cannot exceed 100."]},
    other_expenses: { type: Number, default: 0, min: [0, "Other expenses cannot be negative."]},
    unit_purchase_cost: { type: Number, required: true, min: [0, "Unit purchase cost cannot be negative."]},
    selling_price: { type: Number, required: true, min: [0, "Selling price cannot be negative."] },

    // RECEIVING
    received_at: { type: Date, default: Date.now }
}, { _id: true, timestamps: true }
)

// WAREHOUSE INVENTORY
const warehouseInventorySchema = new mongoose.Schema({
    business_unit_id: { type: mongoose.SchemaTypes.ObjectId, ref: "BusinessUnit", required: true },

    total_stock: { type: Number, default: 0, min: 0 },
    reserved_stock: { type: Number, default: 0, min: 0 },

    batches: { type: [inventoryBatchSchema], default: []}
}, { _id: false }
)


// STORE INVENTORY
const storeInventorySchema = new mongoose.Schema({
    business_unit_id: { type: mongoose.SchemaTypes.ObjectId,ref: "BusinessUnit", required: true },
    total_stock: { type: Number, default: 0, min: 0 },
    batches: { type: [inventoryBatchSchema], default: [] }
},{ _id: false }
)


// MAIN PRODUCT INVENTORY
const productInventorySchema = new mongoose.Schema({
    product_id: { type: mongoose.SchemaTypes.ObjectId, ref: "Product", required: [true, "Product ID is required."], unique: true, index: true },

    warehouse: { type: warehouseInventorySchema, required: true },
    stores: { type: [storeInventorySchema], default: []},

    total_stock: { type: Number, default: 0, min: 0 },
    low_stock_threshold: { type: Number, default: 5, min: 0 },

    status: { type: String, enum: { values: [ "active", "out_of_stock", "inactive" ], message: "Invalid inventory status." },default: "active", index: true },
    deleted: { type: Boolean, default: false, index: true }
}, { timestamps: true, strict: true, strictQuery: true, versionKey: "_v", minimize: true }
)

productInventorySchema.index({ product_id: 1, deleted: 1 })
productInventorySchema.index({ "stores.business_unit_id": 1 })
productInventorySchema.index({ status: 1, deleted: 1 })


const ProductInventory = mongoose.model( "ProductInventory", productInventorySchema )
export default ProductInventory