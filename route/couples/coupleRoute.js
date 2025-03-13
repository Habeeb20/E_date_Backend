import express from "express"
import Couples from "../../models/couples/couplesSchema.js"
import mongoose from "mongoose";
import User  from "../../models/user/auth.schema.js"
import Profile from "../../models/user/profile.schema.js"
import cloudinary from "../../config/cloudinary.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import Post from "../../models/couples/postSchema.js";
import formidable from "formidable"
import fs from "fs/promises";


const coupleRoute = express.Router()


coupleRoute.post("/couples", verifyToken, async (req, res) => {
    const id = req.user.id
  try {
  
    const {
      documentDescription,
      medicalHistory,
      familyBackground,
      ethics,
      medicalDocument,
    } = req.body;

    const user = await User.findOne({_id: id})
    if(!user){
        return res.status(404).json({
            message: "user not found",
            message: "false"
        })
    }

    const myUserId = user._id

    const profile = await Profile.findOne({userId:myUserId})
    if(!profile){
        return res.status(404).json({
            status: false,
            message: "profile not found"
        })
    }

  
    if (!medicalDocument) {
      return res.status(400).json({ message: "Medical document is required" });
    }
    if (!medicalHistory || !familyBackground || !ethics) {
      return res.status(400).json({ message: "Medical history, family background, and ethics are required" });
    }

    let medicalDocumentUrl = "";
    if (typeof medicalDocument === "string" && medicalDocument.startsWith("data:")) {
    
      const uploadResponse = await cloudinary.uploader.upload(medicalDocument, {
        resource_type: "auto", 
        folder: "couples_health",
      });
      medicalDocumentUrl = uploadResponse.secure_url;
    } else if (typeof medicalDocument === "string") {
      // Handle URL (e.g., from a pre-uploaded file)
      const uploadResponse = await cloudinary.uploader.upload(medicalDocument, {
        resource_type: "auto",
        folder: "couples_health",
      });
      medicalDocumentUrl = uploadResponse.secure_url;
    } else {
      return res.status(400).json({ message: "Invalid medical document format. Please provide base64 data or a URL" });
    }

    const existingCouple = await Couples.findOne({ userId: myUserId });
    if (existingCouple) {
      return res.status(400).json({
        message: "You have already created a couple profile. Only one profile is allowed per user.",
        status: false,
      });
    }

    const newCouple = new Couples({
        userId:user._id,
        profileId: profile._id,
      medicalDocument: medicalDocumentUrl,
      documentDescription: documentDescription || "",
      medicalHistory,
      familyBackground,
      ethics,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

   
    const savedCouple = await newCouple.save();
    res.status(201).json({
      message: "Couple's health record created successfully",
     savedCouple,
    });
  } catch (error) {
    console.error("Error creating couple's health record:", error);
    res.status(500).json({
      message: "Failed to create couple's health record",
      error: error.message,
    });
  }
});


coupleRoute.get("/getMycouplesdata", verifyToken, async (req, res) => {
    const id = req.user.id
  try {
   
    const user = await User.findOne({_id: id})
    if(!user){
        return res.status(404).json({
            message: "user not found",
            message: "false"
        })
    }

    const myUserId = user._id

    const profile = await Profile.findOne({userId:myUserId})
    if(!profile){
        return res.status(404).json({
            status: false,
            message: "profile not found"
        })
    }
const myProfileId =  profile._id
    const couple = await Couples.findOne({profileId:myProfileId }).populate("profileId", "firstName lastName state dateOfBirth gender maritalStatus interests nationality    profilePicture skinColor eyeColor");

    if (!couple) {
      return res.status(404).json({ message: "Couple's health record not found" });
    }

    res.status(200).json({
      message: "Couple's health record retrieved successfully",
      couple,
    });
  } catch (error) {
    console.error("Error retrieving couple's health record:", error);
    res.status(500).json({
      message: "Failed to retrieve couple's health record",
      error: error.message,
    });
  }
});


coupleRoute.post("/posts", verifyToken, async(req, res) => {
    const {content, isStatus} = req.body;
    const userId= req.user.id;

    try {
        const profile = await Profile.findOne({userId});
        if(!profile){
            return res.status(404).json({
                status: false,
                message: "profile not found "
            })
        }

        const couple = await Couples.findOne({profileId: profile._id})
        if(!couple){
            return res.status(404).json({
                success: false,
                message: "couple profile not found"
            })
        }

        let mediaUrl = null;
        let mediaType = null;
        if(req.files && req.files.media){
            const file = req.files.media;
            const result = await cloudinary.uploader.upload(file.tempFilePath, {
                resource_type: file.mimetype.startsWith("video") ? "video" : "image"
            })
            mediaUrl = result.secure_url;
            mediaType = file.mimetype.startsWith("video") ? "video" : "image"
        }

        const post = new Post({
            content,
            media: mediaUrl,
            mediaType,
            isStatus: isStatus === "true",
            userId,
            profileId: profile._id
        })
        await post.save()

        return res.status(201).json({
            status: true,
            message: `${isStatus === "true" ? "Status" : "Post" }created successfully `, post
        })
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ message: "Failed to create post", error: error.message });
    }
})






