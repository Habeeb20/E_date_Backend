import mongoose from "mongoose";
import slugify from "slugify";

const datingModelSchema = new mongoose.Schema({
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
  },
  genotype: {
    type: String,
    required: true
  },
  hobbies: [{
    type: String,
    required: true
  }],
  occupation: {
    type: String,
    required: true  
  },
  bloodgroup: {
    type: String,
    required: true 
  },
  pictures: [{
    type: String,
    validate: {
      validator: function(array) {
        return array.length <= 15;  
      },
      message: "You can upload a maximum of 15 pictures"
    }
  }],
  slug: {
    type: String,
    unique: true,
    trim: true,
  },
}, { timestamps: true });


datingModelSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = slugify(this.occupation, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model("Dating", datingModelSchema);