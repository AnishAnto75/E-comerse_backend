import mongoose from "mongoose";

const productVariantGroupSchema = new mongoose.Schema(
    {
        variant_group_id: { type: String, required: true, unique: true, trim: true, index: true },
        products: [
            {
                product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
                variant_value: { type: String, required: true, trim: true },
            },
        ],
        deleted: { type: Boolean, default: false, index: true },
    },
    { timestamps: true, versionKey: true }
)


// Prevent duplicate products inside the same variant group
productVariantGroupSchema.path("products").validate(
    function (products) {
        const productIds = products.map((item) => item.product_id.toString())
        const uniqueProductIds = new Set(productIds)
        return uniqueProductIds.size === productIds.length
    },
    "A product cannot be added more than once to the same variant group."
)

const ProductVariantGroup = mongoose.model( "ProductVariantGroup", productVariantGroupSchema )
export default ProductVariantGroup