// coupleRoute.post("/posts", verifyToken, (req, res) => {
//     const form = new formidable.IncomingForm({
//       uploadDir: "./tmp/", // Directory for temporary files
//       keepExtensions: true, // Preserve file extensions
//       maxFileSize: 50 * 1024 * 1024, // 50MB limit (adjust as needed)
//     });
  
//     form.parse(req, async (err, fields, files) => {
//       if (err) {
//         console.error("Form parsing error:", err);
//         return res.status(500).json({
//           status: false,
//           message: "Failed to parse form data",
//           error: err.message,
//         });
//       }
  
//       try {
//         // Log parsed data for debugging
//         console.log("Fields:", fields);
//         console.log("Files:", files);
  
//         const { content, isStatus, mediaType } = fields;
//         const userId = req.user.id;
  
//         // Find user profile
//         const profile = await Profile.findOne({ userId });
//         if (!profile) {
//           return res.status(404).json({
//             status: false,
//             message: "Profile not found",
//           });
//         }
  
//         // Find couple profile
//         const couple = await Couples.findOne({ profileId: profile._id });
//         if (!couple) {
//           return res.status(404).json({
//             status: false,
//             message: "Couple profile not found",
//           });
//         }
  
//         // Handle media upload with Cloudinary
//         let mediaUrl = null;
//         let mediaTypeValue = mediaType || null;
//         if (files.media) {
//           const file = files.media;
//           console.log("Processing file:", file);
  
//           const result = await cloudinary.uploader.upload(file.filepath, {
//             resource_type: file.mimetype.startsWith("video") ? "video" : "image",
//           });
//           mediaUrl = result.secure_url;
//           mediaTypeValue = file.mimetype.startsWith("video") ? "video" : "image";
  
//           // Optional: Clean up temp file after upload
//           await fs.unlink(file.filepath).catch((err) => console.log("Failed to delete temp file:", err));
//         } else {
//           console.log("No media file received");
//         }
  
//         // Create new post
//         const post = new Post({
//           content: content || "",
//           media: mediaUrl,
//           mediaType: mediaTypeValue,
//           isStatus: isStatus === "true",
//           userId,
//           profileId: profile._id,
//         });
//         await post.save();
  
//         return res.status(201).json({
//           status: true,
//           message: `${isStatus === "true" ? "Status" : "Post"} created successfully`,
//           post,
//         });
//       } catch (error) {
//         console.error("Error creating post:", error);
//         return res.status(500).json({
//           status: false,
//           message: "Failed to create post",
//           error: error.message,
//         });
//       }
//     });
//   });








coupleRoute.get("/posts", verifyToken, async(req, res) => {
    const userId = req.user.id;
    try {
        const profile = await Profile.findOne({userId})
        if(!profile){
            return res.status(404).json({
                   status: false,
            message: "profile not found"
            })
         
        }

        const posts = await Post.find({profileId: profile._id}).sort({createdAt: -1}).populate("userId", "email").populate("profileId", "firstName lastName")

        const currentTime = Date.now();
        const validPosts = posts.filter((post) => {
            if(post.isStatus){
                const timeElapsed = currentTime - new Date(post.createdAt).getTime()
                return timeElapsed < 24 * 60 * 60 * 1000
            }
            return true
        })

        return res.status(200).json({
            posts: validPosts
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status: false,
            message: "failed to fetch posts"
        })
    }
})


//get other posts

coupleRoute.get("/getOtherPosts", verifyToken, async(req, res) => {
    const userId = req.user.id;

    try {
        const profile = await Profile.findOne({userId})
        if(!profile) {
            return res.status(404).json({
                status: false,
                message: "profile not found"
            })
        }

        const posts = await Post.find({}).sort({createdAt: -1})
            .populate("userId", "email")
            .populate("profileId", "firstName lastName profilePicture")
            .populate("comments.profileId", "firstName lastName profilePicture")
            .populate("likes.profileId", "firstName lastName profilePicture")
            .populate("shares.profileId", "firstName lastName profilePicture");

        const currentTime = Date.now();
        const validPosts = posts.filter((post) => {
            if(post.isStatus){
                const timeElapsed = currentTime - new Date(post.createdAt).getTime()
                return timeElapsed < 24 * 60 * 60 * 1000
                 
            }

            return true
        })

        return res.status(200).json({
            posts:validPosts
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status: false,
            message: "failed to fetch all posts"
        })
    }
})



