import { useState, useEffect } from 'react';
import { MdPeople, MdAgriculture, MdInventory, MdShoppingCart, MdReceipt, MdPayments } from 'react-icons/md';

export default function Dashboard() {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashData = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
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
    { label: 'Total Advisors', value: dashData?.advisores || 0, icon: <MdPeople />, color: 'bg-blue-500' },
    { label: 'Total Farmers', value: dashData?.customers || dashData?.patients || 0, icon: <MdAgriculture />, color: 'bg-green-500' },
    { label: 'Total Orders', value: dashData?.orders || dashData?.appointments || 0, icon: <MdShoppingCart />, color: 'bg-purple-500' },
    { label: 'Total Products', value: dashData?.products || 0, icon: <MdInventory />, color: 'bg-amber-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-gray-500">Welcome to the AgriIndiaa Admin Control Panel</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md3-2 transition-shadow">
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
            
            {dashData?.latestOrders?.length > 0 || dashData?.latestAppointments?.length > 0 ? (
              <div className="overflow-x-auto">
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
                    {(dashData.latestOrders || dashData.latestAppointments).map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{order.userData.name}</td>
                        <td className="px-6 py-4">{order.slotDate}</td>
                        <td className="px-6 py-4">{order.advisorData.name}</td>
                        <td className="px-6 py-4 font-medium">₹{order.amount}</td>
                        <td className="px-6 py-4">
                          {order.status ? (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                              order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>{order.status}</span>
                          ) : order.cancelled ? (
                            <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">Cancelled</span>
                          ) : (
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
