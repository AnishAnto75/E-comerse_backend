import Product from "../../models/ProductModel.js"
import User from "../../models/UserModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"

export const addToCart = async(req , res)=>{
    try {
        const usr = req.body.user
        const data = req.body.data
        if(!data){return apiErrorResponce(res, "Invalid Crdentials")}

        const {product_barcode , quantity} = data
        if(!product_barcode){return apiErrorResponce(res , "Invalid Credentials")}

        const product_details = await Product.findOne({product_barcode, deleted: false, hidden: false, out_of_stock: false})
        if(!product_details){return apiErrorResponce(res , "Product Currently Unavailable")}

        if (!usr.cart?.length){
            try {
                const cart = [{
                    product_id : product_details._id ,
                    quantity : 1
                }]
                const userCart = await User.findOneAndUpdate({_id : usr._id},{cart} , {returnDocument: 'after'})

                return apiSucessResponce(res , "Added successfully" , userCart.cart )
            } catch (error) {
                apiErrorResponce(res , "Internal Server Error" , null , 500)
            }
        }

        const cartProducts = usr.cart
        cartProducts.push({product_id: product_details._id, quantity: quantity ? quantity : 1 })

        const userCart = await User.findOneAndUpdate({_id : usr._id},{cart: cartProducts} , {returnDocument: 'after'})

        return apiSucessResponce(res , "Added successfully" ,  userCart.cart )

    } catch (error) {
        console.log("addCart controller error :", error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}

export const removeCart = async(req , res)=>{
    try {
        const user = req.body.user
        const id = req.body.data
        if(!id){return apiErrorResponce(res, "Invalid Crdentials")}

        const cartProducts = user.cart?.map(product =>{
            if(product.product_id.toString() == id.toString()){return} 
            else { return {product_id : product.product_id , quantity : product.quantity}}
        })

        let newCartProducts = cartProducts.filter( (e)=> {return e }); // Removes the null and undefined values 

        const userCart = await User.findOneAndUpdate({_id : user._id},{cart: newCartProducts} , {returnDocument: 'after'})
            .populate({ path: ["cart.product_id"],
                populate: {path: 'product_brand product_inventory_id' , select: "Brand_name product_stock.stock product_stock.size product_stock.mrp product_stock.price"},
                select:["product_name", "product_brand", "product_barcode", "product_inventory_id", "product_min_order_quantity", "product_max_order_quantity", "product_photos" , "hidden", "deleted", "out_of_stock"  ], 
                strictPopulate: false })
            .select("cart")

        return apiSucessResponce(res, "Removed Sucessfully" , {data1: userCart.cart , data2 : newCartProducts}  )
    } catch (error) {
        console.log("error in removeCart controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}


export const fetchCart = async(req , res)=>{
    try {

        const user = req.body.user

        const cart = await User.findOne(user?._id)
            .populate({ path: ["cart.product_id"],
                populate: {path: 'product_brand product_inventory_id' , select: "Brand_name product_stock.batch_no product_stock.manufacture_date product_stock.expire_date product_stock.stock product_stock.size product_stock.mrp product_stock.price"},
                select:["product_name", "product_brand", "product_barcode", "product_inventory_id", "product_min_order_quantity", "product_max_order_quantity", "product_photos" , "hidden", "deleted", "out_of_stock"  ], 
                strictPopulate: false })
            .select("cart")

        return apiSucessResponce(res , "Fetched successfully" , cart )

    } catch (error) {
        console.log("fetchCart controller error :", error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}


export const alterProductCart = async(req , res)=>{
    try {
        const usr = req.body.user
        const data = req.body.data
        if(!data){return apiErrorResponce(res, "Invalid Crdentials")}

        const {product_barcode , quantity} = data
        if(!product_barcode){return apiErrorResponce(res , "Invalid Credentials")}

        const product_details = await Product.findOne({product_barcode, deleted: false, hidden: false, out_of_stock: false})
        if(!product_details){return apiErrorResponce(res , "Product Currently Unavailable")}

        if (!usr.cart?.length){return apiErrorResponce(res , "Product Not Found" , null , 400)}

        const cartProducts = usr.cart

        let changeProducts = true
        const newCartProducts =  cartProducts.map(product =>{
            if(product.product_id.toString() == product_details._id.toString()){
                changeProducts = false
                return {product_id : product.product_id , quantity : quantity ? quantity : product.quantity }
            } 
            else {return {product_id : product.product_id , quantity : product.quantity}}
        })
        if(changeProducts){ newCartProducts.push({product_id: product_details._id, quantity: quantity ? quantity : 1 })}

        const userCart = await User.findOneAndUpdate({_id : usr._id},{cart: newCartProducts} , {returnDocument: 'after'})
            .populate({ path: ["cart.product_id"],
                populate: {path: 'product_brand product_inventory_id' , select: "Brand_name product_stock.stock product_stock.size product_stock.mrp product_stock.price"},
                select:["product_name", "product_brand", "product_barcode", "product_inventory_id", "product_min_order_quantity", "product_max_order_quantity", "product_photos" , "hidden", "deleted", "out_of_stock"  ], 
                strictPopulate: false })
            .select("cart")

        return apiSucessResponce(res , "Added successfully" ,  {data1: userCart.cart , data2 : newCartProducts} )

    } catch (error) {
        console.log("addCart controller error :", error)
        return apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}
