import mongoose from "mongoose"


const businessUnitSchema = new mongoose.Schema({
    business_unit_id: { type: String, required: [true, "Business unit ID is required."], unique: true, trim: true, uppercase: true, immutable: true },
    business_unit_name: { type: String, required: [true, "Business unit name is required."], trim: true },
    business_unit_type: { type: String, required: [true, "Business unit type is required."], lowercase: true, index: true,
        enum: { 
            values: [ "warehouse", "store", "office" ],
            message: "Invalid business unit type."
        }
    },
    contact: {
        phone: { type: String, trim: true, default: "", match: [ /^(?:\+91[-\s]?)?[6-9]\d{9}$/, "Invalid Indian phone number." ] },
        email: { type: String, trim: true, lowercase: true, default: "", match: [ /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Invalid email address." ]}
    },
    address: {
        address_line_1: { type: String, required: [true, "Address is required."], trim: true, maxlength: [200, "Address cannot exceed 200 characters."]},
        address_line_2: { type: String, trim: true, default: "", maxlength: [200, "Address cannot exceed 200 characters."] },
        area: { type: String, required: [true, "Area is required."], trim: true, maxlength: [100, "Area cannot exceed 100 characters."]},
        city: { type: String, required: [true, "City is required."], trim: true, maxlength: [100, "City cannot exceed 100 characters."]},
        state: { type: String, required: [true, "State is required."], trim: true, maxlength: [100, "State cannot exceed 100 characters."] },
        pincode: { type: String, required: [true, "Pincode is required."], trim: true, match: [ /^[1-9][0-9]{5}$/, "Invalid Indian pincode."]},
        country: { type: String, trim: true, default: "India" }
    },
    working_hours: {
        opening_time: { type: String, trim: true, default: "09:00", match: [ /^([01]\d|2[0-3]):[0-5]\d$/, "Opening time must be in HH:mm format." ]},
        closing_time: { type: String, trim: true, default: "21:00", match: [ /^([01]\d|2[0-3]):[0-5]\d$/, "Closing time must be in HH:mm format." ]}
    },
    total_assets: { type: Number, default: 0, min: [0, "Asset value cannot be negative."], validate: { validator: Number.isFinite, message: "Asset value must be a valid number." }},
    status: { type: String, default: "active", lowercase: true, enum: { values: [ "active", "temporarily_closed", "permanently_closed" ], message: "Invalid business unit status." }, index: true},
    deleted: { type: Boolean, default: false, index: true },
    history: [{
        action: { type: String, required: true, enum: [ "create", "update", "delete", "restore" ]},
        performed_by: { type: mongoose.SchemaTypes.ObjectId, ref: "Staff", required: true },
        performed_at: { type: Date, default: Date.now },
        changes: { type: mongoose.Schema.Types.Mixed, default: {}}
    }]
}, { timestamps: true, strict: true, strictQuery: true, versionKey: "_v", minimize: true }
)

businessUnitSchema.index({ business_unit_type: 1, status: 1, deleted: 1 })
businessUnitSchema.index({ "address.city": 1, business_unit_type: 1, deleted: 1 })

const BusinessUnit = mongoose.model( "BusinessUnit", businessUnitSchema )
export default BusinessUnit