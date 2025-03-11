import ProductGroup from "../../models/ProductGroupModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"

export const createProductGroup = async(req, res)=>{
    try {
        const {group_name, group_description, group_image } = req.body?.data
        if(!group_name) { return apiErrorResponce(res , "Invalid Credentials")}

        const group = await ProductGroup.findOne({group_name})
        if(group){return apiErrorResponce(res, "Group Name Is Already Added")}

        const formatedData = {
            group_name,
            group_description,
            group_image
        }

        const newGroup = new ProductGroup(formatedData)
        await newGroup.save()

        return apiSucessResponce(res , "Group Created Sucessfully", newGroup, 201)
    } catch (error) {
        console.log("error in createProductGroup :" , error)
        return apiErrorResponce(res, "internal server error", null, 500 )
    }
}

export const fetchAllProductGroup = async(req, res)=>{
    try {
        const group = await ProductGroup.find().populate([{ path: 'category_id', strictPopulate: false }]);
        return apiSucessResponce(res , "All group fetched Sucessfully", group)
    } catch (error) {
        console.log("error in fetchAllProductGroup :" , error)
        return apiErrorResponce(res, "internal server error", null, 500 )
    }
}