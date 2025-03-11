import mongoose from "mongoose";

const supplierSchema = mongoose.Schema({
    supplier_id : {type: String, unique: true, required: true},
    supplier_name : {type: String, unique: true, required: true},
    supplier_contact_person : {type: String, default: null},
    supplier_contact_person_phone : {type: Number, default: null},
    supplier_email : {type: String, default: null},
    supplier_phone : {type: Number, default: null},
    supplier_gst_no : {type: String, default: null},
    supplier_address : {
        street : {type: String, default: null},
        city : {type: String, default: null},
        district : {type: String, default: null},
        state : {type: String, default: null},
        pincode : {type: Number, default: null},
        address : {type: String, default: null},
    },
    supplier_bank_details : {
        bank_name : {type: String, default: null},
        account_number : {type: String, default: null},
        branch_name : {type: String, default: null},
        IFSC : {type: String, default: null},
    },
    active_status : {type: Boolean, default: true}
},{timestamps:true})

const Supplier = mongoose.model ("Supplier", supplierSchema)

export default Supplier