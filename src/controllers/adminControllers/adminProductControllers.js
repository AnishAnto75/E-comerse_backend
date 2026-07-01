import mongoose from "mongoose"
import ProductCategory from "../../models/ProductCategoryModel.js"
import ProductGroup from "../../models/ProductGroupModel.js"
import Product from "../../models/ProductModel.js"
import ProductBrand from '../../models/ProductBrandModel.js'
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import { validateMongooseId } from "../../utils/validateTypes.js"
import ProductInventory from "../../models/ProductInventoryModel.js"
import ProductReview from "../../models/ProductReviewModel.js"

export const CreateProduct = async(req , res)=>{
    var valid1 = false
    const user = req.body.user
    const {data} = req.body

    const {product_group, product_category, product_brand, product_barcode, product_name, product_UOM, product_net_unit, product_min_order_quantity, product_max_order_quantity, 
        product_low_in_stock, product_photos, product_additional_photos, product_hsn_code, product_description, product_highlights} = data

    if(!product_group || !product_category || !product_brand || !product_barcode || !product_name || !product_UOM ){ return apiErrorResponce(res , "Invalid credentials")}
    
    try {

        const validateGroup = await ProductGroup.findOne({_id : product_group})
        if(!validateGroup) { return apiErrorResponce(res , "Invalid credentials") }

        const validateCategory = await ProductCategory.findOne({_id : product_category})

        if(!validateCategory) { return apiErrorResponce(res , "Invalid credentials") }
        if(validateCategory.group_id != product_group) { return apiErrorResponce(res , "Invalid credentials") }
        
        const validateBrand = await ProductBrand.findOne({_id : product_brand})
        if(!validateBrand) { return apiErrorResponce(res , "Invalid credentials") }

        const validateProduct = await Product.findOne({product_barcode})
        if(validateProduct){return apiErrorResponce(res , "barcode existed")}
        if(!validateProduct){valid1 = true}

        const productInventory = new ProductInventory({product_barcode, product_low_in_stock}) 
        await productInventory.save()

        const productReview = new ProductReview({product_barcode})
        await productReview.save()

        const formatedData = {
            product_group,
            product_category, 
            product_brand, 
            product_barcode, 
            product_name,
            product_inventory_id : productInventory._id,
            product_review_id : productReview._id,
            product_UOM ,
            product_net_unit, 
            product_min_order_quantity, 
            product_max_order_quantity, 
            product_photos,
            product_additional_photos,
            product_hsn_code,
            product_description,
            product_highlights, 
            product_added_by : user._id ,
        }

        const product = new Product(formatedData)
        await product.save()

        return apiSucessResponce(res, "Product Created Successfully", product )
    } catch (error) {
        try {
            if(valid1){
                const deletingProductInventory = await ProductInventory.deleteOne({product_barcode})
                const deletingProductReview = await ProductReview.deleteOne({product_barcode})
            }
        } catch (error) {
            console.log("error in CreateProduct controller ",error)
            return apiErrorResponce(res , "internal Server Error")
        }
        console.log("error in CreateProduct controller ",error)
        return apiErrorResponce(res , "internal Server Error")
    }
}


export const adminFetchAllProduct = async(req,res)=>{
    try {
        const products = await Product.find({deleted : false})
        .select(["product_brand", "product_barcode", "product_name", "product_photos", "status", "product_inventory_id"])
        .populate({ path: ["product_brand"], strictPopulate: false })
        .populate({ path: ["product_inventory_id"], strictPopulate: false })
        .populate({ path: ["product_review_id"], strictPopulate: false })


        return apiSucessResponce(res, "All Products Fetched SuccessFully", products)
    } catch (error) {
        console.log("error in fetchAllProduct controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}



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


export const adminFetchProduct = async(req,res)=>{
    try {
        const {id} = req.params
        const product = await Product.findOne({product_barcode : id})
        .populate({ path: ["product_brand"], strictPopulate: false })
        .populate({ path: ["product_inventory_id"], strictPopulate: false })
        .populate({ path: ["product_category"], strictPopulate: false })
        .populate({ path: ["product_group"], strictPopulate: false })
        .populate({ path: ["product_review_id"], strictPopulate: false })

        if(!product){
            return apiErrorResponce(res, "Product Not Found", 404)
        }
        return apiSucessResponce(res, "Product Found Successfully", product)
    } catch (error) {
        console.log("error in adminFetchProduct controller" , error)
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