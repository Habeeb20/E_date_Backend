import mongoose from "mongoose";

const coupleConversationSchema = new mongoose.Schema({
    participants:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref: "Profile",
            required: true
        }
    ],

    messages:[
        {
            sender:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Profile",
                required: true
            },
            content:{
                type:String,
                required: true
            },
            read:{
                type:Boolean,
                defsult: false
            },
            timestamp:{
                type:Date,
                default: Date.now
            }
        }
    ]


}, {timestamps: true})

export default mongoose.model("CoupleConversation",  coupleConversationSchema)