import express from "express";
import Dating from "../../models/Dating/datingModel.js";
import Profile from "../../models/user/profile.schema.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import User from "../../models/user/auth.schema.js"
import Conversation from "../../models/Dating/conversation.schema.js";
import cloudinary from "cloudinary"
import multer from "multer";


// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret:process.env.CLOUDINARY_API_SECRET,
// })

cloudinary.config({
  cloud_name: "dc0poqt9l",
  api_key: "624216876378923",
  api_secret: "rEb4aQiEt5my3nIp8PZ38J9X4vU",
})




const storage = multer.memoryStorage(); 
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("pictures", 15); 


const datingRoute = express.Router();


datingRoute.get("/dating_dashboard", verifyToken, async (req, res) => {
    const profileId = req.user.id; 
  
    try {
      
      const profile = await Profile.findOne({ userId: profileId });
      if (!profile) {
        return res.status(404).json({
          status: false,
          message: "Your profile is not found"
        });
      }
  
      
      const datingProfile = await Dating.findOne({ profileId: profile._id })
        .populate("profileId", "userEmail firstName lastName");
  
 
      if (!datingProfile) {
        return res.status(404).json({
          status: false,
          message: "You have not created a dating profile yet"
        });
      }
  
     
      return res.status(200).json({
        status: true,
        message: "Dashboard data retrieved successfully",
        data: {
          profile: {
            userEmail: profile.userEmail,
            firstName: profile.firstName,
            lastName: profile.lastName,
            state: profile.state,
            dateOfBirth: profile.dateOfBirth,
            gender: profile.gender,
            maritalStatus: profile.maritalStatus,
            interest: profile.interest,
            nationality: profile.nationality,
            profilePicture: profile.profilePicture,
            skinColor: profile.skinColor,
            EyeColor: profile.EyeColor,
            slug: profile.slug
          },
          datingProfile: {
            genotype: datingProfile.genotype,
            hobbies: datingProfile.hobbies,
            occupation: datingProfile.occupation,
            bloodgroup: datingProfile.bloodgroup,
            pictures: datingProfile.pictures,
            admirers: datingProfile.admirers,
            slug: datingProfile.slug
           
          }
        }
      });
    } catch (error) {
      console.error("Error fetching dating dashboard:", error);
      return res.status(500).json({
        status: false,
        message: "Server error occurred",
        error: error.message
      });
    }
  });



  datingRoute.post("/create_datingdata", verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { genotype, hobbies: hobbiesInput, occupation, bloodGroup, pictures } = req.body;
  
    try {

   
    
      const profile = await Profile.findOne({ userId });
      if (!profile) {
        return res.status(404).json({
          status: false,
          message: "Profile not found"
        });
      }
      const profileId = profile._id;
  
    
      const existingDatingProfile = await Dating.findOne({ profileId });
      if (existingDatingProfile) {
        return res.status(400).json({
          status: false,
          message: "Dating profile already exists for this user"
        });
      }
  
      let hobbies = Array.isArray(hobbiesInput)
        ? hobbiesInput
        : typeof hobbiesInput === "string" && hobbiesInput.trim()
        ? [hobbiesInput.trim()]
        : [];
  
  
      if (hobbies.length === 0) {
        return res.status(400).json({
          status: false,
          message: "Hobbies cannot be empty"
        });
      }
  
      const validHobbies = hobbies.every(hobby =>
        typeof hobby === "string" && hobby.trim().length > 0
      );
      if (!validHobbies) {
        return res.status(400).json({
          status: false,
          message: "All hobbies must be non-empty strings"
        });
      }
  
   
      let pictureUrls = [];
      if (pictures && Array.isArray(pictures) && pictures.length > 0) {
        if (pictures.length > 15) {
          return res.status(400).json({
            status: false,
            message: "Maximum of 15 pictures allowed"
          });
        }
  
        const uploadPromises = pictures.map(base64String =>
          new Promise((resolve, reject) => {
            if (!base64String.startsWith("data:image/")) {
              return reject(new Error("Invalid image format"));
            }
            cloudinary.v2.uploader.upload(
              base64String,
              { resource_type: "image" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
              }
            );
          })
        );
        pictureUrls = await Promise.all(uploadPromises);
      }
  
     
      if (!genotype || !occupation || !bloodGroup) {
        return res.status(400).json({
          status: false,
          message: "Genotype, occupation, and bloodgroup are required"
        });
      }
  
  
      const datingUser = new Dating({
        profileId,
        genotype,
        hobbies: hobbies.map(hobby => hobby.trim()),
        occupation,
        bloodGroup,
        pictures: pictureUrls,
      });
  
      await datingUser.save();
  
      // Step 8: Send response
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


  datingRoute.get("/get-datingusers", verifyToken, async (req, res) => {
    try {
      const userId = req.user.id; 
  
    
      const user = await User.findOne({ _id: userId });
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found"
        });
      }

      const authProfile = await Profile.findOne({ userId });
      if (!authProfile) {
        return res.status(404).json({
          status: false,
          message: "Your profile not found"
        });
      }
      const authProfileId = authProfile._id; 
  

      const authDatingProfile = await Dating.findOne({ profileId: authProfileId });
      const admirerProfileIds = authDatingProfile ? authDatingProfile.admirerList : [];
  
   
      const datingData = await Dating.find({
        profileId: { $ne: authProfileId, $nin: admirerProfileIds } 
      })
        .populate("profileId", "userEmail firstName lastName") 
        .select("-admirerList -pendingInvitations -acceptedInvitations -chatList"); 
  
  
      return res.status(200).json({
        status: true,
        message: "All other users with dating profiles (excluding admirers)",
        data: datingData.map(profile => ({
          slug: profile.slug,
          genotype: profile.genotype,
          hobbies: profile.hobbies,
          occupation: profile.occupation,
          bloodgroup: profile.bloodgroup,
          pictures: profile.pictures,
          admirers: profile.admirers,
          profile: {
            userEmail: profile.profileId.userEmail,
            firstName: profile.profileId.firstName,
            lastName: profile.profileId.lastName
          }
        }))
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
        if (!datingData ) {
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



datingRoute.post("/admire", verifyToken, async (req, res) => {
    try {
      const { slug } = req.body; 
      const userId = req.user.id; 
   
      if (!slug || typeof slug !== "string" || slug.trim() === "") {
        return res.status(400).json({
          status: false,
          message: "Slug is required and must be a non-empty string"
        });
      }
  
 
      const admirerProfile = await Profile.findOne({ userId });
      if (!admirerProfile) {
        return res.status(404).json({
          status: false,
          message: "Your profile not found"
        });
      }
      const admirerProfileId = admirerProfile._id; 
  
   
      const datingProfile = await Dating.findOne({ slug });
      if (!datingProfile) {
        return res.status(404).json({
          status: false,
          message: "Dating profile not found"
        });
      }
  
  
      if (datingProfile.admirerList.includes(admirerProfileId)) {
        return res.status(400).json({
          status: false,
          message: "You have already admired this profile"
        });
      }
  
  
      datingProfile.admirers += 1;
      datingProfile.admirerList.push(admirerProfileId);
      await datingProfile.save();

      return res.status(200).json({
        status: true,
        message: "Profile admired successfully",
        data: {
          admirers: datingProfile.admirers,
          admirerList: datingProfile.admirerList
        }
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "An error occurred with the server",
        error: error.message
      });
    }
  });


  datingRoute.get("/get_my_admirers", verifyToken, async (req, res) => { 
    try {
      const userId = req.user.id; 
  
    
      const myProfile = await Profile.findOne({ userId });
      if (!myProfile) {
        return res.status(404).json({
          status: false,
          message: "Your profile not found"
        });
      }
      const profileId = myProfile._id; 
  

      const authDatingProfile = await Dating.findOne({ profileId });
      if (!authDatingProfile) {
        return res.status(404).json({
          status: false,
          message: "You have not created a dating profile yet"
        });
      }
  
      const admirersDatingProfiles = await Dating.find({
        admirerList: profileId 
      })
        .populate("profileId", "firstName lastName userEmail") 
        .select("-admirerList -pendingInvitations -acceptedInvitations -chatList"); 
  
      if (!admirersDatingProfiles.length) {
        return res.status(200).json({
          status: true,
          message: "No users have admired you yet",
          data: {
            admirersCount: 0,
            admirers: []
          }
        });
      }
  
      const admirers = admirersDatingProfiles.map(datingProfile => ({
        id: datingProfile.profileId._id,
        name: `${datingProfile.profileId.firstName} ${datingProfile.profileId.lastName}`,
        email: datingProfile.profileId.userEmail,
        slug: datingProfile.slug,
        occupation: datingProfile.occupation,
        hobbies: datingProfile.hobbies,
        pictures: datingProfile.pictures 
      }));
  
    
      return res.status(200).json({
        status: true,
        message: "Admirers retrieved successfully",
        data: {
          admirersCount: admirers.length, 
          admirers: admirers 
        }
      });
    } catch (error) {
      console.error("Error fetching admirers:", error);
      return res.status(500).json({
        status: false,
        message: "Server error occurred"
      });
    }
  });

//send invitation
datingRoute.post("/invite/:slug", verifyToken, async(req, res) => {
    try {
        const {slug} = req.params;
        const senderProfileId = req.user.id

        const recipientProfile = await Dating.findOne({slug});
        if(!recipientProfile){
            return res.status(404).json({
                status: false,
        message: "Dating profile not found"
            })
        }

        if(recipientProfile.profileId.toString() === senderProfileId){
            return res.status(400).json({
                status: false,
                message: "you cannot send an invitation to yourself"
            })
        }

        if(recipientProfile.pendingInvitations.includes(senderProfileId) || 
        recipientProfile.acceptedInvitations.includes(senderProfileId) ){
            return res.status(400).json({
                status: false,
                message:"Invitation already sent or accepted"
            })
        }

        recipientProfile.pendingInvitations.push(senderProfileId);
        await recipientProfile.save();

        return res.status(200).json({
           status: true,
      message: "Invitation sent successfully" 
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
      message: "Server error occurred",
 error
        })
        
    }
})


//accept or reject invitation

datingRoute.post("/respond-invitation/:slug", verifyToken, async (req, res) => {
    try {
      const { slug } = req.params;
      const userProfileId = req.user.id;
      const { senderProfileId, action } = req.body;
  
      if (!["accept", "reject"].includes(action)) {
        return res.status(400).json({
          status: false,
          message: "Action must be 'accept' or 'reject'"
        });
      }
  
      const userProfile = await Dating.findOne({ profileId: userProfileId });
      if (!userProfile || userProfile.slug !== slug) {
        return res.status(404).json({
          status: false,
          message: "Dating profile not found or unauthorized"
        });
      }
  
      const invitationIndex = userProfile.pendingInvitations.indexOf(senderProfileId);
      if (invitationIndex === -1) {
        return res.status(400).json({
          status: false,
          message: "No pending invitation from this user"
        });
      }
  
      if (action === "accept") {
        const conversation = new Conversation({
          participants: [userProfileId, senderProfileId]
        });
        await conversation.save();
  
        userProfile.pendingInvitations.splice(invitationIndex, 1);
        userProfile.acceptedInvitations.push(senderProfileId);
        userProfile.chatList.push({ user: senderProfileId, conversationId: conversation._id });
  
        const senderProfile = await Dating.findOne({ profileId: senderProfileId });
        if (!senderProfile) {
          return res.status(404).json({
            status: false,
            message: "Sender profile not found"
          });
        }
        senderProfile.chatList.push({ user: userProfileId, conversationId: conversation._id });
  
        await Promise.all([userProfile.save(), senderProfile.save()]);
      } else if (action === "reject") {
        userProfile.pendingInvitations.splice(invitationIndex, 1);
        await userProfile.save();
      }
  
      return res.status(200).json({
        status: true,
        message: `Invitation ${action}ed successfully`
      });
    } catch (error) {
      console.error("Error responding to invitation:", error);
      return res.status(500).json({
        status: false,
        message: "Server error occurred",
        error: error.message
      });
    }
  });

datingRoute.get("/invitation", verifyToken, async(req, res) => {
    try {
        const userProfileId = req.user.id;

        const userProfile = await Dating.findOne({profileId: userProfileId})
        .populate("pendingInvitations", "firstName lastName")
        .populate("acceptedInvitations", "firstName lastName")
        .exec();
        if (!userProfile) {
            return res.status(404).json({
              status: false,
              message: "Dating profile not found"
            });
          }
          const pending = userProfile.pendingInvitations.map(user => ({
            id: user._id,
            name: `${user.firstName} ${user.lastName}`
          }));
          const accepted = userProfile.acceptedInvitations.map(user => ({
            id: user._id,
            name: `${user.firstName} ${user.lastName}`
          }));

          return res.status(200).json({
            status: true,
            message: "Invitations retrieved successfully",
            data: {
              pendingInvitations: pending,
              acceptedInvitations: accepted
            }
          });
    } catch (error) {
        console.error("Error retrieving invitations:", error);
    return res.status(500).json({
      status: false,
      message: "Server error occurred",
      error: error.message
    });
    }
})


datingRoute.get("/coversation/:conversationId", verifyToken, async(req, res) => {
    try {
        const {conversationId} = req.params;
        const userId = req.user.id;

        const conversation = await Conversation.findById(conversationId).populate("participants", "firstName lastName").exec()
        if(!conversation || !conversation.participants.some(p => p._id.toString() === userId)){
            return res.status(403).json({
                status: false,
                message: "unauthorized or conversation not found"
            })
        }
        return res.status(200).json({
            status: true,
            message: "conversation retrieved successfully",
            data:{
                participants: conversation.participants.map(p => ({
          id: p._id,
          name: `${p.firstName} ${p.lastName}`
        })),
        messages: conversation.messages
            }
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Server error",
            error: error.message
          })
    }
})


datingRoute.post("/end-chat/:conversationId", verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { conversationId } = req.params;
  
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ status: false, message: "Unauthorized" });
    }
  
    await Promise.all([
      Dating.updateOne({ profileId: userId }, { $pull: { "chatList": { conversationId } } }),
      Dating.updateOne(
        { profileId: { $in: conversation.participants, $ne: userId } },
        { $pull: { "chatList": { conversationId } } }
      )
    ]);
  
  
  
    return res.status(200).json({ status: true, message: "Chat ended" });
  });



//interest matches

datingRoute.get("/match/:slug", verifyToken, async(req, res) =>{
    try {
        const userAUserId = req.user.id; 
        const { slug } = req.params;

        const userAProfile = await Profile.findOne({ userId: userAUserId });
    if (!userAProfile) {
      return res.status(404).json({
        status: false,
        message: "Your profile is not found"
      });
    }

    const userBDatingProfile = await Dating.findOne({ slug });
    if (!userBDatingProfile) {
      return res.status(404).json({
        status: false,
        message: "Target user's dating profile not found"
      });
    }

    const userBProfile = await Profile.findOne({ _id: userBDatingProfile.profileId });
    if (!userBProfile) {
      return res.status(404).json({
        status: false,
        message: "Target user's profile not found"
      });
    }

 
    const userAInterests = userAProfile.interest; 
    const userBInterests = userBProfile.interest;

    const matchingInterests = userAInterests.filter(interest =>
        userBInterests.includes(interest)
      ); 
  
   
      const matchCount = matchingInterests.length;
      const totalPossibleMatches = Math.max(userAInterests.length, userBInterests.length); 
      const basePercentagePerMatch = 20; 
      const matchPercentage = Math.min(
        matchCount * basePercentagePerMatch,
        100
      );

      return res.status(200).json({
        status: true,
        message: "Match calculated successfully",
        data: {
          userA: {
            firstName: userAProfile.firstName,
            lastName: userAProfile.lastName,
            interests: userAInterests
          },
          userB: {
            firstName: userBProfile.firstName,
            lastName: userBProfile.lastName,
            interests: userBInterests,
            datingSlug: userBDatingProfile.slug
          },
          match: {
            percentage: matchPercentage,
            matchingInterests: matchingInterests
          }
        }
      });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status:false,
            message: "an error occurred from server"
           
        })
    }
})




export default datingRoute;