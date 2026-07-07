import ProductGroup from "../../models/ProductGroupModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"

export const createProductGroup = async(req, res)=>{
    try {
        const {group_name, group_description} = req.body
        if( !group_name?.trim()) { return apiErrorResponce(res , "Group name is required")}
        if (!req.file) {return apiErrorResponce(res, "Group image is required");}

        console.log(req.body)
        console.log(req.file)

        const group = await ProductGroup.findOne({
            group_name: {$regex: new RegExp(`^${group_name.trim()}$`, "i"),},
        });
        if(group){return apiErrorResponce(res, "Group Name Is Already Added")}

        const formattedData = {
            group_name: group_name.trim(),
            group_description,
            group_image:{
                url : `/uploads/groups/${req.file.filename}`
            }
        }

        const newGroup = await ProductGroup.create(formattedData);

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