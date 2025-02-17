import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import{User} from "../models/user.model.js";
import{uploadOnCloudinary} from "../utils/cloudinary.js";
import{ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshToken = async(userId)=>{
   try{
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken()
        const refereshToken=user.generateRefreshToken()
         user.refreshToken=refereshToken;
        await user.save({validateBeforeSave:false});
        return {accessToken, refereshToken}
   }catch(error){
      throw new ApiError(500, "Token generation failed");
   }
}


const registerUser = asyncHandler(async (req, res) => {
   // console.log("✅ Received Request Body:", req.body);
   const{fullName, email,username,password}=req.body;
   // console.log("email:",email);
   if([fullName, email, username, password].some((field)=>field?.trim()==="")){
         throw new ApiError(400, "All fields are required");
   }

   const existedUser=await User.findOne({
      $or:[{username},{email}]
   })
   if(existedUser){
      throw new ApiError(409, "User already existed");
   }
   console.log("Files received:", req.files);

   if (!req.files || !req.files.avatar || req.files.avatar.length === 0) {
      throw new ApiError(400, "Avatar file is required");
  }
  const avatarLocalPath = req.files.avatar[0].path;
const coverImageLocalPath = req.files.coverImage ? req.files.coverImage[0]?.path : null;

 
// console.log("Avatar Local Path:", avatarLocalPath);
// console.log("Cover Image Local Path:", coverImageLocalPath);

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

const loginUser=asyncHandler(async(req,res)=>{

   const{email,username,password}=req.body;
   if (!(username || email)) {
      throw new ApiError(400, "Username or email are required"); 
       }
     const user= await User.findOne({
         $or:[{username},{email}]
       })
       if (!user) {
         throw new ApiError(400, "User not found");
       }

      const isPasswordValid= await user.isPasswordCorrect(password);
      if (!isPasswordValid) {
         throw new ApiError(400, "Password is incorrect");
      }

     const{accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id)

 const LoggedInUser=await User.findById(user._id).select("-password -refreshToken")
         const options={
         httpOnly:true,
         secure:true
        }

        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
         new ApiResponse(
            200,{
               user:LoggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
         )
        )
})

const logoutUser=asyncHandler(async(req,res)=>{
           await User.findByIdAndUpdate(req.user._id,{
               $set:{
                  refreshToken:undefined
               }
             },
             {
                  new:true
             }

            
            )
            const options={
               httpOnly:true,
               secure:true
            }
            return res 
            .status(200)
            .clearCookie("accessToken",options)
            .clearCookie("refreshToken",options)
            .json(
               new ApiResponse(200,{}, "User logged out successfully")
            )
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
   const incomingRefreshToken = req.cookies.refreshToken||req.body.refreshToken;
   if (!incomingRefreshToken) {
      throw new ApiError(400, "Refresh Token is required");
   }
  try {
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
   const user=await User.findById(decodedToken._id)
   if (!user) {
       throw new ApiError(400, "Invalid Refresh Token");
   }
 
   if(incomingRefreshToken !==user?.refereshToken){
       throw new ApiError(400, "Refresh Token is expire or used");
   }
 
   const options={
    httpOnly: true,
    secure: true
   }
 
  const{accessToken,newRefreshToken}= await generateAccessAndRefreshToken(user._id)
 
   return res
   .status(200) 
   .cookie("accessToken", accessToken,options)
   .cookie("refereshToken", newRefreshToken, options)
   .json(
    new ApiResponse(200,{accessToken, refreshToken:newRefreshToken},"Access token refreshed")
   )
  } catch (error) {
      throw new ApiError(400, error?.message||"Invalid refresh token")
   
  }
}
)
export { registerUser,loginUser,logoutUser,refreshAccessToken }
