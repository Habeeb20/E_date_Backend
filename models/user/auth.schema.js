import mongoose from "mongoose";


const authSchema  = new mongoose.Schema({
    email: {
        type:String,
        required: true,
        unique:true
    },
    phoneNumber: {
        type:String,
        required: String,

    },
    countryNumber: {
        type:String,
        required: String,
    },
    password: {
        type:String,
        required: String
    },
    confirmPassword: {
        type:String,
        required: true
    },
    isVerified: {type: Boolean,default: false},
    status: { type: String, enum: ['active', 'blocked', 'pending'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    registrationDate: { type: Date, default: Date.now },
    uniqueNumber: { type: String, unique: true },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
}, {timestamps: true })


export default mongoose.model("User", authSchema)