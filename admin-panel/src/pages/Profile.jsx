import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { 
  MdPerson, 
  MdPhone, 
  MdLogout, 
  MdCheckCircle, 
  MdAdminPanelSettings,
  MdSave
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';
import { OverlayLoader } from '../components/Loader';

export default function Profile() {
  const navigate = useNavigate();
  const [adminPhone, setAdminPhone] = useState('');
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch admin profile from database table
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('aToken') || '';
      const response = await fetch(`${API_BASE_URL}/admin/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'atoken': token
        }
      });
      const data = await response.json();
      if (data.success && data.admin) {
        setAdminName(data.admin.name || 'Admin');
        setAdminPhone(data.admin.phone || '');
        localStorage.setItem('adminPhone', data.admin.phone || '');
        localStorage.setItem('adminName', data.admin.name || '');
      } else {
        // Fallback to local storage if needed
        setAdminPhone(localStorage.getItem('adminPhone') || '9876543210');
        setAdminName(localStorage.getItem('adminName') || 'Super Admin');
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      setAdminPhone(localStorage.getItem('adminPhone') || '9876543210');
      setAdminName(localStorage.getItem('adminName') || 'Super Admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSaving(true);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('aToken') || '';
      const response = await fetch(`${API_BASE_URL}/admin/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'atoken': token
        },
        body: JSON.stringify({ name: adminName, phone: adminPhone })
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('adminPhone', adminPhone);
        localStorage.setItem('adminName', adminName);
        setToastMessage(data.message || 'Admin profile updated in database!');
        setTimeout(() => setToastMessage(''), 3500);
      } else {
        setErrorMessage(data.message || 'Failed to update admin profile');
      }
    } catch (error) {
      console.error('Error updating admin profile:', error);
      setErrorMessage('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('aToken');
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-6">
      {loading && <OverlayLoader message="Fetching Admin Profile from Database..." />}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-medium animate-bounce">
          <MdCheckCircle className="text-green-400 w-5 h-5 flex-shrink-0" />
          {toastMessage}
        </div>
      )}

      <PageHeader 
        title="Admin Profile & Account" 
        description="Manage administrator display name and contact phone number stored in database." 
      />

      {/* Main Profile Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-primary-100 border-4 border-primary-200 flex items-center justify-center text-primary-700 font-extrabold text-3xl shadow-inner shrink-0">
          {adminName ? adminName.slice(0, 2).toUpperCase() : 'AD'}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{adminName}</h2>
            <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded-full flex items-center gap-1">
              <MdAdminPanelSettings className="w-4 h-4" /> Administrator
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-600 flex items-center justify-center sm:justify-start gap-1">
            <MdPhone className="w-4 h-4 text-gray-400" /> {adminPhone}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-green-600 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            Database Connected • Active Session
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer shrink-0"
        >
          <MdLogout className="w-5 h-5" />
          Logout
        </button>
      </div>

      {/* Account Information Form - Showing Name and Phone Number */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <MdPerson className="text-primary-600 w-5 h-5" /> Admin Details
        </h3>

        {errorMessage && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Admin Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Enter Admin Name"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
              <MdPerson className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="Enter Phone Number"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
              <MdPhone className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors shadow-md cursor-pointer disabled:opacity-50"
            >
              <MdSave className="w-5 h-5" />
              {saving ? 'Saving to Database...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
