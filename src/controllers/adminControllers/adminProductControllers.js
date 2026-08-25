import mongoose from "mongoose"
import ProductCategory from "../../models/ProductCategoryModel.js"
import ProductGroup from "../../models/ProductGroupModel.js"
import Product from "../../models/ProductModel.js"
import ProductBrand from '../../models/ProductBrandModel.js'
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import { validateMongooseId } from "../../utils/validateTypes.js"
import ProductInventory from "../../models/ProductInventoryModel.js"
import ProductReview from "../../models/ProductReviewModel.js"
import RecentActivity from "../../models/RecentActivityModel.js"


export const adminFetchProductPage = async (req, res) => {

    try {

        const page = Math.max( parseInt(req.query.page) || 1, 1);
        const limit = Math.min( Math.max(parseInt(req.query.limit) || 20, 1), 100 );
        const skip = (page - 1) * limit

        const status = req.query.status?.trim()
        const search = req.query.search?.trim()

        const match = { deleted: false }
        if (status && status !== "all") { match.status = status }

        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const searchRegex = { $regex: escapedSearch, $options: "i" }
            match.$or = [{ product_barcode: searchRegex }, { product_name: searchRegex }]
        }

        const summaryResult = await Product.aggregate([
            { $match: { deleted: false } },
            { $lookup: {
                from: "productinventories",
                localField: "_id",
                foreignField: "product_id",
                as: "inventory"
            }},
            { $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true}},
            { $group: {
                _id: null,
                total_products: { $sum: 1 },
                out_of_stock: { $sum: { $cond: [{ $lte: [{ $ifNull: ["$inventory.product_total_stock", 0] }, 0 ]}, 1, 0]}},
                low_in_stock: {
                    $sum: { $cond: [ { $and: [
                        { $gt: [ { $ifNull: [ "$inventory.product_total_stock", 0 ] }, 0 ]},
                        { $lte: [{ $ifNull: [ "$inventory.product_total_stock", 0 ] }, { $ifNull: ["$inventory.product_low_in_stock", 1 ]}]}
                    ]}, 1, 0 ]}
                }
            }},
            { $project: {
                _id: 0,
                total_products: 1,
                low_in_stock: 1,
                out_of_stock: 1,
            }}
        ]);

        const summary = summaryResult[0] || {
            total_products: 0,
            active_products: 0,
            inactive_products: 0,
            low_in_stock: 0,
            out_of_stock: 0,
        };

        const products = await Product.aggregate([

            { $match: match },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            { $lookup: {
                from: "productinventories",
                localField: "_id",
                foreignField: "product_id",
                as: "inventory"
            }},
            { $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true }},
            { $lookup: {
                from: "productgroups",
                localField: "product_group",
                foreignField: "_id",
                as: "group"
            }},
            { $unwind: { path: "$group", preserveNullAndEmptyArrays: true }},
            { $lookup: {
                from: "productcategories",
                localField: "product_category",
                foreignField: "_id",
                as: "category"
            }},
            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true}},
            { $lookup: {
                from: "productbrands",
                localField: "product_brand",
                foreignField: "_id",
                as: "brand"
            }},
            { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true }},
            { $lookup: {
                from: "productreviews",
                localField: "product_review_id",
                foreignField: "_id",
                as: "review"
            }},
            { $unwind: { path: "$review", preserveNullAndEmptyArrays: true }},
            { $project: {
                _id: 1,
                product_name: 1,
                product_barcode: 1,
                group_name: "$group.group_name",
                category_name: "$category.category_name",
                product_brand: "$brand.brand_name",
                product_photo: "$product_photo.url",
                current_stock: { $ifNull: [ "$inventory.product_total_stock", 0 ]},
                product_low_in_stock: { $ifNull: [ "$inventory.product_low_in_stock", 1 ]},
                product_average_ratings: { $ifNull: [ "$review.product_average_ratings", 0] },
                status: 1,
                out_of_stock: 1,
                createdAt: 1
            }},
        ])

        const totalProducts = await Product.countDocuments(match)
        const totalPages = Math.ceil( totalProducts / limit )

        const data = {
            summary, 
            products,
            pagination: {
                current_page: page,
                limit,
                total_products: totalProducts,
                total_pages: totalPages,
                has_next_page: page < totalPages,
                has_previous_page: page > 1
            }
        }

        return apiSucessResponce( res, "Product dashboard data fetched successfully.", data, 200 );
    } catch (error) {
        console.error( "Error in adminProductDashboardData:", error );
        return apiErrorResponce( res, "Internal Server Error", null, 500 );
    }
}

