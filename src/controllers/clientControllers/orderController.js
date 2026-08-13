import User from "../../models/UserModel.js"
import Order from "../../models/OrderModel.js"
import Product from '../../models/ProductModel.js'
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import {generateRandom12DigitNumber} from '../../utils/generateRandomNumber.js'
import ProductInventory from "../../models/ProductInventoryModel.js"
import mongoose from "mongoose"
import OrderIncome from "../../models/OrderIncomeModel.js"
import Transaction from "../../models/TransactionModel.js"
import Cart from "../../models/CartModel.js"
import AddressModel from "../../models/AddressModel.js"

export const createOrder = async(req , res)=>{
    
    const session = await mongoose.startSession();

    const FREE_DELIVERY_LIMIT = 500
    const DELIVERY_CHARGE = 40;

    try {
        const userId = req.user._id;
        const { address_id, payment_method } = req.body;

        if (!address_id) return apiErrorResponce(res, "Select a delivery address.");
        if (!payment_method) return apiErrorResponce(res, "Select payment method.");

        if (![ "COD", "UPI", "Card", "Net Banking"].includes(payment_method)) { return apiErrorResponce(res, "Invalid payment method.");}

        session.startTransaction();

        const cart = await Cart.findOne({ user_id: userId }).session(session)
        if (!cart || cart.products.length === 0) { await session.abortTransaction(); return apiErrorResponce(res, "Cart is empty.")}

        const address = await AddressModel.findOne({ _id: address_id, user_id: userId }).lean()
        if (!address) { await session.abortTransaction(); return apiErrorResponce(res, "Address not found.");}

        let totalMRP = 0;
        let totalSellingPrice = 0;
        let totalGST = 0;
        let totalQuantity = 0;

        const orderItems = [];

        for (const cartItem of cart.products) {

            const product = await Product.findOne({_id : cartItem.product_id , deleted : false , status: "active", out_of_stock: false})
            .select("deleted status product_name product_barcode product_UOM product_photo product_min_order_quantity product_max_order_quantity current_stock")
            .session(session)
            if (!product) {throw new Error(`Product not found.`) }
            
            if(product.product_min_order_quantity > cartItem.quantity ) {throw new Error(`${product.product_name} min order quantity is ${product.product_min_order_quantity}.`) }
            if(product.product_max_order_quantity < cartItem.quantity ) {throw new Error(`${product.product_name} max order quantity is ${product.product_max_order_quantity}.`) }

            const inventory = await ProductInventory.findOne({ product_id: product._id }).select("product_stock product_total_stock").session(session);
            if (!inventory) throw new Error( `${product.product_name} inventory missing.`)

            if ( inventory.product_stock.length === 0) throw new Error( `${product.product_name} is out of stock.`);

            const stock = inventory.product_stock[0]
            if (stock.stock < cartItem.quantity) { throw new Error( `${product.product_name} have only limited stock.`)}

            const subtotal = stock.selling_price * cartItem.quantity
            const gstAmount = subtotal * stock.gst_percentage / 100

            orderItems.push({
                product_id: product._id,
                inventory_batch_id: stock._id,
                product_barcode: product.product_barcode,
                product_name: product.product_name,
                product_UOM: product.product_UOM,
                product_photo: product.product_photo.url,
                batch_no: stock.batch_no,
                size: stock.size,
                manufacture_date: stock.manufacture_date,
                expiry_date: stock.expiry_date,
                mrp: stock.mrp,
                unit_price: stock.selling_price,
                subtotal, 
                gst_percentage: stock.gst_percentage,
                quantity: cartItem.quantity
            });

            totalMRP += stock.mrp * cartItem.quantity;
            totalSellingPrice += subtotal;
            totalGST += gstAmount;
            totalQuantity += cartItem.quantity;

            if( stock.stock === cartItem.quantity ){ inventory.product_stock.splice(0, 1)} 
            else { stock.stock -= cartItem.quantity }

            inventory.product_total_stock -= cartItem.quantity;
            await inventory.save({ session });
            
            product.current_stock = inventory.product_total_stock
            await product.save({ session });
        }

        const deliveryCharges = totalSellingPrice < FREE_DELIVERY_LIMIT ? DELIVERY_CHARGE : 0

        const totalAmount = totalSellingPrice + deliveryCharges

        const [order] = await Order.create([{
            order_id: `ORD${generateRandom12DigitNumber()}`,
            user_id: userId,
            total_mrp: totalMRP,
            total_price: totalSellingPrice,
            delivery_charges: deliveryCharges,
            total_amount: totalAmount,
            total_gst: totalGST,
            total_quantity: totalQuantity,
            delivery_address: {
                name : address.name,
                phone_number: address.phone_number,
                alternate_phone_number: address.alternate_phone_number,
                house_no: address.house_no,
                area: address.area,
                landmark: address.landmark,
                city: address.city,
                district: address.district,
                state: address.state,
                pincode: address.pincode,
                address_type: address.address_type
            },
            items: orderItems,
            payment: { 
                method: payment_method,
                status: payment_method === "UPI" || payment_method === "Card" || payment_method === "Net Banking"  ? "Paid": "Pending",
            }
        }], { session });

        cart.products = [];
        await cart.save({session})

        // Saving Transaction of the order
        if(!payment_method == "COD"){
            const transactionData = {
                type: "income",
                category: "Sales",
                title: `Income Order ${order.order_id}`,
                amount: order.total_amount,
                payment_method: order.payment_method,
                reference_no: order.order_id,
                order_id: order._id
            }
            const transaction = new Transaction(transactionData);
            await transaction.save({ session });
        }

        await session.commitTransaction();
        return apiSucessResponce(res, "Order Placed Successfully", { order_id: order.order_id, total_amount: order.total_amount, payment_status: order.payment.status }, 201 )
       
    } catch (error){
        await session.abortTransaction();
        console.log("error in createOrder controller : " ,error)
        return apiErrorResponce(res , "internal server error" , error.message || "Unable to place order." , 500)
    } finally {
        await session.endSession();
    }
}

