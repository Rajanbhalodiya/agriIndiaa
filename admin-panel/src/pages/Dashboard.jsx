import { useState, useEffect } from 'react';
import { MdPeople, MdAgriculture, MdInventory, MdShoppingCart, MdReceipt, MdPayments } from 'react-icons/md';
import { API_BASE_URL } from '../services/api';

import { PageLoader } from '../components/Loader';

export default function Dashboard() {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashData = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'atoken': token
        }
      });
      const data = await response.json();
      if (data.success) {
        setDashData(data.dashData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashData();
  }, []);

  const stats = [
    { label: 'Total Advisors', value: dashData?.advisors || dashData?.advisores || 0, icon: <MdPeople />, color: 'bg-blue-500' },
    { label: 'Total Farmers', value: dashData?.farmers || dashData?.customers || 0, icon: <MdAgriculture />, color: 'bg-green-500' },
    { label: 'Total Orders', value: dashData?.totalOrders || dashData?.productOrdersCount || 0, icon: <MdShoppingCart />, color: 'bg-purple-500' },
    { label: 'Total Products', value: dashData?.products || 0, icon: <MdInventory />, color: 'bg-amber-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-gray-500">Welcome to the AgriIndia Admin Control Panel</p>
      </div>
      
      {loading ? (
        <PageLoader text="Loading Dashboard Overview..." size="lg" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${stat.color}`}>
                  <div className="text-2xl">{stat.icon}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            </div>
            
            {dashData?.latestOrders?.length > 0 ? (
              <div className="space-y-4">
                {/* Mobile View (< md) */}
                <div className="divide-y divide-gray-100 md:hidden">
                  {dashData.latestOrders.map((order) => (
                    <div key={order._id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 text-sm">{order.farmerName || order.userData?.name || 'Farmer'}</h4>
                        <span className="font-bold text-gray-900 text-sm">₹{order.totalAmount || order.amount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Advisor: {order.advisorName || order.advisorData?.name || 'N/A'}</span>
                        <span>{order.date || order.slotDate}</span>
                      </div>
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{order.status || (order.cancelled ? 'Cancelled' : 'Pending')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View (>= md) */}
                <div className="hidden md:block overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-sm text-gray-500">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Farmer</th>
                        <th className="px-6 py-4 font-semibold">Date</th>
                        <th className="px-6 py-4 font-semibold">Advisor</th>
                        <th className="px-6 py-4 font-semibold">Amount</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dashData.latestOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{order.farmerName || order.userData?.name || 'Farmer'}</td>
                          <td className="px-6 py-4">{order.date || order.slotDate}</td>
                          <td className="px-6 py-4">{order.advisorName || order.advisorData?.name || 'N/A'}</td>
                          <td className="px-6 py-4 font-medium">₹{order.totalAmount || order.amount}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                              order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>{order.status || (order.cancelled ? 'Cancelled' : 'Pending')}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No recent orders found.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
