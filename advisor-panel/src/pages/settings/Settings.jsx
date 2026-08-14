import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdPerson, MdPhone, MdLocationOn, MdSave, MdCheckCircle, MdOutlineShield, MdPhotoCamera, MdDelete } from 'react-icons/md';
import { apiFetch } from '../../services/api';
import { PageLoader, ButtonSpinner, OverlayLoader } from '../../components/Loader';

export default function Settings() {
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    village: '',
    address: '',
    price: '',
    available: true,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiFetch('/advisor/profile');
      if (data.success && data.profileData) {
        setProfile({
          name: data.profileData.name || '',
          phone: data.profileData.phone || '',
          village: data.profileData.village || '',
          address: data.profileData.address || '',
          price: data.profileData.price || 0,
          available: data.profileData.available !== undefined ? data.profileData.available : true,
        });
        if (data.profileData.image) {
          setImagePreview(data.profileData.image);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemovePhoto(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setRemovePhoto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('price', Number(profile.price));
      formData.append('address', profile.address || profile.village);
      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (removePhoto) {
        formData.append('removePhoto', 'true');
      }

      const data = await apiFetch('/advisor/update-profile', {
        method: 'POST',
        body: formData,
      });

      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        if (data.profileData) {
          setImagePreview(data.profileData.image || '');
          setImageFile(null);
          setRemovePhoto(false);
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Error updating profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader text="Loading Account Settings..." size="lg" />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
      {saving && <OverlayLoader message="Saving Settings..." />}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Account Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your profile details, photo, and preferences.</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          <MdCheckCircle className="w-5 h-5 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-surface rounded-2xl shadow-md3-1 p-6 md:p-8 border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-100 border-2 border-primary-200 flex items-center justify-center text-primary-700 font-bold text-2xl shadow-sm">
                {imagePreview ? (
                  <img src={imagePreview} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile.name ? profile.name.charAt(0).toUpperCase() : 'A'
                )}
              </div>
              <label 
                htmlFor="advisor-photo-upload" 
                className="absolute bottom-0 right-0 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full cursor-pointer shadow-md transition-all"
                title="Upload Profile Photo"
              >
                <MdPhotoCamera className="w-4 h-4" />
                <input 
                  id="advisor-photo-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-1 -right-1 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full cursor-pointer shadow-md transition-all"
                  title="Remove Profile Photo"
                >
                  <MdDelete className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
              <p className="text-sm text-primary-600 font-medium">Agricultural Advisor</p>
              <div className="flex items-center gap-3 mt-1">
                <label htmlFor="advisor-photo-upload" className="text-xs text-primary-600 hover:underline cursor-pointer font-medium">
                  Change photo
                </label>
                {imagePreview && (
                  <button 
                    type="button" 
                    onClick={handleRemoveImage} 
                    className="text-xs text-red-600 hover:underline cursor-pointer font-medium"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={profile.name}
                  disabled
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed outline-none"
                />
                <MdPerson className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <input
                  type="text"
                  value={profile.phone}
                  disabled
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed outline-none"
                />
                <MdPhone className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Village / Region</label>
              <div className="relative">
                <input
                  type="text"
                  value={profile.village}
                  disabled
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed outline-none"
                />
                <MdLocationOn className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
              <input
                type="number"
                value={profile.price}
                onChange={(e) => setProfile({ ...profile, price: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="e.g. 500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Address</label>
              <textarea
                rows={2}
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Enter address details"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Status:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                profile.available ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {profile.available ? '🟢 Available (Active)' : '🔴 Unavailable (Managed by Admin)'}
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl shadow-md hover:bg-primary-700 transition-colors font-medium disabled:opacity-70"
            >
              {saving ? (
                <>
                  <ButtonSpinner />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <MdSave className="w-5 h-5" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-surface rounded-2xl p-6 border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-gray-700">
          <MdOutlineShield className="w-6 h-6 text-primary-600" />
          <div>
            <h3 className="font-bold text-gray-900">Security & Authentication</h3>
            <p className="text-xs text-gray-500">Your account is secured with JWT Token authentication.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
