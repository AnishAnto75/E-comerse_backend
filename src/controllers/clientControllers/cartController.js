import Product from "../../models/ProductModel.js"
import User from "../../models/UserModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"

export const addCart = async(req , res)=>{
    try {

        const usr = req.body.user
        const data = req.body.data
        if(!data){return apiErrorResponce(res, "Invalid Crdentials")}

        const {product_barcode , quantity} = data
        if(!product_barcode){return apiErrorResponce(res , "Invalid Credentials")}

        const product_details = await Product.findOne({product_barcode, deleted: false, hidden: false, product_out_of_stock: false})
        if(!product_details){return apiErrorResponce(res , "Product Went OutOfStock")}

        if (!usr.cart){
            try {
                const cart = [{
                    product_id : product_details._id ,
                    quantity : 1
                }]
                const userCart = await User.findOneAndUpdate({_id : usr._id},{cart} , {new : true}).populate({ path: ["cart.product_id"], strictPopulate: false }).select('cart')

                const postCart = userCart.cart?.map(product => ({
                    product_id : {
                        _id :  product.product_id._id,
                        product_brand:  product.product_id.product_brand,
                        product_barcode:  product.product_id.product_barcode,
                        product_name:  product.product_id.product_name,
                        product_total_stock:  product.product_id.product_total_stock,
                        product_offer:  product.product_id.product_offer,
                        product_net_unit:  product.product_id.product_net_unit,
                        product_out_of_stock:  product.product_id.product_out_of_stock,
                        product_min_order_quantity:  product.product_id.product_min_order_quantity,
                        product_max_order_quantity:  product.product_id.product_max_order_quantity,
                        product_photos:  product.product_id.product_photos,
                        product_varient:  product.product_id.product_varient,
                        product_stock: {
                            stock: product.product_id.product_stock[0].stock,
                            quantity: product.product_id.product_stock[0].quantity,
                            mrp: product.product_id.product_stock[0].mrp,
                            price: product.product_id.product_stock[0].price,
                            _id: product.product_id.product_stock[0]._id,
                        },
                        hidden:  product.product_id.hidden ,
                        deleted:  product.product_id.deleted ,
                    },
                    quantity: product.quantity
                }))
                return apiSucessResponce(res , "Added sucessfully", postCart )
            } catch (error) {
                apiErrorResponce(res , "Internal Server Error" , null , 500)
            }
        }

        const cartProducts = usr.cart

        let changeProducts = true
        const newCartProducts =  cartProducts.map(product =>{
            if(product.product_id._id.toString() == product_details._id.toString()){
                changeProducts = false
                return {product_id : product.product_id , quantity : quantity ? quantity : product.quantity}
            } else {
                return {product_id : product.product_id , quantity : product.quantity}
            }
        })
        if(changeProducts){ newCartProducts.push({product_id: product_details._id, quantity: quantity ? quantity : 1 })}

        const userCart = await User.findOneAndUpdate({_id : usr._id},{cart: newCartProducts} , {new : true}).populate({ path: ["cart.product_id"], strictPopulate: false }).select("cart")

        const cart = userCart.cart?.map(product => ({
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
                    quantity: product.product_id.product_stock[0].quantity ,
                    mrp: product.product_id.product_stock[0].mrp ,
                    price: product.product_id.product_stock[0].price ,
                    _id: product.product_id.product_stock[0]._id ,
                } ,
                hidden:  product.product_id.hidden ,
                deleted:  product.product_id.deleted ,
            },
            quantity: product.quantity
        }))

        return apiSucessResponce(res , "Added sucessfully" ,  cart )

    } catch (error) {
        console.log("addCart controller error :", error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}

export const removeCart = async(req , res)=>{
    try {
        const user = req.body.user
        const data = req.body.data
        if(!data){return apiErrorResponce(res, "Invalid Crdentials")}

        const {product_barcode} = data
        if(!product_barcode){ return apiErrorResponce(res , "Invalid Credentials")}

        const cartProducts = user.cart.map(product =>{
            if(product.product_id.product_barcode.toString() == product_barcode.toString()){return} 
            else { return {product_id : product.product_id._id , quantity : product.quantity}}
        })

        let newCartProducts = cartProducts.filter( (e)=> {return e }); // Removes the null and undefined values 

        const userCart = await User.findOneAndUpdate({_id : user._id},{cart: newCartProducts} , {new : true}).populate({ path: ["cart.product_id"], strictPopulate: false }).select("cart")

        const cart = userCart.cart?.map(product => ({
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
                    quantity: product.product_id.product_stock[0].quantity ,
                    mrp: product.product_id.product_stock[0].mrp ,
                    price: product.product_id.product_stock[0].price ,
                    _id: product.product_id.product_stock[0]._id ,
                } ,
                hidden:  product.product_id.hidden ,
                deleted:  product.product_id.deleted ,
            },
            quantity: product.quantity
        }))

        return apiSucessResponce(res, "Removed Sucessfully" , cart  )
    } catch (error) {
        console.log("error in removeCart controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}
