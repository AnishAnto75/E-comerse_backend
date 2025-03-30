import User from "../../models/UserModel.js"
import Order from "../../models/OrderModel.js"
import Product from '../../models/ProductModel.js'
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import {generateRandom12DigitNumber} from '../../utils/generateRandomNumber.js'

export const createOrder = async(req , res)=>{
    try {
        const data = req.body.data
        if(!data){return apiErrorResponce(res, "Invalid Credentials")}

        const user_id = req.body.user._id
        const { total_mrp, total_price, delivery_charges, total_amount, payment_method, delivery_address, product_details, total_no_of_product } = data

        if( !total_mrp || !total_price || !delivery_charges || !total_amount || !payment_method || !delivery_address  || !product_details || typeof(product_details) !== 'object' || !product_details.length || !total_no_of_product ){ return apiErrorResponce(res , "Invalid Credentials")}

        const {name, phoneNo, alternatePhoneNo, pincode, houseNo, landMark, city, district, state, addressType} = delivery_address

        if(!name || !phoneNo || !pincode || !city || !district || !state){return apiErrorResponce(res , "Invalid Credentials")}

        const product_b_s = product_details?.map((product)=> product.product_barcode)
        let products = await Product.find({product_barcode: product_b_s , deleted: false, hidden: false}).select(['product_stock', 'product_barcode', 'product_min_order_quantity', "product_max_order_quantity"])
        if(products.length !== product_b_s.length){return apiErrorResponce(res, "Product May be Out Of Stock")}

        let valid = []
        products.forEach((product, index) => {
            const inpProd = product_details.filter(p => p.product_barcode === product.product_barcode)[0]
            let val = true
            if(product.product_min_order_quantity > inpProd.no_of_product || product.product_max_order_quantity < inpProd.no_of_product){
                return}
            product.product_stock.forEach((prod, index)=>{
                if(!val){return}
                if( !prod.hidden && prod.mrp == inpProd.product_mrp && prod.price == inpProd.product_price && prod.batch_no == inpProd.product_batch_no && prod.stock >= inpProd.no_of_product){
                    valid.push(true)
                    val = false
                }
                // console.log({index, prod, inpProd})
            })
        });
        if(valid.length !== product_b_s.length){return apiErrorResponce(res, "Product May be Out Of Stock")}

        const orderData = {
            order_id: `ORD${generateRandom12DigitNumber()}`,
            user_id,
            total_mrp,
            total_price,
            delivery_charges,
            total_amount,
            payment_method,
            delivery_address : { name, phoneNo, alternatePhoneNo, pincode, houseNo, landMark, city, district, state, addressType },
            order_status: {
                placed:{ status: true, date: new Date()},
            },
            product_details,
            total_no_of_product,
        }

        const newOrder = new Order(orderData)
        await newOrder.save()
        console.log(newOrder)

        const user = await User.findOne({_id : user_id})
        user.order_id.push(newOrder._id) 
        user.cart = []
        await user.save()

        product_details?.forEach(async( inpProd, index ) => {
            const product = await Product.findOne({product_barcode: inpProd.product_barcode})
            product.product_total_stock = Number(product.product_total_stock) - Number(inpProd.no_of_product)
            product.product_total_unit_sold = Number(product.product_total_unit_sold) + Number(inpProd.no_of_product)
            product.product_stock.map( (prod, index1) => {
                if( !prod.hidden && prod.mrp == inpProd.product_mrp && prod.price == inpProd.product_price && prod.batch_no == inpProd.product_batch_no && prod.stock >= inpProd.no_of_product){
                    if(Number(prod.stock) == Number(inpProd.no_of_product)){
                        prod.hidden = true
                    }
                    console.log(index, index1, Number(prod.stock) , Number(inpProd.no_of_product), prod.hidden)
                    prod.stock = Number(prod.stock) - Number(inpProd.no_of_product)
                    return prod
                } else {return prod}
            })
            await product.save()
        })
        return apiSucessResponce(res, "Order Placed Sucessfully", newOrder, 201 )
    } catch (error){
        console.log("error in createOrder controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}

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