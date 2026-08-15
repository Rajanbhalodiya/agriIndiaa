import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import { API_BASE_URL } from '../services/api';
import { CardSkeleton } from '../components/Loader';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/product/list`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE_URL}/product/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'atoken': token
        },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (data.success) {
        fetchProducts();
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting product');
    }
  };

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Products Catalog"
        description="Manage product inventory, prices, stock, and create new product listings"
      />

      {/* Search and Category Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
            >
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <Link
            to="/products/add"
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <MdAdd className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={6} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title="No Products Found"
          description="No products match your search or filter."
          action={
            <Link
              to="/products/add"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer mt-4"
            >
              <MdAdd className="w-5 h-5" />
              Add First Product
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Mobile Card View (< md) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-14 h-14 rounded-xl object-contain bg-gray-50 border border-gray-100 p-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-gray-900 text-base truncate">{product.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.status || 'active'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{product.description}</p>
                    <span className="inline-block mt-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-medium">
                      {product.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-sm">
                  <div>
                    {product.packSizes && product.packSizes.length > 0 ? (
                      <div className="space-y-1">
                        {product.packSizes.map((p, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs flex-wrap">
                            <span className="font-bold text-gray-900">₹{p.price}</span>
                            <span className="bg-primary-50 text-primary-700 border border-primary-100 px-1.5 py-0.5 rounded text-[10px] font-semibold">{p.size}</span>
                            <span className="text-[10px] text-gray-500 font-medium">({p.stock !== undefined ? p.stock : product.stock} in stock)</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-gray-900">₹{product.price || 0}</span>
                        <span className="text-xs text-gray-400"> / {product.unit || 'kg'}</span>
                      </>
                    )}
                    <span className="text-xs text-gray-500 block mt-1 font-medium">Total Stock: {product.stock}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/products/edit/${product._id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                      title="Edit Product"
                    >
                      <MdEdit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                      title="Delete Product"
                    >
                      <MdDelete className="w-5 h-5" />
                    </button>
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
                    <th className="px-6 py-4 font-semibold">Product</th>
                    <th className="px-6 py-4 font-semibold">Category</th>
                    <th className="px-6 py-4 font-semibold">Price & Packaging Options (Stock)</th>
                    <th className="px-6 py-4 font-semibold">Total Stock</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-contain bg-gray-50 border border-gray-100 p-1 shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-400 truncate max-w-xs">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.packSizes && product.packSizes.length > 0 ? (
                          <div className="space-y-1.5 max-w-[280px]">
                            {product.packSizes.map((p, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-2 text-xs bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                <span className="bg-primary-50 text-primary-700 border border-primary-100 px-1.5 py-0.5 rounded text-[11px] font-semibold">{p.size}</span>
                                <span className="font-bold text-gray-900">₹{p.price}</span>
                                <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${ (p.stock !== undefined ? p.stock : product.stock) > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600' }`}>
                                  Qty: {p.stock !== undefined ? p.stock : product.stock}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="font-semibold text-gray-900">
                            ₹{product.price || 0} <span className="text-xs font-normal text-gray-400">/ {product.unit || 'kg'}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {product.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/products/edit/${product._id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <MdEdit className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <MdDelete className="w-5 h-5" />
                          </button>
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
    </div>
  );
}
