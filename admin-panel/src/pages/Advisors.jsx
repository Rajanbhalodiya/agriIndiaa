import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { MdClose } from 'react-icons/md';
import { API_BASE_URL } from '../services/api';

export default function Advisors() {
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');

  const fetchAdvisors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/all-advisores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAdvisors(data.advisores || data.doctors); // Fallback for legacy key
      } else {
        console.error('Failed to fetch advisors:', data.message);
      }
    } catch (error) {
      console.error('Error fetching advisors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisors();
  }, []);

  const formatAddress = (address, village) => {
    if (!address) return village || 'N/A';
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
      const line1 = address.line1 || '';
      const line2 = address.line2 || '';
      const full = [line1, line2].filter(Boolean).join(', ');
      return full || village || 'N/A';
    }
    return village || 'N/A';
  };

  const filteredAdvisors = advisors.filter((advisor) => {
    const addrStr = formatAddress(advisor.address, '');
    const matchesSearch = 
      advisor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.village?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      addrStr?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAvailability = 
      availabilityFilter === 'All' ||
      (availabilityFilter === 'Available' && advisor.available) ||
      (availabilityFilter === 'Unavailable' && !advisor.available);

    return matchesSearch && matchesAvailability;
  });

  return (
    <div className="max-w-7xl mx-auto pb-10 relative">
      <PageHeader 
        title="Advisors" 
        description="Manage agriculture advisors and their service areas" 
      />

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Search by name, phone, village, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <label className="text-sm font-medium text-gray-600">Availability:</label>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          >
            <option value="All">All Advisors</option>
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : filteredAdvisors.length === 0 ? (
        <EmptyState 
          title="No Matching Advisors" 
          description="Try adjusting your search query or availability filter." 
        />
      ) : (
        <div className="space-y-4">
          {/* Mobile Card View (< md) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredAdvisors.map((advisor) => (
              <div
                key={advisor._id}
                onClick={() => setSelectedAdvisor(advisor)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3 cursor-pointer hover:border-primary-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0">
                    {advisor.image && advisor.image !== 'default.jpg' ? (
                      <img src={advisor.image} alt={advisor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-primary-50 text-primary-600">
                        {advisor.name ? advisor.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">{advisor.name}</h4>
                    <p className="text-xs text-gray-500">{advisor.phone || 'No Phone'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400 block">Village</span>
                    <span className="font-semibold text-gray-800">{advisor.village || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Address</span>
                    <span className="font-semibold text-gray-800 truncate block">{formatAddress(advisor.address, advisor.village)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Advisor Name</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Village</th>
                    <th className="px-6 py-4">Detailed Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAdvisors.map((advisor) => (
                    <tr 
                      key={advisor._id} 
                      onClick={() => setSelectedAdvisor(advisor)}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                            {advisor.image && advisor.image !== 'default.jpg' ? (
                              <img src={advisor.image} alt={advisor.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-primary-50 text-primary-600">
                                {advisor.name ? advisor.name.charAt(0).toUpperCase() : 'A'}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{advisor.name}</div>
                            {advisor.email && <div className="text-xs text-gray-500">{advisor.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{advisor.phone || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700">{advisor.village || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-800 font-medium max-w-xs truncate">
                        {formatAddress(advisor.address, advisor.village)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Advisor Details Modal */}
      {selectedAdvisor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedAdvisor(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">Advisor Details</h2>
              <button 
                onClick={() => setSelectedAdvisor(null)}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl shrink-0">
                  {selectedAdvisor.image ? (
                    <img src={selectedAdvisor.image} alt={selectedAdvisor.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedAdvisor.name ? selectedAdvisor.name.charAt(0).toUpperCase() : 'A'
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedAdvisor.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${selectedAdvisor.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {selectedAdvisor.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Details */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Profile & Location Information</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium text-gray-900">{selectedAdvisor.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Village / Region:</span>
                    <span className="font-medium text-gray-900">{selectedAdvisor.village || 'N/A'}</span>
                  </div>
                  {selectedAdvisor.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-medium text-gray-900">{selectedAdvisor.email}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-500 block mb-1">Detailed Address:</span>
                    <p className="font-semibold text-gray-900 bg-white p-3 rounded-xl border border-gray-200">
                      {formatAddress(selectedAdvisor.address, selectedAdvisor.village)}
                    </p>
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
