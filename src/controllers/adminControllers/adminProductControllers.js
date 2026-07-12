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

        session.startTransaction();

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
            user_id: req.user._id,
            activity_type: "product",
            action: "created",
            title: "Product Added",
            description: `Product "${product[0].product_name}" has been created successfully.`,
            reference_id: product[0]._id,
            reference_model: "Product",
            metadata: {
                product_id: product[0]._id,
                product_name: product[0].product_name,
                added_by: user.name
            }
        }], { session });

        await session.commitTransaction();
        return apiSucessResponce(res, "Product Created Successfully", product[0] )

    } catch (error) {
        await session.abortTransaction();
        console.log("error in CreateProduct controller ",error)
        return apiErrorResponce(res , "internal Server Error")
    } finally { session.endSession() }
}

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