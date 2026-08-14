import ProductGroup from "../../models/ProductGroupModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"

export const createProductGroup = async(req, res)=>{
    try {
        const {group_name, group_description} = req.body
        if( !group_name?.trim()) { return apiErrorResponce(res , "Group name is required")}
        if (!req.file) {return apiErrorResponce(res, "Group image is required");}

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

export const adminFetchGroupCategoryPage = async (req, res) => {
    try {

        const summaryResult = await ProductGroup.aggregate([
            { $match: { deleted: false }},
            { $facet: {
                groups: [{ $count: "count"}],
                categories: [
                    { $lookup: {
                        from: "productcategories",
                        let: { groupId: "$_id" },
                        pipeline: [ { $match: 
                            { $expr: { $and: [ 
                                { $eq: [ "$group_id", "$$groupId"]}, { $eq: [ "$deleted", false ]}
                            ]}}
                        }],
                        as: "categories"
                    }},
                    { $unwind: "$categories"},
                    { $count: "count"}
                ],
                products: [
                    { $lookup: {
                        from: "products",
                        let: { groupId: "$_id" },
                        pipeline: [{ $match: 
                            { $expr: { $and: [
                                {$eq: ["$product_group","$$groupId"] },{$eq: ["$deleted",false]}
                            ]}}
                        }],
                        as: "products"
                    }},
                    { $unwind: "$products" },
                    { $count: "count" }
                ]
            }}
        ]);

        const summaryData = summaryResult[0] || {};
        const summary = { 
            total_groups: summaryData.groups?.[0]?.count || 0,
            total_categories: summaryData.categories?.[0]?.count || 0,
            total_products: summaryData.products?.[0]?.count || 0
        };
        const groups = await ProductGroup.aggregate([
            { $match: { deleted: false }},
            { $sort: { createdAt: -1 }},
            { $lookup: {
                from: "productcategories",
                let: { groupId: "$_id" },
                pipeline: [
                    { $match: { 
                        $expr: { $and: [ 
                            { $eq: [ "$group_id", "$$groupId"] },
                            { $eq: [ "$deleted", false ]}
                        ]}
                    }},
                    { $lookup: {
                        from: "products",
                        let: { categoryId: "$_id" },
                        pipeline: [
                            { $match: {$expr: {$and: [
                                { $eq: [ "$product_category", "$$categoryId" ]},
                                { $eq: [ "$deleted", false ] }
                            ]}}},
                            { $count: "count"}
                        ],
                        as: "productCount"
                    }},
                    { $addFields: { product_count: { $ifNull: [{ $arrayElemAt: [ "$productCount.count", 0 ]}, 0 ]}}},
                    { $project: {
                        _id: 1,
                        category_name: 1,
                        category_description: 1,
                        category_image: "$category_image.url",
                        product_count: 1,
                        createdAt: 1
                    }},
                    { $sort: { createdAt: -1}}
                ],
                as: "categories"
            }},

            { $addFields: {
                category_count: { $size: "$categories" },
                product_count: { $sum: "$categories.product_count" }}
            },
            { $project: {
                _id: 1,
                group_name: 1,
                group_description: 1,
                group_image: "$group_image.url",
                category_count: 1,
                product_count: 1,
                categories: 1,
                createdAt: 1,
                updatedAt: 1
            }}
        ]);

        const data = { summary, groups }

        return apiSucessResponce( res, "Group and category data fetched successfully.", data, 200);
    } catch (error) {
        console.error( "Error in adminFetchGroupCategoryPage:", error );
        return apiErrorResponce( res, "Internal Server Error", null, 500 );
    }
};