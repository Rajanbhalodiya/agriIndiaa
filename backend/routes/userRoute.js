import express from 'express'
import { registerUser, loginUser, getProfile, updateProfile, forgotPasswordVerify, verifyOtp, resetPassword } from '../controllers/userController.js'
import authUser from '../middlewares/authuser.js'
import upload from '../middlewares/multer.js'

const userRouter = express.Router() 

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/forgot-password', forgotPasswordVerify)
userRouter.post('/verify-otp', verifyOtp)
userRouter.post('/reset-password', resetPassword)

userRouter.get('/get-profile', authUser, getProfile)
userRouter.post('/update-profile', upload.single('image'), authUser, updateProfile)

export default userRouter

