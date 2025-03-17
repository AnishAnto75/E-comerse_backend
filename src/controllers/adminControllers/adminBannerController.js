import Banner from '../../models/BannerModel.js'
import {apiErrorResponce, apiSucessResponce} from '../../utils/apiResponce.js'

export const createBanner = async(req, res)=>{
    try {

        const data = req.body.data
        if(!data || !data.banner_id || !data.banner_type){return apiErrorResponce(res, "Invalid Credentials")}
        const {banner_type, card, carousel, group, category } = data

        if(!["carousel", "card", "group", "category"].includes(banner_type)){return apiErrorResponce(res, "Invalid Credentials")}
        
        const banner = await Banner.findOne({banner_id: data.banner_id})
        if(!banner){ return apiErrorResponce(res, "Invalid Credentials")}
        
        if(banner_type == "carousel"){

            if(!carousel || !carousel.products || typeof(carousel.products) !== 'object' || !carousel.heading){return apiErrorResponce(res, "Invalid Credentials")}

            const formatedData = {
                banner_type,
                carousel: {
                    products: carousel.products,
                    heading: carousel.heading
                },
                status: true
            }

            // not done

            return apiSucessResponce(res, "Carousel Added Successfully", formatedData)
        }

        return apiSucessResponce(res, "done", banner)
    } catch (error) {
        console.log("Error in modifyBanner Controller: ", error)
        return apiErrorResponce(res, "Internal Server Error")
    }
}

export const fetchAllBanners = async(req, res)=>{
    try {
        const banner = await Banner.find()

        return apiSucessResponce(res, "All banners fetched sucessfully", banner)
    } catch (error) {
        console.log("Error in modifyBanner Controller: ", error)
        return apiErrorResponce(res, "Internal Server Error")
    }
}

// for creating a new bannner
// export const createBanner = async(req, res)=>{
//     try {
//         const banner = new Banner(req.body.data)
//         await banner.save()
//         return apiSucessResponce(res, "done", banner)
//     } catch (error) {
//         console.log("Error in modifyBanner Controller: ", modifyBanner)
//         return apiErrorResponce(res, "Internal Server Error")
//     }
// }