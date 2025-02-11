// import dotenv from "dotenv"
// dotenv.config({ path: "./.env" });
import {app} from './app.js'

// "scripts": {
//     "dev": "nodemon src/index.js"
//    },

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