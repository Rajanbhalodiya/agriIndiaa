import express from 'express'
import { addAdvisor, allAdvisors, loginAdmin, adminDashboard, allFarmers, productOrdersAdmin, updateProductOrderStatus, updateFarmerAdmin, updateAdvisorAdmin, getAdvisorLocationsAdmin, sendResetOtpAdmin, resetPasswordAdmin, getAdminProfile, updateAdminProfile } from '../controllers/adminController.js'
import upload from '../middlewares/multer.js'
import authAdmin from '../middlewares/authAdmin.js'
import { changeAvailability } from '../controllers/advisorController.js'

const adminRouter = express.Router()

adminRouter.post('/add-advisor', authAdmin, addAdvisor)
adminRouter.post('/login', loginAdmin)
adminRouter.post('/send-reset-otp', sendResetOtpAdmin)
adminRouter.post('/reset-password', resetPasswordAdmin)
adminRouter.get('/profile', authAdmin, getAdminProfile)
adminRouter.post('/update-profile', authAdmin, updateAdminProfile)
adminRouter.post('/all-advisors', authAdmin, allAdvisors)
adminRouter.post('/all-advisores', authAdmin, allAdvisors) // backward compatibility
adminRouter.post('/all-farmers', authAdmin, allFarmers)
adminRouter.post('/change-availability', authAdmin, changeAvailability)
adminRouter.get('/dashboard', authAdmin, adminDashboard)
adminRouter.get('/product-orders', authAdmin, productOrdersAdmin)
adminRouter.post('/update-product-order-status', authAdmin, updateProductOrderStatus)
adminRouter.post('/update-farmer', authAdmin, updateFarmerAdmin)
adminRouter.post('/update-advisor', authAdmin, updateAdvisorAdmin)
adminRouter.get('/advisor-locations', authAdmin, getAdvisorLocationsAdmin)

export default adminRouter

