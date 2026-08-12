import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdSearch, MdAdd, MdShoppingCart, MdPerson } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, selectCartItems, setSelectedFarmerId, selectSelectedFarmerId } from '../../store/slices/cartSlice';
import CartModal from '../../components/CartModal';
import { apiFetch } from '../../services/api';
import { CardSkeleton } from '../../components/Loader';

export default function ProductsList() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const selectedFarmerId = useSelector(selectSelectedFarmerId);
  const [selectedPack, setSelectedPack] = useState({});
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    try {
      const data = await apiFetch('/advisor/farmers');
      if (data.success) setFarmers(data.farmers || []);
    } catch (error) {
      console.error('Error fetching farmers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiFetch('/product/list');
      if (data.success) {
        const productList = data.products || data.data || [];
        setProducts(productList);
        const uniqueCats = new Set(productList.map(p => p.category).filter(Boolean));
        setCategories(['All', ...Array.from(uniqueCats)]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 w-full"
    >
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Products Catalog</h1>
          <p className="text-gray-500 text-sm mt-0.5">Browse products and create orders for assigned farmers.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Farmer Selector */}
          <div className="flex items-center gap-2 bg-surface px-3 py-2.5 border border-gray-200 rounded-xl shadow-sm min-w-0">
            <MdPerson className="w-4 h-4 text-primary-600 flex-shrink-0" />
            <select
              value={selectedFarmerId || ''}
              onChange={(e) => dispatch(setSelectedFarmerId(e.target.value))}
              className="bg-transparent text-sm font-medium text-gray-800 outline-none w-full cursor-pointer"
            >
              <option value="" disabled>-- Select Farmer --</option>
              {farmers.map(farmer => (
                <option key={farmer._id} value={farmer._id}>
                  {farmer.firstName} {farmer.lastName || ''} ({farmer.village || farmer.phone})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl shadow-md hover:bg-primary-700 transition-colors font-medium text-sm relative"
          >
            <MdShoppingCart className="w-4 h-4" />
            View Cart
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-surface border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow outline-none shadow-sm text-sm"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${activeCategory === cat
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-surface text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <CardSkeleton count={6} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
      ) : (
        /* Grid: 2 cols mobile, 3 cols tablet, 4 cols desktop */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filteredProducts.map((product, idx) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-surface border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div
                className="h-32 sm:h-40 md:h-44 w-full bg-gray-100 cursor-pointer"
                onClick={() => navigate(`/products/${product._id}`)}
              >
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 flex flex-col flex-1">
                <span className="text-xs font-medium text-gray-500 mb-1">{product.category}</span>
                <h3
                  className="font-bold text-gray-900 text-sm leading-tight mb-2 cursor-pointer hover:text-primary-600 line-clamp-2"
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  {product.name}
                </h3>

                <div className="mt-auto flex items-end justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {product.packSizes && product.packSizes.length > 0 ? (
                      (() => {
                        const chosenSize = selectedPack[product._id] || product.packSizes[0].size;
                        const chosenPack = product.packSizes.find(p => p.size === chosenSize) || product.packSizes[0];
                        const packStock = chosenPack.stock !== undefined ? chosenPack.stock : product.stock;
                        return (
                          <>
                            <div className="text-base font-bold text-primary-700 flex items-baseline gap-1">
                              ₹{chosenPack.price}
                              <span className="text-xs font-normal text-gray-500">/ {chosenPack.size}</span>
                            </div>
                            <div className={`text-[11px] font-medium mt-0.5 ${packStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {packStock > 0 ? `Stock: ${packStock}` : 'Out of Stock'}
                            </div>
                            {product.packSizes.length > 1 && (
                              <select
                                value={chosenSize}
                                onChange={(e) => setSelectedPack(prev => ({ ...prev, [product._id]: e.target.value }))}
                                className="mt-1.5 w-full p-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 font-medium text-gray-700 cursor-pointer"
                              >
                                {product.packSizes.map(p => (
                                  <option key={p.size} value={p.size}>
                                    {p.size} (₹{p.price})
                                  </option>
                                ))}
                              </select>
                            )}
                          </>
                        );
                      })()
                    ) : (
                      <>
                        <div className="text-base font-bold text-primary-700 flex items-baseline gap-1">
                          ₹{product.price}
                          <span className="text-xs font-normal text-gray-500">/ {product.unit || 'kg'}</span>
                        </div>
                        <div className={`text-[11px] font-medium mt-0.5 ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock'}
                        </div>
                      </>
                    )}
                  </div>
                  {(() => {
                    const chosenSize = product.packSizes && product.packSizes.length > 0 ? (selectedPack[product._id] || product.packSizes[0].size) : null;
                    const chosenPack = product.packSizes && product.packSizes.length > 0 ? (product.packSizes.find(p => p.size === chosenSize) || product.packSizes[0]) : null;
                    const currentStock = chosenPack ? (chosenPack.stock !== undefined ? chosenPack.stock : product.stock) : product.stock;

                    return (
                      <button
                        onClick={() => {
                          if (chosenPack) {
                            dispatch(addToCart({ ...product, price: chosenPack.price, packSize: chosenPack.size, stock: currentStock }));
                          } else {
                            dispatch(addToCart({ ...product, price: product.price, packSize: product.unit || 'kg', stock: currentStock }));
                          }
                        }}
                        disabled={currentStock === 0}
                        className={`p-2 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${currentStock > 0
                          ? 'bg-primary-100 text-primary-700 hover:bg-primary-200 active:scale-95'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                      >
                        <MdAdd className="w-5 h-5" />
                      </button>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center bg-surface rounded-2xl border border-dashed border-gray-300">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MdSearch className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">No products found</h3>
              <p className="text-gray-500 mt-1 text-sm">Try adjusting your search filters</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
