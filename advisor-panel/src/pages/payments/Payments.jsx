import { useState, useEffect } from 'react';
import { MdReceipt, MdSearch, MdAccountBalanceWallet, MdCheckCircleOutline, MdPendingActions } from 'react-icons/md';
import { motion } from 'framer-motion';
import { apiFetch } from '../../services/api';
import { downloadInvoice, printInvoice } from '../../utils/invoiceHelper';
import { TableSkeleton } from '../../components/Loader';
import { formatPrice } from '../../utils/formatters';

export default function Payments() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const data = await apiFetch('/product-order/list');
      if (data.success) setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const paidOrders = orders.filter(o => o.payment);
  const unpaidOrders = orders.filter(o => !o.payment);
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.farmerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      paymentFilter === 'All' ||
      (paymentFilter === 'Paid' && order.payment) ||
      (paymentFilter === 'Unpaid' && !order.payment);
    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 w-full"
    >
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Payments Overview</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track revenue and payment status for all farmer orders.</p>
      </div>

      {/* Metric Cards — 1 col mobile, 3 col sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-100 text-green-700 flex items-center justify-center text-xl flex-shrink-0">
            <MdAccountBalanceWallet />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 mb-0.5">Total Paid Volume</p>
            <p className="text-xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl flex-shrink-0">
            <MdCheckCircleOutline />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 mb-0.5">Paid Transactions</p>
            <p className="text-xl font-bold text-gray-900">{paidOrders.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl flex-shrink-0">
            <MdPendingActions />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 mb-0.5">Pending Payments</p>
            <p className="text-xl font-bold text-gray-900">{unpaidOrders.length}</p>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by farmer name or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
        </div>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm cursor-pointer"
        >
          <option value="All">All Transactions</option>
          <option value="Paid">Paid Only</option>
          <option value="Unpaid">Unpaid / Pending</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-500 text-sm">
          No payment records found matching your filters.
        </div>
      ) : (
        <>
          {/* Card view — mobile & tablet */}
          <div className="space-y-3 lg:hidden">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">
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

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                  <div>
                    <span className="text-gray-400 block mb-0.5">Farmer</span>
                    <span className="font-semibold text-gray-900">{order.farmerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Order Status</span>
                    <span className={`font-semibold ${order.status === 'Completed' ? 'text-green-700' : order.status === 'Processing' ? 'text-blue-700' : order.status === 'Cancelled' ? 'text-red-700' : 'text-orange-700'}`}>
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Order Date</span>
                    <span className="text-gray-700">{formatDateTime(order.date)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Payment Date</span>
                    <span className="text-gray-700">
                      {order.payment ? formatDateTime(order.paymentDate || order.updatedAt || order.date) : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div>
                    <span className="text-xs text-gray-400 block">Total Amount</span>
                    <span className="text-base font-bold text-gray-900">₹{formatPrice(order.totalAmount)}</span>
                  </div>
                  <button
                    onClick={() => setSelectedInvoiceOrder(order)}
                    className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 px-3 py-2 rounded-xl bg-primary-50 font-medium border border-primary-100"
                  >
                    <MdReceipt className="w-4 h-4" />
                    View Bill
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Table — lg+ only */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Transaction ID</th>
                    <th className="px-5 py-4 font-semibold">Farmer</th>
                    <th className="px-5 py-4 font-semibold">Order Date</th>
                    <th className="px-5 py-4 font-semibold">Payment Date</th>
                    <th className="px-5 py-4 font-semibold">Amount</th>
                    <th className="px-5 py-4 font-semibold">Payment Status</th>
                    <th className="px-5 py-4 font-semibold">Order Status</th>
                    <th className="px-5 py-4 font-semibold text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs font-bold text-gray-900">
                        #{order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900 text-sm">{order.farmerName}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{formatDateTime(order.date)}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs">
                        {order.payment
                          ? formatDateTime(order.paymentDate || order.updatedAt || order.date)
                          : <span className="text-amber-600">Pending</span>}
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-900">₹{formatPrice(order.totalAmount)}</td>
                      <td className="px-5 py-4">
                        {order.payment ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            PAID ({order.paymentMethod || 'Cash'})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : order.status === 'Processing' ? 'bg-blue-100 text-blue-700' : order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="text-primary-600 hover:text-primary-800 p-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                          title="View Bill"
                        >
                          <MdReceipt className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Invoice Modal — slides from bottom on mobile */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-start flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-xl p-1.5 border border-primary-100 flex items-center justify-center flex-shrink-0">
                  <img src="/favicon.png" alt="AgriIndia Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Invoice</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Transaction #{selectedInvoiceOrder._id.slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedInvoiceOrder(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Billed To</p>
                  <p className="text-gray-900 font-medium mt-1 text-sm">{selectedInvoiceOrder.farmerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Order Date</p>
                  <p className="text-gray-900 font-medium mt-1 text-xs">{formatDateTime(selectedInvoiceOrder.date)}</p>
                </div>
                {selectedInvoiceOrder.payment && (
                  <>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Payment Mode</p>
                      <p className="text-gray-900 font-medium mt-1 text-sm">{selectedInvoiceOrder.paymentMethod || 'Cash'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Payment Date</p>
                      <p className="text-gray-900 font-medium mt-1 text-xs">{formatDateTime(selectedInvoiceOrder.paymentDate || selectedInvoiceOrder.updatedAt || selectedInvoiceOrder.date)}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium text-xs">Item</th>
                      <th className="px-3 py-3 font-medium text-xs text-center">Qty</th>
                      <th className="px-3 py-3 font-medium text-xs text-right">Price</th>
                      <th className="px-4 py-3 font-medium text-xs text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedInvoiceOrder.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-gray-900 text-sm">
                          <div className="font-medium">{item.name}</div>
                          {item.packSize && <div className="text-xs text-gray-500">{item.packSize}</div>}
                        </td>
                        <td className="px-3 py-3 text-gray-600 text-center text-sm">{item.quantity}</td>
                        <td className="px-3 py-3 text-gray-600 text-right text-sm">₹{formatPrice(item.price)}</td>
                        <td className="px-4 py-3 text-gray-900 font-semibold text-right text-sm">₹{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mb-4">
                <div className="space-y-2 w-48">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900 font-medium">₹{formatPrice(selectedInvoiceOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-gray-100 pt-2">
                    <span className="text-gray-900">Total</span>
                    <span className="text-primary-600">₹{formatPrice(selectedInvoiceOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${selectedInvoiceOrder.payment ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedInvoiceOrder.payment ? '✓ PAYMENT COMPLETED' : '⏳ PAYMENT PENDING'}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-3 flex-shrink-0">
              <button
                onClick={() => downloadInvoice(selectedInvoiceOrder)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 transition-colors text-sm"
              >
                📥 Download Invoice
              </button>
              <button
                onClick={() => printInvoice(selectedInvoiceOrder)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
              >
                🖨️ Print Invoice
              </button>
              <button
                onClick={() => setSelectedInvoiceOrder(null)}
                className="px-4 py-2.5 rounded-xl font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
