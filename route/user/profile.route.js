import express from "express";
import { verifyToken } from "../../middleware/verifyToken.js";
import User from "../../models/user/auth.schema.js";
import Profile from "../../models/user/profile.schema.js";
import bcrypt from "bcrypt"

const profilerouter = express.Router()

profilerouter.post("/createprofile", async (req, res) => {
    try {
        const { email, firstName, lastName, dateOfBirth, gender, maritalStatus, interest, Nationality, ProfilePicture, skinColor, EyeColor } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const existingProfile = await Profile.findOne({ userId: email });
        if (existingProfile) {
            return res.status(400).json({ message: "Profile already exists for this user" });
        }

        if (!firstName || !lastName || !dateOfBirth || !gender || !maritalStatus || !Nationality) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

        if (!Array.isArray(interest) || interest.length === 0) {
            return res.status(400).json({ message: "Interest must be a non-empty array" });
        }

        if (!interest.every(item => typeof item === "string" && item.trim().length > 0)) {
            return res.status(400).json({ message: "All interests must be non-empty strings" });
        }

    
        const newProfile = new Profile({
            userEmail: email, 
            firstName,
            lastName,
            dateOfBirth,
            gender,
            maritalStatus,
            interest,
            Nationality,
            ProfilePicture,
            skinColor,
            EyeColor,
        });

        await newProfile.save();

        return res.status(201).json({
            message: "Profile created successfully",
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