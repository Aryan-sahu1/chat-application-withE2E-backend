// Signup new User

import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs"

export const signup = async (req,res) => {
    const { fullName, email, password, bio } = req.body;
    try {
        if (!fullName || !email || !password || !bio) {
            return resizeBy.json({ success: false, message: "Missing Details" })
        }
        const user = await User.findOne({ email })

        if (user) {
            return res.json({ success: false, message: "Account already exists" })
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({ fullName, email, password: hashedPassword, bio });

        const token = generateToken(newUser._id)
       return res.json({ success: true, userData: newUser, token, message: "Account Created Successfully" })

    } catch (error) { 
       return res.json({ success: false, message: error.message })
    }
}

//Controller to login user

export const login = async (req, res) => {

    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email })

        const ispassswordCorrect = await bcrypt.compare(password, userData.password);

        if (!ispassswordCorrect) {
           return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = generateToken(userData._id)
       return res.json({ success: true, userData, token, message: "Login Successful" });

    } catch (error) {
 
      return res.json({ success: true, message: error.message })
    }
}


// Controller to check if user is authenticated

export const checkAuth = (req, res) => {
   return res.json({ success: true, user: req.user });
}

//Controller to update user profile details

export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body;

        const userId = req.user._id;

        let updatedUser;

        if (!profilePic) {
            updatedUser = await User.findByIdAndUpdate(userId, { bio, fullName }, { new: true })
          
        }
        else {
            const upload = await cloudinary.uploader.upload(profilePic);
            

            updatedUser = await User.findByIdAndUpdate(userId, { profilePic: upload.secure_url, bio, fullName }, { new: true })
        }
       return res.json({ success: true, user: updatedUser })

    } catch (error) {
       return res.json({ success: false, message: error.message })
    }
}

export const savePublicKey = async (req, res) => {

    try {

        const { publicKey } = req.body;

        await User.findByIdAndUpdate(

            req.user._id,

            {
                publicKey
            }

        );

        res.json({

            success: true

        });

    } catch (error) {

        res.json({

            success: false,

            message: error.message

        });

    }

}

export const getPublicKey = async (req, res) => {

    try {

        const user = await User.findById(req.params.id).select("publicKey");

        res.json({

            success: true,

            publicKey: user.publicKey

        });

    }

    catch (error) {

        res.json({

            success: false,

            message: error.message

        });

    }

}