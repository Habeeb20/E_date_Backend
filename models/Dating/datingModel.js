import mongoose from "mongoose";
import slugify from "slugify";

const datingModelSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    genotype: {
      type: String,
      required: true,
    },
    hobbies: [
      {
        type: String,
        required: true,
      },
    ],
    occupation: {
      type: String,
      required: true,
    },
    bloodGroup: {
      type: String,
      required: true,
    },
    admirers: {
      type: Number,
      default: 0,
    },
    admirerList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
      },
    ],

    pendingInvitations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
      },
    ],
    acceptedInvitations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
      },
    ],
  pictures: {
      type: [{
        type: String,
      }],
      validate: {
        validator: function (array) {
          return Array.isArray(array) && array.length <= 15;
        },
        message: "You can upload a maximum of 15 pictures",
      },
    },
    chatList: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Profile",
        },

        conversationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Conversation",
        },
      },
    ],
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

datingModelSchema.pre("save", function (next) {
  if (!this.slug) {
    const uniquePart = `${this.profileId}-${Date.now()}`;
    this.slug = slugify(`${this.occupation}-${uniquePart}`, {
      lower: true,
      strict: true,
    });
  }
  next();
});

export default mongoose.model("Dating", datingModelSchema);
