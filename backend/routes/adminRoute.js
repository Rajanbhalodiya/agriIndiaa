import express from 'express'
import { addadvisor, alladvisores, loginAdmin, ordersAdmin, orderCancel, adminDashboard, allFarmers, productOrdersAdmin, updateProductOrderStatus } from '../controllers/adminController.js'
import upload from '../middlewares/multer.js'
import authAdmin from '../middlewares/authAdmin.js'
import { changeAvailability } from '../controllers/advisorController.js'

const adminRouter = express.Router()

adminRouter.post('/add-advisor', authAdmin, upload.single('image'), addadvisor)
adminRouter.post('/login', loginAdmin)
adminRouter.post('/all-advisores', authAdmin, alladvisores)
adminRouter.post('/all-farmers', authAdmin, allFarmers)
adminRouter.post('/change-availability', authAdmin, changeAvailability)
adminRouter.get('/orders', authAdmin, ordersAdmin)
adminRouter.post('/cancel-order', authAdmin, orderCancel)
adminRouter.get('/dashboard', authAdmin, adminDashboard)
adminRouter.get('/product-orders', authAdmin, productOrdersAdmin)
adminRouter.post('/update-product-order-status', authAdmin, updateProductOrderStatus)

export default adminRouter
