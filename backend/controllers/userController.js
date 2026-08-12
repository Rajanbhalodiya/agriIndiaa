import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'
import advisorModel from '../models/advisorModel.js'
import { sendOTPEmail } from '../config/nodemailer.js'

// API to register user 
const registerUser = async (req , res) => {
    
    try {
      
        const { name, email, password, phone } = req.body

        if( !name || !password || !email || !phone ) {
            return res.json({success:false,message:"Missing Details"})
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({success:false,message:"enter a valid email"})
        }

        // validating phone number
        if (!validator.isMobilePhone(phone)) {
            return res.json({success:false,message:"Please enter a valid phone number"})
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({success:false,message:"Please enter strong password"})
        }
        // hashing user password

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const userData = {
            name,
            email,
            password : hashedPassword,
            phone
        }

        const newUser = new userModel(userData) 
        const user = await newUser.save()

        const token = jwt.sign({id:user._id} , process.env.JWT_SECRET)

        res.json({success:true,token })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message }) // ✅ handle error
    }
}

// API to user login 

const loginUser = async (req , res) => {
    try {
        
        const {email,password} = req.body
        const user = await userModel.findOne({email})

        if (!user) {
            return res.json({ success: false, message: "User does not exist" }) // ✅ handle error
        }

        const isMatch = await bcrypt.compare(password,user.password)

        if (isMatch) {
            const token = jwt.sign({id:user._id},process.env.JWT_SECRET)
            res.json({success:true,token})
        } else {
            res.json({ success:false,message:"Invalid Credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message }) //  handle error
    }
}

// API to get user profile details

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ from middleware
    const userData = await userModel.findById(userId).select("-password");

    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

// API to update user profile details

const updateProfile = async (req, res) => {
    try {

        const { name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({ success:false,message:"Data Missing" })
        } 

        const userId = req.user.id; // ✅ from middleware

        await userModel.findByIdAndUpdate(userId, {name, phone, address:JSON.parse(address),dob,gender})
 
        if(imageFile){

            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path,{resource_type:'image'})
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId,{image:imageURL})
        }

        res.json({ success:true,message:"Profile Updated" })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}


// API for Forgot Password email validation & OTP generation
const forgotPasswordVerify = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.json({ success: false, message: "Email is required" })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()

        // Set OTP expiry to 5 minutes
        const expiry = new Date(Date.now() + 5 * 60 * 1000)

        user.resetOtp = otp
        user.resetOtpExpire = expiry
        await user.save()

        // Send OTP to user email
        await sendOTPEmail(email, otp)

        res.json({ 
            success: true, 
            message: "Verification code (OTP) has been sent to your email address."
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to Verify OTP
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body
        if (!email || !otp) {
            return res.json({ success: false, message: "Email and OTP are required" })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        if (user.resetOtp === '' || user.resetOtp !== otp) {
            return res.json({ success: false, message: "Invalid OTP" })
        }

        if (new Date() > user.resetOtpExpire) {
            return res.json({ success: false, message: "OTP has expired" })
        }

        res.json({ success: true, message: "OTP verified successfully" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to Reset Password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body
        if (!email || !otp || !newPassword) {
            return res.json({ success: false, message: "Missing required fields" })
        }

        if (newPassword.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password (minimum 8 characters)" })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        if (user.resetOtp === '' || user.resetOtp !== otp) {
            return res.json({ success: false, message: "Invalid OTP verification state" })
        }

        if (new Date() > user.resetOtpExpire) {
            return res.json({ success: false, message: "OTP has expired" })
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt)

        user.password = hashedPassword
        user.resetOtp = ''
        user.resetOtpExpire = undefined
        await user.save()

        res.json({ success: true, message: "Password reset successful. Please login with your new password." })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { registerUser, loginUser, getProfile, updateProfile, forgotPasswordVerify, verifyOtp, resetPassword }

