import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { 
  MdPerson, 
  MdPhone, 
  MdShield, 
  MdVpnKey, 
  MdLogout, 
  MdCheckCircle, 
  MdSecurity, 
  MdAdminPanelSettings,
  MdSave
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const [adminPhone, setAdminPhone] = useState('');
  const [adminName, setAdminName] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const savedPhone = localStorage.getItem('adminPhone') || '9510459100';
    const savedName = localStorage.getItem('adminName') || 'Super Admin';
    setAdminPhone(savedPhone);
    setAdminName(savedName);
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('adminPhone', adminPhone);
    localStorage.setItem('adminName', adminName);
    setToastMessage('Admin Profile updated and permanently saved!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('aToken');
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-medium animate-bounce">
          <MdCheckCircle className="text-green-400 w-5 h-5" />
          {toastMessage}
        </div>
      )}

      <PageHeader 
        title="Admin Profile & Account" 
        description="View and manage super administrator profile, access permissions, and session security." 
      />

      {/* Main Profile Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-primary-100 border-4 border-primary-200 flex items-center justify-center text-primary-700 font-extrabold text-3xl shadow-inner shrink-0">
          {adminPhone ? adminPhone.slice(0, 2).toUpperCase() : 'SA'}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{adminName}</h2>
            <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded-full flex items-center gap-1">
              <MdAdminPanelSettings className="w-4 h-4" /> Super Administrator
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500">{adminPhone}</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-green-600 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            System Session Active • JWT Encrypted
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

      {/* Profile Form & Permissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Information Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <MdPerson className="text-primary-600 w-5 h-5" /> Account Information
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Admin Display Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
                />
                <MdPerson className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Admin Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
                />
                <MdPhone className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Admin System Role
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value="Super Administrator (Root)"
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed"
                />
                <MdAdminPanelSettings className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md cursor-pointer"
              >
                <MdSave className="w-5 h-5" />
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>

        {/* Security & Access Rights */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <MdSecurity className="text-primary-600 w-5 h-5" /> Security & Access Rights
          </h3>

          <div className="space-y-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
              <span className="font-bold text-gray-900 flex items-center gap-2">
                <MdShield className="text-green-600" /> Full System Administrative Privileges
              </span>
              <p className="text-xs text-gray-500">
                You have unrestricted access to manage Advisors, Farmers, Products, Orders, Payments, Reports, and System Configurations.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
              <span className="font-bold text-gray-900 flex items-center gap-2">
                <MdVpnKey className="text-blue-600" /> Authentication Token
              </span>
              <p className="text-xs text-gray-500 font-mono truncate">
                Bearer {localStorage.getItem('token')?.slice(0, 32)}...
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 space-y-2">
              <span className="font-bold text-purple-900 text-xs uppercase tracking-wider block">
                Security Recommendations
              </span>
              <ul className="text-xs text-purple-800 space-y-1 list-disc pl-4">
                <li>Never share your admin secret token or password.</li>
                <li>Always log out when using public or shared computers.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