export const getAllOrder = async(req , res)=>{
    try {
        const user = req.user
        const order = await Order.find({user_id : user._id})
        return apiSucessResponce(res , "Order Fetched Successfully" , order )
    } catch (error) {
        console.log("error in getAllOrder controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}






//  old code

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


// import User from "../../models/UserModel.js"
// import Order from "../../models/OrderModel.js"
// import Product from '../../models/ProductModel.js'
// import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
// import {generateRandom12DigitNumber} from '../../utils/generateRandomNumber.js'
// import ProductInventory from "../../models/ProductInventoryModel.js"
// import mongoose from "mongoose"
// import OrderIncome from "../../models/OrderIncomeModel.js"
// import Transaction from "../../models/TransactionModel.js"

// export const createOrder = async(req , res)=>{
    
//     const data = req.body.data
//     if(!data){return apiErrorResponce(res, "Invalid Credentials")}
    
//     const user_id = req.body.user._id
    
//     const { total_mrp, total_price, delivery_charges, total_amount, payment_method, delivery_address, product_details, total_no_of_product } = data
//     if( !total_mrp || !total_price || !delivery_charges || !total_amount || !payment_method || !delivery_address || !product_details || !total_no_of_product ){ return apiErrorResponce(res , "Invalid Credentials")}
    
//     const {name, phoneNo, alternatePhoneNo, pincode, houseNo, landMark, city, district, state, addressType} = delivery_address
//     if(!name || !phoneNo || !pincode || !city || !district || !state){return apiErrorResponce(res , "Invalid Credentials")}
    
//     const session = await mongoose.startSession();

//     try {
//         session.startTransaction();
    
//         // validating duplicate barcode and Existing Product 
//         const product_barcodes = product_details?.map((product)=> product.product_barcode)
//         let products = await Product.find({product_barcode : product_barcodes , deleted: false, status: "active", out_of_stock: false})
//             .populate({ path: ["product_inventory_id"], strictPopulate: false })
//             .session(session)

//         if(products.length !== product_barcodes.length){return 
//             throw new Error("Product unavailable")
//         }

//         const orderData = {
//             order_id: `ORD${generateRandom12DigitNumber()}`,
//             user_id,
//             total_mrp,
//             total_price,
//             delivery_charges,
//             total_amount,
//             payment_method,
//             total_no_of_product,
//             delivery_address : { name, phoneNo, alternatePhoneNo, pincode, houseNo, landMark, city, district, state, addressType },
//             product_details,
//             order_status: {
//                 placed:{ status: true, date: new Date()},
//             }
//         }

//         const [newOrder] = await Order.create([orderData],{ session });

//         // adding order id to user
//         const user = await User.findOne({_id : user_id}).session(session)
//         user.order_id.push(newOrder._id)
//         user.cart = []
//         await user.save({ session })

//         let purchase_amount = 0

//         // adjusting the product Inventory
//         for (const inpProd of product_details) {
//             const productInventory = await ProductInventory.findOne({product_barcode: inpProd.product_barcode}).session(session)
//             if (!productInventory) continue;

//             if (productInventory.product_stock[0].stock < inpProd.no_of_product || productInventory.product_stock.length === 0) {throw new Error("Product Went Out Of Stock");}

//             productInventory.product_total_stock -= inpProd.no_of_product

//             if(Number(productInventory.product_stock[0].stock) == Number(inpProd.no_of_product) ){
//                 purchase_amount += productInventory.product_stock[0].purchase_cost * inpProd.no_of_product
//                 productInventory.product_stock.splice(0, 1)
//             } 
//             else if(Number(productInventory.product_stock[0].stock) > Number(inpProd.no_of_product)){
//                 purchase_amount += productInventory.product_stock[0].purchase_cost * inpProd.no_of_product
//                 productInventory.product_stock[0].stock = Number(productInventory.product_stock[0].stock) -  Number(inpProd.no_of_product)
//             } 
//             await productInventory.save({ session })
//         }

//         // Saving The Profit for the order
//         const orderIncomeData = {
//             order_id : newOrder._id ,
//             purchase_amount ,             
//             sale_amount: total_amount
//         }
//         await OrderIncome.create([orderIncomeData],{ session });
        
//         // Saving Transaction of the order
//         const transactionData = {
//             type: "income",
//             category: "Sales",
//             title: `Income Order ${newOrder.order_id}`,
//             amount: newOrder.total_amount,
//             payment_method: newOrder.payment_method,
//             reference_no: newOrder.order_id,
//             order_id: newOrder._id
//         }
//         const transaction = new Transaction(transactionData);
//         await transaction.save({ session });

//         await session.commitTransaction();
//         return apiSucessResponce(res, "Order Placed Successfully", newOrder, 201 )
       
//     } catch (error){
//         await session.abortTransaction();
//         console.log("error in createOrder controller : " ,error)
//         return apiErrorResponce(res , "internal server error" , null , 500)
//     } finally {
//         await session.endSession();
//     }
// }

// export const getOrder = async(req , res)=>{
//     try {
//         const user_id = req.body.user._id
//         const {id} = req.params
//         const order = await Order.findOne({user_id , order_id : id})

//         if(!order) {return apiErrorResponce(res , "No Order Found" )}

//         return apiSucessResponce(res , "Order Fetched Sucessfully" , order )
//     } catch (error) {
//         console.log("error in getOrder controller : " ,error)
//         return apiErrorResponce(res , "internal server error" , null , 500)
//     }
// }

// export const getAllOrder = async(req , res)=>{
//     try {
//         const user = req.body.user
//         const order = await Order.find({user_id : user._id})
//         return apiSucessResponce(res , "Order Fetched Sucessfully" , order )
//     } catch (error) {
//         console.log("error in getOrder controller : " ,error)
//         return apiErrorResponce(res , "internal server error" , null , 500)
//     }
// }

// export const cancelOrder = async(req , res)=>{
//     try {
//         const {id} = req.params
        
//         const reason_for_cancel = req.body.data?.reason_for_cancel
//         if(!reason_for_cancel){return apiErrorResponce(res, "Invalid Credentials")}
        
//         const order = await Order.findOne({order_id : id})
//         if(!order){ return apiErrorResponce(res, "Order Not Found", null, 404) }        
        
//         if(order.order_status.delivered.status){return apiErrorResponce(res, "Can't cancel the because the order is already delivered")}
//         if(order.order_status.canceled.status){return apiErrorResponce(res, "Order Is Already Canceled")}

//         order.order_status.canceled.status = true
//         order.order_status.canceled.date = new Date()
//         order.order_status.canceled.canceled_by = 'customer'
//         order.order_status.canceled.reason_for_cancel = reason_for_cancel
//         await order.save()

//         return apiSucessResponce(res , "Order Canceled", order.order_status )

//     } catch (error) {
//         console.log("error in cancelOrder controller : " ,error)
//         return apiErrorResponce(res , "internal server error" , null , 500)
//     }
// }

// export const returnOrder = async(req , res)=>{
//     try {
//         const {id} = req.params

//         const reason_for_return = req.body.data?.reason_for_return
//         if(!reason_for_return){return apiErrorResponce(res, "Invalid Credentials")}

//         const order = await Order.findOne({order_id : id})
//         if(!order){ return apiErrorResponce(res, "Order Not Found", null, 404) }        

//         if(order.order_status.canceled.status){return apiErrorResponce(res, "The order is already canceled")}
//         if(!order.order_status.delivered.status){return apiErrorResponce(res, "Can't return because the order is not yet to be delivered")}
//         if(order.order_status.returned.status){return apiErrorResponce(res, "Order Is Already Returned")}
//         if(order.order_status.return_requested.status){return apiErrorResponce(res, "Order already requested for return")}

//         order.order_status.return_requested.status = true
//         order.order_status.return_requested.date = new Date()
//         order.order_status.return_requested.reason_for_return = reason_for_return
//         await order.save()

//         return apiSucessResponce(res , "Order requested for return", order.order_status )

//     } catch (error) {
//         console.log("error in updateOrderStatusToReturned controller : " ,error)
//         return apiErrorResponce(res , "internal server error" , null , 500)
//     }
// }