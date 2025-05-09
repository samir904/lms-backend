import express from "express";
import cors from "cors"; 
import cookieParser from "cookie-parser";
import { model } from "mongoose";
import userRoutes from './routes/user.routes.js'
import courseRoute from "./routes/course.routes.js"
import paymentRoute from "./routes/payment.routes.js"
import {config} from 'dotenv';
import morgan from "morgan";
import errorMiddleware from "./middlewares/error.middleware.js";
config();

 const app = express();
 

 app.use(express.json());
 app.use(express.urlencoded({extended:true}))

 app.use(
   cors({
     origin: "http://localhost:5173",
     credentials: true,
     methods: ["GET", "POST", "PUT", "DELETE"],
     allowedHeaders: ["Content-Type"],
   })
 );
 

 app.use(cookieParser());
 app.use(morgan('dev'));

 app.get("/ping",(req,res)=>{
    res.send("pong")
 });


 
 app.use("/api/v1/user",userRoutes);
 app.use("/api/v1/courses",courseRoute);
 app.use("/api/v1/payments",paymentRoute)


 app.use(errorMiddleware);
 

 export default app;