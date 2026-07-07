import ProductCategory from "../../models/ProductCategoryModel.js"
import ProductGroup from "../../models/ProductGroupModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import { validateMongooseId } from "../../utils/validateTypes.js"

export const createProductCategory = async(req, res)=>{
    try {
        const {group_id , category_name, category_description  } = req.body
        if(!group_id || !category_name?.trim()) { return apiErrorResponce(res , "Group and Category name in required")}
        if (!req.file) {return apiErrorResponce(res, "Group image is required");}
        
        // validating mongoose id
        const valid_group_id = await validateMongooseId(group_id)
        if (!valid_group_id){return apiErrorResponce(res, "Error occured")}
            
        // validating category and group
        const category = await ProductCategory.findOne({ group_id, category_name: category_name.trim(), deleted: false });
        const group = await ProductGroup.findOne({_id : group_id, deleted: false})
        if(!group) {return apiErrorResponce(res, "Group not found")}
        if(category){return apiErrorResponce(res, "Category already exists in this group")}

        // data
        const formattedData = {
            category_name: category_name.trim(),
            category_description,
            category_image:{
                url : `/uploads/categories/${req.file.filename}`,
                public_id: "",
            },
            group_id
        }

        const newCategory = await ProductCategory.create(formattedData)
        return apiSucessResponce(res , "Category Created Sucessfully", newCategory, 201)

    } catch (error) {
        if (error.code === 11000) { return apiErrorResponce(res, "Category already exists in this group")}
        console.error("error in createProductCategory :" , error)
        return apiErrorResponce(res, "internal server error", null, 500 )
    }
}














// old

export const fetchAllProductCategory = async(req, res)=>{
    try {
        const category = await ProductCategory.find()

        return apiSucessResponce(res , "All Category fetched Successfully", category)
    } catch (error) {
        console.log("error in fetchAllProductCategory :" , error)
        return apiErrorResponce(res, "internal server error", null, 500 )
    }
}

export const fetchCategoriesByGroup = async(req, res)=>{
    try {
        const {id} = req.params

        const validId =  validateMongooseId(id)
        if(!validId){return apiErrorResponce(res, "Internal Server Error")}

        const categories = await ProductCategory.find({group_id : id})
        return apiSucessResponce(res , "Category fetched Successfully", categories)

    } catch (error) {
        console.log("error in fetchAllProductCategory :" , error)
        return apiErrorResponce(res, "internal server error", null, 500 )
    }
}
