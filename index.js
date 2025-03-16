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
import http from "http";
import { Server } from "socket.io";
import { createServer } from "http";
import Conversation from "./models/Dating/conversation.schema.js";
import coupleRoute from "./route/couples/coupleRoute.js";
import fileUpload from "express-fileupload"
import { setupSocket } from "./socket.js";
dotenv.config();


connectDb();

const app = express();



app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(multer().any()); 
app.use(cors({ origin: "*" })); 
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cookieParser());
// app.use(fileUpload({
//   useTempFiles: true,
//   tempFileDir: "/tmp/",
//   limits: { fileSize: 50 * 1024 * 1024 }, 
//   abortOnLimit: true,
// }))

app.use("/api/v1", authRouter);
app.use("/api/v1", profilerouter);
app.use("/api/v1", datingRoute);
app.use("/api/v1", coupleRoute)


app.get("/", (req, res) => {
  res.json("The API for E-Dates is perfectly working right now...");
});


const server = http.createServer(app);


const io = setupSocket(server);




const PORT = process.env.PORT || 2000; 
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});