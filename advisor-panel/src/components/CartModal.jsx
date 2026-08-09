import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdDelete, MdPerson } from 'react-icons/md';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, updateQuantity, clearCart, selectCartItems, selectCartTotal, setSelectedFarmerId, selectSelectedFarmerId } from '../store/slices/cartSlice';
import { apiFetch } from '../services/api';

export default function CartModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const selectedFarmerId = useSelector(selectSelectedFarmerId);

  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFarmers();
    }
  }, [isOpen]);

  const fetchFarmers = async () => {
    try {
      const data = await apiFetch('/advisor/farmers');
      if (data.success) {
        setFarmers(data.farmers || []);
      }
    } catch (error) {
      console.error('Error fetching farmers:', error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedFarmerId) {
      alert("Please select a farmer to place the order.");
      return;
    }

    if (cartItems.length === 0) {
      alert("Cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const formattedItems = cartItems.map(item => ({
        productId: item._id,
        name: item.name,
        packSize: item.packSize,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      }));

      const data = await apiFetch('/product-order/place', {
        method: 'POST',
        body: JSON.stringify({
          farmerId: selectedFarmerId,
          items: formattedItems,
          totalAmount: cartTotal
        })
      });

      if (data.success) {
        alert("Order placed successfully!");
        dispatch(clearCart());
        onClose();
      } else {
        alert(data.message || "Failed to place order");
      }
    } catch (error) {
      console.error(error);
      alert("Error placing order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MdClose className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                  <p>Your cart is empty.</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.cartItemId} className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-16 h-16 rounded-lg bg-white overflow-hidden border border-gray-200">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{item.name}</h4>
                      {item.packSize && <div className="text-xs text-gray-500 mt-0.5">{item.packSize}</div>}
                      <div className="text-primary-600 font-bold text-sm mt-1">₹{item.price}</div>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-8 bg-white">
                          <button 
                            onClick={() => dispatch(updateQuantity({ id: item.cartItemId, quantity: item.quantity - 1 }))}
                            className="px-2 hover:bg-gray-50 text-gray-600"
                          >-</button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => dispatch(updateQuantity({ id: item.cartItemId, quantity: item.quantity + 1 }))}
                            className="px-2 hover:bg-gray-50 text-gray-600"
                          >+</button>
                        </div>
                        <button 
                          onClick={() => dispatch(removeFromCart(item.cartItemId))}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <MdDelete className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4 bg-white border-t border-gray-100 space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MdPerson className="w-4 h-4 text-primary-500" />
                    Select Farmer
                  </label>
                  <select
                    value={selectedFarmerId || ''}
                    onChange={(e) => dispatch(setSelectedFarmerId(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  >
                    <option value="" disabled>-- Choose a farmer --</option>
                    {farmers.map(farmer => (
                      <option key={farmer._id} value={farmer._id}>
                        {farmer.firstName} {farmer.lastName} ({farmer.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-gray-600 font-medium">Total</span>
                  <span className="text-2xl font-bold text-gray-900">₹{cartTotal}</span>
                </div>
                
                <button 
                  onClick={handlePlaceOrder}
                  disabled={loading || cartItems.length === 0}
                  className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium shadow-md hover:bg-primary-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  Place Order for Farmer
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
