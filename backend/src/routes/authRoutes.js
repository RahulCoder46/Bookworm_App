import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (userId) => {
   return jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: "15d"});
}

router.post("/register", async(req, res) =>{
    try {
        const {email, username, password} = req.body;

        if(!username || !password || !email){
            return res.status(400).json({message: "All fields are required"});
        }

        if(password.length < 6){
            return res.status(400).json({message: "Password must be at least 6 characters long"});
        }

        if(username.length < 3){
            return res.status(400).json({message: "Username must be at least 3 characters long"});
        }

        // Check if user already exists

        // const existingUser = User.findOne({$or :[{email}, {username}]});

        const existingEmail = await User.findOne({email});
        if(existingEmail){
            return res.status(400).json({message: "Email already exists"});
        }

        const existingUsername = await User.findOne({username});
        if(existingUsername){
            return res.status(400).json({message: "Username already exists"});
        }

        //get random avatars from api
        const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
        
        const user = new User({
            email,
            password,
            username,
            profileImage
        })

        await user.save();

        const token = generateToken(user._id);
        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                profileImage: user.profileImage
            }
        })
    } catch (error) {
        console.log("Error in register route", error);
        res.status(500).json({message: "Internal server error"});
    }
});


router.post("/login", async(req, res) =>{
    try {
        const {email, password} = req.body;
        console.log(email, password);
        if(!email || !password) return res.status(400).json({message: "All fields are required"});

        const user = await User.findOne({email});
        if(!user) return res.status(400).json({message: "Invalid Credentials"});

        //check if hashed password is correct
        const isPasswordCorrect = await user.comparePassword(password);
        if(!isPasswordCorrect) return res.status(400).json({message: "Invalid Credentials"});
        
        const token = generateToken(user._id);
        res.status(200).json({
            token,
            user:{
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage
            }
        })
    } catch (error) {
        console.log("Error in login route", error);
        res.status(500).json({message: "Internal server error"});
    }
});

export default router;