import express from "express";
import { verifyToken } from "../../middleware/verifyToken.js";
import User from "../../models/user/auth.schema.js";
import Profile from "../../models/user/profile.schema.js";
import bcrypt from "bcrypt"
import cloudinary from "cloudinary"


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  

const profilerouter = express.Router()

profilerouter.post("/createprofile", async (req, res) => {
    try {
        const { userEmail, firstName, bio, religion, lastName, state, dateOfBirth, gender, maritalStatus, interest, nationality,     profilePicture, skinColor, EyeColor } = req.body;

        if (!userEmail) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ message: "User not found" });

            
        }

        if (!Array.isArray(interest)) {
            return res.status(400).json({
              status: false,
              message: "Interest must be an array"
            });
          }
      
          if (interest.length === 0) {
            return res.status(400).json({
              status: false,
              message: "Interest array cannot be empty"
            });
          }
      
          const validInterests = interest.every(item => 
            typeof item === "string" && item.trim().length > 0
          );
          if (!validInterests) {
            return res.status(400).json({
              status: false,
              message: "All interests must be non-empty strings"
            });
          }

        const existingProfile = await Profile.findOne({ userEmail: userEmail });
        if (existingProfile) {
            return res.status(400).json({ message: "Profile already exists for this user" });
        }

        if (!firstName || !lastName || !state || !religion || !bio || !dateOfBirth || !gender || !maritalStatus || !nationality || !profilePicture) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

    



    
        const newProfile = new Profile({
            userId: user._id,
            userEmail,
            firstName,
            lastName,
            state,
            dateOfBirth,
            gender,
            maritalStatus,
            interest: interest.map(i => i.trim()),
            nationality,
            religion,
            bio,
            profilePicture,
            skinColor,
            EyeColor,
    });

        await newProfile.save();

        return res.status(201).json({
            status: "Profile created successfully",
            profile: newProfile,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
});


profilerouter.put("/editprofile", verifyToken, async(req, res) => {
    try {
        const userId = req.user.id; 
        const updates = req.body;
    
       
        const profile = await Profile.findOne({ userId });
        if (!profile) {
          return res.status(404).json({ message: "Profile not found" });
        }
    
      
        Object.assign(profile, updates);
        await profile.save();
    
        res.status(200).json({ message: "Profile updated successfully", profile });
      } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
      }
})


profilerouter.get("/getprofile", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

    
        const user = await User.findById(userId).select("-password"); 
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

      
        const profile = await Profile.findOne({ userId });
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.status(200).json({
            message: "User and profile fetched successfully",
            user,
            profile
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

export default profilerouter