import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, Clock, BookOpen, UserCheck, Layers, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const sessionSchema = z.object({
  sessionName: z.string().min(1, 'Session Name is required'),
  startYear: z.string().min(4, 'Start Year is required').max(4),
  endYear: z.string().min(4, 'End Year is required').max(4),
  duration: z.coerce.number().min(1, 'Duration must be greater than zero'),
  entryType: z.string().min(1, 'Entry Type is required'),
  totalSemesters: z.coerce.number().min(1, 'Total Semesters must be greater than zero'),
  status: z.enum(['Active', 'Inactive']),
  description: z.string().optional(),
}).refine((data) => {
  if (data.startYear && data.endYear) {
    return parseInt(data.endYear) >= parseInt(data.startYear);
  }
  return true;
}, {
  message: "End Year must be greater than or equal to Start Year",
  path: ["endYear"],
});

const SessionForm = ({ isOpen, onClose, initialData, onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      sessionName: '',
      startYear: '',
      endYear: '',
      duration: 1,
      entryType: 'Regular',
      totalSemesters: 1,
      status: 'Active',
      description: '',
    },
  });

  const startYear = watch('startYear');
  const endYear = watch('endYear');

  // Auto-calculate duration and semesters
  useEffect(() => {
    if (startYear?.length === 4 && endYear?.length === 4) {
      const start = parseInt(startYear, 10);
      const end = parseInt(endYear, 10);
      
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        // If end == start, assume 1 year duration as fallback, otherwise end - start
        const diffYears = end > start ? end - start : 1;
        
        setValue('duration', diffYears, { shouldValidate: true, shouldDirty: true });
        // Automatically suggest semesters assuming 2 per year
        setValue('totalSemesters', diffYears * 2, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [startYear, endYear, setValue]);

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        sessionName: '',
        startYear: '',
        endYear: '',
        duration: 1,
        entryType: 'Regular',
        totalSemesters: 1,
        status: 'Active',
        description: '',
      });
    }
  }, [initialData, reset, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] border border-white/50"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {initialData ? 'Edit Session Details' : 'Create New Session'}
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Configure academic timeline and structure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="sessionForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              {/* Session Name */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" /> Session Name *
                </label>
                <input
                  {...register('sessionName')}
                  placeholder="e.g. 2026-2027 Academic Year"
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900"
                />
                {errors.sessionName && <p className="text-xs text-red-500 font-medium">{errors.sessionName.message}</p>}
              </div>

              {/* Start Year */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Start Year *</label>
                <input
                  type="text"
                  placeholder="e.g. 2026"
                  maxLength={4}
                  {...register('startYear')}
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900"
                />
                {errors.startYear && <p className="text-xs text-red-500 font-medium">{errors.startYear.message}</p>}
              </div>

              {/* End Year */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">End Year *</label>
                <input
                  type="text"
                  placeholder="e.g. 2027"
                  maxLength={4}
                  {...register('endYear')}
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900"
                />
                {errors.endYear && <p className="text-xs text-red-500 font-medium">{errors.endYear.message}</p>}
              </div>

              {/* Program Duration */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" /> Program Duration (Years) *
                </label>
                <input
                  type="number"
                  {...register('duration')}
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900"
                />
                {errors.duration && <p className="text-xs text-red-500 font-medium">{errors.duration.message}</p>}
              </div>

              {/* Total Semesters */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-500" /> Number of Semesters *
                </label>
                <input
                  type="number"
                  {...register('totalSemesters')}
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900"
                />
                <p className="text-[11px] font-medium text-gray-400 mt-1">Manual entry required (e.g. 4 Years → 8 Semesters)</p>
                {errors.totalSemesters && <p className="text-xs text-red-500 font-medium">{errors.totalSemesters.message}</p>}
              </div>

              {/* Entry Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-500" /> Entry Type *
                </label>
                <select
                  {...register('entryType')}
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900"
                >
                  <option value="Regular">Regular</option>
                  <option value="Lateral Entry">Lateral Entry</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Direct Admission">Direct Admission</option>
                  <option value="Other">Other</option>
                </select>
                {errors.entryType && <p className="text-xs text-red-500 font-medium">{errors.entryType.message}</p>}
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Status *</label>
                <select
                  {...register('status')}
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {errors.status && <p className="text-xs text-red-500 font-medium">{errors.status.message}</p>}
              </div>

              {/* Description */}
              <div className="col-span-1 md:col-span-2 space-y-1.5 mt-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" /> Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900"
                ></textarea>
                {errors.description && <p className="text-xs text-red-500 font-medium">{errors.description.message}</p>}
              </div>

            </div>
          </form>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/80 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all font-semibold text-sm"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            form="sessionForm"
            disabled={isLoading}
            className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-blue-500/20"
          >
            {isLoading && <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>}
            {initialData ? 'Update Session' : 'Save Session'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default SessionForm;
