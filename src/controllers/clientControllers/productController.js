import Product from "../../models/ProductModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import {validateMongooseId} from "../../utils/validateTypes.js"

export const fetchAllProduct = async(req , res)=>{
    try {
        const selectedValues = [
            "product_brand", 
            "product_barcode", 
            "product_name",
            "product_stock.stock", 
            "product_stock.quantity", 
            "product_stock.mrp", 
            "product_stock.price", 
            "product_total_stock", 
            "product_photos"
        ]

        const products = await Product.find({
            product_stock: {$exists: true, $ne: [], $not: { $size: 0 }}, 
            deleted : false, 
            hidden: false, 
            product_out_of_stock: false, 
            product_total_stock: {$exists: true, $ne: 0, }
        }).select(selectedValues)
        apiSucessResponce(res , "Products found successfully" , products )
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

