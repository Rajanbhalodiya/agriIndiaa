import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Config
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';

// Middlewares
import { errorHandler } from './middlewares/errorHandler.js';
import logger from './utils/logger.js';
import AppError from './utils/AppError.js';

// Routes
import authRouter from './routes/authRoute.js';
import adminRouter from './routes/adminRoute.js';
import advisorRouter from './routes/advisorRoute.js';
import userRouter from './routes/userRoute.js';

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(`${err.name}: ${err.message}`);
  process.exit(1);
});

// App Config
const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

// Security HTTP headers
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Middlewares
app.use(express.json({ limit: '10kb' }));
app.use(cors());

// Custom request logger
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

import productRouter from './routes/productRoute.js';
import productOrderRouter from './routes/productOrderRoute.js';

// API Endpoints
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/advisor', advisorRouter);
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/product-order', productOrderRouter);

app.get('/', (req, res) => {
  res.send('Agriculture ERP Backend API is running.');
});

// Handle undefined routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

const server = httpServer.listen(port, () => {
  logger.info(`Server Started on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(`${err.name}: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});
// Trigger nodemon restart