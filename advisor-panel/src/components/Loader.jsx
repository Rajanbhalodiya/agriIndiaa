import React from 'react';
import { motion } from 'framer-motion';
import { MdAgriculture } from 'react-icons/md';

/**
 * Standard Page / Component Content Loader for Advisor Panel
 */
export function PageLoader({ text = 'Loading...', size = 'md', fullScreen = false }) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const iconSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative flex items-center justify-center mb-3">
        {/* Outer glowing ring */}
        <div
          className={`${sizeClasses[size]} border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin`}
        />
        {/* Inner reverse spinning ring */}
        <div
          className={`absolute ${size === 'lg' ? 'w-14 h-14' : size === 'md' ? 'w-9 h-9' : 'w-6 h-6'} border-3 border-emerald-200 border-b-emerald-500 rounded-full animate-spin-reverse`}
        />
        {/* Central pulsing Agri icon */}
        <motion.div
          animate={{ scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute text-primary-600 ${iconSizes[size]}`}
        >
          <MdAgriculture />
        </motion.div>
      </div>

      {text && (
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex items-center gap-1 text-xs font-semibold text-gray-700"
        >
          <span>{text}</span>
          <span className="flex gap-0.5">
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}>.</motion.span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}>.</motion.span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}>.</motion.span>
          </span>
        </motion.div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * Fullscreen Action Overlay Loader (e.g. submitting order / adding farmer)
 */
export function OverlayLoader({ message = 'Processing...' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm transition-opacity">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white px-6 py-5 rounded-2xl shadow-2xl flex flex-col items-center border border-gray-100 max-w-xs w-full mx-4"
      >
        <div className="relative flex items-center justify-center mb-3">
          <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
          <div className="absolute text-primary-600 text-lg">
            <MdAgriculture />
          </div>
        </div>
        <p className="text-gray-800 font-semibold text-sm mb-0.5">{message}</p>
        <p className="text-gray-400 text-[11px]">Please wait a moment...</p>
      </motion.div>
    </div>
  );
}

/**
 * Inline Button Spinner
 */
export function ButtonSpinner({ className = 'w-4 h-4 text-white' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

/**
 * Skeleton Loader for Cards (Products, Farmers, Orders list)
 */
export function CardSkeleton({ count = 3, columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' }) {
  return (
    <div className={`grid ${columns} gap-4`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200 animate-shimmer" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-gray-200 rounded w-1/2 animate-shimmer" />
              <div className="h-5 bg-gray-200 rounded w-3/4 animate-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Loader for Tables or Rows
 */
export function TableSkeleton({ rows = 4, cols = 4 }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-4 space-y-3">
      <div className="h-5 bg-gray-200 rounded w-1/3 animate-shimmer mb-3" />
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-3 items-center">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-4 bg-gray-100 rounded flex-1 animate-shimmer"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PageLoader;
