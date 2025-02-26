import mongoose from "mongoose";
import slugify from "slugify";
const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    fName:{
        type:String,
        required: true
    },
    lName:{
        type:String,
        required: true
    },
    dateOfBirth:{
        type:String,
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
    skinColour:{
        type:String,
    },
    EyeColour:{
        type:String
    }
}, {timestamps: true})


profileSchema.pre("save", function(next){
    if(!this.slug){
      this.slug = slugify(this.fName, { lower: true, strict: true });
    }
    next();
  })
  
export default mongoose.model("Profile", profileSchema)