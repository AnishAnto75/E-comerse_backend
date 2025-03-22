import Banner from '../../models/BannerModel.js'
import Product from '../../models/ProductModel.js'
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
            let valid = carousel.products?.map((product) => {
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

            const selectedCarouselValues = ["product_barcode", "product_name"]
            const newBanner = await Banner.findOne({banner_id: banner.banner_id}).populate([{ path: ["carousel.products.product_id"], select:selectedCarouselValues, strictPopulate: false }])

            return apiSucessResponce(res, "Banner placed Successfully", newBanner)
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

            const selectedCardValues = ["product_brand", "product_barcode", "product_name", "product_photos"]
            const newBanner = await Banner.findOne({banner_id: banner.banner_id}).populate([{ path: ["card.product_id"], select:selectedCardValues, strictPopulate: false }])

            return apiSucessResponce(res, "Banner created Successfully", newBanner)
        }

        // Group
        if(banner_type == "group"){
            if(!group || !group.group_id || !validateMongooseId(group.group_id) || !group.heading){return apiErrorResponce(res, "Invalid Credentials")}

            banner.banner_type = 'group'
            banner.group = {
                group_id: group.group_id,
                heading: group.heading
            },
            banner.status = true
            await banner.save()

            const newBanner = await Banner.findOne({banner_id: banner.banner_id}).populate({path: 'group.group_id', populate: {path: 'category_id',model: 'ProductCategory', select:['category_name', "category_image", "deleted" ], strictPopulate: false}, strictPopulate: false})

            return apiSucessResponce(res, "Banner placed Successfully", newBanner)
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
        console.log("Error in createBanner Controller: ", error)
        return apiErrorResponce(res, "Internal Server Error")
    }
}

export const fetchAllBanners = async(req, res)=>{
    try {
        const banner = await Banner.find()
            .populate({ path: ["carousel.products.product_id"], select:["product_barcode", "product_name"], strictPopulate: false })
            .populate({ path: ["card.product_id"], select:["product_brand", "product_barcode", "product_name", "product_photos"], strictPopulate: false })
            .populate({path: 'group.group_id', populate: {path: 'category_id',model: 'ProductCategory', select:['category_name', "category_image", "deleted" ], strictPopulate: false}, strictPopulate: false})

        if(!banner.length){return apiErrorResponce(res, "Internal Server Error")}
        return apiSucessResponce(res, "All banners fetched successfully", banner)
    } catch (error) {
        console.log("Error in fetchAllBanners Controller: ", error)
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
        console.log("Error in deleteBanner Controller: ", error)
        return apiErrorResponce(res, "Internal Server Error")
    }
}

export const adminFetchProductsByNameForCreateBanner = async(req, res)=>{
    try {
        const { name } = req.params;
        const products = await Product.find({product_name : {$regex: name, $options: 'i'} , deleted: false}).select(['_id', 'product_name', "product_barcode", 'product_photos']).limit(5)
        return apiSucessResponce(res, "Products found Successfully", products)
    } catch (error) {
        console.log("error in adminFetchProductsByNameForCreateBanner controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}

export const adminFetchProductsByBarcodeForCreateBanner = async(req, res)=>{
    try {
        const {barcode} = req.params
        const products = await Product.findOne({product_barcode : barcode, deleted: false}).select(['_id', 'product_name', "product_barcode", 'product_photos'])
        return apiSucessResponce(res, "Products found Successfully", products)
    } catch (error) {
        console.log("error in adminFetchProductsByBarcodeForCreateBanner controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}