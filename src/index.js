import dotenv from "dotenv";
import express from "express";

dotenv.config();

import connectDB from "./db/index.js";

const app = express();

connectDB()
    .then(() => {
        app.listen(process.env.PORT||8000,()=>{
            console.log(`Server is running on port ${process.env.PORT||8000}`);
        })
        
    })
    .catch((err) => {
        console.log("MONGO connection fail",err);
    });