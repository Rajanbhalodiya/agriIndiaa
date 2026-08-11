import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdSearch, MdFilterList, MdAdd, MdReceipt } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { apiFetch, API_BASE_URL } from '../../services/api';
import { downloadInvoice } from '../../utils/invoiceHelper';

export default function OrdersList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('qr');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await apiFetch('/product-order/list');
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayClick = (orderId) => {
    setSelectedOrderForPayment(orderId);
    setPaymentMethod('qr');
    setPaymentModalOpen(true);
  };

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

  const submitPayment = async () => {
    if (!selectedOrderForPayment) return;
    try {
      const data = await apiFetch('/product-order/pay', {
        method: 'POST',
        body: JSON.stringify({ 
          orderId: selectedOrderForPayment,
          paymentMethod 
        })
      });

      if (data.success) {
        alert("Payment successful!");
        setPaymentModalOpen(false);
        setSelectedOrderForPayment(null);
        fetchOrders();
      } else {
        alert(data.message || "Payment failed");
      }
    } catch (error) {
      console.error(error);
      alert("Error processing payment");
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order._id.toLowerCase().includes(searchLower) ||
      (order.farmerName && order.farmerName.toLowerCase().includes(searchLower)) ||
      (order.status && order.status.toLowerCase().includes(searchLower)) ||
      order.items?.some(i => i.name?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <>
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-gray-500">Track and manage farmer product orders.</p>
        </div>
        <button 
          onClick={() => navigate('/products')}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:bg-primary-700 transition-colors font-medium"
        >
          <MdAdd className="w-5 h-5" />
          Create New Order
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search orders..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4 p-4 md:p-0">
            {/* Mobile View (< md) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
                  No orders found. Select products to create a new order.
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                        #{order._id.slice(-8).toUpperCase()}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="text-gray-400 block">Farmer</span>
                        <span className="font-semibold text-gray-900">{order.farmerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Date</span>
                        <span className="text-gray-700">{formatDateTime(order.date)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Items Count</span>
                        <span className="font-semibold text-gray-800">{order.items?.length || 0} items</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Payment</span>
                        {order.payment ? (
                          <span className="text-green-600 font-semibold">
                            Paid ({order.paymentMethod || 'Cash'})
                          </span>
                        ) : (
                          <span className="text-gray-400 font-semibold">Unpaid</span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100 mt-2">
                      <span className="font-semibold text-gray-700 block mb-1">Items Breakdown</span>
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="text-gray-600 flex justify-between gap-2">
                          <span>{item.name} {item.packSize ? `(${item.packSize})` : ''} <span className="text-gray-400">x{item.quantity}</span></span>
                          <span className="font-medium text-gray-800">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <div>
                        <span className="text-xs text-gray-400 block">Total</span>
                        <span className="text-base font-bold text-gray-900">₹{order.totalAmount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!order.payment && order.status !== 'Cancelled' && (
                          <button 
                            onClick={() => handlePayClick(order._id)}
                            className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary-700 transition-colors shadow-sm"
                          >
                            Pay Now
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 px-3 py-1.5 rounded-lg bg-primary-50 font-medium transition-colors border border-primary-100"
                        >
                          <MdReceipt className="w-4 h-4" />
                          Bill
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                    <th className="p-4 font-medium">Order ID</th>
                    <th className="p-4 font-medium">Farmer</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Items & Packaging</th>
                    <th className="p-4 font-medium">Total</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Payment</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-500">No orders found. Select products to create a new order.</td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium text-gray-900 truncate max-w-[120px]" title={order._id}>
                          #{order._id.slice(-8).toUpperCase()}
                        </td>
                        <td className="p-4 text-gray-700 font-medium">{order.farmerName}</td>
                        <td className="p-4 text-gray-600 text-xs font-medium">{formatDateTime(order.date)}</td>
                        <td className="p-4">
                          <div className="text-xs space-y-1 max-w-[220px]">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="text-gray-700 leading-tight">
                                <span className="font-medium">{item.name}</span>
                                {item.packSize && <span className="text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded text-[11px] font-semibold ml-1.5">{item.packSize}</span>}
                                <span className="text-gray-500 ml-1 font-medium">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-gray-900">₹{order.totalAmount}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {order.payment ? (
                            <span className="text-green-600 font-medium text-xs bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                              Paid ({order.paymentMethod || 'Cash'})
                            </span>
                          ) : order.status !== 'Cancelled' ? (
                            <button 
                              onClick={() => handlePayClick(order._id)}
                              className="bg-primary-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-primary-700 transition-colors"
                            >
                              Pay Now
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">Unpaid</span>
                          )}
                        </td>
                        <td className="p-4">
                          <button 
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="text-primary-600 hover:text-primary-800 p-2 rounded-lg hover:bg-primary-50 transition-colors"
                            title="View Bill"
                          >
                            <MdReceipt className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>

    {/* Invoice Modal */}
    {selectedInvoiceOrder && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Invoice</h2>
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
                <p className="text-gray-900 font-medium mt-1">{selectedInvoiceOrder.farmerName}</p>
                {selectedInvoiceOrder.farmerPhone && (
                  <p className="text-gray-500 text-xs font-medium mt-0.5 flex items-center gap-1">
                    <span>📞</span> {selectedInvoiceOrder.farmerPhone}
                  </p>
                )}
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

            <div className="border border-gray-100 rounded-xl overflow-x-auto no-scrollbar mb-6">
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
                      <td className="px-4 py-3 text-gray-900">
                        <div>{item.name}</div>
                        {item.packSize && <div className="text-xs text-gray-500">{item.packSize}</div>}
                      </td>
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

          <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-wrap justify-end gap-3">
            <button 
              onClick={() => downloadInvoice(selectedInvoiceOrder)}
              className="px-5 py-2 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm cursor-pointer flex items-center gap-2"
            >
              <span>📥</span> Download / Print Invoice
            </button>
            <button 
              onClick={() => setSelectedInvoiceOrder(null)}
              className="px-5 py-2 rounded-xl font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

    {paymentModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Process Payment</h2>
            <button 
              onClick={() => setPaymentModalOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex gap-4">
              <button 
                onClick={() => setPaymentMethod('qr')}
                className={`flex-1 py-3 rounded-xl border-2 font-medium transition-colors ${
                  paymentMethod === 'qr' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                QR Code
              </button>
              <button 
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 py-3 rounded-xl border-2 font-medium transition-colors ${
                  paymentMethod === 'cash' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Cash
              </button>
            </div>

            {paymentMethod === 'qr' ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=agriindia_payment" alt="Payment QR Code" className="w-full h-full object-contain" />
                </div>
                <p className="text-sm text-gray-500 text-center">Scan this QR code with any UPI app to pay.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <p className="text-sm text-gray-600 font-medium">Collect cash from the farmer.</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button 
              onClick={() => setPaymentModalOpen(false)}
              className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={submitPayment}
              className="px-5 py-2.5 rounded-xl font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm"
            >
              Payment Successful
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
