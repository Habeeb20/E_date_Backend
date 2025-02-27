import express from "express";
import cors from "cors"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import connectDb from "./db.js";
import morgan from "morgan";
import multer from "multer";
import bodyParser from "body-parser";
import authRouter from "./route/user/auth.route.js";

import profilerouter from "./route/user/profile.route.js";
import datingRoute from "./route/dating/dating.route.js";



dotenv.config();


connectDb()


const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true })); 
app.use(multer().any()); 


app.use(cors("*"))
app.use(bodyParser.json())
app.use(morgan('dev'))
app.use(cookieParser()); 


const PORT =2000


app.use("/api/v1", authRouter)
app.use("/api/v1", profilerouter)
app.use("/api/v1", datingRoute)



 // Start server
 app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

app.get("/", (req, res) => {
    res.json("the api for e_dates is perfectly working right now.......")
  })