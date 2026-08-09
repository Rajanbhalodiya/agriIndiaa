import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdSearch, MdFilterList, MdShoppingCart, MdAdd } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, selectCartItems } from '../../store/slices/cartSlice';
import CartModal from '../../components/CartModal';
import { apiFetch } from '../../services/api';

export default function ProductsList() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  // Map productId -> selected pack size (size string)
  const [selectedPack, setSelectedPack] = useState({});
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await apiFetch('/product/list');
      if (data.success) {
        const productList = data.products || data.data || [];
        setProducts(productList);

        // Extract unique categories
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
      className="space-y-6"
    >
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products Catalog</h1>
          <p className="text-gray-500">Browse products and create orders for farmers.</p>
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:bg-primary-700 transition-colors font-medium relative"
        >
          <MdShoppingCart className="w-5 h-5" />
          View Cart ({cartItemCount})
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-surface text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map((product, idx) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-surface border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div
                className="h-32 md:h-48 w-full bg-gray-100 cursor-pointer"
                onClick={() => navigate(`/products/${product._id}`)}
              >
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <span className="text-xs font-medium text-gray-500 mb-1">{product.category}</span>
                <h3
                  className="font-bold text-gray-900 text-sm md:text-base leading-tight mb-2 cursor-pointer hover:text-primary-600 line-clamp-2"
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  {product.name}
                </h3>

                <div className="mt-auto flex items-end justify-between gap-2">
                  <div className="flex-1">
                    {product.packSizes && product.packSizes.length > 0 ? (
                      (() => {
                        const chosenSize = selectedPack[product._id] || product.packSizes[0].size;
                        const chosenPack = product.packSizes.find(p => p.size === chosenSize) || product.packSizes[0];
                        return (
                          <>
                            <div className="text-lg font-bold text-primary-700 flex items-baseline gap-1">
                              ₹{chosenPack.price}
                              <span className="text-xs font-normal text-gray-500">/ {chosenPack.size}</span>
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
                      <div className="text-lg font-bold text-primary-700 flex items-baseline gap-1">
                        ₹{product.price}
                        <span className="text-xs font-normal text-gray-500">/ {product.unit || 'kg'}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (product.packSizes && product.packSizes.length > 1) {
                        // Use selected pack size if user chose one, otherwise default to first
                        const chosenSize = selectedPack[product._id] || product.packSizes[0].size;
                        const chosenPack = product.packSizes.find(p => p.size === chosenSize) || product.packSizes[0];
                        dispatch(addToCart({ ...product, price: chosenPack.price, packSize: chosenPack.size }));
                      } else {
                        const packSize = product.packSizes && product.packSizes.length > 0 ? product.packSizes[0].size : (product.unit || 'kg');
                        const price = product.packSizes && product.packSizes.length > 0 ? product.packSizes[0].price : product.price;
                        dispatch(addToCart({ ...product, price, packSize }));
                      }
                    }}
                    disabled={product.stock === 0}
                    className={`p-2 rounded-xl flex items-center justify-center transition-colors ${product.stock > 0
                        ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    <MdAdd className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center bg-surface rounded-2xl border border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdSearch className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No products found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your search filters</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
