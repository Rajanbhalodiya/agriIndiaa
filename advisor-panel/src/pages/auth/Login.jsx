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
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

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
      </motion.div>
    </>
  );
}
