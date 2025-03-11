import jwt from 'jsonwebtoken'
import User from '../models/UserModel.js'
import { apiErrorResponce, apiSucessResponce } from '../utils/apiResponce.js'

const renewToken = async (req, res , next) => {
    
    const accessTokenExpirationTime = '10m'
    
    const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY
    const REFRESH_TOKEN_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET_KEY

    try {
        const refreshtoken = req.cookies.refreshToken;
        if(!refreshtoken) { return apiErrorResponce(res, "No Refresh token")}

        jwt.verify(refreshtoken, REFRESH_TOKEN_SECRET_KEY , async(error , decoded)=>{
            if (error){
                console.log("Error in renew token middleware :",error)
                return apiErrorResponce(res, "Invalid Refresh Token")
            }
            const selectedValues = ['_id', "user_type", "email", "name", "order_id", "blocked", "address", 'cart']
            const user = await User.findOne({email: decoded.email, deleted: false}).populate([{ path: ["cart.product_id"], strictPopulate: false }]).select(selectedValues)
            if(!user){ 
                res.clearCookie('refreshToken')
                res.clearCookie('accessToken')
                return res.status(400).send({message : "No User Found"})
            } 
            const accessToken = jwt.sign({email : user.email}, ACCESS_TOKEN_SECRET_KEY , {expiresIn: accessTokenExpirationTime} )
            res.cookie('accessToken', accessToken, {maxAge: 600000})

            const cart = user.cart?.map(product => ({
                product_id : {
                    _id :  product.product_id._id,
                    product_brand:  product.product_id.product_brand,
                    product_barcode:  product.product_id.product_barcode,
                    product_name:  product.product_id.product_name,
                    product_total_stock:  product.product_id.product_total_stock ,
                    product_offer:  product.product_id.product_offer ,
                    product_net_unit:  product.product_id.product_net_unit ,
                    product_out_of_stock:  product.product_id.product_out_of_stock ,
                    product_min_order_quantity:  product.product_id.product_min_order_quantity ,
                    product_max_order_quantity:  product.product_id.product_max_order_quantity ,
                    product_photos:  product.product_id.product_photos ,
                    product_varient:  product.product_id.product_varient ,
                    product_stock: {
                        stock: product.product_id.product_stock[0].stock ,
                        quantity: product.product_id.product_stock[0].quantity,
                        mrp: product.product_id.product_stock[0].mrp,
                        batch_no: product.product_id.product_stock[0].batch_no,
                        price: product.product_id.product_stock[0].price ,
                        manufacture_date: product.product_id.product_stock[0].manufacture_date ,
                        expire_date: product.product_id.product_stock[0].expire_date ,
                    } ,
                    hidden:  product.product_id.hidden ,
                    deleted:  product.product_id.deleted ,
                },
                quantity: product.quantity
            }))

            user._doc.cart = cart
            req.body.user = user
            next()            
        })
    } catch (error) {
        console.log("Error in renewToken middleware", error)
        apiErrorResponce(res , "internal server error" , error)
    }
}

const verifyUser = async(req, res, next) => {

    try {
        const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY

        const accesstoken = req.cookies.accessToken;
        if(!accesstoken) {renewToken(req, res , next); return} 
    
        const token = jwt.verify(accesstoken, ACCESS_TOKEN_SECRET_KEY )
        if(!token) { return apiErrorResponce(res, "Invalid Token")}

        const selectedValues = ['_id', "user_type", "email", "name", "order_id", "blocked", "address", 'cart']
        let user = await User.findOne({email: token.email, deleted: false}).populate([{ path: ["cart.product_id"], strictPopulate: false }]).select(selectedValues)
        if(!user){ 
            res.clearCookie('refreshToken')
            res.clearCookie('accessToken')
            return res.status(400).send({message : "No User Found"})
        } 
        const cart = user.cart?.map(product => ({
            product_id : {
                _id :  product.product_id._id,
                product_brand:  product.product_id.product_brand,
                product_barcode:  product.product_id.product_barcode,
                product_name:  product.product_id.product_name,
                product_total_stock:  product.product_id.product_total_stock ,
                product_offer:  product.product_id.product_offer ,
                product_net_unit:  product.product_id.product_net_unit ,
                product_out_of_stock:  product.product_id.product_out_of_stock ,
                product_min_order_quantity:  product.product_id.product_min_order_quantity ,
                product_max_order_quantity:  product.product_id.product_max_order_quantity ,
                product_photos:  product.product_id.product_photos ,
                product_varient:  product.product_id.product_varient ,
                product_stock: {
                    stock: product.product_id.product_stock[0].stock ,
                    quantity: product.product_id.product_stock[0].quantity,
                    mrp: product.product_id.product_stock[0].mrp,
                    batch_no: product.product_id.product_stock[0].batch_no,
                    price: product.product_id.product_stock[0].price ,
                    manufacture_date: product.product_id.product_stock[0].manufacture_date ,
                    expire_date: product.product_id.product_stock[0].expire_date ,
                },
                hidden:  product.product_id.hidden,
                deleted:  product.product_id.deleted ,
            },
            quantity: product.quantity
        }))

        user._doc.cart = cart
        req.body.user = user
        next()

    } catch (error) {
        console.log("Error in verifyUser middleware", error)
        apiErrorResponce(res , "internal server error" , error)
    }
}

export default verifyUser