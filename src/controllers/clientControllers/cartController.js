import Product from "../../models/ProductModel.js"
import User from "../../models/UserModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import mongoose from "mongoose";
import Cart from "../../models/CartModel.js";
import ProductInventory from "../../models/ProductInventoryModel.js";

export const addToCart = async (req, res) => {

    try {

        const userId = req.user._id;
        const { product_id, quantity = 1 } = req.body;

        if (!mongoose.Types.ObjectId.isValid(product_id)) { return apiErrorResponce(res, "Invalid Product") }
        if (!Number.isInteger(quantity) || quantity < 1) { return apiErrorResponce(res, "Invalid Quantity") }

        const product = await Product.findOne({_id: product_id, deleted: false, status: "active", out_of_stock: false })
        if (!product) { return apiErrorResponce(res, "Product not found") }

        const inventory = await ProductInventory.findOne({ product_id })
        if (!inventory || inventory.product_total_stock <= 0 ) { return apiErrorResponce(res, "Insufficient stock") }

        let cart = await Cart.findOne({ user_id: userId })

        if (!cart) { cart = await Cart.create({ user_id: userId, products: [] }) }

        const existingProduct = cart.products.find( item => item.product_id.toString() === product_id);

        let updatedQuantity = 0

        if (existingProduct) {

            let newQuantity = existingProduct.quantity + quantity;

            newQuantity = Math.max( product.product_min_order_quantity, newQuantity );
            newQuantity = Math.min(product.product_max_order_quantity, newQuantity);
            newQuantity = Math.min(inventory.product_total_stock, newQuantity);

            existingProduct.quantity = newQuantity;
            updatedQuantity = newQuantity;

        } else {

            let newQuantity = quantity;
            
            newQuantity = Math.max( product.product_min_order_quantity, newQuantity );
            newQuantity = Math.min(product.product_max_order_quantity, newQuantity);
            newQuantity = Math.min(inventory.product_total_stock, newQuantity);

            cart.products.push({ product_id, quantity : newQuantity });
            updatedQuantity = newQuantity;
        }

        await cart.save();

        return apiSucessResponce(res, "Product added to cart" , { product_id, updated_quantity: updatedQuantity , cartCount: cart.products.length });

    } catch (error) {
        console.log("Error in addToCart:", error);
        return apiErrorResponce(res, "Internal Server Error");
    } 
};

export const fetchCart = async(req , res)=>{
    try {

        const cart = await Cart.findOne( { user_id: req.user._id }, { products: 1 } )
        if (!cart) { return apiSucessResponce(res, "Success", { cartCount: 0, products: [] }) }

        return apiSucessResponce(res, "Success", { cartCount: cart.products.length, products: cart.products });

    } catch (error) {
        console.log("fetchCart controller error :", error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}

export const fetchFullCart = async(req , res)=>{
    try {

        const cart = await Cart.findOne( { user_id: req.user._id }, { products: 1 } )
        if (!cart) { return apiSucessResponce(res, "Success", { cartCount: 0, products: [] }) }

        return apiSucessResponce(res, "Success", { cartCount: cart.products.length, products: cart.products });

    } catch (error) {
        console.log("fetchCart controller error :", error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
}














// old code

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
