import mongoose from "mongoose";

const addressSchema = mongoose.Schema({
    houseNo : {type: String, default: null},
    street : {type: String, default: null},
    landmark : {type: String, default: null},
    city: {type: String, default: null},
    pincode: {type: Number, default: null},
    district: {type: String, default: null},
    state: {type: String, default: null},
})

const staffSchema = mongoose.Schema({
    staff_id: {type: String, required: true},
    name: {type: String, required: true},
    email: {type: String, unique: true, required: true},
    gender: {type: String, enum: ["male", "female", "other"], default: null},
    password: {type: String, required: true},
    role: { type: String, enum: ["delivery", "staff", "sales_manager", "inventory_manager", "order_manager", "general_manager", "admin" ], message: '{VALUE} is not supported', required : true},
    salary: {type: Number, default: 0},
    emergency_contact_name: {type: String, default: null},
    emergency_contact_number: {type: String, default: null},
    DOB: {type: Date, default: null},
    photo: {type: String, default:null},
    phone_number: {type: String, required: true},
    alternate_phone_number: {type: String, default: null},
    qualification: {type: String, default: null},
    pancard_number: {type: String, default: null},
    aadhar_number: {type: String, default: null},
    bank_details: {
        account_number: {type: String, default: null},
        bank_name: {type: String, default: null},
        ifsc_code: {type: String, default: null},
        account_holder_name: {type: String, default: null},
    },
    addresses: addressSchema ,
    status: {type: String, enum: [ "active" , "inactive" ], default: "active"},
    deleted: {type: Boolean, default: false},
    joining_date: {type: Date, default: Date.now},
    last_login: {type: Date, default: null},
},{
    timestamps : true ,
})

const Staff = mongoose.model("Staff" , staffSchema)

export default Staff