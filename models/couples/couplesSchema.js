import mongoose from "mongoose";
import slugify from "slugify";
const couplesSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    profileId: { 
        type:mongoose.Schema.Types.ObjectId,
        ref: "Profile",
        required: true,
        unique: true
    },
 
  medicalDocument: {
    type: String,
    required: true
  },
  documentDescription: {
    type: String,
    default: ""
  },


  medicalHistory: {
    hasHepatitis: {
      type: Boolean,
      required: true
    },
    hasHIV: {
      type: Boolean,
      required: true
    },
    isAlbino: {
      type: Boolean,
      required: true
    },
    hasHighSugar: {
      type: Boolean,
      required: true
    },
    hasPolio: {
      type: Boolean,
      required: true
    },
    hasSTI: {
      type: Boolean,
      required: true
    }
  },


  familyBackground: {
    fatherMaidenName: {
      type: String,
      required: true,
      trim: true
    },
    numberOfSiblings: {
      type: Number,
      required: true,
      min: 0
    },
    numberOfChildren: {
      type: Number,
      required: true,
      min: 0
    }
  },


  ethics: {
    religiousBelief: {
      type: String,
      required: true,
      trim: true
    },
    isSmoker: {
      type: Boolean,
      required: true
    },
    drinksAlcohol: {
      type: Boolean,
      required: true
    },
    isReligious: {
      type: Boolean,
      required: true
    }
  },

  pendingInvitations:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref: "Profile"
    },
  ],

  acceptedInvitations:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
  ],

  chatList:[
    {
      user: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "Profile"
      },
    

    conversationId:{
      type:mongoose.Schema.Types.ObjectId,
      ref: "CoupleConversation"
    }
  }
  ],

  slug: {
    type: String,
    unique: true,
    trim: true,
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

couplesSchema.pre("save", function(next) {
  if (!this.slug) {
    const uniquePart = `${this.profileId}-${Date.now()}`;
    this.slug = slugify(`${this.familyBackground.fatherMaidenName}-${uniquePart}`, {
      lower: true,
      strict: true,
    });
  }
  next();
});


couplesSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});


export default mongoose.model('Couples', couplesSchema);