import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { MdDashboard, MdPeople, MdInventory, MdPointOfSale, MdReceipt, MdSettings, MdNotifications, MdLogout, MdPhone, MdLocationOn, MdMenu, MdClose, MdRefresh } from 'react-icons/md';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const profileRef = useRef(null);
  const mainRef = useRef(null);
  const touchStartYRef = useRef(0);

  // Close sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProfileData = async () => {
    try {
      const result = await apiFetch('/advisor/profile');
      if (result.success) setProfile(result.profileData);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Manual & Pull Refresh Handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setIsPullRefreshing(true);

    try {
      await fetchProfileData();
      window.dispatchEvent(new CustomEvent('app:refresh'));
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setIsPullRefreshing(false);
        setPullDistance(0);
      }, 700);
    }
  };

  // Mobile Pull-to-Refresh Touch Handlers
  const handleTouchStart = (e) => {
    if (mainRef.current && mainRef.current.scrollTop === 0) {
      touchStartYRef.current = e.touches[0].clientY;
    } else {
      touchStartYRef.current = 0;
    }
  };

  const handleTouchMove = (e) => {
    if (touchStartYRef.current > 0 && mainRef.current && mainRef.current.scrollTop === 0) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartYRef.current;
      if (distance > 0) {
        setPullDistance(Math.min(distance * 0.45, 90));
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      handleManualRefresh();
    } else {
      setPullDistance(0);
    }
    touchStartYRef.current = 0;
  };

  // Background Live GPS Location Pinger
  useEffect(() => {
    let watchId;
    const sendLocation = (lat, lng, speed = 0) => {
      apiFetch('/advisor/update-location', {
        method: 'POST',
        body: JSON.stringify({ lat, lng, speed, isMoving: speed > 2 })
      }).catch(() => { });
    };

    if (navigator && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.speed || 0),
        () => { },
        { enableHighAccuracy: true }
      );
      watchId = navigator.geolocation.watchPosition(
        (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.speed || 0),
        () => { },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    }
    return () => {
      if (watchId !== undefined && navigator && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    window.location.href = '/auth/login';
  };

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b flex items-center gap-3">
        <img src="/favicon.png" alt="AgriIndia Logo" className="w-9 h-9 object-contain rounded-xl shadow-sm" />
        <span className="text-xl font-bold text-gray-900 tracking-tight">AgriIndia</span>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium',
                isActive
                  ? 'bg-primary-100 text-primary-800 font-semibold shadow-sm'
                  : 'text-gray-600 hover:bg-surface-variant hover:text-gray-900'
              )}
            >
              <Icon className={clsx('w-5 h-5 flex-shrink-0', isActive ? 'text-primary-600' : '')} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) => clsx(
            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium',
            isActive ? 'bg-primary-100 text-primary-800 font-semibold' : 'text-gray-600 hover:bg-surface-variant hover:text-gray-900'
          )}
        >
          <MdSettings className="w-5 h-5 flex-shrink-0" />
          <span>Settings</span>
        </NavLink>

        {profile && (
          <div className="mx-1 p-3 bg-primary-50 rounded-xl border border-primary-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-800 font-bold text-sm flex-shrink-0 overflow-hidden border border-primary-200">
                {profile?.image ? (
                  <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile.name ? profile.name.charAt(0).toUpperCase() : 'A'
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{profile.name}</p>
                <p className="text-xs text-primary-600">Advisor</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 font-medium text-sm"
        >
          <MdLogout className="w-5 h-5 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden w-full relative">
      {/* Pull To Refresh Mobile Indicator */}
      <AnimatePresence>
        {(pullDistance > 12 || isPullRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: isPullRefreshing ? 20 : Math.min(pullDistance, 55) }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center bg-white border border-gray-200 shadow-md rounded-full px-4 py-2 gap-2 text-xs font-semibold text-primary-700 pointer-events-none"
          >
            <MdRefresh className={clsx("w-5 h-5 text-primary-600", (pullDistance > 60 || isPullRefreshing) && "animate-spin")} />
            <span>{isPullRefreshing ? "Refreshing data..." : pullDistance > 60 ? "Release to refresh" : "Pull down to refresh"}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (lg+) */}
      <aside className="w-60 bg-surface shadow-md3-1 hidden lg:flex flex-col z-20 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Tablet Sidebar Overlay (md-lg) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-60 bg-surface shadow-md3-3 z-40 flex flex-col lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ minWidth: 0 }}>
        {/* Header */}
        <header className="h-16 bg-surface shadow-sm flex items-center justify-between px-4 md:px-6 z-10 flex-shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile & tablet */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-surface-variant transition-colors"
              aria-label="Open menu"
            >
              <MdMenu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <img src="/favicon.png" alt="AgriIndia Logo" className="w-7 h-7 object-contain rounded-lg" />
              <span className="text-lg font-bold text-gray-900">AgriIndia</span>
            </div>
            {/* Page breadcrumb on desktop */}
            <div className="hidden lg:block">
              <span className="text-sm text-gray-500">
                {navItems.find(n => n.path !== '/' && location.pathname.startsWith(n.path))?.label
                  || (location.pathname === '/' ? 'Dashboard' : '')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl text-gray-500 hover:bg-surface-variant relative transition-colors">
              <MdNotifications className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                className="flex items-center gap-2 cursor-pointer p-1.5 pr-2 rounded-xl hover:bg-surface-variant transition-colors"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                {profile && (
                  <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {profile.name}
                  </span>
                )}
                <div className="w-8 h-8 rounded-full bg-primary-100 border-2 border-primary-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {profile?.image ? (
                    <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary-700 font-bold text-sm">
                      {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
                    </span>
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-md3-2 border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-100 bg-primary-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 border-2 border-primary-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {profile?.image ? (
                            <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-primary-700 font-bold">
                              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm truncate">{profile?.name || 'Advisor'}</h3>
                          <p className="text-xs text-primary-600 font-medium">Agricultural Advisor</p>
                        </div>
                      </div>
                    </div>
                    {profile && (
                      <div className="p-2">
                        {profile.phone && (
                          <div className="px-3 py-2 flex items-center gap-3 text-sm text-gray-600">
                            <MdPhone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span>{profile.phone}</span>
                          </div>
                        )}
                        {profile.village && (
                          <div className="px-3 py-2 flex items-center gap-3 text-sm text-gray-600">
                            <MdLocationOn className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span>{profile.village}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-2 border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                      >
                        <MdLogout className="w-4 h-4" />
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
        <main
          ref={mainRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-20 md:pb-24 lg:pb-6 bg-background"
        >
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* Bottom Navigation — Mobile & Tablet only (hidden on lg+) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] flex justify-around items-center z-20 safe-bottom">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center py-2 px-3 min-w-[56px] transition-all duration-200"
              >
                <div className={clsx(
                  'flex items-center justify-center w-10 h-7 rounded-full mb-0.5 transition-all duration-200',
                  isActive ? 'bg-primary-100' : 'bg-transparent'
                )}>
                  <Icon className={clsx('w-5 h-5', isActive ? 'text-primary-700' : 'text-gray-500')} />
                </div>
                <span className={clsx(
                  'text-[10px] font-medium leading-tight',
                  isActive ? 'text-primary-700' : 'text-gray-500'
                )}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
