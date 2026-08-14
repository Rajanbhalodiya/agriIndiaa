import express from 'express';
import { 
  addAdvisor, 
  allAdvisors, 
  loginAdmin, 
  adminDashboard, 
  allFarmers, 
  productOrdersAdmin, 
  updateProductOrderStatus, 
  updateFarmerAdmin, 
  updateAdvisorAdmin, 
  getAdvisorLocationsAdmin, 
  getAdminProfile, 
  updateAdminProfile 
} from '../controllers/adminController.js';
import upload from '../middlewares/multer.js';
import authAdmin from '../middlewares/authAdmin.js';
import { changeAvailability } from '../controllers/advisorController.js';

const adminRouter = express.Router();

adminRouter.post('/login', loginAdmin);

// Protected Admin Routes
adminRouter.post('/add-advisor', authAdmin, addAdvisor);
adminRouter.get('/profile', authAdmin, getAdminProfile);
adminRouter.post('/update-profile', authAdmin, updateAdminProfile);
adminRouter.post('/all-advisors', authAdmin, allAdvisors);
adminRouter.post('/all-farmers', authAdmin, allFarmers);
adminRouter.post('/change-availability', authAdmin, changeAvailability);
adminRouter.get('/dashboard', authAdmin, adminDashboard);
adminRouter.get('/product-orders', authAdmin, productOrdersAdmin);
adminRouter.post('/update-product-order-status', authAdmin, updateProductOrderStatus);
adminRouter.post('/update-farmer', authAdmin, upload.single('image'), updateFarmerAdmin);
adminRouter.post('/update-advisor', authAdmin, upload.single('image'), updateAdvisorAdmin);
adminRouter.get('/advisor-locations', authAdmin, getAdvisorLocationsAdmin);

export default adminRouter;
