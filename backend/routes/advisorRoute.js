import express from 'express';
import { 
  advisorList, 
  loginAdvisor, 
  registerAdvisor,
  ordersAdvisor, 
  orderCompleted, 
  orderCancel, 
  advisorDashboard, 
  advisorProfile, 
  updateAdvisorProfile,
  addFarmer,
  advisorFarmers,
  getFarmer,
  forgotPasswordAdvisor,
  resetPasswordAdvisor,
  sendAdvisorOTP,
  verifyAdvisorOTP
} from '../controllers/advisorController.js';
import authAdvisor from '../middlewares/authAdvisor.js';

const advisorRouter = express.Router();

advisorRouter.get('/list', advisorList);
advisorRouter.post('/login', loginAdvisor);
advisorRouter.post('/register', registerAdvisor);
advisorRouter.post('/send-otp', sendAdvisorOTP);
advisorRouter.post('/verify-otp', verifyAdvisorOTP);
advisorRouter.post('/forgot-password', forgotPasswordAdvisor);
advisorRouter.post('/reset-password', resetPasswordAdvisor);

// Protected Advisor routes
advisorRouter.use(authAdvisor);

advisorRouter.get('/appointments', ordersAdvisor);
advisorRouter.post('/complete-appointment', orderCompleted);
advisorRouter.post('/cancel-appointment', orderCancel);
advisorRouter.get('/dashboard', advisorDashboard);
advisorRouter.get('/profile', advisorProfile);
advisorRouter.post('/update-profile', updateAdvisorProfile);
advisorRouter.post("/add-farmer", authAdvisor, addFarmer)
advisorRouter.get("/farmers", authAdvisor, advisorFarmers)
advisorRouter.post("/farmer", authAdvisor, getFarmer)

export default advisorRouter;
