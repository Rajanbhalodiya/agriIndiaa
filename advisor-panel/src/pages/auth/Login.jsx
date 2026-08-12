import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdPhone, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { apiFetch } from '../../services/api';
import { ButtonSpinner, OverlayLoader } from '../../components/Loader';

const loginSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  
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

  const phoneValue = watch('phone');

  const onPasswordLogin = async (data) => {
    setLoginError('');
    try {
      const result = await apiFetch('/advisor/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (result && result.success) {
        localStorage.setItem('token', result.token);
        window.location.href = '/'; 
      } else {
        const errorMsg = result?.message || 'Login failed. Please check your credentials.';
        setLoginError(errorMsg);
        alert(errorMsg);
      }
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      console.error("STATUS:", error?.status || error?.response?.status);
      console.error("DATA:", error?.data || error?.response?.data);

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to connect to server. Please check your internet or try again later.";

      setLoginError(errorMessage);
      alert(`Login Error: ${errorMessage}`);
    }
  };

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState({ type: '', text: '' });

  const handleRequestForgotOtp = async (e) => {
    e.preventDefault();
    if (!forgotPhone || forgotPhone.length < 10) {
      setForgotMsg({ type: 'error', text: 'Please enter a valid phone number' });
      return;
    }
    setForgotLoading(true);
    setForgotMsg({ type: '', text: '' });
    try {
      const res = await apiFetch('/advisor/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ phone: forgotPhone })
      });
      if (res.success) {
        setForgotStep(2);
        setForgotMsg({ type: 'success', text: res.message });
      } else {
        setForgotMsg({ type: 'error', text: res.message || 'Failed to send OTP' });
      }
    } catch (err) {
      console.error(err);
      setForgotMsg({ type: 'error', text: 'Error connecting to server' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.length < 6) {
      setForgotMsg({ type: 'error', text: 'Please enter 6-digit OTP' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setForgotMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setForgotLoading(true);
    setForgotMsg({ type: '', text: '' });
    try {
      const res = await apiFetch('/advisor/reset-password', {
        method: 'POST',
        body: JSON.stringify({ phone: forgotPhone, otp: forgotOtp, newPassword })
      });
      if (res.success) {
        alert('Password reset successfully! Please login with your new password.');
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotPhone('');
        setForgotOtp('');
        setNewPassword('');
      } else {
        setForgotMsg({ type: 'error', text: res.message || 'Failed to reset password' });
      }
    } catch (err) {
      console.error(err);
      setForgotMsg({ type: 'error', text: 'Error resetting password' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <>
      {isSubmitting && <OverlayLoader message="Authenticating Advisor..." />}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl mx-auto flex items-center justify-center mb-4 p-2.5 border border-primary-100 shadow-sm">
            <img src="/favicon.png" alt="AgriIndia Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to your Advisor Panel</p>
        </div>

        <form onSubmit={handleSubmit(onPasswordLogin)} className="space-y-6">
          {loginError && (
            <div className="p-3.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl font-medium">
              {loginError}
            </div>
          )}
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

          <div>
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
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
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
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotStep(1);
                    setForgotMsg({ type: '', text: '' });
                    if (phoneValue) setForgotPhone(phoneValue);
                  }}
                  className="font-medium text-primary-600 hover:text-primary-500 bg-transparent border-none cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md3-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <ButtonSpinner />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-600">
          Contact administrator to create an account.
        </div>

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6"
            >
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
                <button 
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              {forgotMsg.text && (
                <div className={`p-3 rounded-xl mb-4 text-xs font-medium ${forgotMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  {forgotMsg.text}
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestForgotOtp} className="space-y-4">
                  <p className="text-xs text-gray-500">Enter your registered phone number to receive a verification OTP code.</p>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      placeholder="Enter registered phone number"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                      {forgotLoading ? (
                        <>
                          <ButtonSpinner />
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        'Send OTP'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-xs text-gray-500">Enter the OTP sent to <span className="font-semibold text-gray-800">{forgotPhone}</span> and set your new password.</p>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">6-Digit OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm tracking-widest text-center font-bold focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-xs font-medium text-primary-600 hover:underline"
                    >
                      ← Back
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(false)}
                        className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition-colors disabled:opacity-60 flex items-center gap-2"
                      >
                        {forgotLoading ? (
                          <>
                            <ButtonSpinner />
                            <span>Resetting...</span>
                          </>
                        ) : (
                          'Reset Password'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </motion.div>
    </>
  );
}
