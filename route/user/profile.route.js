import express from "express";
import { verifyToken } from "../../middleware/verifyToken.js";
import User from "../../models/user/auth.schema.js";
import Profile from "../../models/user/profile.schema.js";
import bcrypt from "bcrypt"

const profilerouter = express.Router()

profilerouter.post("/createprofile", verifyToken, async (req, res) => {
    try {
        const { fName, lName, dateOfBirth, gender, maritalStatus, interest, Nationality, ProfilePicture, skinColour, EyeColour } = req.body;
        const userId = req.user.id;

   
        const existingProfile = await Profile.findOne({ userId });
        if (existingProfile) {
            return res.status(400).json({ message: "Profile already exists for this user" });
        }

        if (!fName || !lName || !dateOfBirth || !gender || !maritalStatus || !interest || !Nationality) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

     
        if (!Array.isArray(interest) || interest.length === 0) {
            return res.status(400).json({ message: "Interest must be a non-empty array" });
        }

  
        if (!interest.every(item => typeof item === 'string' && item.trim().length > 0)) {
            return res.status(400).json({ message: "All interests must be non-empty strings" });
        }

        // Ensure the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Create new profile
        const newProfile = new Profile({
            userId,
            fName,
            lName,
            dateOfBirth,
            gender,
            maritalStatus,
            interest, // Will now accept an array
            Nationality,
            ProfilePicture,
            skinColour,
            EyeColour,
        });

        await newProfile.save();

        res.status(201).json({
            message: "Profile created successfully",
            profile: newProfile,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
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