coupleRoute.put("/posts/:id", verifyToken, async(req, res) => {
    const {content} = req.body;
    const postId = req.params.id;
    const userId = req.user.id;

    try {
        const post = await Post.findById(postId)
        if(!post) return res.status(404).json({message: "post not found"})
        if(post.userId.toString() !==userId) return res.status(404).json({message: "you are not authorized"})
        if(post.isStatus) return res.status(400).json({message: "cannot edit statuses"})

        post.content = content

        await post.save();

        return res.status(200).json({
            success: true,
            message: "post updated successfully"
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "an error occurred from the server",
            success: false
        })
    }
})






coupleRoute.delete("/posts/:id", verifyToken, async(req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;

    try {
        const post = await Post.findById(postId);
        if(!post) return res.status(404).json({message: "post not found"})
        if(post.userId.toString() !== userId) return res.status(400).json({message: "unauthorized"})
        
        if(post.media){
            const publicId = post.media.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(publicId, {
                resource_type: post.mediaType === "video" ? "video" : "image",
            })
        }

        await Post.deleteOne({_id: postId});
        return res.status(200).json({message: `${post.isStatus ? "Status" : "Post" } deleted successfully`})
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Failed to delete post", error: error.message });
    }
})



// add a comment
coupleRoute.post("/posts/:postId/comment", verifyToken, async(req, res) => {
    try {
        const {content} = req.body;
        const {postId} = req.params;
        const userId = req.user.id;

        const profile = await Profile.findOne({userId})
        if(!profile){
            return res.status(404).json({status: false, message: "profile not found"})
        }

        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({status: false, message: "post not found"})
        }

        post.comments.push({userId, profileId: profile._id, content})
        await post.save();


        
    const updatedPost = await Post.findById(postId)
    .populate("comments.profileId", "firstName lastName profilePicture")
    .populate("likes.profileId", "firstName lastName profilePicture")
    .populate("shares.profileId", "firstName lastName profilePicture");

    return res.status(200).json({
        status: true,
         message: "commented successfully", 
         post: updatedPost})
    } catch (error) {
        console.log(error)
        return res.status(500).json({status: false, message: "an error occurred from the sever"})
    }
})



coupleRoute.post("/posts/:postId/like", verifyToken, async(req, res) => {
    try {
        const {postId} = req.params
        const userId = req.user.id

        const profile = await Profile.findOne({ userId});
        if(!profile) {
            return res.status(404).json({
                status: false,
                message: "not profile not found"
            })
        }

        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({
                status: false,
                message: "post not found"
            })
        }

        const likeIndex = post.likes.findIndex(
            (like) => like.userId.toString() === userId
        );
        if(likeIndex === -1){
            post.likes.push({userId, profileId: profile._id})
        }else {
            post.likes.splice(likeIndex, 1)
        }

        await post.save()
        const updatedPost = await Post.findById(postId)
        .populate("comments.profileId", "firstName lastName profilePicture")
        .populate("likes.profileId", "firstName lastName profilePicture")
        .populate("shares.profileId", "firstName lastName profilePicture");
        return res.status(200).json({
            status: true,
            message: likeIndex === -1 ? "Liked" : "Unliked",
            post: updatedPost,
          });
    } catch (error) {
        console.error("Error toggling like:", error);
        return res.status(500).json({ status: false, message: "Failed to toggle like" });
    }
})



coupleRoute.post("/posts/:postId/share", verifyToken, async (req, res) => {
    try {
        const {postId} = req.params
        const userId = req.user.id

        const profile = await Profile.findOne({userId})
        if(!profile){
            return res.status(404).json({status: false, message: "user account not found"})
        }

        const post = await Post.findById(postId)
        if(!post){
            return res.status(404).json({status: false, message: 'post not found'})
        
        }

        post.comments.push({userId, profileId:profile._id})
        await post.save()
        const updatedPost = await Post.findById(postId)
        .populate("comments.profileId", "firstName lastName profilePicture")
        .populate("likes.profileId", "firstName lastName profilePicture")
        .populate("shares.profileId", "firstName lastName profilePicture");
  
      return res.status(200).json({ status: true, message: "Post shared", post: updatedPost });
    } catch (error) {
        console.error("Error sharing post:", error);
        return res.status(500).json({ status: false, message: "Failed to share post" }); profilePicture
    }
})


export default coupleRoute



























