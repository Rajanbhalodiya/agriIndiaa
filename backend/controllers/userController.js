import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'
import advisorModel from '../models/advisorModel.js'
import orderModel from '../models/orderModel.js'
import razorpay from 'razorpay'
import { sendOTPEmail, sendOrderConfirmationEmail } from '../config/nodemailer.js'

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


// API to Book Order
const bookOrder = async (req, res) => {

    try {

        const  { userId, advisorId, slotDate, slotTime, paymentMethod } = req.body // advisorId represents advisorId

        const advisorData = await advisorModel.findById(advisorId).select('-password')

        if (!advisorData.available) {
            return res.json({success:false,message:'Product is out of stock'})
        }

        let slots_booked = advisorData.slots_booked

        // checking for slot availability
        if (slots_booked[slotDate]) {
            slots_booked[slotDate].push(slotTime)
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }
        
        const userData = await userModel.findById(userId).select('-password')

        // check if user has set a valid address
        if (!userData.address || !userData.address.line1 || userData.address.line1.trim() === '') {
            return res.json({ success: false, message: "Please update your delivery address in your profile before booking an order" })
        }

        delete advisorData.slots_booked

        const orderData = {
            userId,
            advisorId: advisorId,
            userData,
            advisorData,
            amount: advisorData.price,
            slotTime,
            slotDate,
            paymentMethod: paymentMethod || 'Online',
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        // save new slot data in advisorData
        await advisorModel.findByIdAndUpdate(advisorId,{slots_booked})

        // Send order confirmation email asynchronously
        sendOrderConfirmationEmail(userData.email, {
            userName: userData.name,
            orderId: newOrder._id,
            productName: advisorData.name,
            amount: newOrder.amount,
            slotDate: newOrder.slotDate,
            slotTime: newOrder.slotTime,
            paymentMethod: newOrder.paymentMethod
        }).catch(err => console.log('Error sending order confirmation email:', err.message));

        res.json({success:true,message:'Order Booked Successfully'})

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}


// API to get user orders for frontend my-appointments page
const listOrders = async (req, res) => {
    try {
        
        const {userId} = req.body
        const orders = await orderModel.find({userId})

        res.json({success:true, orders, appointments: orders})

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to cancel order
const cancelOrder = async (req,res) => {
    try {

        const {userId,appointmentId} = req.body

        const orderData = await orderModel.findById(appointmentId)

        // verifying order ownership
        if (orderData.userId !== userId) {
            return res.json({success:false,message:'Unauthorized Action'})
        }

        await orderModel.findByIdAndUpdate(appointmentId,{cancelled:true})

        // releasing advisor delivery slot
        const {advisorId, slotDate, slotTime} = orderData

        const advisorData = await advisorModel.findById(advisorId)

        let slots_booked = advisorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await advisorModel.findByIdAndUpdate(advisorId,{slots_booked})

        res.json({success:true,message:'Order Cancelled'})
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });   
    }
}

const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

// Api to make payment of order using Razorpay

const paymentRazorpay = async (req,res) => {

    try {

        const { appointmentId } = req.body
        const orderData = await orderModel.findById(appointmentId)
    
        if (!orderData || orderData.cancelled) {
            return res.json({success:false,message:"Order Cancelled or not found"})
        }
    
        // creating options for razorpay payment 
        const options = {
            amount: orderData.amount * 100,
            currency: process.env.CURRENCY,
            receipt: appointmentId,
        }
    
        // creating of an order
        const order = await razorpayInstance.orders.create(options)
    
        res.json({success:true,order})
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });     
    }

}

// API to verify payment of razorpay
const verifyRazorpay = async (req,res) => {
    try {

        const {razorpay_order_id} = req.body
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        if(orderInfo.status === 'paid') {
            await orderModel.findByIdAndUpdate(orderInfo.receipt,{payment:true, paymentDate: Date.now()})
            res.json({success:true,message:"Payment Successful"})
        } else {
            res.json({success:false,message:"Payment Failed"})
        }
        
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

export {registerUser, loginUser , getProfile , updateProfile, bookOrder as bookAppointment, listOrders as listAppointment, cancelOrder as cancelAppointment, paymentRazorpay, verifyRazorpay, forgotPasswordVerify, verifyOtp, resetPassword}

