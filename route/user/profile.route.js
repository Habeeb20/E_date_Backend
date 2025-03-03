import express from "express";
import { verifyToken } from "../../middleware/verifyToken.js";
import User from "../../models/user/auth.schema.js";
import Profile from "../../models/user/profile.schema.js";
import bcrypt from "bcrypt";
import cloudinary from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const profilerouter = express.Router();




//create profile 
profilerouter.post("/createprofile", async (req, res) => {
  try {
    const {
      userEmail,
      firstName,

      religion,
      lastName,
      state,
      dateOfBirth,
      gender,
      maritalStatus,
      interests,
      nationality,
      profilePicture,
      skinColor,
      EyeColor,
    } = req.body;

    
    if (!userEmail) {
      return res.status(400).json({ message: "Email is required" });
    }


    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    let interest = Array.isArray(interests)
      ? interests
      : typeof interest === "string" && interests.trim()
      ? [interests.trim()]
      : [];
    if (interest.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Interest array cannot be empty",
      });
    }

    const validInterests = interest.every(
      (item) => typeof item === "string" && item.trim().length > 0
    );
    if (!validInterests) {
      return res.status(400).json({
        status: false,
        message: "All interests must be non-empty strings",
      });
    }


    const existingProfile = await Profile.findOne({ userEmail });
    if (existingProfile) {
      return res.status(400).json({
        status: false,
        message: "Profile already exists for this user",
      });
    }

 
    if (
      !firstName ||
      !lastName ||
      !state ||
      !religion ||
 
      !dateOfBirth ||
      !gender ||
      !maritalStatus ||
      !nationality ||
      !profilePicture
    ) {
      return res.status(400).json({
        status: false,
        message: "All required fields must be filled",
      });
    }

    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({
        status: false,
        message: "Invalid date of birth format",
      });
    }


    let normalizedProfilePicture = Array.isArray(profilePicture)
      ? profilePicture
      : typeof profilePicture === "string" && profilePicture.trim()
      ? [profilePicture.trim()]
      : [];
    if (normalizedProfilePicture.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Profile picture is required and cannot be empty",
      });
    }
    if (normalizedProfilePicture.length > 15) {
      return res.status(400).json({
        status: false,
        message: "Maximum of 15 profile pictures allowed",
      });
    }


    const newProfile = new Profile({
      userId: user._id,
      userEmail,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      state: state.trim(),
      dateOfBirth: birthDate,
      gender: gender.trim(),
      maritalStatus: maritalStatus.trim(),
      interests: interest.map((i) => i.trim()), 
      nationality: nationality.trim(),
      religion: religion.trim(),
      bio: bio.trim(),
      profilePicture: normalizedProfilePicture,
      skinColor: skinColor?.trim(),
      EyeColor: EyeColor?.trim(),
    });


    await newProfile.save();

    return res.status(201).json({
      status: true, 
      message: "Profile created successfully",
      profile: newProfile,
    });
  } catch (error) {
    console.error("Error creating profile:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        status: false,
        message: "Validation error",
        error: error.message,
      });
    }
    return res.status(500).json({
      status: false,
      message: "Server error occurred",
      error: error.message,
    });
  }
});










profilerouter.put("/editprofile", verifyToken, async (req, res) => {
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
});

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
      profile,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

export default profilerouter;
