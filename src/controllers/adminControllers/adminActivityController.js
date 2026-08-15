import mongoose from "mongoose";
import RecentActivity from "../../models/RecentActivityModel.js";
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js";

export const adminFetchActivityPage = async (req, res) => {
    try {

        const page = Math.max( parseInt(req.query.page) || 1, 1 )
        const limit = Math.min( Math.max(parseInt(req.query.limit) || 20, 1), 100 )
        const skip = (page - 1) * limit

        const activityType = req.query.activity_type?.trim() && req.query.activity_type.trim() !== "all" ? req.query.activity_type.trim() : null
        const action = req.query.action?.trim() && req.query.action.trim() !== "all" ? req.query.action.trim() : null
        const viewed = req.query.viewed?.trim() && req.query.viewed.trim() !== "all" ? req.query.viewed.trim() : null

        const match = { deleted: "false" }

        if (activityType) { match.activity_type = activityType }
        if (action) { match.action = action }
        if (viewed === "read") { match.viewed = true }
        if (viewed === "unread") { match.viewed = false }

        const totalActivities = await RecentActivity.countDocuments(match)
        const totalPages = Math.ceil(totalActivities / limit)
        const unreadActivities = await RecentActivity.countDocuments({ ...match, viewed: false })

        const activities = await RecentActivity.find(match)
            .populate({ path: "performed_by", select: "staff_id name"})
            .select(` performed_by activity_type action title description metadata viewed createdAt `)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()

        const data = {
            activities,
            pagination: {
                current_page: page,
                limit,
                total_activities: totalActivities,
                total_pages: totalPages,
                has_next_page: page < totalPages,
                has_previous_page: page > 1
            },
            unreadCount: unreadActivities
        }

        return apiSucessResponce( res, "Recent activities fetched successfully.", data, 200 )
    } catch (error) {
        console.error( "Error in adminFetchRecentActivities:", error )
        return apiErrorResponce( res, "Internal Server Error", null, 500 )
    }
}

export const adminFetchPreviewActivity = async (req, res) => {
    try {

        const { _id } = req.params
        if (!_id?.trim()) { return apiErrorResponce( res, "Activity ID is required", null, 400 )}
        if (!mongoose.isValidObjectId(_id)) { return apiErrorResponce( res, "Invalid activity ID.", null, 400 )}

        const activity = await RecentActivity.findOne({_id, deleted: false})
            .populate({ path: "performed_by", select: "staff_id name"})
            .select(` performed_by activity_type action title description metadata viewed viewed_at viewed_by createdAt `)
        
        if (!activity) { return apiErrorResponce( res, "Recent activity not found.", null, 404 )}
        
        if(activity.viewed === false){
            activity.viewed = true
            activity.viewed_at = new Date()
            activity.viewed_by = req.user._id
            
            await activity.save()
        }

        return apiSucessResponce( res, "Recent activity fetched successfully.", activity, 200 )
    } catch (error) {
        console.error( "Error in adminFetchPreviewActivity:", error )
        return apiErrorResponce( res, "Internal Server Error", null, 500 )
    }
}
