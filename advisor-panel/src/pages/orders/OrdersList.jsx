import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdSearch, MdAdd, MdReceipt } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { downloadInvoice, printInvoice } from '../../utils/invoiceHelper';
import { TableSkeleton } from '../../components/Loader';
import { formatPrice } from '../../utils/formatters';

export default function OrdersList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('qr');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const data = await apiFetch('/product-order/list');
      if (data.success) setOrders(data.orders || []);
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
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDateShort = (timestamp) => {
    if (!timestamp) return 'N/A';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const submitPayment = async () => {
    if (!selectedOrderForPayment) return;
    try {
      const data = await apiFetch('/product-order/pay', {
        method: 'POST',
        body: JSON.stringify({ orderId: selectedOrderForPayment, paymentMethod })
      });
      if (data.success) {
        alert('Payment successful!');
        setPaymentModalOpen(false);
        setSelectedOrderForPayment(null);
        fetchOrders();
      } else {
        alert(data.message || 'Payment failed');
      }
    } catch (error) {
      alert('Error processing payment');
    }
  };

  const filteredOrders = orders.filter(order => {
    const s = searchTerm.toLowerCase();
    return (
      order._id.toLowerCase().includes(s) ||
      (order.farmerName && order.farmerName.toLowerCase().includes(s)) ||
      (order.status && order.status.toLowerCase().includes(s)) ||
      order.items?.some(i => i.name?.toLowerCase().includes(s))
    );
  });

  const statusColor = (status) => {
    if (status === 'Completed') return 'bg-green-100 text-green-700';
    if (status === 'Processing') return 'bg-blue-100 text-blue-700';
    if (status === 'Cancelled') return 'bg-red-100 text-red-700';
    return 'bg-orange-100 text-orange-700';
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-5 w-full"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track and manage farmer product orders.</p>
          </div>
          <button
            onClick={() => navigate('/products')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl shadow-md hover:bg-primary-700 transition-colors font-medium text-sm"
          >
            <MdAdd className="w-4 h-4" />
            Create New Order
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by farmer, order ID or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow outline-none shadow-sm text-sm"
          />
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : filteredOrders.length === 0 ? (
          <div className="p-10 text-center bg-surface rounded-2xl border border-dashed border-gray-200 text-gray-500">
            <MdReceipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium">No orders found.</p>
            <button
              onClick={() => navigate('/products')}
              className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Create Order
            </button>
          </div>
        ) : (
          <>
            {/* Card list — all screen sizes */}
            <div className="space-y-3 lg:hidden">
              {filteredOrders.map((order) => (
                <div key={order._id} className="bg-surface rounded-2xl p-4 shadow-sm border border-gray-100">
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">
                      #{order._id.slice(-8).toUpperCase()}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                    <div>
                      <span className="text-gray-400 block mb-0.5">Farmer</span>
                      <span className="font-semibold text-gray-900">{order.farmerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Date</span>
                      <span className="text-gray-700">{formatDateShort(order.date)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Items</span>
                      <span className="font-semibold text-gray-800">{order.items?.length || 0} item(s)</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Payment</span>
                      {order.payment ? (
                        <span className="text-green-600 font-semibold">Paid ({order.paymentMethod || 'Cash'})</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">Unpaid</span>
                      )}
                    </div>
                  </div>

                  {/* Items breakdown */}
                  <div className="text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100 mb-3 space-y-1">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between gap-2 text-gray-600">
                        <span className="truncate">{item.name} {item.packSize ? `(${item.packSize})` : ''} <span className="text-gray-400">×{item.quantity}</span></span>
                        <span className="font-medium text-gray-800 flex-shrink-0">₹{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block">Total</span>
                      <span className="text-base font-bold text-gray-900">₹{formatPrice(order.totalAmount)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!order.payment && order.status !== 'Cancelled' && (
                        <button
                          onClick={() => handlePayClick(order._id)}
                          className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary-700 transition-colors"
                        >
                          Pay Now
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedInvoiceOrder(order)}
                        className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 px-3 py-1.5 rounded-lg bg-primary-50 font-medium border border-primary-100"
                      >
                        <MdReceipt className="w-3.5 h-3.5" />
                        Bill
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table — lg+ only */}
            <div className="hidden lg:block bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase">
                      <th className="p-4 font-semibold">Order ID</th>
                      <th className="p-4 font-semibold">Farmer</th>
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Items</th>
                      <th className="p-4 font-semibold">Total</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">Payment</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-mono text-xs font-bold text-gray-900">
                          #{order._id.slice(-8).toUpperCase()}
                        </td>
                        <td className="p-4 text-gray-700 font-medium text-sm">{order.farmerName}</td>
                        <td className="p-4 text-gray-500 text-xs">{formatDateTime(order.date)}</td>
                        <td className="p-4">
                          <div className="text-xs space-y-0.5 max-w-[200px]">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="text-gray-700">
                                <span className="font-medium">{item.name}</span>
                                {item.packSize && <span className="text-primary-700 bg-primary-50 px-1 py-0.5 rounded text-[10px] font-semibold ml-1">{item.packSize}</span>}
                                <span className="text-gray-400 ml-1">×{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-gray-900">₹{formatPrice(order.totalAmount)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(order.status)}`}>
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
                              className="bg-primary-600 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-primary-700 transition-colors"
                            >
                              Pay Now
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">Unpaid</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="text-primary-600 hover:text-primary-800 p-2 rounded-lg hover:bg-primary-50 transition-colors"
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
      </motion.div>

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-start flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-xl p-1.5 border border-primary-100 flex items-center justify-center flex-shrink-0">
                  <img src="/favicon.png" alt="AgriIndia Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Invoice</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Order #{selectedInvoiceOrder._id.slice(-8).toUpperCase()}</p>
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
                  {selectedInvoiceOrder.farmerPhone && (
                    <p className="text-gray-500 text-xs mt-0.5">📞 {selectedInvoiceOrder.farmerPhone}</p>
                  )}
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

      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Process Payment</h2>
              <button onClick={() => setPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex gap-3">
                {['qr', 'cash'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-colors ${paymentMethod === method
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    {method === 'qr' ? '📱 QR Code' : '💵 Cash'}
                  </button>
                ))}
              </div>

              {paymentMethod === 'qr' ? (
                <div className="flex flex-col items-center py-4 space-y-3">
                  <div className="w-44 h-44 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=agriindia_payment" alt="QR" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-sm text-gray-500 text-center">Scan this QR code with any UPI app to pay.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 space-y-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl">💵</div>
                  <p className="text-sm text-gray-600 font-medium">Collect cash from the farmer.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200 transition-colors text-sm border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={submitPayment}
                className="flex-1 py-2.5 rounded-xl font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm text-sm"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
