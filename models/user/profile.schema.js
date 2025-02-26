import mongoose from "mongoose";
import slugify from "slugify";
const profileSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    userEmail: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    
      },
    firstName:{
        type:String,
        required: true
    },
    lastName:{
        type:String,
        required: true
    },
    dateOfBirth:{
        type:Date,
        required: true
    },
    gender:{
        type:String,
        required: true
    },
    maritalStatus:{
        type:String,
        required: true
    },
    interest:[{type:String }],
    Nationality:{
        type:String,
        required: true
    },
    ProfilePicture:{
        type:String
    },
    skinColor:{
        type:String,
    },
    EyeColor:{
        type:String
    }
}, {timestamps: true})


profileSchema.pre("save", function(next){
    if(!this.slug){
      this.slug = slugify(this.firstName, { lower: true, strict: true });
    }
    next();
  })
  
export default mongoose.model("Profile", profileSchema)