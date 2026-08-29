import mongoose from "mongoose"

const staffSchema = mongoose.Schema({
    staff_id: {type: String, required: true, unique: true, immutable: true, index: true},
    business_unit_id: { type: mongoose.SchemaTypes.ObjectId, ref: "BusinessUnit", required: true },
    name: {type: String, required: true, trim: true},
    email: { type: String, unique: true, lowercase: true, trim: true, sparse: true, default: undefined },
    gender: {type: String, enum: ["male", "female", "others"], required: true},
    password: {type: String, default: null, select: false},
    department: { type: String,  enum: [ "sales", "inventory", "delivery", "administration" ], message: '{VALUE} is not supported', required:true },
    role: { type: String, enum: ["delivery", "staff", "bpo", "assistant_manager","manager", "general_manager", "admin" ], message: '{VALUE} is not supported', required : true},
    salary: {type: Number, default: 0, min: 0},
    phone_number: {type: String, required: true, match: /^[6-9]\d{9}$/ },
    alternate_phone_number: {type: String, default: null, match: /^[6-9]\d{9}$/},
    qualification: {type: String, default: null, trim: true},
    pancard_number: {type: String, default: null, trim: true, unique: true, sparse: true, uppercase: true, match: /^[A-Z]{5}[0-9]{4}[A-Z]$/},
    aadhar_number: {type: String, default: null, trim: true, unique: true, sparse: true, match: /^\d{12}$/},
    DOB: {type: Date, default: null},
    emergency_contact: {
        name: {type: String, default: null},
        phone_number: {type: String, default: null, match: /^[6-9]\d{9}$/ },
        relation: { type: String, enum: ["spouse", "father", "mother", "guardian", "sibling" ], message: '{VALUE} is not supported'},
    },
    photo: {
        type: {
            url: {type: String, required: true},
            public_id: { type: String, default: ""},
        },
        required: true,
    },
    bank_details: {
        bank_name: {type: String, default: null, trim: true},
        account_number: {type: String, default: null, trim: true},
        branch_name: {type: String, default: null, trim: true},
        ifsc: {type: String, default: null , trim: true, uppercase: true, match: /^[A-Z]{4}0[A-Z0-9]{6}$/},
        account_holder: {type: String, default: null, trim: true},
    },
    address: {
        house_no: { type: String, required: true, trim: true },
        landmark: { type: String, default: "",trim: true },
        area: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        district: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        pincode: { type: String, required: true, trim: true }
    } ,

    joining_date: {type: Date, required: true},

    password_created: { type: Boolean, default: false },
    password_created_at: { type: Date, default: null },
    password_setup_otp: {
        code: { type: String, select: false },
        expires_at: {type: Date, select: false}
    },
    
    last_login: {type: Date, default: null},
    
    login_attempts: { type: Number, default: 0},
    lock_until: { type: Date, default: null },

    history: [{ type: mongoose.Schema.Types.Mixed, default: {}}],
    
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", immutable: true,},
    status: {type: String, enum: [ "active" , "inactive" , "blocked" ], default: "active"},
    blocked_at: {type: Date, default: null},
    blocked_reason :{type: String, default: null},

    deleted: {type: Boolean, default: false},
    
},{
    timestamps : true ,
})

staffSchema.index({ department: 1 });

staffSchema.index({ role: 1 });

staffSchema.index({ status: 1 });

staffSchema.index({ deleted: 1 });

const Staff = mongoose.model("Staff" , staffSchema)

export default Staff