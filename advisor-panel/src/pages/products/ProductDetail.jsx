import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdArrowBack, MdShoppingCart, MdInventory, MdInfo } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, selectCartItems } from '../../store/slices/cartSlice';
import { apiFetch } from '../../services/api';
import CartModal from '../../components/CartModal';
import { PageLoader } from '../../components/Loader';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await apiFetch('/product/single', {
          method: 'POST',
          body: JSON.stringify({ id })
        });
        if (data.success && (data.product || data.data)) {
          setProduct(data.product || data.data);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.addEventListener('app:refresh', fetchProduct);
    return () => window.removeEventListener('app:refresh', fetchProduct);
  }, [id]);

  if (loading) {
    return <PageLoader text="Loading product details..." size="lg" />;
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <button onClick={() => navigate('/products')} className="mt-4 text-primary-600 hover:underline">
          Back to Products
        </button>
      </div>
    );
  }

  const selectedPack = product.packSizes && product.packSizes.length > 0 ? product.packSizes[selectedPackIndex] : null;
  const currentPackStock = selectedPack ? (selectedPack.stock !== undefined ? selectedPack.stock : product.stock) : product.stock;

  const handleAddToCart = () => {
    let packSize = product.unit || 'kg';
    let price = product.price;

    if (selectedPack) {
      packSize = selectedPack.size;
      price = selectedPack.price;
    }
    
    dispatch(addToCart({ ...product, quantity, packSize, price, stock: currentPackStock }));
    setIsCartOpen(true);
  };

  const displayPrice = selectedPack ? selectedPack.price : product.price;
  const displayUnit = selectedPack ? selectedPack.size : (product.unit || 'kg');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <MdArrowBack className="w-5 h-5" />
          Back to Products
        </button>

        <button 
          onClick={() => setIsCartOpen(true)}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 transition-colors font-medium relative"
        >
          <MdShoppingCart className="w-5 h-5" />
          Cart ({cartItemCount})
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
          <div className="bg-gray-50 rounded-xl overflow-hidden aspect-square flex items-center justify-center border border-gray-100 p-3">
            <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
          </div>

          <div className="flex flex-col space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                  {product.category}
                </span>
                <span className={`flex items-center gap-1 text-sm font-medium ${currentPackStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  <MdInventory className="w-4 h-4" />
                  {currentPackStock > 0 ? `${currentPackStock} In Stock` : 'Out of Stock'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight mb-2">
                {product.name}
              </h1>
              <div className="flex items-end gap-3 mb-6">
                <div className="text-3xl font-bold text-primary-700">₹{displayPrice}</div>
                <div className="text-gray-500 mb-1">/ {displayUnit}</div>
              </div>
            </div>

            <div className="prose prose-sm text-gray-600 border-t border-b border-gray-100 py-6">
              <h3 className="flex items-center gap-2 text-gray-900 font-semibold mb-2">
                <MdInfo className="w-5 h-5 text-primary-500" />
                Product Description
              </h3>
              <p className="whitespace-pre-wrap">{product.description}</p>
            </div>

            <div className="mt-auto space-y-5">
              {/* Pack Sizes Selection */}
              {product.packSizes && product.packSizes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Select Pack Size:</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {product.packSizes.map((pack, index) => {
                      const isSelected = selectedPackIndex === index;
                      const pStock = pack.stock !== undefined ? pack.stock : product.stock;
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedPackIndex(index);
                            setQuantity(1);
                          }}
                          className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-2.5 ${
                            isSelected
                              ? 'bg-primary-50 border-primary-600 text-primary-800 ring-2 ring-primary-500/20 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-gray-50'
                          }`}
                        >
                          <span>{pack.size}</span>
                          <span className="text-xs font-bold opacity-80">₹{pack.price}</span>
                          {pStock <= 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-semibold">
                              Out
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Separate Stock Availability Display */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MdInventory className="w-5 h-5 text-primary-600" />
                  <span>Stock Availability:</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  currentPackStock > 0 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {currentPackStock > 0 ? `${currentPackStock} Units Available` : 'Out of Stock'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-12">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                  >-</button>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(currentPackStock, parseInt(e.target.value) || 1)))}
                    className="w-16 text-center focus:outline-none bg-transparent"
                    min="1"
                    max={currentPackStock}
                  />
                  <button 
                    onClick={() => setQuantity(Math.min(currentPackStock, quantity + 1))}
                    className="px-4 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                  >+</button>
                </div>
                <button 
                  onClick={handleAddToCart}
                  disabled={currentPackStock === 0}
                  className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-medium transition-colors ${
                    currentPackStock > 0
                      ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-500/20'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <MdShoppingCart className="w-5 h-5" />
                  {currentPackStock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
