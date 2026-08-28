import mongoose from "mongoose"

const posCustomerSchema = new mongoose.Schema({
    customer_name: { type: String, required: true, trim: true, minlength: [2, "Customer name must be at least 2 characters"], maxlength: [100, "Customer name cannot exceed 100 characters"]},
    phone: { type: String, required: true, trim: true, maxlength: [20, "Phone number is too long"] },
    email: { type: String, trim: true, lowercase: true, default: null, maxlength: [150, "Email is too long"], match: [ /^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address" ] },
    address: { type: String, trim: true, maxlength: [300, "Address cannot exceed 300 characters"], default: "" },
    customer_code: { type: String, required: true, unique: true, trim: true, uppercase: true, immutable: true },
    notes: { type: String, trim: true, maxlength: [500, "Notes cannot exceed 500 characters"], default: "" },
    status: { type: String, enum: ["active", "inactive", "blocked"], default: "active", index: true }
},{ timestamps: true, versionKey: false}
)

posCustomerSchema.index({ phone: 1 },{ unique: true } )
posCustomerSchema.index({ customer_code: 1 },{ unique: true })
posCustomerSchema.index({customer_name: 1})

posCustomerSchema.pre("save", function(next) {
    if (this.phone) { this.phone = this.phone.replace(/\s+/g, "").trim()}
    if (this.email) { this.email = this.email.toLowerCase().trim()}
    if (this.customer_name) {this.customer_name = this.customer_name.trim()}
    if (this.customer_code) {this.customer_code = this.customer_code.trim().toUpperCase()}
    next()
})

const POSCustomer = mongoose.model( "POSCustomer", posCustomerSchema )

export default POSCustomer