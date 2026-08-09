import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [], // { _id, name, price, quantity, stock, image }
  selectedFarmerId: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      const cartItemId = `${product._id}-${product.packSize || 'default'}`;
      const existingItem = state.items.find(item => item.cartItemId === cartItemId);
      
      const quantityToAdd = product.quantity || 1;

      if (existingItem) {
        if (existingItem.quantity + quantityToAdd <= product.stock) {
          existingItem.quantity += quantityToAdd;
        } else {
          existingItem.quantity = product.stock;
        }
      } else {
        state.items.push({ ...product, cartItemId, quantity: quantityToAdd });
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.cartItemId !== action.payload);
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.cartItemId === id);
      if (item) {
        item.quantity = Math.max(1, Math.min(quantity, item.stock));
      }
    },
    setSelectedFarmerId: (state, action) => {
      state.selectedFarmerId = action.payload;
    },
    clearCart: (state) => {
      state.items = [];
      state.selectedFarmerId = null;
    }
  }
});

export const { addToCart, removeFromCart, updateQuantity, setSelectedFarmerId, clearCart } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
export const selectSelectedFarmerId = (state) => state.cart.selectedFarmerId;

export default cartSlice.reducer;
