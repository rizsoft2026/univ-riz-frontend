import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Navigation, CheckCircle, XCircle } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import baseApi from '@/services/baseApi';

export default function DistrictMaster({ districts = [], setDistricts, countries = [], states = [], showNotification }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [formData, setFormData] = useState({
    countryId: '',
    stateId: '',
    districtName: '',
    status: 'Active',
  });
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  const { data: fetchedData, isSuccess } = useQuery({
    queryKey: ['districts'],
    queryFn: async () => {
      const response = await baseApi.get('/districts');
      if (response.data.success) {
        return response.data.data.map((d) => ({
          id: d.district_id.toString(),
          districtName: d.district_name,
          stateId: d.state_id.toString(),
          stateName: d.state?.state_name || '',
          countryId: d.state?.country_id ? d.state.country_id.toString() : '',
          countryName: d.state?.country?.country_name || '',
          status: d.status,
          createdAt: d.created_at || new Date().toISOString(),
        }));
      }
      return [];
    }
  });

  useEffect(() => {
    if (isSuccess && fetchedData) {
      setDistricts(fetchedData);
    }
  }, [isSuccess, fetchedData, setDistricts]);

  const createMutation = useMutation({
    mutationFn: (data) => baseApi.post('/districts', data),
    onSuccess: (res) => {
      showNotification(`District "${res.data.data.district_name}" created successfully!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      setIsFormOpen(false);
    },
    onError: (err) => {
      showNotification(err.response?.data?.message || 'Error creating district', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => baseApi.put(`/districts/${id}`, data),
    onSuccess: (res) => {
      showNotification(`District "${res.data.data.district_name}" updated successfully!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      setIsFormOpen(false);
    },
    onError: (err) => {
      showNotification(err.response?.data?.message || 'Error updating district', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => baseApi.delete(`/districts/${id}`),
    onSuccess: () => {
      showNotification('District deleted successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      setItemToDelete(null);
      setIsDeleteOpen(false);
    },
    onError: (err) => {
      showNotification(err.response?.data?.message || 'Error deleting district', 'error');
      setIsDeleteOpen(false);
    }
  });

  // Dynamic filter of states for form state dropdown
  const availableStatesForForm = useMemo(() => {
    if (!formData.countryId) return [];
    return states.filter((s) => s.countryId === formData.countryId);
  }, [states, formData.countryId]);

  // Dynamic filter of states for search filter dropdown
  const availableStatesForFilter = useMemo(() => {
    if (countryFilter === 'ALL') return states;
    return states.filter((s) => s.countryId === countryFilter);
  }, [states, countryFilter]);

  const handleCreateOpen = () => {
    setEditingItem(null);
    const initialCountry = countries.length > 0 ? countries[0].id : '';
    const filteredSt = states.filter((s) => s.countryId === initialCountry);
    const initialState = filteredSt.length > 0 ? filteredSt[0].id : '';

    setFormData({
      countryId: initialCountry,
      stateId: initialState,
      districtName: '',
      status: 'Active',
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const handleEditOpen = (item) => {
    setEditingItem(item);
    setFormData({
      countryId: item.countryId,
      stateId: item.stateId,
      districtName: item.districtName,
      status: item.status,
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const handleCountryChange = (e) => {
    const selectedCountryId = e.target.value;
    const matchingStates = states.filter((s) => s.countryId === selectedCountryId);
    setFormData((prev) => ({
      ...prev,
      countryId: selectedCountryId,
      stateId: matchingStates.length > 0 ? matchingStates[0].id : '',
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!formData.countryId) {
      tempErrors.countryId = 'Country selection is required';
    }
    if (!formData.stateId) {
      tempErrors.stateId = 'State selection is required';
    }
    if (!formData.districtName.trim()) {
      tempErrors.districtName = 'District Name is required';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      district_name: formData.districtName.trim(),
      state_id: formData.stateId,
      status: formData.status,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    deleteMutation.mutate(itemToDelete.id);
  };

  const filteredData = useMemo(() => {
    if (!Array.isArray(districts)) return [];
    return districts.filter((item) => {
      if (!item) return false;
      const search = (searchTerm || '').toLowerCase();
      const matchSearch =
        (item.districtName || '').toLowerCase().includes(search) ||
        (item.stateName || '').toLowerCase().includes(search) ||
        (item.countryName || '').toLowerCase().includes(search);
      const matchStatus = statusFilter === 'ALL' || (item.status || '').toUpperCase() === statusFilter;
      const matchCountry = countryFilter === 'ALL' || item.countryId === countryFilter;
      const matchState = stateFilter === 'ALL' || item.stateId === stateFilter;

      return matchSearch && matchStatus && matchCountry && matchState;
    });
  }, [districts, searchTerm, statusFilter, countryFilter, stateFilter]);

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-blue-700 to-sky-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-600/10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
            <Navigation className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">District Master</h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5">Select Country and State, then define the District Name.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
        <button
          onClick={handleCreateOpen}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 font-medium rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" /> Add District
        </button>
      
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-blue-100/80 dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-slate-800 shadow-xs max-w-full overflow-hidden">
        {/* Search */}
        <div className="relative w-full lg:w-80 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-950/40 border border-white/60 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-white placeholder:text-slate-400 shadow-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Country Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">Country:</span>
            <select
              value={countryFilter}
              onChange={(e) => {
                setCountryFilter(e.target.value);
                setStateFilter('ALL');
              }}
              className="flex-1 sm:flex-none sm:max-w-[150px] truncate pl-3.5 pr-8 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-white/60 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            >
              <option value="ALL">All Countries</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.countryName}</option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">State:</span>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="flex-1 sm:flex-none sm:max-w-[150px] truncate pl-3.5 pr-8 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-white/60 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            >
              <option value="ALL">All States</option>
              {availableStatesForFilter.map((s) => (
                <option key={s.id} value={s.id}>{s.stateName}</option>
              ))}
            </select>
          </div>

          {/* Status Tab Filter */}
          <div className="flex items-center gap-1 p-1 bg-white/60 dark:bg-slate-800/60 rounded-xl shrink-0 max-w-full overflow-x-auto shadow-sm">
            {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => {
              const isSelected = statusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">DISTRICT NAME</th>
                <th className="px-6 py-4">STATE</th>
                <th className="px-6 py-4">COUNTRY</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id} className="odd:bg-blue-50/40 even:bg-white dark:odd:bg-slate-800/30 dark:even:bg-slate-900 hover:bg-blue-100/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white flex items-center gap-3">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400">
                        <Navigation className="w-4 h-4" />
                      </div>
                      {item.districtName}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                      {item.stateName || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                      {item.countryName || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      }`}>
                        {item.status === 'Active' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleEditOpen(item)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setItemToDelete(item); setIsDeleteOpen(true); }}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                    No districts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Edit District' : 'Add District'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Select Country *</label>
            <select
              name="countryId"
              value={formData.countryId}
              onChange={handleCountryChange}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950/40 border ${
                errors.countryId ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
              } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white`}
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.countryName}</option>
              ))}
            </select>
            {errors.countryId && <p className="text-red-500 text-xs mt-1">{errors.countryId}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Select State *</label>
            <select
              name="stateId"
              value={formData.stateId}
              onChange={handleInputChange}
              disabled={!formData.countryId}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950/40 border ${
                errors.stateId ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
              } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white disabled:opacity-50`}
            >
              <option value="">Select State</option>
              {availableStatesForForm.map((s) => (
                <option key={s.id} value={s.id}>{s.stateName}</option>
              ))}
            </select>
            {errors.stateId && <p className="text-red-500 text-xs mt-1">{errors.stateId}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">District Name *</label>
            <input
              type="text"
              name="districtName"
              value={formData.districtName}
              onChange={handleInputChange}
              placeholder="e.g. Pune, Los Angeles"
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950/40 border ${
                errors.districtName ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
              } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white`}
            />
            {errors.districtName && <p className="text-red-500 text-xs mt-1">{errors.districtName}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
            <div className="flex gap-4">
              <label className="flex-1 flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Active</span>
                <input
                  type="radio"
                  name="status"
                  value="Active"
                  checked={formData.status === 'Active'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600"
                />
              </label>
              <label className="flex-1 flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Inactive</span>
                <input
                  type="radio"
                  name="status"
                  value="Inactive"
                  checked={formData.status === 'Inactive'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
            >
              {editingItem ? 'Save Changes' : 'Create District'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete District"
        message={`Are you sure you want to delete district "${itemToDelete?.districtName}"?`}
      />
    </div>
  );
}
