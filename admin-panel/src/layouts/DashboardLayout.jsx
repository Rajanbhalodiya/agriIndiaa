import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdDashboard, 
  MdPeople, 
  MdAgriculture,
  MdInventory,
  MdShoppingCart,
  MdReceipt,
  MdPayments,
  MdBarChart,
  MdMap,
  MdPerson,
  MdNotifications,
  MdSettings,
  MdLogout,
  MdMenu,
  MdClose,
  MdSearch
} from 'react-icons/md';

const navItems = [
  { path: '/dashboard', icon: <MdDashboard />, label: 'Dashboard' },
  { path: '/advisors', icon: <MdPeople />, label: 'Advisors' },
  { path: '/farmers', icon: <MdAgriculture />, label: 'Farmers' },
  { path: '/products', icon: <MdInventory />, label: 'Products' },
  { path: '/orders', icon: <MdShoppingCart />, label: 'Orders' },
  { path: '/payments', icon: <MdPayments />, label: 'Payments' },
  { path: '/reports', icon: <MdBarChart />, label: 'Reports' },
  { path: '/tracking', icon: <MdMap />, label: 'GPS Tracking' },
  { path: '/profile', icon: <MdPerson />, label: 'Admin Profile' },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('aToken');
    if (!token) {
      navigate('/login');
    } else if (localStorage.getItem('aToken')) {
      // Migrate old token if exists
      localStorage.setItem('token', localStorage.getItem('aToken'));
      localStorage.removeItem('aToken');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('aToken');
    navigate('/login');
  };

  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const filteredNavItems = navItems.filter(item => 
    item.label.toLowerCase().includes(globalSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-md3-2 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-primary-600">
            <MdAgriculture className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">AgriAdmin</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <NavLink 
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-primary-50 rounded-xl mb-4 transition-colors cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center text-primary-700 font-bold transition-colors shrink-0">
              {(localStorage.getItem('adminName') || localStorage.getItem('adminEmail') || 'Super Admin').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 group-hover:text-primary-700 truncate transition-colors">
                {localStorage.getItem('adminName') || 'Super Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">{localStorage.getItem('adminEmail') || 'admin@gmail.com'}</p>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
          >
            <MdLogout className="text-lg" />
            Logout
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30">
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <MdMenu className="w-6 h-6" />
            </button>

            {/* Global Search Bar */}
            <div className="relative w-full">
              <div className="relative">
                <MdSearch className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Quick search sections (Orders, Products, Farmers, Advisors...)"
                  value={globalSearch}
                  onFocus={() => setShowSearchResults(true)}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setShowSearchResults(true);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                />
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && globalSearch.trim() && (
                <div 
                  className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Quick Navigation
                  </div>
                  {filteredNavItems.length > 0 ? (
                    filteredNavItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setGlobalSearch('');
                          setShowSearchResults(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 hover:text-primary-700 text-gray-700 text-sm transition-colors text-left"
                      >
                        <span className="text-lg text-primary-600">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No matching sections found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors relative">
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              <MdNotifications className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
