import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { MdDashboard, MdPeople, MdInventory, MdPointOfSale, MdReceipt, MdSettings, MdNotifications, MdLogout, MdPhone, MdLocationOn } from 'react-icons/md';
import clsx from 'clsx';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { apiFetch } from '../services/api';

const navItems = [
  { path: '/', label: 'Dashboard', icon: MdDashboard },
  { path: '/farmers', label: 'Farmers', icon: MdPeople },
  { path: '/products', label: 'Products', icon: MdInventory },
  { path: '/orders', label: 'Orders', icon: MdPointOfSale },
  { path: '/payments', label: 'Payments', icon: MdReceipt },
];

export default function DashboardLayout() {
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await apiFetch('/advisor/profile');
        if (result.success) {
          setProfile(result.profileData);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/auth/login';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar (Desktop) */}
      <aside className="w-64 bg-surface shadow-md3-1 hidden md:flex flex-col z-10">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">AgriIndia</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary-100 text-primary-800 font-semibold shadow-sm"
                    : "text-gray-600 hover:bg-surface-variant hover:text-gray-900"
                )}
              >
                <Icon className={clsx("w-6 h-6", isActive ? "text-primary-600" : "")} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          <NavLink to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-surface-variant transition-all duration-200">
            <MdSettings className="w-6 h-6" />
            <span>Settings</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 font-medium"
          >
            <MdLogout className="w-6 h-6" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
        {/* Topbar (Mobile & Desktop) */}
        <header className="h-16 bg-surface shadow-sm flex items-center justify-between px-4 md:px-8 z-10">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900">AgriCRM</span>
          </div>

          <div className="hidden md:block">
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full text-gray-500 hover:bg-surface-variant relative">
              <MdNotifications className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-red-600 hover:bg-red-50 border border-red-100 text-sm font-medium transition-colors"
              title="Logout"
            >
              <MdLogout className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            <div className="relative" ref={profileRef}>
              <div
                className="flex items-center gap-3 cursor-pointer p-1 rounded-full hover:bg-surface-variant transition-colors"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                {profile && (
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {profile.name}
                  </span>
                )}
                <div className="w-10 h-10 rounded-full bg-primary-100 border-2 border-primary-200 flex items-center justify-center overflow-hidden">
                  {profile?.image ? (
                    <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary-700 font-bold text-lg">
                      {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
                    </span>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-md3-2 border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-100 bg-surface">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-primary-100 border-2 border-primary-200 flex items-center justify-center overflow-hidden shrink-0">
                          {profile?.image ? (
                            <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-primary-700 font-bold text-xl">
                              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{profile?.name || 'Advisor'}</h3>
                          <p className="text-xs text-primary-600 font-medium">Advisor</p>
                        </div>
                      </div>
                    </div>
                    {profile && (
                      <div className="p-2">
                        {profile.phone && (
                          <div className="px-4 py-2 flex items-center gap-3 text-sm text-gray-600">
                            <MdPhone className="w-5 h-5 text-gray-400" />
                            <span>{profile.phone}</span>
                          </div>
                        )}
                        {profile.village && (
                          <div className="px-4 py-2 flex items-center gap-3 text-sm text-gray-600">
                            <MdLocationOn className="w-5 h-5 text-gray-400" />
                            <span>{profile.village}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-2 border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error/10 rounded-xl transition-colors font-medium"
                      >
                        <MdLogout className="w-5 h-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-background">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-surface shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-around p-2 pb-safe border-t z-50">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={clsx(
                "flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200",
                isActive ? "text-primary-700" : "text-gray-500"
              )}
            >
              <div className={clsx(
                "flex items-center justify-center w-12 h-8 rounded-full mb-1 transition-all duration-200",
                isActive ? "bg-primary-100" : "bg-transparent"
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
