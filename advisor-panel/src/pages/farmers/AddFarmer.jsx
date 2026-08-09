import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdArrowBack, MdSave } from 'react-icons/md';
import { apiFetch } from '../../services/api';

const farmerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  village: z.string().min(2, 'Village is required'),
  totalLand: z.string().min(1, 'Total land area is required'),
  temporaryLand: z.string().optional(),
  landType: z.string().min(1, 'Land type is required'),
  winterCrop: z.string().optional(),
  summerCrop: z.string().optional(),
  rainCrop: z.string().optional(),
});

export default function AddFarmer() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(farmerSchema),
  });

  const onSubmit = async (data) => {
    try {
      const result = await apiFetch('/advisor/add-farmer', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (result.success) {
        alert('Farmer Added Successfully!');
        navigate('/farmers');
      } else {
        alert(result.message || 'Failed to add farmer');
      }
    } catch (error) {
      console.error('Error adding farmer:', error);
      alert('An error occurred while adding the farmer');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-surface-variant transition-colors"
          >
            <MdArrowBack className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Farmer</h1>
        </div>
      </div>

      <div className="bg-surface rounded-3xl shadow-md3-2 p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                {...register('name')}
                className={`block w-full px-4 py-3 border ${errors.name ? 'border-error' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-surface`}
                placeholder="Enter full name"
              />
              {errors.name && <p className="mt-1 text-sm text-error">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                {...register('phone')}
                className={`block w-full px-4 py-3 border ${errors.phone ? 'border-error' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-surface`}
                placeholder="e.g. 9876543210"
              />
              {errors.phone && <p className="mt-1 text-sm text-error">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
              <input
                type="text"
                {...register('village')}
                className={`block w-full px-4 py-3 border ${errors.village ? 'border-error' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-surface`}
                placeholder="Enter village name"
              />
              {errors.village && <p className="mt-1 text-sm text-error">{errors.village.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Own Land (Acres)</label>
              <input
                type="text"
                {...register('totalLand')}
                className={`block w-full px-4 py-3 border ${errors.totalLand ? 'border-error' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-surface`}
                placeholder="e.g. 15"
              />
              {errors.totalLand && <p className="mt-1 text-sm text-error">{errors.totalLand.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Land (Optional)</label>
              <input
                type="text"
                {...register('temporaryLand')}
                className={`block w-full px-4 py-3 border ${errors.temporaryLand ? 'border-error' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-surface`}
                placeholder="e.g. 5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Land Type</label>
              <select
                {...register('landType')}
                className={`block w-full px-4 py-3 border ${errors.landType ? 'border-error' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-surface`}
              >
                <option value="">Select type</option>
                <option value="farm">Farm</option>
                <option value="open">Open</option>
              </select>
              {errors.landType && <p className="mt-1 text-sm text-error">{errors.landType.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Winter Crop Details</label>
              <input
                type="text"
                {...register('winterCrop')}
                className={`block w-full px-4 py-3 border ${errors.winterCrop ? 'border-error' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-surface`}
                placeholder="e.g. Wheat, Gram"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Summer Crop Details</label>
              <input
                type="text"
                {...register('summerCrop')}
                className={`block w-full px-4 py-3 border ${errors.summerCrop ? 'border-error' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-surface`}
                placeholder="e.g. Bajra, Moong"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rain Crop Details</label>
              <input
                type="text"
                {...register('rainCrop')}
                className={`block w-full px-4 py-3 border ${errors.rainCrop ? 'border-error' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-surface`}
                placeholder="e.g. Rice, Cotton"
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none transition-colors disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : (
                <>
                  <MdSave className="w-5 h-5 mr-2" />
                  Save Farmer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
