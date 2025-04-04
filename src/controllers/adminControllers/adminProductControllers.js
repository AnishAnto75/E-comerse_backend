import ProductCategory from "../../models/ProductCategoryModel.js"
import ProductGroup from "../../models/ProductGroupModel.js"
import Product from "../../models/ProductModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import { validateMongooseId } from "../../utils/validateTypes.js"

export const CreateProduct = async(req , res)=>{
    try {
        const user = req.body.user
        const {data} = req.body
        console.log("CreateProduct payload",data)

        const {product_group, product_category, product_brand, product_barcode, product_name, product_UOM, product_net_unit, product_min_order_quantity, product_max_order_quantity, product_low_in_stock, 
            product_photos, product_additional_photos, product_hsn_code, product_description, product_highlights } = data

        if(!product_group || !product_category || !product_brand || !product_barcode || !product_name || !product_UOM ){ return apiErrorResponce(res , "Invalid credentials")}

        const group = await ProductGroup.findOne({_id : product_group})
        const category = await ProductCategory.findOne({_id : product_category})
        const ValidateProduct = await Product.findOne({product_barcode})

        if(!group || !category) { return apiErrorResponce(res , "Invalid credentials") }
        if(ValidateProduct){return apiErrorResponce(res , "barcode existed") }

        const formatedData = {
            product_group,
            product_category, 
            product_brand, 
            product_barcode, 
            product_name, 
            product_UOM ,
            product_net_unit, 
            product_min_order_quantity, 
            product_max_order_quantity, 
            product_low_in_stock, 
            product_photos,
            product_additional_photos,
            product_hsn_code,
            product_description,
            product_highlights, 
            product_added_by : user._id ,
        }

        const product = new Product(formatedData)
        await product.save()

        return apiSucessResponce(res, "Product Created Sucessfully", product )
    } catch (error) {
        console.log("error in CreateProduct controller ",error)
        return apiErrorResponce(res , "internal Server Error")
    }
}

export const adminFetchAllProduct = async(req,res)=>{
    try {
        const selectingList = ["product_brand", "product_barcode", "product_name", "product_total_stock", "product_photos", "product_total_unit_sold", "product_low_in_stock", "product_category", "hidden" ]
        const products = await Product.find({deleted : false})
        .populate({ path: ["product_category"], select:["category_name"], strictPopulate: false })
        .select(selectingList)

        return apiSucessResponce(res, "All Products Fetched SucessFully", products)
    } catch (error) {
        console.log("error in fetchAllProduct controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}

export const adminFetchForProductPage = async(req, res)=>{
    try {
        const products = await Product.find({deleted : false}).sort({ product_total_unit_sold: -1 })
        .select(["product_brand", "product_barcode", "product_name", "product_total_stock", "product_low_in_stock", "product_total_unit_sold", "product_photos", "hidden" ])

        const prdts = products.slice(0, 15)
        const total_products = products.length
        const low_in_stock_products = products.filter((product)=> product.product_total_stock < product.product_low_in_stock)
        let total_stock = 0
        products?.forEach(product => total_stock += product.product_total_stock)

        const data = {
            products : prdts,
            total_products,
            low_in_stock : low_in_stock_products.length,
            total_stock,
        }
        return apiSucessResponce(res, "All Products Fetched SucessFully", data)
    } catch (error) {
        console.log("error in fetchAllProduct controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}

export const adminFetchProduct = async(req,res)=>{
    try {
        const {id} = req.params
        const product = await Product.findOne({product_barcode : id})
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
        .select(["product_brand", "product_barcode", "product_name", "product_total_stock", "product_photos", "product_total_unit_sold", "product_category", "hidden" ]).limit(15)

        return apiSucessResponce(res, "All Products Fetched SucessFully", products)
        
    } catch (error) {
        console.log("error in adminFetchProduct controller" , error)
        return apiErrorResponce(res , "Internal Server Error")
    }
}