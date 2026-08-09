import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdArrowBack, MdLocationOn, MdPhone, MdShoppingBag, MdReceipt } from 'react-icons/md';
import { apiFetch } from '../../services/api';

export default function FarmerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('farm');
  const [farmer, setFarmer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const dateObj = new Date(timestamp);
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    fetchFarmer();
  }, [id]);

  const fetchFarmer = async () => {
    try {
      const data = await apiFetch('/advisor/farmer', {
        method: 'POST',
        body: JSON.stringify({ farmerId: id })
      });

      if (data.success) {
        setFarmer(data.farmer);
        setOrders(data.orders || []);
        setErrorMsg(null);
      } else {
        setErrorMsg(data.message || 'Failed to load details.');
      }
    } catch (error) {
      console.error('Failed to fetch farmer:', error);
      setErrorMsg('Network error: Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'farm', label: 'Farm Details' },
    { id: 'land', label: 'Land Details' },
    { id: 'crop', label: 'Crop Details' },
    { id: 'orders', label: `Order History (${orders.length})` }
  ];

  if (loading) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (errorMsg) {
    return (
      <div className="text-center p-12 space-y-4">
        <div className="text-red-500 font-medium text-lg">Error: {errorMsg}</div>
        <button onClick={() => navigate(-1)} className="text-primary-600 hover:underline">Go Back</button>
      </div>
    );
  }

  if (!farmer) {
    return <div className="text-center p-12 text-gray-500">Farmer not found.</div>;
  }

  const farmerFullName = farmer.farmerName || `${farmer.firstName || ''} ${farmer.lastName || ''}`.trim();

  return (
    <>
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-surface-variant transition-colors"
          >
            <MdArrowBack className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Farmer Profile</h1>
        </div>
      </div>

      <div className="bg-surface rounded-3xl shadow-md3-2 overflow-hidden">
        <div className="bg-primary-600 h-32 relative">
          <div className="absolute -bottom-12 left-8 w-24 h-24 bg-white rounded-full border-4 border-white flex items-center justify-center text-3xl font-bold text-primary-600 shadow-md">
            {farmerFullName ? farmerFullName.charAt(0).toUpperCase() : 'F'}
          </div>
        </div>
        <div className="pt-16 pb-6 px-8">
          <h2 className="text-2xl font-bold text-gray-900">{farmerFullName}</h2>
          <div className="flex items-center gap-6 mt-2 text-gray-600">
            <div className="flex items-center gap-1">
              <MdLocationOn className="w-5 h-5 text-gray-400" />
              {farmer.village || 'N/A'}
            </div>
            <div className="flex items-center gap-1">
              <MdPhone className="w-5 h-5 text-gray-400" />
              {farmer.phone}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100">
          <div className="flex overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-primary-600 text-primary-600 font-semibold' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-3xl shadow-md3-1 p-6 md:p-8 min-h-[300px]">
        {activeTab === 'farm' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Farm Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Village</p>
                <p className="font-semibold text-gray-900">{farmer.village || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Contact Phone</p>
                <p className="font-semibold text-gray-900">{farmer.phone}</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'land' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Land Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Total Land Area</p>
                <p className="font-semibold text-gray-900">{farmer.totalLand || 'N/A'} Acres</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Temporary Land Area</p>
                <p className="font-semibold text-gray-900">{farmer.temporaryLand || '0'} Acres</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Land Type</p>
                <p className="font-semibold text-gray-900 capitalize">{farmer.landType || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crop' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Crop & Land Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Land Type</p>
                <p className="font-semibold text-gray-900 capitalize">{farmer.landType || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Winter Crop</p>
                <p className="font-semibold text-gray-900">{farmer.winterCrop || 'None'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Summer Crop</p>
                <p className="font-semibold text-gray-900">{farmer.summerCrop || 'None'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Rain Crop (Monsoon)</p>
                <p className="font-semibold text-gray-900">{farmer.rainCrop || 'None'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Order History for {farmerFullName}</h3>
              <button 
                onClick={() => navigate('/products')}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <MdShoppingBag className="w-4 h-4" />
                Place New Order
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-500">
                No orders placed for this farmer yet.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order._id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-200 pb-2">
                      <div>
                        <span className="font-mono text-xs font-semibold text-gray-900">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 block">
                          Order: {formatDateTime(order.date)}
                        </span>
                        {order.payment && (
                          <span className="text-xs text-green-600 block">
                            Paid: {formatDateTime(order.paymentDate || order.updatedAt || order.date)} ({order.paymentMethod || 'Cash'})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${order.payment ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {order.payment ? 'PAID' : 'PENDING'}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {order.status}
                        </span>
                        <button 
                          onClick={() => setSelectedInvoiceOrder({ ...order, farmerName: farmerFullName })}
                          className="flex items-center gap-1 bg-white text-primary-600 border border-primary-200 hover:bg-primary-50 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ml-2"
                        >
                          <MdReceipt className="w-4 h-4" />
                          View Bill
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-gray-700">
                          <span>{item.name} x {item.quantity}</span>
                          <span className="font-medium">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-sm">
                      <span className="font-medium text-gray-600">Total Amount</span>
                      <span className="font-bold text-gray-900 text-base">₹{order.totalAmount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>

    {/* Bill / Invoice Modal */}
    {selectedInvoiceOrder && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Invoice / Bill</h2>
              <p className="text-sm text-gray-500 mt-1">Order #{selectedInvoiceOrder._id.slice(-8).toUpperCase()}</p>
            </div>
            <button 
              onClick={() => setSelectedInvoiceOrder(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Billed To</p>
                <p className="text-gray-900 font-medium mt-1">{selectedInvoiceOrder.farmerName || farmerFullName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Order Date & Time</p>
                <p className="text-gray-900 font-medium mt-1 text-xs">{formatDateTime(selectedInvoiceOrder.date)}</p>
              </div>
              {selectedInvoiceOrder.payment && (
                <>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Payment Mode</p>
                    <p className="text-gray-900 font-medium mt-1">{selectedInvoiceOrder.paymentMethod || 'Cash'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Payment Date & Time</p>
                    <p className="text-gray-900 font-medium mt-1 text-xs">{formatDateTime(selectedInvoiceOrder.paymentDate || selectedInvoiceOrder.updatedAt || selectedInvoiceOrder.date)}</p>
                  </div>
                </>
              )}
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium text-center">Qty</th>
                    <th className="px-4 py-3 font-medium text-right">Price</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedInvoiceOrder.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-gray-600 text-right">₹{item.price}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium text-right">₹{item.price * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-1/2 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900 font-medium">₹{selectedInvoiceOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-3">
                  <span className="text-gray-900">Total</span>
                  <span className="text-primary-600">₹{selectedInvoiceOrder.totalAmount}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
               <span className={`px-4 py-2 rounded-full text-sm font-semibold ${selectedInvoiceOrder.payment ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                 {selectedInvoiceOrder.payment ? 'PAYMENT COMPLETED' : 'PAYMENT PENDING'}
               </span>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button 
              onClick={() => window.print()}
              className="px-5 py-2 rounded-xl font-medium text-primary-600 border border-primary-200 hover:bg-primary-50 transition-colors"
            >
              Print Bill
            </button>
            <button 
              onClick={() => setSelectedInvoiceOrder(null)}
              className="px-5 py-2 rounded-xl font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
