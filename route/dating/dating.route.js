import express from "express";
import Dating from "../../models/Dating/datingModel.js";
import Profile from "../../models/user/profile.schema.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import User from "../../models/user/auth.schema.js"
import Conversation from "../../models/Dating/conversation.schema.js";
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



datingRoute.post("/admire/:slug", verifyToken,  async(req, res) => {
    try {
        const {slug} = req.params;
        const admirerProfileId = req.user.id;

        const datingProfile = await Dating.findOne({ slug });
    if (!datingProfile) {
      return res.status(404).json({
        status: false,
        message: "Dating profile not found"
      });
    }


    if(datingProfile.admirerList.includes(admirerProfileId)){
        return res.status(400).json({
            status: false,
            message: "You have already admired this profile"
          });
    }

    datingProfile.admirers +=1;
    datingProfile.admirerList.push(admirerProfileId)
    await datingProfile.save()

    return res.status(200).json({
        status: true,
        message: "Profile admired successfully",
        data: {
          admirers: datingProfile.admirers,
          admirerList: datingProfile.admirerList
        }
      })
    } catch (error) {
        console.log(error)
        res.status(500).json({message: " an error occurred with the server",
            error: error.message})
    }
})



datingRoute.get("/admirers/:slug", async(req, res) =>  {
    try {
        const {slug} = req.params;

        const dating = await Dating.findOne({slug}).populate("admirerList", "firstName lastName").exec()

        if(!dating) {
            return res.status(404).json({message: "admirer not found"})
        }
        const admireDetails = dating.admirerList.map(admirer => ({
            id: admirer._id,
            name:`${admirer.firstName}`
        }))

        return res.status(200).json({
            status: true,
            message: "admirers retrieved successfully",
            data:{
                admireDetails: dating.admirers,
                admirers: admireDetails
            }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "server error", error})
    }
})




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
                message: "you cannot send an invitation to youself"
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

datingRoute.post("/respond-invitation/:slug", verifyToken, async( req, res) => {
    try {
        const {slug} = req.params;
        const userProfileId =req.user.id;

        const {senderProfileId, action} = req.body;

        if(!["accept", "reject"].includes(action)){
            return res.status(400).json({
                status:false,
                message: "Action must be 'accept' or 'reject' "
            })
        }

        const userProfile = await DatingFindOne({profileId: userProfileId})
        if(!userProfile || userProfile.slug !== slug){
            return res.status(404).json({
                status: false,
                message: "Dating profile not found or unauthorized"
            })
        }

        const invitationIndex = userProfile.pendingInvitations.indexOf(senderProfileId)
        if(invitationIndex === -1) {
            return res.status(400).json({
                status:false,
                message: 'no pending invitation from this user'
            })
        }

        if(action === "accept"){
            const conversation = new Conversation({
                participants:[userProfileId, senderProfileId]
            })

            await conversation.save()
            userProfile.pendingInvitations.splice(invitationIndex, 1);
            userProfile.acceptedInvitations.push(senderProfileId);
            userProfile.chatList.push({ user: senderProfileId, conversationId: conversation._id });

            const senderProfile = await Dating.findOne({profileId: senderProfileId})
            if(!senderProfile){
                return res.status(404).json({
                   status: false,
                   message: "sender profile not found" 
                })
            }
            senderProfile.chatList.push({user: userProfileId, conversationId: conversation._id})

            await Promise.all([userProfile.save(), senderProfile.save()]);
        } else if(action === "reject") {
            userProfile.pendingInvitations.splice(invitationIndex, 1)
            await userProfile.save()
        }

        await userProfile.save()

        return res.status(200).json({
            status: true,
            message: 'invitation ${action}ad successfully'
        })
    } catch (error) {
        console.error("Error responding to invitation:", error);
    return res.status(500).json({
      status: false,
      message: "Server error occurred",
      error: error.message
    });
    }
})


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
export default datingRoute;