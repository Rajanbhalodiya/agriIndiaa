import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MdPhone, MdLock, MdVisibility, MdVisibilityOff, MdOutlineMessage } from 'react-icons/md';
import { apiFetch } from '../../services/api';

const loginSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState('password'); // 'password' or 'otp'
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const { register: registerOtp, handleSubmit: handleOtpSubmit, formState: { errors: otpErrors, isSubmitting: isSubmittingOtp } } = useForm({
    resolver: zodResolver(otpSchema),
  });

  const phoneValue = watch('phone');

  const onPasswordLogin = async (data) => {
    try {
      const result = await apiFetch('/advisor/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (result.success) {
        localStorage.setItem('token', result.token);
        window.location.href = '/'; 
      } else {
        alert(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login.');
    }
  };

  const onSendOtp = async () => {
    if (!phoneValue || phoneValue.length < 10) {
      alert("Please enter a valid phone number first");
      return;
    }
    setPhoneNumber(phoneValue);
    
    // Simulate API call to send OTP
    setOtpSent(true);
    alert('OTP Sent to ' + phoneValue + '. For testing, enter any 6 digits.');
  };

  const onVerifyOtp = async (data) => {
    // Simulate API call to verify OTP
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Verifying OTP for', phoneNumber, ':', data.otp);
        localStorage.setItem('token', 'mock_advisor_token');
        window.location.href = '/'; 
        resolve();
      }, 1500);
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
          <span className="text-3xl font-bold text-primary-600">A</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
        <p className="text-gray-500 mt-2">Sign in to your Advisor Panel</p>
      </div>

      <AnimatePresence mode="wait">
        {!otpSent ? (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <form onSubmit={handleSubmit(onPasswordLogin)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MdPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    {...register('phone')}
                    className={`block w-full pl-10 pr-3 py-3 border ${errors.phone ? 'border-error' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-surface`}
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-error">{errors.phone.message}</p>}
              </div>

              {loginMode === 'password' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MdLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register('password')}
                      className={`block w-full pl-10 pr-10 py-3 border ${errors.password ? 'border-error' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-surface`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <MdVisibilityOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <MdVisibility className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-error">{errors.password.message}</p>}
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                        Remember me
                      </label>
                    </div>
                    <div className="text-sm">
                      <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                        Forgot password?
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}

              {loginMode === 'password' ? (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md3-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSendOtp}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md3-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Send OTP
                </button>
              )}
              
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-surface text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setLoginMode(loginMode === 'password' ? 'otp' : 'password')}
                    className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    {loginMode === 'password' ? (
                      <>
                        <MdOutlineMessage className="h-5 w-5 text-gray-400 mr-2" />
                        Login with OTP
                      </>
                    ) : (
                      <>
                        <MdLock className="h-5 w-5 text-gray-400 mr-2" />
                        Login with Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="otp-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <form onSubmit={handleOtpSubmit(onVerifyOtp)} className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">
                  We've sent a verification code to<br/>
                  <span className="font-semibold text-gray-900">{phoneNumber}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MdLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    {...registerOtp('otp')}
                    className={`block w-full pl-10 pr-3 py-3 text-center tracking-widest text-lg font-semibold border ${otpErrors.otp ? 'border-error' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-surface`}
                    placeholder="000000"
                  />
                </div>
                {otpErrors.otp && <p className="mt-1 text-sm text-error">{otpErrors.otp.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmittingOtp}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md3-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-70"
              >
                {isSubmittingOtp ? 'Verifying...' : 'Verify & Login'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="mt-8 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">
          Sign up as Advisor
        </Link>
      </div>
    </motion.div>
  );
}