export const adminFetchProductPreview = async (req, res) => {
    try {

        const { barcode } = req.params;

        if (!barcode?.trim()) { return apiErrorResponce( res, "Product barcode is required", null, 400 )}

        const product = await Product.aggregate([
            { $match: {
                product_barcode: barcode.trim(),
                deleted: false
            }},
            { $lookup: {
                from: "productinventories",
                localField: "_id",
                foreignField: "product_id",
                as: "inventory"
            }},
            { $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true }},

            { $lookup: {
                from: "productgroups",
                localField: "product_group",
                foreignField: "_id",
                as: "group"
            }},
            { $unwind: { path: "$group", preserveNullAndEmptyArrays: true }},

            { $lookup: {
                from: "productcategories",
                localField: "product_category",
                foreignField: "_id",
                as: "category"
            }},
            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true }},

            { $lookup: {
                from: "productbrands",
                localField: "product_brand",
                foreignField: "_id",
                as: "brand"
            }},
            { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true }},

            { $lookup: {
                from: "productreviews",
                localField: "product_review_id",
                foreignField: "_id",
                as: "review"
            }},
            { $unwind: { path: "$review", preserveNullAndEmptyArrays: true }},

            { $lookup: {
                from: "users",
                localField: "product_added_by",
                foreignField: "_id",
                as: "added_by"
            }},
            { $unwind: { path: "$added_by", preserveNullAndEmptyArrays: true }},

            {
                $project: {
                    _id: 1,
                    product_barcode: 1,
                    product_name: 1,
                    product_UOM: 1,
                    product_net_unit: 1,
                    product_min_order_quantity: 1,
                    product_max_order_quantity: 1,
                    product_hsn_code: 1,
                    product_photo: "$product_photo.url",
                    product_additional_photos: "$product_additional_photos.url",
                    product_description: 1,
                    product_highlights: 1,
                    product_varient: 1,
                    faqs: 1,
                    out_of_stock: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    latest_batch_details: 1,
                    inventory: {
                        _id: "$inventory._id",
                        product_low_in_stock: { $ifNull: ["$inventory.product_low_in_stock", 1] },
                        product_total_stock: { $ifNull: ["$inventory.product_total_stock", 0] },
                        product_stock: { $ifNull: ["$inventory.product_stock", []] }
                    },
                    review: {
                        _id: "$review._id",
                        product_average_ratings: { $ifNull: ["$review.product_average_ratings", 0] },
                        product_total_reviews: { $ifNull: ["$review.product_total_reviews", 0] },
                    },
                    group: {
                        _id: "$group._id",
                        group_name: "$group.group_name",
                        deleted: "$group.deleted"
                    },
                    category: {
                        _id: "$category._id",
                        category_name: "$category.category_name",
                        deleted: "$category.deleted",
                    },
                    brand: {
                        _id: "$brand._id",
                        brand_name: "$brand.brand_name",
                        brand_logo: "$brand.brand_logo.url",
                        brand_average_ratings: { $ifNull: ["$brand.brand_average_ratings", 0] },
                        deleted: "$brand.deleted",
                    },
                    added_by: {
                        staff_id: "$added_by.staff_id",
                        name: "$added_by.name",
                        photo: "$added_by.photo.url",
                        deleted: "$added_by.deleted",
                    }
                }
            },
            { $limit: 1 }
        ]);

        if (!product.length) { return apiErrorResponce( res, "Product not found", null, 404 )}

        return apiSucessResponce( res, "Product fetched successfully.", product[0], 200 )

    } catch (error) {
        console.error( "Error in adminFetchProduct:", error )
        return apiErrorResponce( res, "Internal Server Error", null, 500)
    }
}

