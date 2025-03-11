import mongoose from "mongoose";


const addressSchema = mongoose.Schema({
    houseNo : {type: String, default: null},
    city: {type: String, default: null},
    pincode: {type: Number, default: null},
    district: {type: String, default: null},
    address: {type: String, default: null}
})

const staffSchema = mongoose.Schema({
    staff_id: {type: String, required: true},
    staff_username: {type: String, required: true},
    staff_email: {type: String, unique: true, required: true},
    staff_password: {type: String, required: true},
    staff_type: {type: String, enum: [ "staff", "manager", "general_manager", "admin" ], message: '{VALUE} is not supported', required : true},
    staff_photo: {type: String, default:null},
    staff_phone_number: {type: Number, required: true},
    staff_alternate_phone_number: {type: Number, default: null},
    staff_qualification: {type: String, default: null},
    staff_pancard_number: {type: String, default: null},
    staff_aadhar_number: {type: String, default: null},
    staff_DOB: {type: Date, default: null},
    staff_account_number: {type: String, default: null},
    staff_addresses: addressSchema ,
    blocked: {type: Boolean, default: false},
    deleted: {type: Boolean, default: false}
},{
    timestamps : true ,
})

const Staff = mongoose.model("Staff" , staffSchema)

export default Staff