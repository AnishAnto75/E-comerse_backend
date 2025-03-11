import ProductCategory from "../../models/ProductCategoryModel.js"
import ProductGroup from "../../models/ProductGroupModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"

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
            category_image
        }

        const newCategory = new ProductCategory(formatedData)
        await newCategory.save()
        Group.category_id.push(newCategory._id)
        await Group.save()

        return apiSucessResponce(res , "Category Created Sucessfully", newCategory, 201)
    } catch (error) {
        console.log("error in createProductCategory :" , error)
        return apiErrorResponce(res, "internal server error", null, 500 )
    }
}

export const fetchAllProductCategory = async(req, res)=>{
    try {

        const category = await ProductCategory.find()

        return apiSucessResponce(res , "All Category fetched Sucessfully", {category})
    } catch (error) {
        console.log("error in fetchAllProductCategory :" , error)
        return apiErrorResponce(res, "internal server error", null, 500 )
    }
}
