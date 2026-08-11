import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import ProductBrand from "../../models/ProductBrandModel.js"
import { validateMongooseId } from "../../utils/validateTypes.js"
import mongoose from "mongoose"


export const createProductBrand = async(req, res)=>{
    try {
        const{brand_name, brand_description } = req.body
        
        if (!brand_name?.trim()) { return apiErrorResponce(res, "Brand name is required")}
        if (!req.file) {return apiErrorResponce(res, "Brand logo is required")}

        const validateBrand = await ProductBrand.findOne({brand_name: { $regex: new RegExp(`^${brand_name.trim()}$`, "i"),}, deleted: false })
        if(validateBrand){ return apiErrorResponce(res, "Brand Already Exist", null, 400)}

        const formattedData = {
            brand_name : brand_name.trim(),
            brand_description,
            brand_logo:{
                url : `/uploads/brands/${req.file.filename}`,
                public_id: "",
            }
        }

        const newBrand = await ProductBrand.create(formattedData)

        return apiSucessResponce(res , "Brand Created Successfully", newBrand, 201)
    } catch (error) {
        if (error.code === 11000) {return apiErrorResponce(res, "Brand already exists", null, 400)}
        console.log("error in createProductBrand :" , error)
        return apiErrorResponce(res, "internal server error", null, 500 )
    }
}

export const fetchBrand = async(req, res)=>{
    try {
        const {id} = req.params

        if (!id || !mongoose.Types.ObjectId.isValid(id)) { return apiErrorResponce( res, "Invalid brand id", null, 400 )}

        const brand = await ProductBrand.findOne({_id : id, deleted: false}).lean()
        if (!brand) { return apiErrorResponce( res, "Brand not found", null, 404 )}

        return apiSucessResponce(res, "Brand Fetched Successfully" , brand, 200)
    } catch (error) {
        console.log("error in fetchBrand :" , error)
        return apiErrorResponce(res, "internal server error", null, 500 )
    }
}

export const fetchAllBrand = async (req, res) => {
    try {
        const page = Math.max( parseInt(req.query.page) || 1, 1 )
        const limit = Math.min( Math.max(parseInt(req.query.limit) || 20, 1), 100 )
        const skip = (page - 1) * limit;
        const filter = { 
            deleted: false
        };

        const [brands, totalBrands] = await Promise.all([
            ProductBrand.find(filter)
                .select( "brand_name brand_description brand_logo brand_average_ratings brand_total_reviews" )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ProductBrand.countDocuments(filter)
        ]);
        const totalPages = Math.ceil(totalBrands / limit);

        const data = { 
            brands,
            pagination: {
                current_page: page,
                limit,
                total_brands: totalBrands,
                total_pages: totalPages,
                has_next_page: page < totalPages,
                has_previous_page: page > 1
            }
        }
        return apiSucessResponce( res, "Brands fetched successfully", data, 200 )

    } catch (error) {
        console.error("Error in fetchAllBrand:", error);
        return apiErrorResponce( res, "Internal server error", null, 500 )
    }
};







// old

export const adminEditBrand = async(req,res)=>{
    try {
        
        const {id} = req.params
        if(!validateMongooseId(id)){return apiErrorResponce(res, "invalid Credentials")}
         
        const brandData = req.body.data;
        if(!brandData){return apiErrorResponce(res, "Invalid credentials")}
        
        const brand = await ProductBrand.findOne({_id: id})
        if(!brand){return apiErrorResponce(res, "invalid credentials")}

        if(brandData.Brand_name !== brand.Brand_name){
            const validatingBrand = await ProductBrand.findOne({Brand_name: brandData.Brand_name})
            if(validatingBrand){ return apiErrorResponce(res, "Brand Name Already Exist")}
        }

        brand.Brand_name = brandData.Brand_name
        brand.Brand_description = brandData.Brand_description
        brand.Brand_logo = brandData.Brand_logo
        await brand.save()
    
        return apiSucessResponce(res, "Brand Edited SuccessFully", {brand})
        
    } catch (error) {
        console.log("error in adminSearchBrand controller" , error)
        return apiErrorResponce(res , "Internal Server Error")
    }
}

export const adminSearchBrand = async(req,res)=>{
    try {
        
        const { name } = req.query;
        if(!name){
            return apiErrorResponce(res, "Internal Server Error")
        }
        const brands = await ProductBrand.find({Brand_name : {$regex: name, $options: 'i'}, deleted: false})
        .select(["Brand_name", "Brand_description", "Brand_logo"])

        return apiSucessResponce(res, "All Brands Fetched SucessFully", brands)
        
    } catch (error) {
        console.log("error in adminSearchBrand controller" , error)
        return apiErrorResponce(res , "Internal Server Error")
    }
}


