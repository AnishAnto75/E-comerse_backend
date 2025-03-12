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
                console.log(1, index)
                return}
            product.product_stock.forEach((prod, index)=>{
                if(!val){return}
                if( !prod.hidden && prod.mrp == inpProd.product_mrp && prod.price == inpProd.product_price && prod.batch_no == inpProd.product_batch_no && prod.stock >= inpProd.no_of_product){
                    valid.push(true)
                    val = false
                    // console.log(2,index)
                }
                // console.log({index, prod, inpProd})
            })
        });
        console.log({valid})
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
    const {id} = req.params
    try {
        const user = req.body.user
        const _id = req.body.user._id

        // validating user author
        let valid = false
        user.order_id.map((order)=>{ if(order._id.toString() == id){ return valid = true } })
        if(!valid){ return apiErrorResponce(res , "unauthorised user") }        

        const order = await Order.findOne({_id : id})
        if(!order){ return apiErrorResponce(res, "Order Not Found") }

        const preStatus = order.order_status[order.order_status.length-1].status

        const validStatus = preStatus == "delivered" ? false : preStatus == "canceled" ? false : preStatus == "return" ? false : preStatus == "returned" ? false : true
        if(!validStatus){return apiErrorResponce(res, "Cannot Cancel the Order ")}

        const order_status = {
            status : 'canceled',
            date : new Date(),
            updated_staff_id : _id
        }

        order.order_status.push(order_status)
        await order.save()

        return apiSucessResponce(res , "Order Canceled Sucessfully", order )

    } catch (error) {
        console.log("error in cancelOrder controller : " ,error)
        return apiErrorResponce(res , "internal server error" , null , 500)
    }
}
