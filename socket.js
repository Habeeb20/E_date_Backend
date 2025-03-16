import { Server } from "socket.io";
import CoupleConversation from "./models/couples/coupleConversation.js";
 export const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        // Join a conversation room
        socket.on("join room", ({ conversationId, userId }) => {
            socket.join(conversationId);
            console.log(`User ${userId} joined room: ${conversationId}`);
        });

        // Handle chat message
        socket.on("chat message", async ({ conversationId, senderId, content }) => {
            try {
            
                const conversation = await CoupleConversation.findOne({ _id: conversationId });
                if (!conversation) {
                    console.log("Conversation not found");
                    return;
                }

                // Add message to conversation
                conversation.messages.push({
                    sender: senderId,
                    content,
                    read: false,
                });
                await conversation.save();

                // Broadcast message to room (excluding sender)
                socket.to(conversationId).emit("chat message", {
                    senderId,
                    content,
                    timestamp: new Date(),
                });
            } catch (error) {
                console.error("Error handling chat message:", error);
            }
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
};


