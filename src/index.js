import dotenv from "dotenv";
import express from "express";
import {app} from './app.js'


dotenv.config();

import connectDB from "./db/index.js";


connectDB()
    .then(() => {
        app.listen(process.env.PORT||8000,()=>{
            console.log(`Server is running on port ${process.env.PORT||8000}`);
        })
        
    })
    .catch((err) => {
        console.log("MONGO connection fail",err);
    });