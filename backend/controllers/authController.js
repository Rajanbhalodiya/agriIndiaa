import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import AppError from '../utils/AppError.js';
import { sendSMS } from '../utils/smsService.js';
import logger from '../utils/logger.js';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super-secret-default-key-dev', {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;
  user.otp = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const register = async (req, res, next) => {
  try {
    const newUser = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role, // Admin creation should be restricted in production
      village: req.body.village,
    });

    createSendToken(newUser, 201, res);
  } catch (err) {
    next(err);
  }
};

export const loginWithPassword = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return next(new AppError('Please provide phone and password!', 400));
    }

    const user = await User.findOne({ phone }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect phone or password', 401));
    }

    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

export const requestOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return next(new AppError('Please provide a phone number.', 400));

    const user = await User.findOne({ phone });
    if (!user) {
      return next(new AppError('There is no user with that phone number.', 404));
    }

    const otp = user.createOTP();
    await user.save({ validateBeforeSave: false });

    try {
      await sendSMS({
        phone: user.phone,
        message: `Your Agriculture ERP login OTP is: ${otp}. Valid for 10 minutes.`,
      });

      res.status(200).json({
        status: 'success',
        message: 'OTP sent to phone!',
      });
    } catch (err) {
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('There was an error sending the SMS. Try again later!', 500));
    }
  } catch (err) {
    next(err);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return next(new AppError('Please provide phone and OTP.', 400));

    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      phone,
      otp: hashedOTP,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('OTP is invalid or has expired', 400));
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};
