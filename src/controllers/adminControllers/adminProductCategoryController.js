import ProductCategory from "../../models/ProductCategoryModel.js"
import ProductGroup from "../../models/ProductGroupModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import { validateMongooseId } from "../../utils/validateTypes.js"

export const createProductCategory = async(req, res)=>{
    try {
        const {group_id , category_name, category_description, category_image } = req.body?.data
        if(!group_id || !category_name) { return apiErrorResponce(res , "Invalid Credentials")}

        const Category = await ProductCategory.findOne({category_name})
        const Group = await ProductGroup.findOne({_id : group_id})

        if(!Group) {return apiErrorResponce(res, "Group Not exist")}
        if(Category){return apiErrorResponce(res, "Category Name Is Already Added")}

        const formatedData = {
            category_name,
            category_description,
            category_image,
            group_id
        }

        const newCategory = new ProductCategory(formatedData)
        await newCategory.save()

        return apiSucessResponce(res , "Category Created Sucessfully", newCategory, 201)
    } catch (error) {
        console.log("error in createProductCategory :" , error)
        return apiErrorResponce(res, "internal server error", null, 500 )
    }
}

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
