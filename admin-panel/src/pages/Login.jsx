import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdVisibility, MdVisibilityOff, MdClose, MdKey, MdPhone, MdCheckCircle } from 'react-icons/md';
import { API_BASE_URL } from '../services/api';
import { ButtonSpinner, OverlayLoader } from '../components/Loader';

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotPhone, setForgotPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [receivedOtpNotice, setReceivedOtpNotice] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('aToken');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
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
        localStorage.setItem('adminPhone', phone);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setReceivedOtpNotice('');

    if (!forgotPhone) {
      setForgotError('Please enter your phone number');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/send-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone })
      });
      const data = await response.json();
      if (data.success) {
        setForgotStep(2);
        setForgotSuccess('OTP generated successfully!');
        if (data.otp) {
          setReceivedOtpNotice(`Testing OTP: ${data.otp}`);
        }
      } else {
        setForgotError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error(err);
      setForgotError('Error sending OTP. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!otp || !newPassword) {
      setForgotError('OTP and new password are required');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone, otp, newPassword })
      });
      const data = await response.json();
      if (data.success) {
        setForgotSuccess(data.message || 'Password updated in database!');
        setPhone(forgotPhone);
        setPassword(newPassword);
        setTimeout(() => {
          setForgotModalOpen(false);
          setForgotStep(1);
          setOtp('');
          setNewPassword('');
          setReceivedOtpNotice('');
        }, 2000);
      } else {
        setForgotError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error(err);
      setForgotError('Error updating password. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <>
      {loading && <OverlayLoader message="Authenticating Admin..." />}
      <form className="space-y-6" onSubmit={handleLogin}>
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <div className="mt-1">
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter 10-digit phone number"
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
                setForgotPhone(phone || '9876543210');
                setForgotStep(1);
                setForgotError('');
                setForgotSuccess('');
                setForgotModalOpen(true);
              }}
              className="text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono"
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
              'Sign in'
            )}
          </button>
        </div>
      </form>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 text-gray-800 font-semibold">
                <MdKey className="w-5 h-5 text-primary-600" />
                <span>Reset Admin Password</span>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {forgotError && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div className="mb-4 p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <MdCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <p className="text-xs text-gray-500">
                    Enter your registered Admin phone number to receive a verification OTP.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Admin Phone Number
                    </label>
                    <div className="relative">
                      <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        required
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {forgotLoading ? <ButtonSpinner /> : 'Send Reset OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {receivedOtpNotice && (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg font-mono font-semibold text-center">
                      {receivedOtpNotice}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Enter 6-Digit OTP
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest font-mono font-bold focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      New Admin Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 6 chars)"
                        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-primary-500 focus:border-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showNewPassword ? <MdVisibilityOff className="w-4 h-4" /> : <MdVisibility className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="w-1/3 py-2.5 px-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-2/3 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {forgotLoading ? <ButtonSpinner /> : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
