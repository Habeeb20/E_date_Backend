import mongoose from "mongoose";
const postSchema = new mongoose.Schema({
  content: { type: String, default: "" },
  media: { type: String }, 
  mediaType: { type: String, enum: ["image", "video", null], default: null },
  isStatus: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("postSchema", postSchema)