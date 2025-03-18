import Banner from '../../models/BannerModel.js'
import {apiErrorResponce, apiSucessResponce} from '../../utils/apiResponce.js'
import {validateMongooseId} from '../../utils/validateTypes.js'

export const createBanner = async(req, res)=>{
    try {
        const data = req.body.data
        if(!data || !data.banner_id || !data.banner_type){return apiErrorResponce(res, "Invalid Credentials")}
        const {banner_id, banner_type, card, carousel, group, category } = data

        if(!["carousel", "card", "group", "category"].includes(banner_type)){return apiErrorResponce(res, "Invalid Credentials")}
        
        const banner = await Banner.findOne({banner_id})
        if(!banner || banner.status){ return apiErrorResponce(res, "Invalid Credentials")}

        // Carousel
        if(banner_type == "carousel"){
            if(!carousel || !carousel.products || typeof(carousel.products) !== 'object' || !carousel.heading){return apiErrorResponce(res, "Invalid Credentials")}
            let valid = carousel.products.map((product) => {
                if(product.product_id && product.image && validateMongooseId(product.product_id)){return true}
                else{return false}
            });
            if(!valid || valid.includes(false)){return apiErrorResponce(res, "Invalid Credentials")}

            banner.banner_type = 'carousel'
            banner.carousel = {
                products: carousel.products,
                heading: carousel.heading
            },
            banner.status = true
            await banner.save()

            return apiSucessResponce(res, "Banner placed Successfully", banner)
        }

        // Card
        if(banner_type == "card"){
            if(!card || !card.product_id || typeof(card.product_id) !== 'object' || !card.heading){return apiErrorResponce(res, "Invalid Credentials")}

            let valid = card.product_id.map((product) => {
                if(validateMongooseId(product)){return true}
                else{return false}
            });
            if(!valid || valid.includes(false)){return apiErrorResponce(res, "Invalid Credentials")}

            banner.banner_type = 'card'
            banner.card = {
                product_id: card.product_id,
                heading: card.heading
            },
            banner.status = true
            await banner.save()

            return apiSucessResponce(res, "Banner placed Successfully", banner)
        }

        // Group
        if(banner_type == "group"){
            if(!group || !group.group_id || typeof(group.group_id) !== 'string' || !group.heading){return apiErrorResponce(res, "Invalid Credentials")}

            if(!validateMongooseId(group.group_id)){return apiErrorResponce(res, "Invalid Credefntials")}

            banner.banner_type = 'group'
            banner.group = {
                group_id: group.group_id,
                heading: group.heading
            },
            banner.status = true
            await banner.save()

            return apiSucessResponce(res, "Banner placed Successfully", banner)
        }

        // Category
        if(banner_type == "category"){
            if(!category || !category.category_id || typeof(category.category_id) !== 'object' || !category.heading){return apiErrorResponce(res, "Invalid Credentials")}

            let valid = category.category_id.map((category) => {
                if(validateMongooseId(category)){return true}
                else{return false}
            });
            if(!valid || valid.includes(false)){return apiErrorResponce(res, "Invalid Credentials")}

            banner.banner_type = 'category'
            banner.category = {
                category_id: category.category_id,
                heading: category.heading
            },
            banner.status = true
            await banner.save()

            return apiSucessResponce(res, "Banner placed Successfully", banner)
        }

        return apiErrorResponce(res, "Invalid Credentials")
    } catch (error) {
        console.log("Error in modifyBanner Controller: ", error)
        return apiErrorResponce(res, "Internal Server Error")
    }
}

export const fetchAllBanners = async(req, res)=>{
    try {
        const selectedCardValues = ["product_brand", "product_barcode", "product_name", "product_photos"]
        const banner = await Banner.find()
            .populate([{ path: ["card.product_id"], select:selectedCardValues, strictPopulate: false }, "card.product_id.product_brand"],)
            .populate([{ path: ["group.group_id"], strictPopulate: false }])

        if(!banner.length){return apiErrorResponce(res, "Internal Server Error")}
        return apiSucessResponce(res, "All banners fetched successfully", banner)
    } catch (error) {
        console.log("Error in modifyBanner Controller: ", error)
        return apiErrorResponce(res, "Internal Server Error")
    }
}

export const deleteBanner = async(req, res)=>{
    try {
        const {id} = req.params
        const banner = await Banner.findOne({banner_id: id})

        if(!banner || !banner.status){ return apiErrorResponce(res, "Banner not found, might be deleted")}

        banner.status = false
        banner.banner_type = null
        banner.card = null
        banner.carousel = null
        banner.category = null
        banner.group = null
        await banner.save()

        return apiSucessResponce(res, "Banner Deleted Sucessfully", banner)
    } catch (error) {
        console.log("Error in modifyBanner Controller: ", error)
        return apiErrorResponce(res, "Internal Server Error")
    }
}

