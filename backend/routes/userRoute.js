import express from 'express'
import { registerUser,loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, verifyRazorpay, forgotPasswordVerify, verifyOtp, resetPassword } from '../controllers/userController.js'
import authUser from '../middlewares/authuser.js'
import upload from '../middlewares/multer.js'

const userRouter = express.Router() 

userRouter.post('/register',registerUser)
userRouter.post('/login',loginUser)
userRouter.post('/forgot-password',forgotPasswordVerify)
userRouter.post('/verify-otp',verifyOtp)
userRouter.post('/reset-password',resetPassword)

userRouter.get('/get-profile',authUser,getProfile)
userRouter.post('/update-profile',upload.single('image'),authUser,updateProfile)
userRouter.post('/book-order',authUser,bookAppointment)
userRouter.get('/orders',authUser,listAppointment)
userRouter.post('/cancel-order',authUser,cancelAppointment)
userRouter.post('/payment-razorpay',authUser,paymentRazorpay)
userRouter.post('/verifyRazorpay',authUser,verifyRazorpay)

export default userRouter
