import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdTrendingUp, MdPeople, MdLocalShipping, MdOutlinePayment, MdAdd, MdPersonAdd, MdReceipt, MdInventory, MdChevronRight, MdRefresh } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState({
    totalFarmers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingPaymentsAmount: 0,
    pendingPaymentsCount: 0,
    totalAppointments: 0,
    recentOrders: [],
    recentFarmers: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/advisor/dashboard');
      if (data.success && data.dashData) {
        setDashData(data.dashData);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    { 
      id: 1, 
      name: 'Total Farmers', 
      value: dashData.totalFarmers, 
      icon: MdPeople, 
      color: 'bg-blue-100 text-blue-600',
      link: '/farmers'
    },
    { 
      id: 2, 
      name: 'Product Orders', 
      value: dashData.totalOrders, 
      icon: MdLocalShipping, 
      color: 'bg-emerald-100 text-emerald-600',
      link: '/orders'
    },
    { 
      id: 3, 
      name: 'Total Paid Volume', 
      value: `₹${(dashData.totalRevenue || 0).toLocaleString()}`, 
      icon: MdTrendingUp, 
      color: 'bg-purple-100 text-purple-600',
      link: '/payments'
    },
    { 
      id: 4, 
      name: 'Pending Payments', 
      value: `₹${(dashData.pendingPaymentsAmount || 0).toLocaleString()}`, 
      subtext: `${dashData.pendingPaymentsCount || 0} unpaid orders`,
      icon: MdOutlinePayment, 
      color: 'bg-orange-100 text-orange-600',
      link: '/payments'
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500">Welcome back, Advisor! Here is your summary for today.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={fetchDashboardData}
            className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <MdRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => navigate('/farmers/add')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 transition-colors font-medium"
          >
            <MdPersonAdd className="w-5 h-5" />
            Add Farmer
          </button>
          <button 
            onClick={() => navigate('/products')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-primary-700 transition-colors font-medium"
          >
            <MdAdd className="w-5 h-5" />
            New Order
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => navigate(stat.link)}
              className="bg-surface p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-primary-200 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <MdChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{stat.name}</p>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</h3>
                {stat.subtext && (
                  <p className="text-xs text-orange-600 font-medium mt-1">{stat.subtext}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-surface rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Farmer Orders</h2>
              <p className="text-xs text-gray-500">Latest product orders placed for your farmers</p>
            </div>
            <button onClick={() => navigate('/orders')} className="text-primary-600 font-medium text-sm hover:text-primary-700">View All</button>
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : dashData.recentOrders.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500 text-sm">
              No orders placed yet. Select products from the catalog to place an order.
            </div>
          ) : (
            <div className="space-y-3">
              {dashData.recentOrders.map((order) => (
                <div key={order._id} onClick={() => navigate('/orders')} className="flex items-center justify-between p-4 bg-background rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">
                      {order.farmerName ? order.farmerName.charAt(0).toUpperCase() : 'F'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{order.farmerName}</h4>
                      <p className="text-xs text-gray-500">
                        {order.items?.length || 0} items • {new Date(order.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-bold text-gray-900 text-sm">₹{order.totalAmount}</span>
                      <span className={`block text-[10px] font-semibold ${order.payment ? 'text-green-600' : 'text-amber-600'}`}>
                        {order.payment ? 'PAID' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => navigate('/products')} className="flex flex-col items-center justify-center gap-2 p-4 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors text-primary-700 border border-primary-100">
                <MdReceipt className="w-7 h-7" />
                <span className="text-xs font-semibold">New Order</span>
              </button>
              <button onClick={() => navigate('/products')} className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-blue-700 border border-blue-100">
                <MdInventory className="w-7 h-7" />
                <span className="text-xs font-semibold">Products</span>
              </button>
              <button onClick={() => navigate('/payments')} className="flex flex-col items-center justify-center gap-2 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors text-orange-700 border border-orange-100">
                <MdOutlinePayment className="w-7 h-7" />
                <span className="text-xs font-semibold">Payments</span>
              </button>
              <button onClick={() => navigate('/farmers')} className="flex flex-col items-center justify-center gap-2 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-purple-700 border border-purple-100">
                <MdPeople className="w-7 h-7" />
                <span className="text-xs font-semibold">Farmers</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 bg-gray-50/50 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Advisor Info</h4>
            <p className="text-xs text-gray-600">Assigned Village Advisors can manage farmers, process orders, and collect payments directly.</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
