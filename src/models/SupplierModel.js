import mongoose from "mongoose";

const supplierSchema = mongoose.Schema({
    supplier_id : {type: String, unique: true, trim: true, required: true},
    supplier_name : {type: String, required: true, trim: true},
    supplier_contact_person : {type: String, trim: true, default: ''},
    supplier_contact_person_phone : {type: String, trim: true, default: ''},
    supplier_email : {type: String, trim: true, lowercase: true, default: '', 
        validate: {
            validator: function (value) {
                return value === "" || /^\S+@\S+\.\S+$/.test(value);
            },
            message: "Invalid email"
        }
    },
    supplier_phone : {type: String, required: true, trim: true, default: ''},
    supplier_gst_no : {type: String, uppercase: true, trim: true, default: ''},
    supplier_address : {
        landmark : {type: String,trim: true, default: ""},
        street : {type: String,trim: true, default: ""},
        city : {type: String, trim: true, default: ""},
        district : {type: String, trim: true, default: ""},
        state : {type: String, trim: true, default: ""},
        pincode : {type: String, trim: true, default: ""},
    },
    supplier_bank_details : {
        bank_name : {type: String, trim: true, default: ""},
        account_number : {type: String,trim: true, default: ""},
        branch_name : {type: String, trim: true, default: ""},
        ifsc : {type: String, trim: true,uppercase: true, default: ""},
        account_holder: { type: String , trim: true, default: "" }
    },
    payment_terms: { type:Number, default: null },
    supplier_type: { type:String,enum:[ "Manufacturer", "Distributor", "Wholesaler" ], default: "Distributor" },
    notes: { type: String, default: "" },
    total_purchase_amount: { type: Number, default: 0 },
    total_orders: { type: Number, default: 0},
    last_purchase_date: { type: Date, default: null },
    status: { type: String, enum : ['active', 'inactive'], default: "active" },
    deleted: { type: Boolean, default: false }
},{timestamps:true})

supplierSchema.index({
    supplier_name: 1,
    deleted: 1
});
supplierSchema.index({ supplier_phone: 1 });

supplierSchema.index({ supplier_gst_no: 1 });

supplierSchema.index({ status: 1 });

supplierSchema.index({ supplier_type: 1 });

supplierSchema.index({
    supplier_name: "text",
    supplier_contact_person: "text"
});


const Supplier = mongoose.model ("Supplier", supplierSchema)

export default Supplier