import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdSearch, MdFilterList, MdAdd, MdLocationOn, MdPhone, MdChevronRight } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function FarmersList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    try {
      const data = await apiFetch('/advisor/farmers');
      if (data.success) {
        setFarmers(data.farmers || []);
      }
    } catch (error) {
      console.error('Failed to fetch farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFarmers = farmers.filter(f => 
    (f.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.village || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Farmers Directory</h1>
          <p className="text-gray-500">Manage your connected farmers and their profiles.</p>
        </div>
        <button 
          onClick={() => navigate('/farmers/add')}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:bg-primary-700 transition-colors font-medium"
        >
          <MdAdd className="w-5 h-5" />
          Add New Farmer
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by name, phone or village..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow outline-none shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFarmers.map((farmer, idx) => (
          <motion.div 
            key={farmer._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => navigate(`/farmers/${farmer._id}`)}
            className="bg-surface border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-50 text-primary-700 rounded-full flex items-center justify-center text-xl font-bold border border-primary-100">
                  {farmer.firstName ? farmer.firstName.charAt(0).toUpperCase() : 'F'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{farmer.firstName} {farmer.lastName}</h3>
                  <div className="flex items-center text-gray-500 text-sm mt-1">
                    <MdLocationOn className="w-4 h-4 mr-1 text-gray-400" />
                    {farmer.village || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <MdPhone className="w-4 h-4 mr-2 text-gray-400" />
                {farmer.phone}
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                <div className="text-xs">
                  <span className="block text-gray-500">Total Land</span>
                  <span className="font-semibold text-gray-900">{farmer.totalLand || 'N/A'} Acres</span>
                </div>
                <div className="text-xs text-right">
                  <span className="block text-gray-500">Winter Crop</span>
                  <span className="font-semibold text-gray-900">{farmer.winterCrop || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="text-sm font-medium text-primary-600">View Profile</span>
              <MdChevronRight className="w-5 h-5 text-primary-600" />
            </div>
          </motion.div>
        ))}
        {filteredFarmers.length === 0 && (
          <div className="col-span-full py-12 text-center bg-surface rounded-2xl border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdSearch className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No farmers found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your search criteria or add a new farmer.</p>
          </div>
        )}
      </div>
      )}
    </motion.div>
  );
}
