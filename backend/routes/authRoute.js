import express from 'express';
import { register, loginWithPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', loginWithPassword);

export default router;
