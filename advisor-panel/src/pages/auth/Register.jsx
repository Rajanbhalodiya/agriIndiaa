import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdPerson, MdPhone, MdLock, MdVisibility, MdVisibilityOff, MdLocationOn } from 'react-icons/md';
import { apiFetch } from '../../services/api';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  village: z.string().min(2, 'Village name is required'),
});

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    try {
      const result = await apiFetch('/advisor/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (result.success) {
        alert('Registration successful! Please login.');
        navigate('/auth/login');
      } else {
        alert(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('An error occurred during registration.');
    }
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
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h1>
        <p className="text-gray-500 mt-2">Join as an Advisor</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdPerson className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              {...register('name')}
              className={`block w-full pl-10 pr-3 py-2 border ${errors.name ? 'border-error' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-surface`}
              placeholder="John Doe"
            />
          </div>
          {errors.name && <p className="mt-1 text-sm text-error">{errors.name.message}</p>}
        </div>



        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdPhone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              {...register('phone')}
              className={`block w-full pl-10 pr-3 py-2 border ${errors.phone ? 'border-error' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-surface`}
              placeholder="Enter your phone number"
            />
          </div>
          {errors.phone && <p className="mt-1 text-sm text-error">{errors.phone.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdLock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              {...register('password')}
              className={`block w-full pl-10 pr-10 py-2 border ${errors.password ? 'border-error' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-surface`}
              placeholder="Create a password"
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
        </div>

        {/* Village */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Village Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdLocationOn className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              {...register('village')}
              className={`block w-full pl-10 pr-3 py-2 border ${errors.village ? 'border-error' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-surface`}
              placeholder="Enter village name"
            />
          </div>
          {errors.village && <p className="mt-1 text-sm text-error">{errors.village.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4 flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md3-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70"
        >
          {isSubmitting ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : 'Create Account'}
        </button>

        <div className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </div>
      </form>
    </motion.div>
  );
}
