import express from "express";
import Dating from "../../models/Dating/datingModel.js";
import Profile from "../../models/user/profile.schema.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import User from "../../models/user/auth.schema.js"

const datingRoute = express.Router();

datingRoute.post("/create_datingdata", verifyToken, async (req, res) => {
    const profileId = req.user.id;
    const { genotype, hobbies, occupation, bloodgroup, pictures } = req.body;

    try {
     
        const user = await Profile.findOne({ _id: profileId });
        if (!user) {
            return res.status(404).json({ 
                status: false, 
                message: "Profile not found" 
            });
        }

   
        const existingDatingProfile = await Dating.findOne({ profileId });
        if (existingDatingProfile) {
            return res.status(400).json({ 
                status: false, 
                message: "Dating profile already exists for this user" 
            });
        }

        if (!Array.isArray(hobbies)) {
            return res.status(400).json({
                status: false,
                message: "Hobbies must be an array"
            });
        }

     
        if (hobbies.length === 0) {
            return res.status(400).json({
                status: false,
                message: "Hobbies array cannot be empty"
            });
        }

        const validHobbies = hobbies.every(hobby => 
            typeof hobby === 'string' && hobby.trim().length > 0
        );
        if (!validHobbies) {
            return res.status(400).json({
                status: false,
                message: "All hobbies must be non-empty strings"
            });
        }

   
        const datingUser = new Dating({
            profileId,
            genotype,
            hobbies: hobbies.map(hobby => hobby.trim()), 
            occupation,
            bloodgroup,
            pictures: pictures || []
        });

        await datingUser.save();

        return res.status(201).json({ 
            status: true, 
            message: "Dating profile successfully created",
            data: datingUser 
        });
    } catch (error) {
        console.error("Error creating dating profile:", error);
        return res.status(500).json({ 
            status: false,
            message: "Server error occurred",
            error: error.message 
        });
    }
});

datingRoute.get("/all_users", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findOne({ _id: userId });
        
        if (!user) {
            return res.status(404).json({ 
                status: false, 
                message: "User not found" 
            });
        }

        const datingData = await Dating.find({ profileId: userId });
        if (!datingData || datingData.length === 0) {
            return res.status(404).json({ 
                status: false, 
                message: "No dating profiles found" 
            });
        }

        return res.status(200).json({ 
            status: true, 
            message: "Dating profiles retrieved successfully",
            data: datingData 
        });
    } catch (error) {
        console.error("Error fetching dating profiles:", error);
        return res.status(500).json({ 
            status: false, 
            message: "Server error occurred",
            error: error.message 
        });
    }
});


datingRoute.get("/profile/:slug", async (req, res) => {
    try {
        const { slug } = req.params;

     
        const datingProfile = await Dating.findOne({ slug })
            .populate("profileId", "userEmail firstName lastName dateOfBirth, gender, maritalStatus, interest, nationality profilePicture skinColor EyeColor") 
            .exec();

        if (!datingProfile) {
            return res.status(404).json({
                status: false,
                message: "Dating profile not found"
            });
        }

     
        return res.status(200).json({
            status: true,
            message: "Dating profile retrieved successfully",
            data: datingProfile
        });
    } catch (error) {
        console.error("Error retrieving dating profile:", error);
        return res.status(500).json({
            status: false,
            message: "Server error occurred",
            error: error.message
        });
    }
});
export default datingRoute;