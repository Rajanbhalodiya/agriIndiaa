import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { MdClose, MdPerson } from 'react-icons/md';
import { API_BASE_URL } from '../services/api';
import { TableSkeleton } from '../components/Loader';

export default function Farmers() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [landTypeFilter, setLandTypeFilter] = useState('All');

  const fetchFarmers = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE_URL}/admin/all-farmers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'atoken': token
        }
      });
      const data = await response.json();
      if (data.success) {
        setFarmers(data.farmers);
      } else {
        console.error('Failed to fetch farmers:', data.message);
      }
    } catch (error) {
      console.error('Error fetching farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const filteredFarmers = farmers.filter((farmer) => {
    const fullName = `${farmer.firstName || ''} ${farmer.lastName || ''} ${farmer.farmerName || ''}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      fullName.includes(searchLower) ||
      farmer.phone?.toLowerCase().includes(searchLower) ||
      farmer.village?.toLowerCase().includes(searchLower) ||
      farmer.advisorName?.toLowerCase().includes(searchLower);

    const matchesLandType =
      landTypeFilter === 'All' ||
      (farmer.landType || '').toLowerCase() === landTypeFilter.toLowerCase();

    return matchesSearch && matchesLandType;
  });

  return (
    <div className="max-w-7xl mx-auto pb-10 relative">
      <PageHeader
        title="Farmers"
        description="View and manage farmers registered in the system"
      />

      {/* Search and Land Type Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="w-full sm:w-96 relative">
          <input
            type="text"
            placeholder="Search by farmer name, advisor, phone, village..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <label className="text-sm font-semibold text-gray-600">Land Type:</label>
          <select
            value={landTypeFilter}
            onChange={(e) => setLandTypeFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm cursor-pointer"
          >
            <option value="All">All Land Types</option>
            <option value="farm">Farm</option>
            <option value="open">Open</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : filteredFarmers.length === 0 ? (
        <EmptyState
          title="No Matching Farmers"
          description="Try adjusting your search query or land type filter."
        />
      ) : (
        <div className="space-y-4">
          {/* Mobile Card View (< md) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredFarmers.map((farmer) => (
              <div
                key={farmer._id}
                onClick={() => setSelectedFarmer(farmer)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3 cursor-pointer hover:border-primary-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                      {(farmer.profileImage && farmer.profileImage !== "default.jpg") || farmer.image ? (
                        <img src={farmer.profileImage || farmer.image} alt={farmer.firstName || farmer.farmerName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-primary-50 text-primary-600">
                          {farmer.firstName ? farmer.firstName.charAt(0).toUpperCase() : (farmer.farmerName ? farmer.farmerName.charAt(0).toUpperCase() : 'F')}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{farmer.farmerName || `${farmer.firstName || ''} ${farmer.lastName || ''}`.trim()}</h4>
                      <p className="text-xs text-gray-500">{farmer.village ? `Village: ${farmer.village}` : 'Village: N/A'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${farmer.advisorName && farmer.advisorName !== 'Direct / Unassigned'
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'bg-gray-100 text-gray-600'
                    }`}>
                    {farmer.advisorName || 'Direct'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400 block">Phone</span>
                    <span className="font-semibold text-gray-800">{farmer.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Total Land</span>
                    <span className="font-semibold text-gray-800">{farmer.totalLand ? `${farmer.totalLand} Acres` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Land Type</span>
                    <span className="font-semibold text-gray-800 capitalize">{farmer.landType || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Temp Land</span>
                    <span className="font-semibold text-gray-800">{farmer.temporaryLand ? `${farmer.temporaryLand} Acres` : '0 Acres'}</span>
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
                    <th className="px-6 py-4 font-semibold">Farmer Name</th>
                    <th className="px-6 py-4 font-semibold">Added By Advisor</th>
                    <th className="px-6 py-4 font-semibold">Phone</th>
                    <th className="px-6 py-4 font-semibold">Village</th>
                    <th className="px-6 py-4 font-semibold">Total Land</th>
                    <th className="px-6 py-4 font-semibold">Temp Land</th>
                    <th className="px-6 py-4 font-semibold">Land Type</th>
                    <th className="px-6 py-4 font-semibold">Crops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredFarmers.map((farmer) => (
                    <tr
                      key={farmer._id}
                      onClick={() => setSelectedFarmer(farmer)}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                            {(farmer.profileImage && farmer.profileImage !== "default.jpg") || farmer.image ? (
                              <img src={farmer.profileImage || farmer.image} alt={farmer.firstName || farmer.farmerName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-primary-50 text-primary-600">
                                {farmer.firstName ? farmer.firstName.charAt(0).toUpperCase() : (farmer.farmerName ? farmer.farmerName.charAt(0).toUpperCase() : 'F')}
                              </div>
                            )}
                          </div>
                          <div className="font-medium text-gray-900">{farmer.farmerName || `${farmer.firstName || ''} ${farmer.lastName || ''}`.trim()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${farmer.advisorName && farmer.advisorName !== 'Direct / Unassigned'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-gray-100 text-gray-600'
                          }`}>
                          {farmer.advisorName || 'Direct / Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{farmer.phone || 'N/A'}</td>
                      <td className="px-6 py-4">{farmer.village || 'N/A'}</td>
                      <td className="px-6 py-4">{farmer.totalLand ? `${farmer.totalLand} Acres` : 'N/A'}</td>
                      <td className="px-6 py-4">{farmer.temporaryLand ? `${farmer.temporaryLand} Acres` : '0 Acres'}</td>
                      <td className="px-6 py-4 capitalize">{farmer.landType || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-500">
                          {farmer.winterCrop && <div>Rabi (Winter): {farmer.winterCrop}</div>}
                          {farmer.summerCrop && <div>Zaid (Summer): {farmer.summerCrop}</div>}
                          {farmer.rainCrop && <div>Kharif (Monsoon): {farmer.rainCrop}</div>}
                          {!farmer.winterCrop && !farmer.summerCrop && !farmer.rainCrop && 'N/A'}
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

      {/* Farmer Details Modal */}
      {selectedFarmer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">Farmer Details</h2>
              <button
                onClick={() => setSelectedFarmer(null)}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-3 sm:gap-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl sm:text-3xl shrink-0">
                  {(selectedFarmer.profileImage && selectedFarmer.profileImage !== "default.jpg") || selectedFarmer.image ? (
                    <img src={selectedFarmer.profileImage || selectedFarmer.image} alt={selectedFarmer.firstName || selectedFarmer.farmerName} className="w-full h-full object-cover" />
                  ) : (
                    selectedFarmer.firstName ? selectedFarmer.firstName.charAt(0).toUpperCase() : (selectedFarmer.farmerName ? selectedFarmer.farmerName.charAt(0).toUpperCase() : 'F')
                  )}
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedFarmer.farmerName || `${selectedFarmer.firstName || ''} ${selectedFarmer.lastName || ''}`.trim()}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Village: {selectedFarmer.village || 'N/A'}</p>
                </div>
              </div>

              {/* Advisor Attribution Banner */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                    <MdPerson className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-xs text-blue-600 font-medium uppercase tracking-wider">Added / Assigned Advisor</span>
                    <span className="text-sm sm:text-base font-bold text-gray-900">{selectedFarmer.advisorName || 'Direct / Unassigned'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Contact Info */}
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 border-b border-gray-200 pb-2 text-sm sm:text-base">Contact Info</h4>
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span className="font-medium text-gray-900">{selectedFarmer.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Land Info */}
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 border-b border-gray-200 pb-2 text-sm sm:text-base">Land Details</h4>
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Land:</span>
                      <span className="font-medium text-gray-900">{selectedFarmer.totalLand || 'N/A'} Acres</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Temporary Land:</span>
                      <span className="font-medium text-gray-900">{selectedFarmer.temporaryLand || '0'} Acres</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Land Type:</span>
                      <span className="font-medium text-gray-900 capitalize">{selectedFarmer.landType || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crop Info */}
              <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 border-b border-gray-200 pb-2 text-sm sm:text-base">Crop Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="block text-gray-500 mb-1">Rabi Crop (Winter)</span>
                    <span className="font-medium text-gray-900">{selectedFarmer.winterCrop || 'None'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 mb-1">Zaid Crop (Summer)</span>
                    <span className="font-medium text-gray-900">{selectedFarmer.summerCrop || 'None'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 mb-1">Kharif Crop (Monsoon)</span>
                    <span className="font-medium text-gray-900">{selectedFarmer.rainCrop || 'None'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
