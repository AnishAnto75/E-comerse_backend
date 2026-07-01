import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    name : { type : String, required : true },
    phoneNo : { type : Number, required : true},
    alternatePhoneNo : { type : Number, default: null},
    pincode : { type : String, required : true },
    houseNo : {type : String, default: null},
    landMark :{type : String, default: null},
    city :{type : String, required : true},
    district : {type : String, required : true},
    state : { type : String, required : true},
    addressType : { type : String, enum : ['home' , 'work'], default: 'home'}
})

const cartSchema = new mongoose.Schema({
    product_id : { type : mongoose.SchemaTypes.ObjectId, ref: 'Product', required: true},
    quantity: {type: Number, required: true, min: [1, "Quantity can't be negative"], validate: Number.isInteger}
},{ _id: false })

const userSchema = new mongoose.Schema({
    user_id :{ type: String, immutable: true, unique: true, required: true},
    user_type :{ type: String, enum: ['user', 'admin'], default: 'user'},
    email : { type: String, immutable: true, unique: true, required: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, "Invalid email"]},
    password : {type: String, required: true},
    name: {type: String, required: true, trim: true, minlength: 2, maxlength: 50},
    gender : {type: String, enum: ['male', 'female', 'other'], required: true },
    DOB : {type: Date, default: null },
    phoneNumber :{type: String, default: null},
    address: {
        type: [addressSchema],
        default: []
    },
    cart: {
        type: [cartSchema],
        default: []
    },
    notificationPreferences: {
        email: { type: Boolean, default: true},
        whatsapp: { type: Boolean, default: true},
        sms: { type: Boolean, default: true},
        push: { type: Boolean, default: true}
    },
    order_id : [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Order'}],
    status: { type: String, enum : ['active', 'inactive', 'blocked'], default: "active" },
    blocked_reason :{type: String, default: null},
    ratings : { type : Number, enum : [1 , 2 , 3 , 4 , 5], default: 1 },
    deleted : {type: Boolean, default: false},
    deletedAt: { type: Date, default: null }
},{
    timestamps : true,
    versionKey: false
})

const User = mongoose.model("User" , userSchema)
export default User