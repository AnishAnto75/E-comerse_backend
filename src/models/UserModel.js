import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    user_id :{ type: String, immutable: true, unique: true, required: true},
    email : { type: String, immutable: true, unique: true, required: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, "Invalid email"]},
    password : {type: String, required: true},
    name: {type: String, required: true, trim: true, minlength: 2, maxlength: 50},
    gender : {type: String, enum: ['male', 'female', 'others'], required: true },
    DOB : {type: Date, default: null },
    phoneNumber :{type: String, default: null},
    notificationPreferences: {
        email: { type: Boolean, default: true},
        whatsapp: { type: Boolean, default: true},
        sms: { type: Boolean, default: true},
        push: { type: Boolean, default: true}
    },
    status: { type: String, enum : ['active', 'inactive', 'blocked'], default: "active" },
    blocked_reason :{type: String, default: null},
    score : { type : Number, enum : [1 , 2 , 3 , 4 , 5], default: 1 },
    deleted : {type: Boolean, default: false},
    deletedAt: { type: Date, default: null }
},{
    timestamps : true,
    versionKey: false
})

const User = mongoose.model("User" , userSchema)
export default User