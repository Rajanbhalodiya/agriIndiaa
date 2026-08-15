import express from 'express';
import { 
  advisorList, 
  loginAdvisor, 
  registerAdvisor,
  advisorDashboard, 
  advisorProfile, 
  updateAdvisorProfile,
  addFarmer,
  advisorFarmers,
  getFarmer,
  updateFarmer,
  updateLocationAdvisor,
  changeAdvisorPassword
} from '../controllers/advisorController.js';
import authAdvisor from '../middlewares/authAdvisor.js';
import upload from '../middlewares/multer.js';

const advisorRouter = express.Router();

advisorRouter.get('/list', advisorList);
advisorRouter.post('/login', loginAdvisor);

// Protected Advisor routes
advisorRouter.use(authAdvisor);

advisorRouter.get('/dashboard', advisorDashboard);
advisorRouter.get('/profile', advisorProfile);
advisorRouter.post('/update-profile', upload.single('image'), updateAdvisorProfile);
advisorRouter.post('/change-password', changeAdvisorPassword);
advisorRouter.post('/update-location', updateLocationAdvisor);
advisorRouter.post("/add-farmer", upload.single('image'), addFarmer)
advisorRouter.get("/farmers", advisorFarmers)
advisorRouter.post("/farmer", getFarmer)
advisorRouter.post("/update-farmer", upload.single('image'), updateFarmer)

export default advisorRouter;

