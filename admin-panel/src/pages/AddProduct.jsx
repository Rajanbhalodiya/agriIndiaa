import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdCloudUpload, MdArrowBack, MdAdd, MdDelete } from 'react-icons/md';
import { API_BASE_URL } from '../services/api';
import { PRODUCT_CATEGORIES } from '../constants/categories';
import { ButtonSpinner, OverlayLoader } from '../components/Loader';

export default function AddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    stock: ''
  });

  const [packSizes, setPackSizes] = useState([{ size: '', price: '', stock: '' }]);

  const [imageFile, setImageFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePackSizeChange = (index, field, value) => {
    const newPackSizes = [...packSizes];
    newPackSizes[index][field] = value;
    setPackSizes(newPackSizes);
  };

  const addPackSize = () => {
    setPackSizes([...packSizes, { size: '', price: '', stock: '' }]);
  };

  const removePackSize = (index) => {
    if (packSizes.length > 1) {
      const newPackSizes = packSizes.filter((_, i) => i !== index);
      setPackSizes(newPackSizes);
    }
  };

  const totalCalculatedStock = packSizes.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!imageFile) {
      alert("Please select a product image");
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      Object.keys(formData).forEach(key => {
        form.append(key, formData[key]);
      });
      form.append('packSizes', JSON.stringify(packSizes));
      form.append('image', imageFile);

      // We use the absolute URL to bypass proxy issues during dev, assuming backend is on 4000
      const response = await fetch(`${API_BASE_URL}/product/add`, {
        method: 'POST',
        headers: {
          // Token would go here
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: form
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Product added successfully!");
        navigate('/products');
      } else {
        alert(data.message || "Failed to add product");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while adding the product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {loading && <OverlayLoader message="Adding Product..." />}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
        >
          <MdArrowBack className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
          <p className="text-sm text-gray-500">Create a new product for the catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Image *</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors relative overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <MdCloudUpload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">SVG, PNG, JPG or WEBP (MAX. 2MB)</p>
                  </div>
                )}
                <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleImageChange} required />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" 
                placeholder="e.g. Premium Organic Fertilizer" />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white">
                <option value="" disabled>Select a category</option>
                {PRODUCT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Calculated Stock</label>
              <input type="number" name="stock" value={totalCalculatedStock} readOnly
                className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-semibold cursor-not-allowed outline-none" 
                placeholder="Calculated automatically" />
            </div>

            {/* Packaging Options */}
            <div className="md:col-span-2 mt-2 bg-gray-50 p-5 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Packaging Options, Prices & Stock *</label>
                  <p className="text-xs text-gray-500">Specify price and available stock for each pack size option.</p>
                </div>
                <button type="button" onClick={addPackSize} className="text-sm flex items-center gap-1 text-primary-600 font-medium hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors">
                  <MdAdd className="w-4 h-4" /> Add Option
                </button>
              </div>
              
              <div className="space-y-3">
                {packSizes.map((pack, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm relative pr-10">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">Pack Size</label>
                      <input type="text" list="pack-sizes-list" placeholder="Size (e.g. 500 ml)" value={pack.size} onChange={(e) => handlePackSizeChange(index, 'size', e.target.value)} required
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">Price (₹)</label>
                      <input type="number" placeholder="Price (₹)" value={pack.price} onChange={(e) => handlePackSizeChange(index, 'price', e.target.value)} required min="0" step="0.01"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">Stock (Qty)</label>
                      <input type="number" placeholder="Available Stock" value={pack.stock} onChange={(e) => handlePackSizeChange(index, 'stock', e.target.value)} required min="0"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                    </div>
                    <button type="button" onClick={() => removePackSize(index)} disabled={packSizes.length === 1} title="Remove Option"
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${packSizes.length === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`}>
                      <MdDelete className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs font-semibold text-primary-700 bg-primary-50 px-3 py-2 rounded-lg border border-primary-100 flex justify-between items-center">
                <span>Total Combined Product Stock:</span>
                <span className="text-sm font-bold text-primary-800">{totalCalculatedStock} units</span>
              </div>
              <datalist id="pack-sizes-list">
                <option value="50 ml" />
                <option value="100 ml" />
                <option value="250 ml" />
                <option value="500 ml" />
                <option value="1 Liter" />
                <option value="5 Liter" />
                <option value="50 g" />
                <option value="100 g" />
                <option value="250 g" />
                <option value="500 g" />
                <option value="1 kg" />
                <option value="5 kg" />
                <option value="10 kg" />
                <option value="25 kg" />
                <option value="50 kg" />
              </datalist>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none" 
                placeholder="Detailed description of the product..."></textarea>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-70 flex items-center gap-2">
            {loading ? (
              <>
                <ButtonSpinner />
                <span>Adding Product...</span>
              </>
            ) : (
              'Add Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
