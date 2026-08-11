import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { API_BASE_URL } from '../services/api';
import { 
  MdBarChart, 
  MdTrendingUp, 
  MdFileDownload, 
  MdPrint, 
  MdAccountBalanceWallet, 
  MdShoppingCart, 
  MdPeople, 
  MdAgriculture, 
  MdSearch, 
  MdFilterList,
  MdCheckCircle,
  MdPendingActions,
  MdCancel,
  MdClose,
  MdVisibility
} from 'react-icons/md';

export default function Reports() {
  const [orders, setOrders] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'products' | 'advisors' | 'transactions'
  const [timeRange, setTimeRange] = useState('All'); // 'All' | '30Days' | 'ThisMonth' | 'ThisYear' | 'Custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdvisorSales, setSelectedAdvisorSales] = useState(null);
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');
  const [productSortBy, setProductSortBy] = useState('units'); // 'units' | 'revenue'

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const headers = { 'Authorization': `Bearer ${token}` };

      const [ordersRes, advisorsRes, farmersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/product-orders`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/admin/all-advisores`, { method: 'POST', headers }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/admin/all-farmers`, { method: 'POST', headers }).then(r => r.json()).catch(() => ({ success: false }))
      ]);

      if (ordersRes.success) setOrders(ordersRes.orders || []);
      if (advisorsRes.success) setAdvisors(advisorsRes.advisores || advisorsRes.doctors || []);
      if (farmersRes.success) setFarmers(farmersRes.farmers || []);
    } catch (error) {
      console.error('Error loading reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper date formatter
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

  // Filter orders by time range
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.date);
    const now = new Date();

    if (timeRange === '30Days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return orderDate >= thirtyDaysAgo;
    }
    if (timeRange === 'ThisMonth') {
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }
    if (timeRange === 'ThisYear') {
      return orderDate.getFullYear() === now.getFullYear();
    }
    if (timeRange === 'Custom') {
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        return orderDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return orderDate <= end;
      }
    }
    return true; // 'All'
  });

  // Calculate Key Business Metrics
  const paidOrders = filteredOrders.filter(o => o.payment);
  const pendingOrders = filteredOrders.filter(o => !o.payment && o.status !== 'Cancelled');
  const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled');
  const completedOrders = filteredOrders.filter(o => o.status === 'Completed');

  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Payment Mode Breakdown
  const paymentModes = { Cash: 0, 'UPI / QR': 0, Online: 0, Other: 0 };
  paidOrders.forEach(o => {
    const mode = o.paymentMethod || 'Cash';
    if (mode in paymentModes) paymentModes[mode] += o.totalAmount || 0;
    else paymentModes.Other += o.totalAmount || 0;
  });

  // Top Products Performance with Packaging Breakdown
  const productSalesMap = {};
  filteredOrders.forEach(order => {
    if (order.status !== 'Cancelled') {
      order.items?.forEach(item => {
        const pName = item.name;
        const packSize = item.packSize || 'Standard';

        if (!productSalesMap[pName]) {
          productSalesMap[pName] = {
            name: pName,
            totalQty: 0,
            totalRevenue: 0,
            price: item.price,
            packBreakdown: {}
          };
        }

        productSalesMap[pName].totalQty += item.quantity || 0;
        productSalesMap[pName].totalRevenue += ((item.price || 0) * (item.quantity || 0));

        if (!productSalesMap[pName].packBreakdown[packSize]) {
          productSalesMap[pName].packBreakdown[packSize] = {
            packSize: packSize,
            totalQty: 0,
            totalRevenue: 0,
            price: item.price
          };
        }
        productSalesMap[pName].packBreakdown[packSize].totalQty += item.quantity || 0;
        productSalesMap[pName].packBreakdown[packSize].totalRevenue += ((item.price || 0) * (item.quantity || 0));
      });
    }
  });

  const topProducts = Object.values(productSalesMap).map(product => ({
    ...product,
    packList: Object.values(product.packBreakdown).sort((a, b) => b.totalQty - a.totalQty)
  })).sort((a, b) => {
    if (productSortBy === 'units') {
      return b.totalQty - a.totalQty || b.totalRevenue - a.totalRevenue;
    }
    return b.totalRevenue - a.totalRevenue || b.totalQty - a.totalQty;
  });
  const maxProductMetric = topProducts[0] ? (productSortBy === 'units' ? topProducts[0].totalQty : topProducts[0].totalRevenue) : 1;

  // Map all-time orders for each advisor
  const advisorAllOrdersMap = {};
  orders.forEach(order => {
    const name = order.advisorName || 'Unassigned Advisor';
    if (!advisorAllOrdersMap[name]) advisorAllOrdersMap[name] = [];
    advisorAllOrdersMap[name].push(order);
  });

  // Advisor Leaderboard Performance
  const advisorPerformanceMap = {};
  filteredOrders.forEach(order => {
    const name = order.advisorName || 'Unassigned Advisor';
    const advisorId = order.advisorId;
    if (!advisorPerformanceMap[name]) {
      advisorPerformanceMap[name] = { 
        name, 
        advisorId, 
        orderCount: 0, 
        paidRevenue: 0, 
        totalRevenue: 0,
        cashRevenue: 0,
        qrRevenue: 0,
        farmersSet: new Set(),
        orders: [],
        allOrders: advisorAllOrdersMap[name] || [],
        productMap: {}
      };
    }
    advisorPerformanceMap[name].orderCount += 1;
    advisorPerformanceMap[name].totalRevenue += order.totalAmount || 0;
    if (order.payment) {
      advisorPerformanceMap[name].paidRevenue += order.totalAmount || 0;
      const pMode = (order.paymentMethod || 'Cash').toLowerCase();
      if (pMode.includes('qr') || pMode.includes('upi')) {
        advisorPerformanceMap[name].qrRevenue += order.totalAmount || 0;
      } else {
        advisorPerformanceMap[name].cashRevenue += order.totalAmount || 0;
      }
    }
    if (order.farmerId) advisorPerformanceMap[name].farmersSet.add(order.farmerId);
    advisorPerformanceMap[name].orders.push(order);

    order.items?.forEach(item => {
      const pKey = `${item.name}_${item.packSize || ''}`;
      if (!advisorPerformanceMap[name].productMap[pKey]) {
        advisorPerformanceMap[name].productMap[pKey] = {
          name: item.name,
          packSize: item.packSize || '',
          totalQty: 0,
          totalRevenue: 0,
          price: item.price
        };
      }
      advisorPerformanceMap[name].productMap[pKey].totalQty += item.quantity || 0;
      advisorPerformanceMap[name].productMap[pKey].totalRevenue += ((item.price || 0) * (item.quantity || 0));
    });
  });

  const advisorLeaderboard = Object.values(advisorPerformanceMap)
    .map(a => ({ 
      ...a, 
      uniqueFarmers: a.farmersSet.size,
      productsList: Object.values(a.productMap).sort((p1, p2) => p2.totalRevenue - p1.totalRevenue)
    }))
    .sort((a, b) => b.paidRevenue - a.paidRevenue);

  // Helper to compute modal statistics based on custom modal date filter
  const getModalFilteredData = () => {
    if (!selectedAdvisorSales) return null;

    const targetOrders = (modalStartDate || modalEndDate)
      ? (selectedAdvisorSales.allOrders || selectedAdvisorSales.orders || [])
      : (selectedAdvisorSales.orders || []);

    const modalOrders = targetOrders.filter(order => {
      const orderDate = new Date(order.date);
      if (modalStartDate && modalEndDate) {
        const start = new Date(modalStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(modalEndDate);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
      } else if (modalStartDate) {
        const start = new Date(modalStartDate);
        start.setHours(0, 0, 0, 0);
        return orderDate >= start;
      } else if (modalEndDate) {
        const end = new Date(modalEndDate);
        end.setHours(23, 59, 59, 999);
        return orderDate <= end;
      }
      return true;
    });

    let paidRevenue = 0;
    let cashRevenue = 0;
    let qrRevenue = 0;
    const farmersSet = new Set();
    const productMap = {};

    modalOrders.forEach(order => {
      if (order.payment) {
        paidRevenue += order.totalAmount || 0;
        const pMode = (order.paymentMethod || 'Cash').toLowerCase();
        if (pMode.includes('qr') || pMode.includes('upi')) {
          qrRevenue += order.totalAmount || 0;
        } else {
          cashRevenue += order.totalAmount || 0;
        }
      }
      if (order.farmerId) farmersSet.add(order.farmerId);

      order.items?.forEach(item => {
        const pKey = `${item.name}_${item.packSize || ''}`;
        if (!productMap[pKey]) {
          productMap[pKey] = {
            name: item.name,
            packSize: item.packSize || '',
            totalQty: 0,
            totalRevenue: 0,
            price: item.price
          };
        }
        productMap[pKey].totalQty += item.quantity || 0;
        productMap[pKey].totalRevenue += ((item.price || 0) * (item.quantity || 0));
      });
    });

    const productsList = Object.values(productMap).sort((p1, p2) => p2.totalRevenue - p1.totalRevenue);

    return {
      name: selectedAdvisorSales.name,
      orderCount: modalOrders.length,
      paidRevenue,
      cashRevenue,
      qrRevenue,
      uniqueFarmers: farmersSet.size,
      productsList,
      orders: modalOrders
    };
  };

  const modalData = getModalFilteredData();

  // CSV Export Function
  const exportCSV = () => {
    const headers = ["Order ID", "Farmer Name", "Advisor Name", "Order Date & Time", "Payment Status", "Payment Mode", "Payment Date & Time", "Order Status", "Total Amount (INR)"];
    
    const rows = filteredOrders.map(o => [
      `"${o._id}"`,
      `"${o.farmerName || 'N/A'}"`,
      `"${o.advisorName || 'N/A'}"`,
      `"${formatDateTime(o.date)}"`,
      `"${o.payment ? 'PAID' : 'PENDING'}"`,
      `"${o.payment ? (o.paymentMethod || 'Cash') : 'N/A'}"`,
      `"${o.payment ? formatDateTime(o.paymentDate || o.updatedAt || o.date) : 'N/A'}"`,
      `"${o.status || 'Pending'}"`,
      o.totalAmount || 0
    ]);

    const fileName = timeRange === 'Custom' && (startDate || endDate)
      ? `AgriIndia_Sales_Report_${startDate || 'start'}_to_${endDate || 'end'}.csv`
      : `AgriIndia_Sales_Report_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`;

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Search filter for transactions table tab
  const searchableOrders = filteredOrders.filter(o => 
    o._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.farmerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.advisorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <PageHeader 
            title="Reports & Business Analytics" 
            description="Real-time sales insights, revenue metrics, advisor rankings, and product performance." 
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Time Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              <MdFilterList className="text-gray-400 w-5 h-5" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Time</option>
                <option value="ThisMonth">This Month</option>
                <option value="30Days">Last 30 Days</option>
                <option value="ThisYear">This Year</option>
                <option value="Custom">Custom Date Range</option>
              </select>
            </div>

            {/* Custom Date Range Selectors */}
            {timeRange === 'Custom' && (
              <div className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-500">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white border border-gray-200 text-xs rounded-lg px-2.5 py-1.5 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-500">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white border border-gray-200 text-xs rounded-lg px-2.5 py-1.5 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="text-xs text-red-600 hover:text-red-800 font-bold px-1.5 py-0.5 hover:bg-red-50 rounded"
                    title="Clear Dates"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
            title="Download CSV Spreadsheet Report"
          >
            <MdFileDownload className="w-5 h-5" />
            Export CSV
          </button>

          {/* Print Report */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-xl text-sm transition-colors cursor-pointer"
            title="Print Summary Report"
          >
            <MdPrint className="w-5 h-5" />
            Print Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-16">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState 
          title="No Orders Available" 
          description="There are no product orders recorded in the system yet to generate analytics." 
        />
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              onClick={() => setActiveTab('overview')}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">Total Revenue Collected</span>
                <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center text-xl font-bold">
                  <MdAccountBalanceWallet />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
                <MdTrendingUp /> {paidOrders.length} Paid Transactions
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('transactions')}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">Pending Receivables</span>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold">
                  <MdPendingActions />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">₹{pendingRevenue.toLocaleString()}</p>
              <p className="text-xs text-amber-600 mt-2 font-medium">
                {pendingOrders.length} Pending Orders Awaiting Payment
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('transactions')}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">Orders Processed</span>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
                  <MdShoppingCart />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{filteredOrders.length}</p>
              <p className="text-xs text-gray-500 mt-2">
                {completedOrders.length} Completed • {cancelledOrders.length} Cancelled
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-300 hover:shadow-md transition-all">
              <div 
                onClick={() => setActiveTab('advisors')} 
                className="flex items-center justify-between mb-3 cursor-pointer"
              >
                <span className="text-sm font-medium text-gray-500">Network Overview</span>
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold">
                  <MdPeople />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <Link to="/advisors" className="p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all text-center block border border-purple-100">
                  <p className="text-2xl font-extrabold text-purple-900">{advisors.length}</p>
                  <p className="text-xs font-semibold text-purple-700">Advisors</p>
                </Link>
                <Link to="/farmers" className="p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-all text-center block border border-green-100">
                  <p className="text-2xl font-extrabold text-green-900">{farmers.length}</p>
                  <p className="text-xs font-semibold text-green-700">Farmers</p>
                </Link>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 bg-white px-6 rounded-t-2xl pt-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'overview' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Sales Overview
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'products' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Top Selling Products
            </button>
            <button
              onClick={() => setActiveTab('advisors')}
              className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'advisors' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Advisor Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'transactions' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Full Order Log
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Status Distribution */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MdBarChart className="text-primary-600 w-6 h-6" /> Order Status Distribution
                </h3>
                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span className="text-gray-700 flex items-center gap-2">
                        <MdCheckCircle className="text-green-600" /> Completed Orders ({completedOrders.length})
                      </span>
                      <span className="font-bold text-gray-900">
                        {filteredOrders.length ? Math.round((completedOrders.length / filteredOrders.length) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{ width: `${filteredOrders.length ? (completedOrders.length / filteredOrders.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span className="text-gray-700 flex items-center gap-2">
                        <MdPendingActions className="text-blue-600" /> Processing Orders ({filteredOrders.filter(o => o.status === 'Processing').length})
                      </span>
                      <span className="font-bold text-gray-900">
                        {filteredOrders.length ? Math.round((filteredOrders.filter(o => o.status === 'Processing').length / filteredOrders.length) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all"
                        style={{ width: `${filteredOrders.length ? (filteredOrders.filter(o => o.status === 'Processing').length / filteredOrders.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span className="text-gray-700 flex items-center gap-2">
                        <MdPendingActions className="text-amber-600" /> Pending Orders ({pendingOrders.length})
                      </span>
                      <span className="font-bold text-gray-900">
                        {filteredOrders.length ? Math.round((pendingOrders.length / filteredOrders.length) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-amber-500 h-3 rounded-full transition-all"
                        style={{ width: `${filteredOrders.length ? (pendingOrders.length / filteredOrders.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span className="text-gray-700 flex items-center gap-2">
                        <MdCancel className="text-red-600" /> Cancelled Orders ({cancelledOrders.length})
                      </span>
                      <span className="font-bold text-gray-900">
                        {filteredOrders.length ? Math.round((cancelledOrders.length / filteredOrders.length) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-red-500 h-3 rounded-full transition-all"
                        style={{ width: `${filteredOrders.length ? (cancelledOrders.length / filteredOrders.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MdAccountBalanceWallet className="text-primary-600 w-6 h-6" /> Revenue by Payment Mode
                </h3>
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl bg-gray-50 flex items-center justify-between border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Cash Payments</p>
                      <p className="text-xl font-bold text-gray-900">₹{paymentModes.Cash.toLocaleString()}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      {totalRevenue ? Math.round((paymentModes.Cash / totalRevenue) * 100) : 0}%
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 flex items-center justify-between border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-500">UPI / QR Scan Payments</p>
                      <p className="text-xl font-bold text-gray-900">₹{paymentModes['UPI / QR'].toLocaleString()}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      {totalRevenue ? Math.round((paymentModes['UPI / QR'] / totalRevenue) * 100) : 0}%
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 flex items-center justify-between border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Online Gateway Payments</p>
                      <p className="text-xl font-bold text-gray-900">₹{paymentModes.Online.toLocaleString()}</p>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                      {totalRevenue ? Math.round((paymentModes.Online / totalRevenue) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TOP PRODUCTS */}
          {activeTab === 'products' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Product Sales Performance</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{topProducts.length} unique products sold</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 p-1 border border-gray-200 rounded-xl text-xs">
                  <button
                    onClick={() => setProductSortBy('units')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      productSortBy === 'units' ? 'bg-primary-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🔥 Top Selling Units
                  </button>
                  <button
                    onClick={() => setProductSortBy('revenue')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      productSortBy === 'revenue' ? 'bg-primary-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    💰 Highest Revenue
                  </button>
                </div>
              </div>

              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No product sales recorded yet.</div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center ${
                            index === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            index === 1 ? 'bg-gray-200 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            #{index + 1}
                          </span>
                          <div>
                            <span className="font-bold text-gray-900 text-base block">{product.name}</span>
                            <span className="text-xs text-gray-500">Unit Price: ₹{product.price}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-primary-700 text-lg block">
                            {product.totalQty} Units Sold
                          </span>
                          <span className="text-xs font-semibold text-gray-600 block">
                            Total Revenue: ₹{product.totalRevenue.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Share progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${maxProductMetric ? ((productSortBy === 'units' ? product.totalQty : product.totalRevenue) / maxProductMetric) * 100 : 0}%` }}
                        ></div>
                      </div>

                      {/* Packaging Type / Pack Size Breakdown */}
                      <div className="pt-3 border-t border-gray-200/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                            📦 Packaging Sales Breakdown ({product.packList.length} Pack Sizes)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {product.packList.map((pack, fk) => (
                            <div key={fk} className="bg-white p-2.5 rounded-xl border border-gray-200/80 flex items-center justify-between shadow-2xs">
                              <div>
                                <span className="font-bold text-gray-900 text-xs block">📦 Pack: {pack.packSize}</span>
                                <span className="text-[11px] text-gray-500">Unit Price: ₹{pack.price}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold text-green-700 text-xs block">{pack.totalQty} Units</span>
                                <span className="text-[11px] text-gray-600 font-semibold">₹{pack.totalRevenue.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADVISOR LEADERBOARD */}
          {activeTab === 'advisors' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Advisor Sales Leaderboard</h3>
                <p className="text-xs text-gray-500 mt-1">Ranked by total revenue collected from farmer orders</p>
              </div>

              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">Advisor Name</th>
                      <th className="px-6 py-4 text-center">Total Orders</th>
                      <th className="px-6 py-4 text-center">Farmers Served</th>
                      <th className="px-6 py-4 text-right">Revenue Collected</th>
                      <th className="px-6 py-4 text-center">Selling Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {advisorLeaderboard.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-500">No advisor sales records available.</td>
                      </tr>
                    ) : (
                      advisorLeaderboard.map((adv, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => setSelectedAdvisorSales(adv)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              idx === 0 ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                              idx === 1 ? 'bg-gray-200 text-gray-700' :
                              idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">{adv.name}</td>
                          <td className="px-6 py-4 text-center font-medium text-gray-800">{adv.orderCount}</td>
                          <td className="px-6 py-4 text-center font-medium text-gray-800">{adv.uniqueFarmers}</td>
                          <td className="px-6 py-4 text-right font-bold text-green-700 text-base">₹{adv.paidRevenue.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedAdvisorSales(adv); }}
                              className="px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 font-semibold rounded-lg text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <MdVisibility className="w-4 h-4" /> View Selling Details
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

          {/* TAB 4: FULL ORDER TRANSACTION LOG */}
          {activeTab === 'transactions' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden space-y-4">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Transaction History Log</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Showing {searchableOrders.length} transaction records</p>
                </div>

                <div className="w-full sm:w-72 relative">
                  <input
                    type="text"
                    placeholder="Search ID, farmer, advisor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <MdSearch className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Transaction ID</th>
                      <th className="px-6 py-4">Farmer</th>
                      <th className="px-6 py-4">Advisor</th>
                      <th className="px-6 py-4">Order Date & Time</th>
                      <th className="px-6 py-4">Payment Date & Time</th>
                      <th className="px-6 py-4">Payment Mode</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {searchableOrders.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-gray-500">No transactions match your search.</td>
                      </tr>
                    ) : (
                      searchableOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-900">
                            #{order._id.slice(-8).toUpperCase()}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{order.farmerName}</td>
                          <td className="px-6 py-4 text-gray-700">{order.advisorName}</td>
                          <td className="px-6 py-4 text-gray-500 text-xs">{formatDateTime(order.date)}</td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {order.payment ? formatDateTime(order.paymentDate || order.updatedAt || order.date) : <span className="text-amber-600 font-normal">Pending</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                              {order.payment ? (order.paymentMethod || 'Cash') : 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">₹{order.totalAmount}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              order.payment ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {order.payment ? 'PAID' : 'PENDING'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Advisor Selling Details Modal */}
      {selectedAdvisorSales && modalData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setSelectedAdvisorSales(null); setModalStartDate(''); setModalEndDate(''); }}>
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Advisor Selling Details</h2>
                <p className="text-xs text-gray-500 mt-0.5">Comprehensive sales breakdown for {modalData.name}</p>
              </div>

              {/* Custom Date Range Filter in Modal */}
              <div className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-500">From:</span>
                  <input
                    type="date"
                    value={modalStartDate}
                    onChange={(e) => setModalStartDate(e.target.value)}
                    className="bg-white border border-gray-200 text-xs rounded-lg px-2 py-1 text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-500">To:</span>
                  <input
                    type="date"
                    value={modalEndDate}
                    onChange={(e) => setModalEndDate(e.target.value)}
                    className="bg-white border border-gray-200 text-xs rounded-lg px-2 py-1 text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                {(modalStartDate || modalEndDate) && (
                  <button
                    type="button"
                    onClick={() => { setModalStartDate(''); setModalEndDate(''); }}
                    className="text-[11px] text-red-600 hover:text-red-800 font-bold px-1.5 py-0.5 hover:bg-red-50 rounded"
                    title="Clear Modal Filter"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button 
                onClick={() => { setSelectedAdvisorSales(null); setModalStartDate(''); setModalEndDate(''); }}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors cursor-pointer"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Advisor Header Stats & Payment Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Advisor Name</span>
                  <span className="text-sm font-bold text-gray-900 mt-1 block truncate">{modalData.name}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Total Revenue</span>
                  <span className="text-sm font-bold text-green-600 mt-1 block">₹{modalData.paidRevenue.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">💵 Cash Collected</span>
                  <span className="text-sm font-bold text-emerald-700 mt-1 block">₹{modalData.cashRevenue.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">📱 UPI / QR Collected</span>
                  <span className="text-sm font-bold text-blue-600 mt-1 block">₹{modalData.qrRevenue.toLocaleString()}</span>
                </div>
              </div>

              {/* Section 1: Products Sold Breakdown */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">📦 Products Sold Breakdown</h4>
                {modalData.productsList.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center bg-gray-50 rounded-xl">No products sold in this date range.</p>
                ) : (
                  <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs text-gray-600">
                      <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-3">Product Name</th>
                          <th className="px-4 py-3 text-center">Pack Size</th>
                          <th className="px-4 py-3 text-center">Qty Sold</th>
                          <th className="px-4 py-3 text-right">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {modalData.productsList.map((prod, pIdx) => (
                          <tr key={pIdx} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{prod.name}</td>
                            <td className="px-4 py-3 text-center text-gray-500">{prod.packSize || 'Standard'}</td>
                            <td className="px-4 py-3 text-center font-bold text-gray-900">{prod.totalQty}</td>
                            <td className="px-4 py-3 text-right font-bold text-green-700">₹{prod.totalRevenue.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 2: Orders History by this Advisor */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">📋 Orders Handled by {modalData.name} ({modalData.orderCount})</h4>
                {modalData.orders.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center bg-gray-50 rounded-xl">No orders found in this date range.</p>
                ) : (
                  <div className="border border-gray-100 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs text-gray-600">
                      <thead className="bg-gray-50 text-gray-700 uppercase font-semibold sticky top-0">
                        <tr>
                          <th className="px-4 py-3">Order ID</th>
                          <th className="px-4 py-3">Farmer</th>
                          <th className="px-4 py-3 text-center">Payment Mode</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {modalData.orders.map((ord, oIdx) => (
                          <tr key={oIdx} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-mono font-semibold text-gray-800">#{ord._id.slice(-6).toUpperCase()}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">
                              <div>{ord.farmerName || 'N/A'}</div>
                              {ord.farmerPhone && <div className="text-[11px] text-gray-400">📞 {ord.farmerPhone}</div>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {ord.payment ? (
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  (ord.paymentMethod || 'Cash').toLowerCase().includes('qr') || (ord.paymentMethod || '').toLowerCase().includes('upi')
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {(ord.paymentMethod || 'Cash').toLowerCase().includes('qr') || (ord.paymentMethod || '').toLowerCase().includes('upi') ? '📱 UPI / QR' : '💵 Cash'}
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold">
                                  ⏳ Unpaid
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500">{formatDateTime(ord.date)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                ord.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                ord.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {ord.status || 'Pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">₹{(ord.totalAmount || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
