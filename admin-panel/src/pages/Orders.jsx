import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { MdCheckCircle, MdCancel, MdReceipt } from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { sendWhatsAppBill } from '../utils/whatsappHelper';
import { downloadInvoice, printInvoice } from '../utils/invoiceHelper';
import { API_BASE_URL } from '../services/api';
import { TableSkeleton } from '../components/Loader';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

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

  const fetchOrders = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE_URL}/admin/product-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'atoken': token
        }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    const confirmMsg = newStatus === 'Cancelled'
      ? 'Are you sure you want to CANCEL this order?'
      : `Are you sure you want to mark this order as ${newStatus}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE_URL}/admin/update-product-order-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'atoken': token
        },
        body: JSON.stringify({ orderId, status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        fetchOrders(); // Refresh list

        // Automatically open WhatsApp bill when order is accepted/completed
        if (newStatus === 'Completed' && orderObj) {
          sendWhatsAppBill({ ...orderObj, status: 'Completed' });
        }
      } else {
        alert(data.message || "Failed to update order status");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating order");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.farmerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.advisorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'All' || 
      order.status === statusFilter || 
      (statusFilter === 'Paid' && order.payment) ||
      (statusFilter === 'Unpaid' && !order.payment);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <PageHeader 
        title="Orders" 
        description="Track and manage all product orders" 
      />

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Search by farmer, advisor, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <label className="text-sm font-medium text-gray-600">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Paid">Payment: Paid</option>
            <option value="Unpaid">Payment: Unpaid</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState 
          title="No Matching Orders" 
          description="Try adjusting your search query or status filter." 
        />
      ) : (
        <div className="space-y-4">
          {/* Mobile Card View (< md) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">{order.farmerName}</h4>
                    <p className="text-xs text-gray-400">{formatDateTime(order.date)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="text-xs space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="font-semibold text-gray-700 block mb-1">Items ({order.items?.length || 0})</span>
                  {order.items?.map(item => (
                    <div key={item._id} className="text-gray-600 flex justify-between">
                      <span>{item.name} {item.packSize ? `(${item.packSize})` : ''} (x{item.quantity})</span>
                      <span className="font-medium">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400 block">Advisor</span>
                    <span className="font-semibold text-gray-800">{order.advisorName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Payment Status</span>
                    <span className={`font-semibold ${order.payment ? 'text-green-600' : 'text-gray-400'}`}>
                      {order.payment ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 block">Total</span>
                    <span className="text-base font-bold text-gray-900">₹{order.totalAmount}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 px-3 py-1.5 rounded-lg bg-primary-50 font-medium transition-colors"
                      title="View Bill"
                    >
                      <MdReceipt className="w-4 h-4" />
                      Bill
                    </button>
                    <button 
                      onClick={() => sendWhatsAppBill(order)}
                      className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 px-3 py-1.5 rounded-lg bg-green-50 font-medium transition-colors"
                      title="Send Bill on WhatsApp"
                    >
                      <FaWhatsapp className="w-4 h-4" />
                      WhatsApp
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.payment && order.status !== 'Completed' && order.status !== 'Cancelled' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateStatus(order, 'Completed')}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg border border-green-200"
                          title="Approve Order & Send Bill"
                        >
                          <MdCheckCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => updateStatus(order, 'Cancelled')}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                          title="Cancel Order"
                        >
                          <MdCancel className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Farmer</th>
                    <th className="px-6 py-4 font-semibold">Advisor</th>
                    <th className="px-6 py-4 font-semibold">Items</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Payment</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.farmerName}</div>
                        <div className="text-xs text-gray-400">{formatDateTime(order.date)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {order.advisorImage && (
                            <img src={order.advisorImage} alt="" className="w-8 h-8 rounded bg-gray-100 object-cover shrink-0" />
                          )}
                          <span>{order.advisorName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-1">
                          {order.items?.map(item => (
                            <div key={item._id}>{item.name} {item.packSize ? `(${item.packSize})` : ''} (x{item.quantity})</div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">₹{order.totalAmount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {order.payment ? (
                          <span className="text-green-600 font-medium text-sm">Paid</span>
                        ) : (
                          <span className="text-gray-400 text-sm">Unpaid</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-3">
                          <button 
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="text-primary-600 hover:text-primary-800 p-1.5 rounded hover:bg-primary-50 transition-colors"
                            title="View Bill"
                          >
                            <MdReceipt className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => sendWhatsAppBill(order)}
                            className="text-green-600 hover:text-green-800 p-1.5 rounded hover:bg-green-50 transition-colors"
                            title="Send Bill on WhatsApp to Farmer"
                          >
                            <FaWhatsapp className="w-5 h-5" />
                          </button>
                          {order.payment && order.status !== 'Completed' && order.status !== 'Cancelled' && (
                            <div className="flex justify-end gap-2 border-l pl-3 border-gray-200">
                              <button 
                                onClick={() => updateStatus(order, 'Completed')}
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Approve Order & Send Bill"
                              >
                                <MdCheckCircle className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => updateStatus(order, 'Cancelled')}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Cancel Order"
                              >
                                <MdCancel className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-xl p-1.5 border border-primary-100 flex items-center justify-center flex-shrink-0">
                  <img src="/favicon.png" alt="AgriIndia Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Invoice</h2>
                  <p className="text-sm text-gray-500 mt-1">Order #{selectedInvoiceOrder._id.slice(-8).toUpperCase()}</p>
                </div>
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
                className="flex items-center gap-2 px-5 py-2 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm cursor-pointer text-sm"
              >
                📥 Download Invoice
              </button>
              <button
                onClick={() => printInvoice(selectedInvoiceOrder)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer text-sm"
              >
                🖨️ Print Invoice
              </button>
              <button
                onClick={() => setSelectedInvoiceOrder(null)}
                className="px-5 py-2 rounded-xl font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors cursor-pointer text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