export const adminFetchProductView = async (req, res) => {
    try {

        const { barcode } = req.params
        if (!barcode?.trim()) { return apiErrorResponce( res, "Product barcode is required.", null, 400 )}

        const [product] = await Product.aggregate([
            { $match: { product_barcode: barcode.trim(), deleted: false }},
            
            { $lookup: {
                from: "productgroups",
                localField: "product_group",
                foreignField: "_id",
                as: "product_group"
            }},
            { $unwind: { path: "$product_group", preserveNullAndEmptyArrays: true }},

            { $lookup: { 
                from: "productcategories",
                localField: "product_category",
                foreignField: "_id",
                as: "product_category"
            }},
            { $unwind: { path: "$product_category", preserveNullAndEmptyArrays: true }},
            
            { $lookup: {
                from: "productbrands",
                localField: "product_brand",
                foreignField: "_id",
                as: "product_brand"
            }},
            { $unwind: { path: "$product_brand", preserveNullAndEmptyArrays: true }},
            
            { $lookup: {
                from: "staffs",
                localField: "product_added_by",
                foreignField: "_id",
                as: "product_added_by"
            }},
            { $unwind: { path: "$product_added_by", preserveNullAndEmptyArrays: true}},
            
            { $lookup: {
                from: "productinventories",
                let: { productId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: [ "$product_id", "$$productId"]}, { $ne: [ "$deleted", true ]}]}}},
                    { $project: {
                        _id: 1,
                        product_low_in_stock: 1,
                        product_total_stock: 1,
                        product_stock: 1,
                        updatedAt: 1
                    }}
                ],
                as: "inventory"
            }},
            { $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true }},
            { $project: {
                    _id: 1,
                    product_name: 1,
                    product_barcode: 1,
                    product_UOM: 1,
                    product_net_unit: 1,
                    product_min_order_quantity: 1,
                    product_max_order_quantity: 1,
                    product_hsn_code: 1,
                    product_group: {
                        _id: "$product_group._id",
                        group_name: "$product_group.group_name"
                    },
                    product_category: {
                        _id: "$product_category._id",
                        category_name: "$product_category.category_name"
                    },
                    product_brand: {
                        _id: "$product_brand._id",
                        brand_name: "$product_brand.brand_name"
                    },
                    product_photo: 1,
                    product_additional_photos: 1,
                    product_description: 1,
                    product_highlights: 1,
                    product_added_by: {
                        _id: "$product_added_by._id",
                        staff_id: "$product_added_by.staff_id",
                        name: "$product_added_by.name"
                    },
                    product_varient: 1,
                    faqs: 1,
                    current_stock: 1,
                    latest_batch_details: 1,
                    search_keywords: 1,
                    status: 1,
                    history: 1,
                    inventory: {
                        _id: { $ifNull: [ "$inventory._id", null ]},
                        low_in_stock: { $ifNull: [ "$inventory.product_low_in_stock", false ]},
                        total_stock: { $ifNull: [ "$inventory.product_total_stock", 0 ]},
                        batches: { $ifNull: [ "$inventory.product_stock", [] ]},
                        updated_at: { $ifNull: [ "$inventory.updatedAt", null ]}
                    },
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ])

        if (!product) { return apiErrorResponce( res, "Product not found.", null, 404 )}

        return apiSucessResponce( res, "Product details fetched successfully.", product, 200 )

    } catch (error) {
        console.error( "Error in adminFetchProductView:", error )
        return apiErrorResponce( res, "Internal Server Error", null, 500 )
    }
}

