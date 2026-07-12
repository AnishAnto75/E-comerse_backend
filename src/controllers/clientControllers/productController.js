import Product from "../../models/ProductModel.js"
import ProductInventory from "../../models/ProductInventoryModel.js";
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import {validateMongooseId} from "../../utils/validateTypes.js"
import mongoose from "mongoose";

export const fetchProducts = async (req, res) => {
    try {

        const { page = 1, limit = 20, search = "", category, brand } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const filter = {
            deleted: false,
            status: "active",
            out_of_stock: false
        };

        if (category && mongoose.Types.ObjectId.isValid(category)) {
            filter.product_category = new mongoose.Types.ObjectId(category);
        }
        if (brand && mongoose.Types.ObjectId.isValid(brand)) {
            filter.product_brand = new mongoose.Types.ObjectId(brand);
        }
        if (search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [
                { product_name: regex },
                { product_barcode: regex },
                { search_keywords: regex }
            ];
        }

        const result = await Product.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "productinventories",
                    localField: "_id",
                    foreignField: "product_id",
                    as: "inventory"
                }
            },
            { $unwind: "$inventory" },
            { $match: { "inventory.product_total_stock": { $gt: 0 }} },
            { $addFields: {
                fifoBatch: {
                    $arrayElemAt: ["$inventory.product_stock", 0]
                }
            }},
            { $facet: {
                products: [
                    { $project: {
                        product_name: 1,
                        product_photo: 1,
                        product_barcode: 1,
                        product_UOM: 1,
                        current_stock: "$inventory.product_total_stock",
                        size: "$fifoBatch.size",
                        mrp: "$fifoBatch.mrp",
                        selling_price: "$fifoBatch.selling_price",
                    }},
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: Number(limit) }
                ],
                totalCount: [{ $count: "count" }]
            }}
        ]);

        const products = result[0].products;
        const totalProducts = result[0].totalCount[0]?.count || 0;

        const pagination = {
            page: Number(page),
            limit: Number(limit),
            totalProducts,
            totalPages: Math.ceil(totalProducts / Number(limit))
        };
        return apiSucessResponce(res, "Product Fetched Sucessfully", {products, pagination})

    } catch (error) {
        console.log("error in fetchProducts controller", error)
        return apiErrorResponce(res, "Internal Server Error")
    }
};




















// old

export const fetchAllProduct = async(req , res)=>{
    try {
        const products = await Product.find({deleted : false, hidden: false, out_of_stock: false, })
            .select(["product_brand", "product_barcode", "product_name", "product_photos", "product_inventory_id"])
            .populate({ path: ["product_brand"], select:["Brand_name"], strictPopulate: false })
            .populate({ path: ["product_inventory_id"], select:["product_total_stock", "product_stock" ], strictPopulate: false })
            .sort({product_name : 1 }).
            limit(50)

        const data = [] 
        products.map(product=>{
            if(product.product_inventory_id?.product_total_stock){
                const stock = product.product_inventory_id.product_stock[0]
                product.product_inventory_id.product_stock = {
                    stock: stock.stock,
                    size: stock.size,
                    mrp: stock.mrp,
                    price: stock.price
                }
                data.push(product)
            }
        })

        apiSucessResponce(res , "Products found successfully" , data )
    } catch (error) {
        console.log("Error in fetchAllProducts controller",error)
        apiErrorResponce(res , "internal server error" , error)
    }
}

export const fetchProduct = async(req , res)=>{
    try {
        const {id} = req.params
        if(!validateMongooseId(id)){return apiErrorResponce(res, "no product found", null, 404)}

        const selectedValues = [
            "product_brand", "product_barcode", 
            "product_name", "product_UOM",
            "product_total_stock", "product_net_unit",
            "product_out_of_stock", "product_min_order_quantity",
            "product_max_order_quantity", "product_photos",
            "product_additional_photos", "product_hsn_code",
            "product_description", "product_highlights",
            "product_user_ratings", "product_user_review",
            "product_varient", "FAQ", 
            "product_offer", "product_stock.batch_no", 
            "product_stock.stock", "product_stock.quantity", 
            "product_stock.manufacture_date", "product_stock.expire_date", 
            "product_stock.best_before", "product_stock.mrp", 
            "product_stock.price", "product_stock.hidden"
        ]
        const product = await Product.findOne({
            _id : id,
            hidden: false,
            deleted: false
        }).select(selectedValues)

        if(!product){return apiErrorResponce(res , "no product found", null, 404)} 

        return apiSucessResponce(res , "products found successfully" , product )

    } catch (error) {
        console.log("Error in fetchProduct controller",error)
        apiErrorResponce(res , "internal server error" , error)
    }
}

