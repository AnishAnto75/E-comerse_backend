import mongoose from "mongoose";

const addressSchema = mongoose.Schema({
    name : { type : String, required : true },
    phoneNo : { type : Number, required : true},
    alternatePhoneNo : { type : Number, default: null},
    pincode : { type : Number, required : true },
    houseNo : {type : String, default: null},
    landMark :{type : String, default: null},
    city :{type : String, required : true},
    district : {type : String, required : true},
    state : { type : String, required : true},
    addressType : { type : String, enum : ['home' , 'work'], default: 'home'}
})

const cartSchema = mongoose.Schema({
    product_id : { type : mongoose.SchemaTypes.ObjectId, ref: 'Product', required: true},
    quantity : { type : Number, required: true}
})

const userSchema = mongoose.Schema({
    user_type :{ type: String, enum: ['user'], default: 'user'},
    email : { type: String, immutable: true, unique: true, required: true },
    password : {type: String, required: true},
    name : {type: String, required: true },
    gender : {type: String, enum: ['male', 'female', 'other'], required: true },
    DOB : {type: Date, default: null },
    phoneNumber :{type: Number, default: null},
    address :  [addressSchema],
    cart : [cartSchema],
    notificationPreferences: {
        email: { type: Boolean, default: true},
        whats_app: { type: Boolean, default: true},
        sms: { type: Boolean, default: true},
        push: { type: Boolean, default: true}
    },
    order_id : [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Order', required: true}],
    blocked : { type: Boolean, default: false},
    deleted : {type: Boolean, default: false},
},{
    timestamps : true,
})

const User = mongoose.model("User" , userSchema)
export default User