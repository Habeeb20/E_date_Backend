import express from "express";
import bcryptjs from "bcryptjs"
import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import cloudinary from "cloudinary"
import { verifyToken } from "../../middleware/verifyToken.js";
import Auth from "../../models/user/auth.schema.js";
import nodemailer from "nodemailer"
import crypto from "crypto"
const authRouter = express.Router()



cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
})


const transporter = nodemailer.createTransport(({
    service:'gmail',
    auth: {
       user:"essentialng23@gmail.com",
        pass:"jvrbtnuvubsdwtwu"
      },
}));


const sendOTPEmail = async(email, otp) => {
    const mailOptions = {
        from:process.env.EMAIL_USER,
        to:email,
        subject: 'Verify your email',
        text: `Your verification code is: ${otp}`,

    };
    
  await transporter.sendMail(mailOptions);
}


authRouter.post("/register", async (req, res) => {
    const { email, password, phoneNumber, confirmPassword } = req.body;

    try {
        if (!email || !password || !phoneNumber || !confirmPassword) {
            return res.status(400).json({ status: false, error: "All fields are required" });
        }

        const existingEmail = await Auth.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ status: false, error: "Email already exists" });
        }

        if (confirmPassword !== password) {
            return res.status(400).json({ status: false, error: "Confirm password does not match password" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const uniqueNumber = `RL-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
        const verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        const user = new Auth({
            email,
            phoneNumber,
            password: hashedPassword,
            verificationToken,
            verificationTokenExpiresAt,
            uniqueNumber,
        });

        await user.save();
        await sendOTPEmail(user.email, verificationToken);

        return res.status(201).json({
            status: true,
            message: "Successfully registered",
            user: { email, phoneNumber, uniqueNumber },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message });
    }
});



authRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ status: false, error: "Email and password are required" });
        }

        const user = await Auth.findOne({ email });
        if (!user) {
            return res.status(400).json({ status: false, error: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: false, error: "Invalid email or password" });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        return res.status(200).json({
            status: true,
            message: "Login successful",
            token,
            user: { email: user.email, phoneNumber: user.phoneNumber, uniqueNumber: user.uniqueNumber },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message });
    }
});


authRouter.get("/dashboard", verifyToken, async (req, res) => {
    try {
        const user = await Auth.findById(req.user.id).select("-password -verificationToken");
        if (!user) {
            return res.status(404).json({ status: false, error: "User not found" });
        }

        return res.status(200).json({ status: true, message: "Dashboard data retrieved", user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message });
    }
});



authRouter.post("/verify-email/:email", async (req, res) => {
    const { email } = req.params;  
    const { code } = req.body;     

    try {
        const user = await Auth.findOne({
            email, 
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;

        await user.save();

        res.status(200).json({
            success: true,
            message: `Email (${user.email}) verified successfully`,
            user: { email: user.email, isVerified: user.isVerified },
        });

    } catch (error) {
        console.error("Error in verifyEmail: ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});






export default authRouter