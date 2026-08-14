import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import AppError from '../utils/AppError.js';
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
