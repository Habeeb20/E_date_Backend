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
import CoupleConversation from "../../models/couples/coupleConversation.js";


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


///get all users on couple schema


coupleRoute.get("/getallcouple", verifyToken, async(req, res) => {
    try {
        const userId = req.user.id

        const profile = await Profile.findOne({userId: userId})
        if(!profile){
            return res.status(404).json({
                message: "your profile is not found",
                status: false
            })
        }

        const myProfileId = profile._id

        const couples = await Couples.find({})
            .populate("profileId", "firstName lastName profilePicture state dateOfBirth gender maritalStatus, interests, nationality profilePicture skinColor eyeColor")
            .populate("userId", "email phoneNumber countryNumber")

        if(couples.length === 0){
            return res.status(404).json({
                status:"false",
                message:"No other user found yet"
            })
        }

        const couple =  couples.filter((coup) => (
            coup.userId._id.toString() !== userId
        ))

        return res.status(200).json({
            status: true,
            message:"All users",
            couple
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "an error occurred from the server",
            status: false
        })
    }
})


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



//send requests
coupleRoute.post("/sendrequest", verifyToken, async(req, res) => {
    try {
        const {id} = req.body;  
        const profileId = req.user.id;

        if(!id || typeof id !== "string" || id.trim() == ""){
            return res.status(400).json({
                status: false,
                message: "id is required and must be a non-empty string"
            })
        }

        const myProfile = await Profile.findOne({userId: profileId});
        if(!myProfile){
            return res.status(404).json({
                status: false,
                message: "your profile is not found"
            })
        }
        const senderProfileId = myProfile._id;

        const recipientProfile = await Couples.findOne({_id: id}) 
        if(!recipientProfile){
            return res.status(404).json({
                status: false,
                message: "recipient partner profile not found"
            })
        }

        const senderCoupleProfile = await Couples.findOne({_id: senderProfileId})
        if(senderCoupleProfile?.acceptedInvitations.some(id => id.equals(recipientProfile._id))){
            return res.status(400).json({
                status: false,
                message: "you cant send a friend request to who is already your friend"
            })
        }

        if( recipientProfile.pendingInvitations.some(id => id.equals(senderProfileId)) ||
            recipientProfile.acceptedInvitations.some(id => id.equals(senderProfileId))
        ){
            return res.status(400).json({
                status: false,
                message: "friend request already sent or accepted"
            })
        }



        

        if(recipientProfile.userId.toString() === profileId){  
            return res.status(400).json({
                status:false,
                message: "you can't send a friend request to yourself"
            })
        }

        recipientProfile.pendingInvitations.push(senderProfileId)
        const updatedProfile = await recipientProfile.save()

        return res.status(200).json({
            status: true,
            message: "friend request successfully sent",
            updatedProfile
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json(
            {
                status: false,
                message: "an error occurred from the server"
            }
        )
    }
})

//accept friend request
coupleRoute.post("/acceptfriendrequest", verifyToken, async(req, res) => {
    try {
        const id = req.user.id;
        const {senderProfileId, action} = req.body;

        if(!["accept", "reject"].includes(action)){
            return res.status(400).json({
                status: false,
                message: 'Action must be accept or reject'
            })
        }

        const user = await Profile.findOne({userId: id})
        if(!user){
            return res.status(404).json({
                message: "your profile is not found",
                status: false
            })
        }

        const userProfileId = user._id

        const userProfile = await Couples.findOne({profileId: userProfileId})

        const invitationIndex = userProfile.pendingInvitations.indexOf(senderProfileId)
        if(invitationIndex === -1){
            return res.status(400).json({
                status: false,
                message: "no pending requests from this user"
            })
        }

        if(action === "accept"){
            const conversation =  new CoupleConversation({
                participants:[userProfileId, senderProfileId]
            })
            await conversation.save();

            userProfile.pendingInvitations.splice(invitationIndex, 1);
            userProfile.acceptedInvitations.push(senderProfileId);
            userProfile.chatList.push({user: senderProfileId, conversationId: conversation._id})

            const senderProfile = await Couples.findOne({profileId: senderProfileId})
            if(!senderProfile){
                return res.status(404).json({
                    status: false,
                    message: "sender profile not found"
                })
            }
            senderProfile.chatList.push({user: userProfileId, conversationId: conversation._id})
            await Promise.all([userProfile.save(), senderProfile.save()])
            
        } else if(action === "reject"){
            userProfile.pendingInvitations.splice(invitationIndex, 1)
            await userProfile.save()
        }


        return res.status(200).json({
            status: true,
            message:"successfully accepted"
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "an error occurred with the server"
        })
    }
})


//get all friend requests
coupleRoute.get("/request", verifyToken, async(req, res) => {
    try {
        const userId = req.user.id

        const profile = await Profile.findOne({userId: userId})
        if(!profile){
            return res.status(404).json({
                status: false,
                message: "profile not found"
            })
        }

       const myProfileId = profile._id

       const couple = await Couples.findOne({profileId: myProfileId})
        .populate("profileId", "firstName lastName profilePicture state dateOfBirth gender maritalStatus, interests, nationality profilePicture skinColor eyeColor")
        .populate("userId", "email phoneNumber countryNumber")
        .populate("pendingInvitations", "firstName lastName _id profilePicture")
        .populate("acceptedInvitations", "firstName lastName _id profilePicture")
        .exec()

        if(!couple){
            return res.status(404).json({
                status: false,
                message: "your couple profile not found"
            })
        }

        return res.status(200).json({
            status: true,
            message:"your friend requests!!",
           
            couple:{
                pending: couple.pendingInvitations,
                accepted: couple.acceptedInvitations,
                user: couple.userId,
                profile:couple.profileId

            }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "an error occurred from the sever",
            status: false
        })
    }
})


///my chat list of friends
coupleRoute.get("/allfriends", verifyToken, async(req, res) => {
    try {
        const id = req.user.id

        const profile = await Profile.findOne({userId : id})
        if(!profile){
            return res.status(404).json({
                status: false,
                message: "no profile found"
            })
        }

        const myProfileId = profile._id;

        const coupleProfile =  await Couples.findOne({profileId: myProfileId})
            .populate("chatList.user", "firstName lastName profilePicture")
            .populate("chatList.conversationId", "_id messages.sender messages.content" )
        if(!coupleProfile){
            return res.status(404).json({
                message:"your couple profile not found",
                status: false
            })
        }

        const chatListData = coupleProfile.chatList?.map((chat) => ({
            firstName:chat.user?.firstName || "unknown",
            lastName:chat.user?.lastName || "unknown",
            profilePicture:chat.user?.profilePicture || null,
            conversationId: chat.conversationId?._id || null,
            conversation: chat.conversationId?.participants || null,
            messages: chat.conversationId.messages.map((message) => ({
                sender:message.sender,
                content: message.content,
                read:message.read,
                time:message.timestamp
            }))

        }))

        return res.status(200).json({
            status: true,
            chatListData
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status: false,
            message: "an error occurred"
        })
    }
})


export default coupleRoute



























