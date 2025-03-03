import mongoose from "mongoose";
import slugify from "slugify";
const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userEmail: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },

 
    state:{
      type:String,
      required: true
    },
    
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    maritalStatus: {
      type: String,
      required: true,
    },
    // interest: { type: String, },
    interests: [{ type: String, required: true }],
    nationality: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      required: true
    },
    skinColor: {
      type: String,
    },
    eyeColor: {
      type: String,
    },

    slug: {
      type: String,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

profileSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = slugify(this.firstName, { lower: true, strict: true });
  }
  next();
});

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
