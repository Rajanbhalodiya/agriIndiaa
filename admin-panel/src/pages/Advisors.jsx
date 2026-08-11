import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { MdClose, MdVisibility, MdVisibilityOff, MdEdit } from 'react-icons/md';
import { API_BASE_URL } from '../services/api';

export default function Advisors() {
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);

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

  const handleStartEdit = (advisor, e) => {
    if (e) e.stopPropagation();
    setSelectedAdvisor(advisor);
    setEditFormData({
      advisorId: advisor._id,
      name: advisor.name || '',
      phone: advisor.phone || '',
      area: advisor.area || '',
      village: advisor.village || '',
      pincode: advisor.pincode || '',
      aadhar: advisor.aadhar || '',
      available: advisor.available !== undefined ? advisor.available : true,
      password: ''
    });
    setIsEditing(true);
  };

  const handleSaveAdvisor = async (e) => {
    e.preventDefault();
    if (editFormData.aadhar && editFormData.aadhar.length !== 12) {
      alert('Aadhar number must be exactly 12 digits');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/update-advisor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(editFormData)
      });
      const data = await response.json();
      if (data.success) {
        alert('Advisor details updated successfully!');
        setSelectedAdvisor(data.advisor);
        setIsEditing(false);
        fetchAdvisors();
      } else {
        alert(data.message || 'Failed to update advisor');
      }
    } catch (error) {
      console.error('Error updating advisor:', error);
      alert('Something went wrong while updating advisor');
    } finally {
      setSaving(false);
    }
  };

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
    const matchesSearch = 
      advisor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.village?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.aadhar?.toLowerCase().includes(searchTerm.toLowerCase());

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
          <Link
            to="/advisors/add"
            className="bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
          >
            Add Advisor
          </Link>
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
                <div className="flex items-center justify-between">
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
                  <button
                    onClick={(e) => handleStartEdit(advisor, e)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1"
                  >
                    <MdEdit className="w-4 h-4" /> Edit
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400 block">Village</span>
                    <span className="font-semibold text-gray-800">{advisor.village || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Area</span>
                    <span className="font-semibold text-gray-800 truncate block">{advisor.area || 'N/A'}</span>
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
                    <th className="px-6 py-4">Area (Arya)</th>
                    <th className="px-6 py-4 text-right">Actions</th>
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
                        {advisor.area || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => handleStartEdit(advisor, e)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <MdEdit className="w-4 h-4" /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Advisor Details / Edit Modal */}
      {selectedAdvisor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setSelectedAdvisor(null); setIsEditing(false); }}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Advisor Details' : 'Advisor Details'}</h2>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    onClick={() => handleStartEdit(selectedAdvisor)}
                    className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-full transition-colors text-xs font-semibold flex items-center gap-1"
                  >
                    <MdEdit className="w-4 h-4" /> Edit Profile
                  </button>
                )}
                <button 
                  onClick={() => { setSelectedAdvisor(null); setIsEditing(false); }}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {isEditing ? (
                /* EDIT FORM */
                <form onSubmit={handleSaveAdvisor} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Pin Code</label>
                      <input
                        type="text"
                        value={editFormData.pincode}
                        onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Area (Arya)</label>
                      <input
                        type="text"
                        value={editFormData.area}
                        onChange={(e) => setEditFormData({ ...editFormData, area: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Village Name</label>
                      <input
                        type="text"
                        value={editFormData.village}
                        onChange={(e) => setEditFormData({ ...editFormData, village: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Aadhar Number (12 Digits)</label>
                    <input
                      type="text"
                      maxLength={12}
                      minLength={12}
                      pattern="[0-9]{12}"
                      value={editFormData.aadhar}
                      onChange={(e) => setEditFormData({ ...editFormData, aadhar: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono tracking-wide"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Account Availability Status</label>
                    <select
                      value={editFormData.available ? 'true' : 'false'}
                      onChange={(e) => setEditFormData({ ...editFormData, available: e.target.value === 'true' })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                    >
                      <option value="true">🟢 Available (Can Place Orders)</option>
                      <option value="false">🔴 Unavailable (Blocked from Placing Orders)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">New Password (Optional)</label>
                    <input
                      type="text"
                      placeholder="Leave blank to keep current password"
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                /* READ-ONLY VIEW */
                <>
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
                        <span className="text-gray-500">Village:</span>
                        <span className="font-medium text-gray-900">{selectedAdvisor.village || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Area (Arya):</span>
                        <span className="font-medium text-gray-900">{selectedAdvisor.area || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pin Code:</span>
                        <span className="font-medium text-gray-900">{selectedAdvisor.pincode || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Aadhar Number:</span>
                        <span className="font-medium text-gray-900">{selectedAdvisor.aadhar || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-gray-500 font-medium">Password:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 bg-gray-200 px-2.5 py-1 rounded-lg text-sm font-mono tracking-wider">
                            {showPassword ? (selectedAdvisor.plainPassword || 'N/A') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                            title={showPassword ? "Hide Password" : "Show Password"}
                          >
                            {showPassword ? <MdVisibilityOff className="w-4 h-4" /> : <MdVisibility className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
