import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDb from "./db.js";
import morgan from "morgan";
import multer from "multer";
import bodyParser from "body-parser";
import authRouter from "./route/user/auth.route.js";
import profilerouter from "./route/user/profile.route.js";
import datingRoute from "./route/dating/dating.route.js";
import { Server } from "socket.io";
import { createServer } from "http";
import Conversation from "./models/Dating/conversation.schema.js";

dotenv.config();


connectDb();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*" 
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(multer().any()); 
app.use(cors({ origin: "*" })); 
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cookieParser());


app.use("/api/v1", authRouter);
app.use("/api/v1", profilerouter);
app.use("/api/v1", datingRoute);

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join
  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  //typing

  socket.on("typing", ({conversationId}) => {
    socket.to(conversationId).emit("userTyping", {userId: socket.userId})
  })

  // Send a message
  socket.on("sendMessage", async ({ conversationId, senderId, content }) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(senderId)) {
        socket.emit("error", { message: "Invalid conversation or unauthorized" });
        return;
      }

      const message = { sender: senderId, content, timestamp: new Date() };
      conversation.messages.push(message);
      await conversation.save(); 

   
      io.to(conversationId).emit("newMessage", message);
    } catch (error) {
      socket.emit("error", { message: error.message });
    }
  });

  socket.on("markAsRead", async ({ conversationId, messageId }) => {
    const conversation = await Conversation.findById(conversationId);
    if (conversation && conversation.participants.includes(socket.userId)) {
      const message = conversation.messages.id(messageId);
      if (message) {
        message.read = true;
        await conversation.save();
        io.to(conversationId).emit("messageRead", { messageId });
      }
    }
  });



  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });


});


app.get("/", (req, res) => {
  res.json("The API for E-Dates is perfectly working right now...");
});


const PORT = process.env.PORT || 2000; 
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});