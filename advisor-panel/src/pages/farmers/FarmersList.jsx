import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdSearch, MdAdd, MdLocationOn, MdPhone, MdChevronRight } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { CardSkeleton } from '../../components/Loader';

export default function FarmersList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFarmers(); }, []);

  const fetchFarmers = async () => {
    try {
      const data = await apiFetch('/advisor/farmers');
      if (data.success) setFarmers(data.farmers || []);
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
      className="space-y-5 w-full"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Farmers Directory</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your connected farmers and their profiles.</p>
        </div>
        <button
          onClick={() => navigate('/farmers/add')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl shadow-md hover:bg-primary-700 transition-colors font-medium text-sm"
        >
          <MdAdd className="w-5 h-5 flex-shrink-0" />
          Add New Farmer
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by name, phone or village..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-surface border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow outline-none shadow-sm text-sm"
        />
      </div>

      {loading ? (
        <CardSkeleton count={6} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
      ) : (
        <>
          {filteredFarmers.length > 0 && (
            <p className="text-xs text-gray-500 font-medium">
              Showing {filteredFarmers.length} of {farmers.length} farmers
            </p>
          )}
          {/* Grid: 1 col mobile, 2 col tablet, 3 col desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFarmers.map((farmer, idx) => (
              <motion.div
                key={farmer._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => navigate(`/farmers/${farmer._id}`)}
                className="bg-surface border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98]"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 bg-primary-50 text-primary-700 rounded-full flex items-center justify-center text-lg font-bold border border-primary-100 flex-shrink-0 overflow-hidden">
                    {(farmer.profileImage && farmer.profileImage !== 'default.jpg') || farmer.image ? (
                      <img src={farmer.profileImage || farmer.image} alt={farmer.firstName || farmer.farmerName} className="w-full h-full object-cover" />
                    ) : (
                      farmer.firstName ? farmer.firstName.charAt(0).toUpperCase() : (farmer.farmerName ? farmer.farmerName.charAt(0).toUpperCase() : 'F')
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 leading-tight truncate">
                      {farmer.farmerName || `${farmer.firstName || ''} ${farmer.lastName || ''}`.trim()}
                    </h3>
                    <div className="flex items-center text-gray-500 text-xs mt-1">
                      <MdLocationOn className="w-3.5 h-3.5 mr-0.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{farmer.village || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MdPhone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{farmer.phone}</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5 gap-2">
                    <div className="text-xs min-w-0">
                      <span className="block text-gray-500">Total Land</span>
                      <span className="font-semibold text-gray-900">{farmer.totalLand || 'N/A'} Acres</span>
                    </div>
                    <div className="text-xs text-right min-w-0">
                      <span className="block text-gray-500">Winter Crop</span>
                      <span className="font-semibold text-gray-900 truncate block">{farmer.winterCrop || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-sm font-semibold text-primary-600">View Profile</span>
                  <MdChevronRight className="w-5 h-5 text-primary-600" />
                </div>
              </motion.div>
            ))}

            {filteredFarmers.length === 0 && (
              <div className="col-span-full py-12 text-center bg-surface rounded-2xl border border-dashed border-gray-300">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MdSearch className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">No farmers found</h3>
                <p className="text-gray-500 mt-1 text-sm">Try adjusting your search or add a new farmer.</p>
                <button
                  onClick={() => navigate('/farmers/add')}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Add Farmer
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