export const adminFetchForCreateProductPage = async(req,res)=>{
    try {

        const [groups, brands] = await Promise.all([
            ProductGroup.find({ deleted: false }).select("group_name").sort({ group_name: 1 }).lean(),
            ProductBrand.find({ deleted: false }).select("brand_name").sort({ brand_name: 1 }).lean()
        ]);

        return apiSucessResponce(res, "Fetched successfully", {groups, brands});

    } catch (error) {
        console.log("error in fetchAllProduct controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}

export const adminFetchCategoriesForCreateProductPage = async(req, res)=>{
    try {
        const {id} = req.params

        const validId =  validateMongooseId(id)
        if(!validId){return apiErrorResponce(res, "Invalid Group ID", null, 400)}

        const categories = await ProductCategory.find({group_id: id, deleted: false, })
            .select("category_name")
            .sort({ category_name: 1 })
            .lean();

        return apiSucessResponce(res , "Category fetched Successfully", categories)

    } catch (error) {
        console.error("error in fetchAllProductCategory :" , error)
        return apiErrorResponce(res, "internal server error", null, 500 )
    }
}

export const createProduct = async(req , res)=>{
    const session = await mongoose.startSession();

    const {product_group, product_category, product_brand, product_barcode, product_name, product_UOM, product_net_unit, product_min_order_quantity, product_max_order_quantity, product_hsn_code, product_description, product_highlights} = req.body
    const user = req.user
    
    try {

        const product_photo = req.files?.product_photo?.[0];
        const additionalPhotos = req.files?.product_additional_photos || [];

        // validation
        if(!product_group || !product_category || !product_brand || !product_barcode || !product_name || !product_UOM || !product_photo){ return apiErrorResponce(res , "Missing some required fields")}
        if ( !validateMongooseId(product_group) || !validateMongooseId(product_category) || !validateMongooseId(product_brand) ) { return apiErrorResponce(res, "Invalid ID");}
        let highlights = [];
        try {highlights = product_highlights ? JSON.parse(product_highlights): []}
        catch {return apiErrorResponce(res, "Invalid product highlights");}
        
        
        // Database validation
        await session.startTransaction();

        const validateGroup = await ProductGroup.findOne({_id: product_group, deleted: false}).session(session);
        if(!validateGroup) { 
            await session.abortTransaction();
            return apiErrorResponce(res , "Invalid Group ID") 
        }
        const validateCategory = await ProductCategory.findOne({ group_id : product_group , _id: product_category, deleted: false }).session(session);
        if (!validateCategory) {
            await session.abortTransaction();
            return apiErrorResponce(res, "Invalid Category")
        }
        const validateBrand = await ProductBrand.findOne({_id : product_brand, deleted: false}).session(session);
        if(!validateBrand) { 
            await session.abortTransaction();
            return apiErrorResponce(res , "Invalid Brand ID") 
        }
        const validateProduct = await Product.findOne({product_barcode : product_barcode.trim(), deleted: false}).session(session);
        if(validateProduct){
            await session.abortTransaction();
            return apiErrorResponce(res , "Duplicate Product")
        }

        const formattedData = {
            product_group,
            product_category, 
            product_brand, 
            product_barcode : product_barcode.trim().toUpperCase(), 
            product_name : product_name.trim(),
            product_UOM ,
            product_net_unit : Number(product_net_unit), 
            product_min_order_quantity : Number(product_min_order_quantity) , 
            product_max_order_quantity : Number(product_max_order_quantity) , 
            product_photo : {
                url : `/uploads/products/${product_photo.filename}`,
                public_id: ""
            },
            product_additional_photos: additionalPhotos.map(photo => ({
                url: photo.path.replace(/\\/g, "/"),
                public_id: ""
            })),
            product_hsn_code,
            product_description,
            product_highlights:highlights ,
            product_added_by : user._id ,
        }

        const product = await Product.create([formattedData], { session })

        await RecentActivity.create([{
            performed_by: req.user._id,
            activity_type: "product",
            action: "created",
            title: "Product Created",
            description: `Product "${product[0].product_name}" has been created successfully.`,
            reference_id: product[0]._id,
            reference_model: "Product",
            metadata: {
                product_id: product[0]._id,
                product_name: product[0].product_name,
                added_by: user.name
            }
        }], { session })

        await session.commitTransaction();
        return apiSucessResponce(res, "Product Created Successfully", product[0] )

    } catch (error) {
        await session.abortTransaction();
        console.log("error in CreateProduct controller ",error)
        return apiErrorResponce(res , "internal Server Error")
    } finally { session.endSession() }
}

export const adminFetchForEditProductPage = async (req, res) => {
    try {
        const { barcode } = req.params

        if ( !barcode || typeof barcode !== "string" || !barcode.trim() ) { return apiErrorResponce( res, "Product barcode is required.", null, 400 )}

        const cleanBarcode = barcode.trim()

        const [groups, categories, brands, product] = await Promise.all([
            ProductGroup.find({ deleted: false }).select("_id group_name").sort({ group_name: 1 }).lean(),
            ProductCategory.find({ deleted: false }).select("_id category_name group_id").sort({ category_name: 1 }).lean(),
            ProductBrand.find({deleted: false }).select("_id brand_name").sort({ brand_name: 1 }).lean(),
            Product.findOne({ product_barcode: cleanBarcode, deleted: false }).select(` product_group product_category product_brand product_barcode product_name product_UOM product_net_unit product_min_order_quantity product_max_order_quantity product_hsn_code product_description product_highlights search_keywords status `).lean()
        ])

        if (!product) { return apiErrorResponce( res, "Product not found.", null, 404 )}
        return apiSucessResponce( res, "Product edit data fetched successfully.", { groups, categories, brands, product }, 200 )

    } catch (error) {
        console.error( "Error in adminFetchForEditProductPage:", error )
        return apiErrorResponce( res, "Internal Server Error.", null, 500 )
    }
}

export const adminEditProduct = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { barcode } = req.params
        const staffId = req.user._id

        if (!barcode) { return apiErrorResponce( res, "Product ID is required.", null, 400 )}

        await session.startTransaction()

        const product = await Product.findOne({ product_barcode: barcode, deleted: false }).session(session)

        if (!product) { await session.abortTransaction(); return apiErrorResponce( res, "Product not found.", null, 404 )}

        const allowedFields = [
            "product_group",
            "product_category",
            "product_brand",
            "product_name",
            "product_UOM",
            "product_net_unit",
            "product_min_order_quantity",
            "product_max_order_quantity",
            "product_hsn_code",
            "product_description",
            "product_highlights",
            "search_keywords",
            "status"
        ]

        const objectIdFields = [
            "product_group",
            "product_category",
            "product_brand"
        ]

        const changes = {}
        const updateData = {}

        for (const field of allowedFields) {
            if (req.body[field] === undefined) { continue }

            const oldValue = product[field]
            let newValue = req.body[field]

            if (objectIdFields.includes(field)) {
                if ( typeof newValue !== "string" || !mongoose.Types.ObjectId.isValid(newValue)) { await session.abortTransaction(); return apiErrorResponce( res, `Invalid ${field}.`, null, 400 )}
                newValue = new mongoose.Types.ObjectId(newValue)
            }
            if ([ "product_highlights", "search_keywords" ].includes(field)) { if (!Array.isArray(newValue)) { await session.abortTransaction(); return apiErrorResponce( res, `${field} must be an array.`, null, 400 )}}
            if ( field === "product_min_order_quantity" || field === "product_max_order_quantity") { if ( !Number.isInteger(newValue) || newValue < 1 ) { await session.abortTransaction(); return apiErrorResponce( res, `${field} must be a positive integer.`, null, 400 )}}
            if (field === "product_net_unit") { if ( typeof newValue !== "number" || !Number.isFinite(newValue) || newValue <= 0 ) { await session.abortTransaction(); return apiErrorResponce( res, "Product net unit must be greater than 0.", null, 400 )}}

            const oldComparable = oldValue instanceof mongoose.Types.ObjectId ? oldValue.toString() : oldValue
            const newComparable = newValue instanceof mongoose.Types.ObjectId ? newValue.toString() : newValue

            const isChanged = JSON.stringify(oldComparable) !== JSON.stringify(newComparable);

            if (!isChanged) { continue }
            changes[field] = { 
                old: oldValue,
                new: newValue
            }
            updateData[field] = newValue;
        }

        if (Object.keys(changes).length === 0) { await session.abortTransaction(); return apiSucessResponce( res, "No changes detected.", null, 200 )}

        const finalMinQty = updateData.product_min_order_quantity ?? product.product_min_order_quantity
        const finalMaxQty = updateData.product_max_order_quantity ?? product.product_max_order_quantity

        if ( !Number.isInteger(finalMinQty) || finalMinQty < 1 ) { await session.abortTransaction(); return apiErrorResponce( res, "Minimum order quantity must be a positive integer.", null, 400 )}
        if ( !Number.isInteger(finalMaxQty) || finalMaxQty < 1 ) { await session.abortTransaction(); return apiErrorResponce( res, "Maximum order quantity must be a positive integer.", null, 400 )}
        if ( finalMinQty > finalMaxQty ) { await session.abortTransaction(); return apiErrorResponce( res, "Minimum order quantity cannot be greater than maximum order quantity.", null, 400 )}

        const finalGroupId = updateData.product_group ?? product.product_group
        const finalCategoryId = updateData.product_category ?? product.product_category
        const finalBrandId = updateData.product_brand ?? product.product_brand

        const [group, category, brand] = await Promise.all([
            ProductGroup.findOne({ _id: finalGroupId, deleted: false })
                .select("_id")
                .session(session)
                .lean(),

            ProductCategory.findOne({ _id: finalCategoryId, deleted: false })
                .select("_id group_id")
                .session(session)
                .lean(),

            ProductBrand.findOne({ _id: finalBrandId, deleted: false})
                .select("_id")
                .session(session)
                .lean()
        ])

        if (!group) { await session.abortTransaction(); return apiErrorResponce( res, "Selected product group not found or has been deleted.", null, 400 )}
        if (!category) { await session.abortTransaction(); return apiErrorResponce( res, "Selected product category not found or has been deleted.", null, 400 )}
        if (!brand) { await session.abortTransaction(); return apiErrorResponce( res, "Selected product brand not found or has been deleted.", null, 400 )}
        if ( category.group_id.toString() !== finalGroupId.toString() ) { await session.abortTransaction(); return apiErrorResponce( res, "Selected category does not belong to the selected product group.", null, 400 )}

        const historyEntry = {
            action: "update",
            updated_by: staffId,
            updated_at: new Date(),
            changes
        }

        // __v is used as an optimistic concurrency check, If another admin changes the product after we read it, __v will no longer match and this update will fail.

        const updatedProduct = await Product.findOneAndUpdate({ product_barcode: barcode, deleted: false, __v: product.__v },
            { $set: updateData, $push: { history: historyEntry }, $inc: { __v: 1 }},
            { session, returnDocument: "after", runValidators: true }
        )

        if (!updatedProduct) { await session.abortTransaction(); return apiErrorResponce( res, "Product was modified by another user. Please refresh and try again.", null, 409 )}

        await RecentActivity.create([{
            performed_by: req.user._id,
            activity_type: "product",
            action: "updated",
            title: "Product updated",
            description: `Product "${updatedProduct.product_name}" has been updated successfully.`,
            reference_id: updatedProduct._id,
            reference_model: "Product",
            metadata: {
                product_id: updatedProduct._id,
                updated_by: req.user.name,
                changes
            }
        }], { session })

        await session.commitTransaction()

        return apiSucessResponce( res, "Product updated successfully.", updatedProduct, 200 )

    } catch (error) {

        if (session.inTransaction()) { await session.abortTransaction() }
        console.error( "Error in adminEditProduct:", error )

        if (error.code === 11000) { return apiErrorResponce( res, "Product barcode already exists.", null, 409 )}
        if (error.name === "ValidationError") { return apiErrorResponce( res, "Invalid product data.", error.message, 400 )}
        if (error.name === "CastError") { return apiErrorResponce( res, "Invalid product data.", null, 400 )}

        return apiErrorResponce( res, "Internal Server Error.", null, 500 )

    } finally { await session.endSession() }
}

export const adminAddProductFAQs = async (req, res) => {
    const session = await mongoose.startSession()

    try {
        const { barcode } = req.params
        const staffId = req.user._id
        const { faqs } = req.body

        if (!barcode?.trim()) { return apiErrorResponce( res, "Product barcode is required.", null, 400 )}
        if (!Array.isArray(faqs) || faqs.length === 0) { return apiErrorResponce( res, "At least one FAQ is required.", null, 400 )}

        const formattedFAQs = []

        for (let i = 0; i < faqs.length; i++) {
            const faq = faqs[i]
            if ( !faq || typeof faq !== "object") { return apiErrorResponce( res, `FAQ at index ${i} is invalid.`, null, 400 )}
            if ( typeof faq.question !== "string" || !faq.question.trim()) { return apiErrorResponce( res, `FAQ question is required at index ${i}.`, null, 400 )}
            if ( typeof faq.answer !== "string" || !faq.answer.trim() ) { return apiErrorResponce( res, `FAQ answer is required at index ${i}.`, null, 400 )}

            formattedFAQs.push({
                question: faq.question.trim(),
                answer: faq.answer.trim()
            })
        }

        const requestQuestions = formattedFAQs.map( faq => faq.question.toLowerCase() )
        const uniqueQuestions = new Set(requestQuestions)

        if (uniqueQuestions.size !== requestQuestions.length) { return apiErrorResponce( res, "Duplicate FAQ questions are not allowed.", null, 409 )}

        await session.startTransaction()

        const product = await Product.findOne({ product_barcode: barcode.trim(), deleted: false }).session(session)

        if (!product) { await session.abortTransaction(); return apiErrorResponce( res, "Product not found.", null, 404 )}

        const existingQuestions = new Set( (product.faqs || []).map( faq => faq.question.trim().toLowerCase() ))
        const duplicateWithExisting = formattedFAQs.find( faq => existingQuestions.has( faq.question.toLowerCase() ))

        if (duplicateWithExisting) { await session.abortTransaction(); return apiErrorResponce( res, `FAQ already exists: "${duplicateWithExisting.question}"`, null, 409 )}

        const historyEntry = {
            action: "update",
            updated_by: staffId,
            updated_at: new Date(),
            changes: {
                faqs: {
                    old : "add",
                    new : formattedFAQs
                }
            }
        }

        const updatedProduct = await Product.findOneAndUpdate({ product_barcode: barcode.trim(), deleted: false, __v: product.__v },
            { 
                $push: {
                    faqs: { $each: formattedFAQs},
                    history: historyEntry
                },
                $inc: { __v: 1 }
            },
            {
                session,
                returnDocument: "after",
                runValidators: true
            }
        )

        if (!updatedProduct) { await session.abortTransaction(); return apiErrorResponce( res, "Product was modified by another user. Please refresh and try again.", null, 409 )}

        await session.commitTransaction()

        return apiSucessResponce( res, `${formattedFAQs.length} FAQ(s) added successfully.`, { product_id: updatedProduct._id, product_barcode: updatedProduct.product_barcode, faqs: formattedFAQs }, 201 )

    } catch (error) {
        if (session.inTransaction()) { await session.abortTransaction() }
        console.error( "Error in adminAddProductFAQs:", error )
        if (error.name === "ValidationError") { return apiErrorResponce( res, "Invalid FAQ data.", error.message, 400 )}
        if (error.name === "CastError") { return apiErrorResponce( res, "Invalid product data.", null, 400 )}
        return apiErrorResponce( res, "Internal Server Error.", null, 500 )
    } finally {
        await session.endSession()
    }
}

export const adminSearchProductsForAddVarient = async (req, res) => {
    try {
        const { query } = req.query
        
        const escapedQuery = query?.replace( /[.*+?^${}()|[\]\\]/g, "\\$&");

        if (!escapedQuery?.trim()) { return apiSucessResponce(res, "product fetched successfully", [] , 200)}

        // Search by name or barcode
        const products = await Product.find({ 
            deleted: false,
            $or: [ 
                { product_name: {$regex: escapedQuery, $options: "i"}}, 
                { product_barcode: { $regex: escapedQuery, $options: "i"}}, 
                { search_keywords: { $regex: escapedQuery, $options: "i"}} 
            ]
        })
        .select( "_id product_name product_barcode product_photo.url")
        .limit(10)
        .lean()

        return apiSucessResponce(res, "product fetched successfully", products, 200)
    } catch (error) {
        console.error(error)
        return apiErrorResponce(res, "failed to search product")
    }
}









// testing controller
export const adminFetchAllProduct = async(req,res)=>{
    try {
        const products = await Product.find({deleted : false})

        return apiSucessResponce(res, "All Products Fetched SuccessFully", products)
    } catch (error) {
        console.log("error in fetchAllProduct controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}
































// old





export const adminFetchForProductPage = async(req, res)=>{
    try {
        const products = await Product.find({deleted : false})
        .select(["product_brand", "product_barcode", "product_name", "product_photos", "status", "product_inventory_id"])
        .populate({ path: ["product_brand"], select:["Brand_name"], strictPopulate: false })
        .populate({ path: ["product_inventory_id"], select:["product_total_stock"], strictPopulate: false })
        .populate({ path: ["product_review_id"], select:["product_average_ratings"], strictPopulate: false })

        const total_products = products.length

        const data = {
            products,
            total_products,
            low_in_stock : 0,
            total_stock :0
        }
        return apiSucessResponce(res, "All Products Fetched SuccessFully", data)
    } catch (error) {
        console.log("error in fetchAllProduct controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}

export const adminSearchProducts = async(req,res)=>{
    try {
        
        const { name } = req.query;
        if(!name){
            return apiErrorResponce(res, "Internal Server Error")
        }
        const products = await Product.find({product_name : {$regex: name, $options: 'i'}, deleted: false})
        .populate({ path: ["product_category"], select:["category_name"], strictPopulate: false })
        .select(["product_brand", "product_barcode", "product_name", "product_total_stock", "product_photos", "product_total_unit_sold", "product_category", "status" ]).limit(15)

        return apiSucessResponce(res, "All Products Fetched SucessFully", products)
        
    } catch (error) {
        console.log("error in adminFetchProduct controller" , error)
        return apiErrorResponce(res , "Internal Server Error")
    }
}

export const adminFetchProductByCategory = async(req,res)=>{
    try {
        const {id} = req.params
        
        const category_id = new mongoose.Types.ObjectId(id);

        const products = await Product.find({product_category : category_id})

        if(!products){
            return apiErrorResponce(res, "No Product Available")
        }
        return apiSucessResponce(res, "Product Found Successfully", products)
    } catch (error) {
        console.log("error in adminFetchProductByCategory controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}