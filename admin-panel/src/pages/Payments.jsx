import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { MdReceipt, MdCheckCircle, MdCancel, MdSearch, MdAccountBalanceWallet, MdCheckCircleOutline, MdPendingActions } from 'react-icons/md';
import { API_BASE_URL } from '../services/api';
import { downloadInvoice, printInvoice } from '../utils/invoiceHelper';
import { TableSkeleton } from '../components/Loader';
import { formatPrice } from '../utils/formatters';

export default function Payments() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

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
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;

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
        fetchOrders();
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating order status");
    }
  };

  // Metrics
  const paidOrders = orders.filter(o => o.payment);
  const unpaidOrders = orders.filter(o => !o.payment);
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Filtered transactions
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.farmerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.advisorName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPayment = 
      paymentFilter === 'All' ||
      (paymentFilter === 'Paid' && order.payment) ||
      (paymentFilter === 'Unpaid' && !order.payment);

    const matchesOrderStatus = 
      orderStatusFilter === 'All' ||
      order.status === orderStatusFilter;

    return matchesSearch && matchesPayment && matchesOrderStatus;
  });

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <PageHeader 
        title="Payments & Revenue" 
        description="Monitor, verify and manage all customer & advisor transactions" 
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center text-2xl">
            <MdAccountBalanceWallet />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue Collected</p>
            <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl">
            <MdCheckCircleOutline />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Paid Transactions</p>
            <p className="text-2xl font-bold text-gray-900">{paidOrders.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl">
            <MdPendingActions />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Pending Payments</p>
            <p className="text-2xl font-bold text-gray-900">{unpaidOrders.length}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Search transaction ID, farmer, advisor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
          <MdSearch className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Payment:</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
            >
              <option value="All">All</option>
              <option value="Paid">Paid Only</option>
              <option value="Unpaid">Unpaid / Pending</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Order Status:</label>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState 
          title="No Transactions Found" 
          description="No payment records match your search or filter." 
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
                  <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                    #{order._id.slice(-8).toUpperCase()}
                  </span>
                  {order.payment ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      PAID ({order.paymentMethod || 'Cash'})
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      PENDING
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400 block">Farmer</span>
                    <span className="font-semibold text-gray-900">{order.farmerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Advisor</span>
                    <span className="font-semibold text-gray-800">{order.advisorName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Order Date</span>
                    <span className="text-gray-700">{formatDateTime(order.date)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Payment Date</span>
                    <span className="text-gray-700">
                      {order.payment ? formatDateTime(order.paymentDate || order.updatedAt || order.date) : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-sm">
                  <div>
                    <span className="text-xs text-gray-400 block">Total Amount</span>
                    <span className="text-base font-bold text-gray-900">₹{formatPrice(order.totalAmount)}</span>
                  </div>
                  <button
                    onClick={() => setSelectedInvoiceOrder(order)}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 px-3 py-1.5 rounded-lg bg-primary-50 font-medium transition-colors border border-primary-100"
                  >
                    <MdReceipt className="w-4 h-4" />
                    Bill
                  </button>
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
                    <th className="px-6 py-4 font-semibold">Transaction ID</th>
                    <th className="px-6 py-4 font-semibold">Farmer</th>
                    <th className="px-6 py-4 font-semibold">Advisor</th>
                    <th className="px-6 py-4 font-semibold">Order Date & Time</th>
                    <th className="px-6 py-4 font-semibold">Payment Date & Time</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Payment Status</th>
                    <th className="px-6 py-4 font-semibold">Order Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-900">
                        #{order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {order.farmerName}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {order.advisorName}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                        {formatDateTime(order.date)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                        {order.payment ? formatDateTime(order.paymentDate || order.updatedAt || order.date) : <span className="text-amber-600 font-normal">Pending</span>}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        ₹{formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        {order.payment ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            SUCCESSFUL ({order.paymentMethod || 'Cash'})
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                          title="View Bill"
                        >
                          <MdReceipt className="w-5 h-5" />
                          View Bill
                        </button>
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
                  <h2 className="text-2xl font-bold text-gray-900">Payment Invoice</h2>
                  <p className="text-sm text-gray-500 mt-1">Transaction #{selectedInvoiceOrder._id.slice(-8).toUpperCase()}</p>
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
                        <td className="px-4 py-3 text-gray-600 text-right">₹{formatPrice(item.price)}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium text-right">₹{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-1/2 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900 font-medium">₹{formatPrice(selectedInvoiceOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-3">
                    <span className="text-gray-900">Total</span>
                    <span className="text-primary-600">₹{formatPrice(selectedInvoiceOrder.totalAmount)}</span>
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
