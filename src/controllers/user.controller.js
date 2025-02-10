import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import{User} from "../models/user.models.js";
import{uploadOnCloudinary} from "../utils/cloudinary.js";
import{ApiResponse} from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
   const{fullName, email,username,password}=req.body;
   console.log("email:",email);
   if([fullName, email, username, password].some((field)=>field?.trim()==="")){
         throw new ApiError(400, "All fields are required");
   }

   const existedUser=User.findOne({
      $or:[{username},{email}]
   })
   if(existedUser){
      throw new ApiError(409, "User already existed");
   }

      const avatarLocalPath=req.files?.avatar[0]?.path;
      const coverImageLocalPath=req.files?.coverImage[0]?.path;

      if (!avatarLocalPath) {
          throw new ApiError(400, "Avatar are required");
         }

        const avatar=await uploadOnCloudinary(avatarLocalPath)
        const coverImage= await uploadOnCloudinary(coverImageLocalPath)
         if(!avatar ){
               throw new ApiError(400, "Avatar file is required");
         }


        const user=await User.create({
               fullName,
               email,
               username:username.toLowerCase(),
               password,
               avatar:avatar.url,
               coverImage:coverImage?.url || "",
         })

        const createdUser =await User.findById(user._id).select("-password -refreshToken" )

        if (!createdUser) {
            throw new ApiError(500, "User not created");
        }

        return res.status(201).json(
            new ApiResponse(200, createdUser, "User created successfully")
        )

})

export { registerUser, }
