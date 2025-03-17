import mongoose from "mongoose";

const orderSchema = mongoose.Schema({
    order_id : { type : String, unique: true, required : true },
    user_id : { type : mongoose.SchemaTypes.ObjectId, ref : 'User', required : true },
    total_mrp:{ type : Number, required : true },
    total_price:{ type : Number, required : true },
    delivery_charges : { type : Number, required : true },
    total_amount : {type : Number, required : true},
    payment_method : {type : String, enum : ["Cash On Delivery" , "UPI"], required : true},
    delivery_address :{
        name : { type : String, required : true },
        phoneNo : {type : Number, required : true},
        alternatePhoneNo : { type : Number, default: null },
        pincode : { type : Number, required : true},
        houseNo : { type : String, default: null},
        landMark :{type : String, default: null},
        city :{type : String, required : true},
        district : {type : String, required : true},
        state : {type : String, required : true},
        addressType : {type : String, enum : ['home' , 'office'],}
    },
    order_status: {
        placed:{
            status: {type : Boolean, default : true},
            date: { type : Date, immutable: true, default: Date.now }
        },
        confirmed:{
            status: {type : Boolean, default : false},
            date: { type : Date},
            confirmation_by : { type : mongoose.SchemaTypes.ObjectId, ref : 'Staff'}
        },
        out:{
            status: {type : Boolean, default : false},
            date: { type : Date },
            taken_by: { type : mongoose.SchemaTypes.ObjectId, ref : 'Staff'},
            confirmation_by: { type : mongoose.SchemaTypes.ObjectId, ref : 'Staff'}
        },
        delivered: {
            status: {type : Boolean, default : false},
            date: { type : Date},
            delivered_by: { type : mongoose.SchemaTypes.ObjectId, ref : 'Staff'}
        },
        canceled: {
            status: {type : Boolean, default : false},
            date: {type : Date},
            canceled_by: {type: String, enum: ["customer", "staff"]},
            canceled_staff_id: {type: mongoose.SchemaTypes.ObjectId, ref: 'Staff'},
            reason_for_cancel: {type: String}
        }
    },
    product_details :[{
        product_id: {type : String, required : true},
        product_barcode: {type : String, required : true},
        product_batch_no: {type : String, required : true},
        product_name: {type : String, required : true } ,
        product_mrp: {type : Number, required : true },
        product_price: { type : Number, required : true },
        product_manufacture_date: { type : Date, required : true },
        product_expire_date: { type : Date, required : true },
        no_of_product: {type: Number, required : true },
    }],
    total_no_of_product : {type : Number , required : true} ,
    order_rating : { type : Number, enum : [1 , 2 , 3 , 4 , 5] },
    order_review:{ type : String }
},{
    timestamps : true
})

const Order = mongoose.model('Order' , orderSchema )
export default Order

//Backup
// import mongoose from "mongoose";

// const orderSchema = mongoose.Schema({
//     order_id : { type : String, unique: true, required : true },
//     user_id : { type : mongoose.SchemaTypes.ObjectId, ref : 'User', required : true },
//     total_mrp:{ type : Number, required : true },
//     total_price:{ type : Number, required : true },
//     delivery_charges : { type : Number, required : true },
//     total_amount : {type : Number, required : true},
//     payment_method : {type : String, enum : ["Cash On Delivery" , "UPI"], required : true},
//     delivery_address :{
//         name : { type : String, required : true },
//         phoneNo : {type : Number, required : true},
//         alternatePhoneNo : { type : Number, default: null },
//         pincode : { type : Number, required : true},
//         houseNo : { type : String, default: null},
//         landMark :{type : String, default: null},
//         city :{type : String, required : true},
//         district : {type : String, required : true},
//         state : {type : String, required : true},
//         addressType : {type : String, enum : ['home' , 'office'],}
//     },
//     order_status: {
//         placed:{
//             status: {type : Boolean, default : true},
//             date: { type : Date, immutable: true, default: Date.now }
//         },
//         confirmed:{
//             status: {type : Boolean, default : false},
//             date: { type : Date},
//             confirmation_by : { type : mongoose.SchemaTypes.ObjectId, ref : 'Staff'}
//         },
//         out:{
//             status: {type : Boolean, default : false},
//             date: { type : Date },
//             taken_by: { type : mongoose.SchemaTypes.ObjectId, ref : 'Staff'},
//             confirmation_by: { type : mongoose.SchemaTypes.ObjectId, ref : 'Staff'}
//         },
//         delivered: {
//             status: {type : Boolean, default : false},
//             date: { type : Date},
//             delivered_by: { type : mongoose.SchemaTypes.ObjectId, ref : 'Staff'}
//         },
//         canceled: {
//             status: {type : Boolean, default : false},
//             date: {type : Date},
//             canceled_by: {type: String, enum: ["customer", "staff"]},
//             canceled_staff_id: {type: mongoose.SchemaTypes.ObjectId, ref: 'Staff'},
//             reason_for_cancel: {type: String}
//         },
//         return_requested :{
//             status: {type : Boolean, default : false},
//             date: { type: Date},
//             reason_for_return : {type : String},
//             rejected: {type: Boolean, default : false},
//             handled_by: {type: mongoose.SchemaTypes.ObjectId, ref : 'Staff'}
//         },
//         returned :{
//             status: {type: Boolean, default : false},
//             date: {type: Date },
//             pickeup_by: {type: mongoose.SchemaTypes.ObjectId, ref : 'Staff'},
//             rejected: {type: Boolean, default: false},
//             rejected_by: {type: String, enum:['customer', 'staff']},
//             rejected_staff_id: {type: mongoose.SchemaTypes.ObjectId, ref : 'Staff'},
//             reason_for_rejection: {type: String}
//         },
//         refund :{
//             status: {type: Boolean, default : false},
//             date: {type: Date },
//             refund_by: {type: mongoose.SchemaTypes.ObjectId, ref : 'Staff'},
//             refund_amount : {type: Number}
//         },
//     },
//     product_details :[{
//         product_id: {type : String, required : true},
//         product_barcode: {type : String, required : true},
//         product_batch_no: {type : String, required : true},
//         product_name: {type : String, required : true } ,
//         product_mrp: {type : Number, required : true },
//         product_price: { type : Number, required : true },
//         product_manufacture_date: { type : Date, required : true },
//         product_expire_date: { type : Date, required : true },
//         no_of_product: {type: Number, required : true },
//     }],
//     total_no_of_product : {type : Number , required : true} ,
//     order_rating : { type : Number, enum : [1 , 2 , 3 , 4 , 5] },
//     order_review:{ type : String }
// },{
//     timestamps : true
// })

// const Order = mongoose.model('Order' , orderSchema )

// export default Order

