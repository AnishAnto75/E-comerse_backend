import User from "../../models/UserModel.js"
import Order from "../../models/OrderModel.js"
import Product from '../../models/ProductModel.js'
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import {generateRandom12DigitNumber} from '../../utils/generateRandomNumber.js'
import ProductInventory from "../../models/ProductInventoryModel.js"
import mongoose from "mongoose"
import OrderIncome from "../../models/OrderIncomeModel.js"

export const createOrder = async(req , res)=>{
    
    const data = req.body.data
    if(!data){return apiErrorResponce(res, "Invalid Credentials")}
    
    const user_id = req.body.user._id
    
    const { total_mrp, total_price, delivery_charges, total_amount, payment_method, delivery_address, product_details, total_no_of_product } = data
    if( !total_mrp || !total_price || !delivery_charges || !total_amount || !payment_method || !delivery_address || !product_details || !total_no_of_product ){ return apiErrorResponce(res , "Invalid Credentials")}
    
    const {name, phoneNo, alternatePhoneNo, pincode, houseNo, landMark, city, district, state, addressType} = delivery_address
    if(!name || !phoneNo || !pincode || !city || !district || !state){return apiErrorResponce(res , "Invalid Credentials")}
    
    const session = await mongoose.startSession();

    try {
        session.startTransaction();
    
        // validating duplicate barcode and Existing Product 
        const product_barcodes = product_details?.map((product)=> product.product_barcode)
        let products = await Product.find({product_barcode : product_barcodes , deleted: false, hidden: false, out_of_stock: false})
            .populate({ path: ["product_inventory_id"], strictPopulate: false })
            .session(session)

        if(products.length !== product_barcodes.length){return 
            throw new Error("Product unavailable")
        }

        const orderData = {
            order_id: `ORD${generateRandom12DigitNumber()}`,
            user_id,
            total_mrp,
            total_price,
            delivery_charges,
            total_amount,
            payment_method,
            total_no_of_product,
            delivery_address : { name, phoneNo, alternatePhoneNo, pincode, houseNo, landMark, city, district, state, addressType },
            product_details,
            order_status: {
                placed:{ status: true, date: new Date()},
            }
        }

        const [newOrder] = await Order.create([orderData],{ session });

        // adding order id to user
        const user = await User.findOne({_id : user_id}).session(session)
        user.order_id.push(newOrder._id)
        user.cart = []
        await user.save({ session })

        let purchase_amount = 0

        // adjusting the product Inventory
        for (const inpProd of product_details) {
            const productInventory = await ProductInventory.findOne({product_barcode: inpProd.product_barcode}).session(session)
            if (!productInventory) continue;

            if (productInventory.product_stock[0].stock < inpProd.no_of_product || productInventory.product_stock.length === 0) {throw new Error("Product Went Out Of Stock");}

            productInventory.product_total_stock -= inpProd.no_of_product

            if(Number(productInventory.product_stock[0].stock) == Number(inpProd.no_of_product) ){
                purchase_amount += productInventory.product_stock[0].purchase_cost * inpProd.no_of_product
                productInventory.product_stock.splice(0, 1)
            } 
            else if(Number(productInventory.product_stock[0].stock) > Number(inpProd.no_of_product)){
                purchase_amount += productInventory.product_stock[0].purchase_cost * inpProd.no_of_product
                productInventory.product_stock[0].stock = Number(productInventory.product_stock[0].stock) -  Number(inpProd.no_of_product)
            } 
            await productInventory.save({ session })
        }

        // Saving The Profit for the order
        const orderIncomeData = {
            order_id : newOrder._id ,
            purchase_amount ,             
            sale_amount: total_amount
        }
        await OrderIncome.create([orderIncomeData],{ session });

        await session.commitTransaction();
        return apiSucessResponce(res, "Order Placed Successfully", newOrder, 201 )
       
    } catch (error){
        await session.abortTransaction();
        console.log("error in createOrder controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    } finally {
        await session.endSession();
    }
}

// export const createOrder = async(req , res)=>{
//     const session = await mongoose.startSession();
//     try {
//         session.startTransaction();
//         const data = req.body.data
//         if(!data){return apiErrorResponce(res, "Invalid Credentials")}

//         const user_id = req.body.user._id

//         const { total_mrp, total_price, delivery_charges, total_amount, payment_method, delivery_address, product_details, total_no_of_product } = data
//         if( !total_mrp || !total_price || !delivery_charges || !total_amount || !payment_method || !delivery_address || !product_details || !total_no_of_product ){ return apiErrorResponce(res , "Invalid Credentials")}

//         const {name, phoneNo, alternatePhoneNo, pincode, houseNo, landMark, city, district, state, addressType} = delivery_address
//         if(!name || !phoneNo || !pincode || !city || !district || !state){return apiErrorResponce(res , "Invalid Credentials")}

//         // validating duplicate barcode and Existing Product 
//         const product_barcodes = product_details?.map((product)=> product.product_barcode)
//         let products = await Product.find({product_barcode : product_barcodes , deleted: false, hidden: false, out_of_stock: false})
//         .populate({ path: ["product_inventory_id"], strictPopulate: false })
//         .session(session)

//         if(products.length !== product_barcodes.length){return apiErrorResponce(res, "Product unavailable")}

//         // validating inventory
//         const validInventory = []
//         await product_details?.map(( inpProd, index ) => {
//             const product = products.filter(product=> product.product_barcode === inpProd.product_barcode)
//             if(product){
//                 if(Number(product[0].product_inventory_id.product_stock[0].stock) < Number(inpProd.no_of_product)){ return } 
//                 else { validInventory.push("valid") }
//             }
//         })
//         if(products.length == validInventory.length){

//             const orderData = {
//                 order_id: `ORD${generateRandom12DigitNumber()}`,
//                 user_id,
//                 total_mrp,
//                 total_price,
//                 delivery_charges,
//                 total_amount,
//                 payment_method,
//                 total_no_of_product,
//                 delivery_address : { name, phoneNo, alternatePhoneNo, pincode, houseNo, landMark, city, district, state, addressType },
//                 product_details,
//                 order_status: {
//                     placed:{ status: true, date: new Date()},
//                 }
//             }

//             const newOrder = new Order(orderData)
//             await newOrder.save({ session })

//             // adding order id to user
//             try {
//                 const user = await User.findOne({_id : user_id})
//                 user.order_id.push(newOrder._id)
//                 user.cart = []
//                 await user.save({ session })
//             } catch (error) {
//                 console.log("error in createOrder controller (adding order id to user) : ", error  )
//                 await Order.findOneAndDelete({_id : newOrder._id})          // deleting the order due to error in saving the order id in user 
//                 throw new Error("internal server error");
//             }

//             let purchase_cost = 0
//             // adjusting the product Inventory
//             try {
//                 product_details?.forEach(async( inpProd, index ) => {
//                     const productInventory = await ProductInventory.findOne({product_barcode: inpProd.product_barcode})
//                     if(productInventory){
//                         productInventory.product_total_stock = Number(productInventory.product_total_stock) - Number(inpProd.no_of_product)
//                         if(Number(productInventory.product_stock[0].stock) == Number(inpProd.no_of_product) ){
//                             console.log(productInventory.product_stock[0].purchase_cost * inpProd.no_of_product)
//                             purchase_cost += productInventory.product_stock[0].purchase_cost * inpProd.no_of_product
//                             productInventory.product_stock.splice(0, 1)
//                         } 
//                         else if(Number(productInventory.product_stock[0].stock) > Number(inpProd.no_of_product)){
//                             console.log(productInventory.product_stock[0].purchase_cost * inpProd.no_of_product)
//                             purchase_cost += productInventory.product_stock[0].purchase_cost * inpProd.no_of_product
//                             productInventory.product_stock[0].stock = Number(productInventory.product_stock[0].stock) -  Number(inpProd.no_of_product)
//                         } 
//                         else {return}
//                         console.log(1)
//                         await productInventory.save()
//                     }
//                 })
//             } catch (error) {
//                 console.log("error in createOrder controller (adjusting the product Inventory) : ", error  )
//                 throw new Error("internal server error");
//             }

//             console.log({purchase_cost})
//             return apiSucessResponce(res, "Order Placed Successfully", newOrder, 201 )

//         } else{
//             console.log("returned For Low Quantity Stock")
//             return apiErrorResponce(res, "Product May Went Out Of Stock Kindly Re-Order")
//         }
//     } catch (error){
//         console.log("error in createOrder controller : " ,error)
//         return apiErrorResponce(res , "internal server error" , null , 500)
//     }
// }

export const getOrder = async(req , res)=>{
    try {
        const user_id = req.body.user._id
        const {id} = req.params
        const order = await Order.findOne({user_id , order_id : id})

        if(!order) {return apiErrorResponce(res , "No Order Found" )}

        return apiSucessResponce(res , "Order Fetched Sucessfully" , order )
    } catch (error) {
        console.log("error in getOrder controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}

export const getAllOrder = async(req , res)=>{
    try {
        const user = req.body.user
        const order = await Order.find({user_id : user._id})
        return apiSucessResponce(res , "Order Fetched Sucessfully" , order )
    } catch (error) {
        console.log("error in getOrder controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}

export const cancelOrder = async(req , res)=>{
    try {
        const {id} = req.params
        
        const reason_for_cancel = req.body.data?.reason_for_cancel
        if(!reason_for_cancel){return apiErrorResponce(res, "Invalid Credentials")}
        
        const order = await Order.findOne({order_id : id})
        if(!order){ return apiErrorResponce(res, "Order Not Found", null, 404) }        
        
        if(order.order_status.delivered.status){return apiErrorResponce(res, "Can't cancel the because the order is already delivered")}
        if(order.order_status.canceled.status){return apiErrorResponce(res, "Order Is Already Canceled")}

        order.order_status.canceled.status = true
        order.order_status.canceled.date = new Date()
        order.order_status.canceled.canceled_by = 'customer'
        order.order_status.canceled.reason_for_cancel = reason_for_cancel
        await order.save()

        return apiSucessResponce(res , "Order Canceled", order.order_status )

    } catch (error) {
        console.log("error in cancelOrder controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}

export const returnOrder = async(req , res)=>{
    try {
        const {id} = req.params

        const reason_for_return = req.body.data?.reason_for_return
        if(!reason_for_return){return apiErrorResponce(res, "Invalid Credentials")}

        const order = await Order.findOne({order_id : id})
        if(!order){ return apiErrorResponce(res, "Order Not Found", null, 404) }        

        if(order.order_status.canceled.status){return apiErrorResponce(res, "The order is already canceled")}
        if(!order.order_status.delivered.status){return apiErrorResponce(res, "Can't return because the order is not yet to be delivered")}
        if(order.order_status.returned.status){return apiErrorResponce(res, "Order Is Already Returned")}
        if(order.order_status.return_requested.status){return apiErrorResponce(res, "Order already requested for return")}

        order.order_status.return_requested.status = true
        order.order_status.return_requested.date = new Date()
        order.order_status.return_requested.reason_for_return = reason_for_return
        await order.save()

        return apiSucessResponce(res , "Order requested for return", order.order_status )

    } catch (error) {
        console.log("error in updateOrderStatusToReturned controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}