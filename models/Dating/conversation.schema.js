import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
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
                ref: "Profile",
                required: true
            },
            content:{
                type:String,
                required: true
            },
            read:{
                type:Boolean,
                default: false
            },
            timestamp: {
      type: Date,
      default: Date.now
    }
        }
    ]
}, {timestamps: true})

export default mongoose.model("Conversation", conversationSchema)