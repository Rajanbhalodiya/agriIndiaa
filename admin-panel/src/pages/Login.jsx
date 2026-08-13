import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdVisibility, MdVisibilityOff, MdPhone, MdLock, MdKey, MdArrowBack, MdCheckCircle } from 'react-icons/md';
import { API_BASE_URL } from '../services/api';
import { ButtonSpinner, OverlayLoader } from '../components/Loader';

export default function Login() {
  const navigate = useNavigate();
  
  // Login State
  const [phone, setPhone] = useState('9510459100');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Request OTP, 2: Verify OTP, 3: Reset Password
  const [resetPhone, setResetPhone] = useState('9510459100');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('aToken');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // Handle Admin Login with Phone & Password
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('adminPhone', data.phone || phone);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while signing in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password - Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/send-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: resetPhone })
      });
      const data = await response.json();

      if (data.success) {
        setDemoOtp(data.otp || '');
        setSuccessMsg(data.message || `OTP sent to ${resetPhone}`);
        setForgotStep(2);
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to send OTP. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password - Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: resetPhone, otp })
      });
      const data = await response.json();

      if (data.success) {
        setSuccessMsg('OTP verified successfully! Now set your new password.');
        setForgotStep(3);
      } else {
        setError(data.message || 'Invalid or expired OTP');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password - Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: resetPhone, otp, newPassword })
      });
      const data = await response.json();

      if (data.success) {
        setSuccessMsg(data.message || 'Password reset successfully!');
        setPhone(resetPhone);
        setPassword(newPassword);
        // Delay switching back to login view so admin sees success message
        setTimeout(() => {
          setIsForgotMode(false);
          setForgotStep(1);
          setOtp('');
          setDemoOtp('');
        }, 1500);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const resetForgotState = () => {
    setIsForgotMode(false);
    setForgotStep(1);
    setError('');
    setSuccessMsg('');
    setOtp('');
    setDemoOtp('');
  };

  return (
    <>
      {loading && <OverlayLoader message={isForgotMode ? "Processing..." : "Authenticating Admin..."} />}

      {/* Title Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isForgotMode ? 'Reset Admin Password' : 'Admin Login'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isForgotMode
            ? 'Verify your phone number to update admin password'
            : 'Sign in with your admin phone number and password'}
        </p>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
          <MdCheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {!isForgotMode ? (
        /* LOGIN FORM */
        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Admin Phone Number
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <MdPhone className="w-5 h-5" />
              </div>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono"
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetPhone(phone || '9876543210');
                  setIsForgotMode(true);
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <MdLock className="w-5 h-5" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <ButtonSpinner />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in to Dashboard'
              )}
            </button>
          </div>
        </form>
      ) : (
        /* FORGOT PASSWORD WORKFLOW */
        <div className="space-y-5">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold mb-4 text-gray-500">
            <span className={`px-2.5 py-1 rounded-full ${forgotStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>1. Phone</span>
            <span>&rarr;</span>
            <span className={`px-2.5 py-1 rounded-full ${forgotStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>2. OTP</span>
            <span>&rarr;</span>
            <span className={`px-2.5 py-1 rounded-full ${forgotStep >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>3. Reset</span>
          </div>

          {/* STEP 1: ENTER PHONE NUMBER */}
          {forgotStep === 1 && (
            <form className="space-y-4" onSubmit={handleSendOTP}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Admin Registered Phone Number
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <MdPhone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                {loading ? <ButtonSpinner /> : 'Send Reset OTP'}
              </button>
            </form>
          )}

          {/* STEP 2: ENTER OTP */}
          {forgotStep === 2 && (
            <form className="space-y-4" onSubmit={handleVerifyOTP}>
              {demoOtp && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-mono">
                  🔑 <strong>Demo OTP:</strong> {demoOtp} (Enter this code below)
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enter 6-Digit OTP
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <MdKey className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono tracking-widest text-center text-lg"
                    placeholder="123456"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForgotStep(1)}
                  className="w-1/3 py-2.5 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Change Phone
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  {loading ? <ButtonSpinner /> : 'Verify OTP'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {forgotStep === 3 && (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono"
                    placeholder="Enter new password (min 6 chars)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showNewPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="mt-1">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono"
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                {loading ? <ButtonSpinner /> : 'Save New Password & Log In'}
              </button>
            </form>
          )}

          {/* Back to Login Button */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={resetForgotState}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <MdArrowBack className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
