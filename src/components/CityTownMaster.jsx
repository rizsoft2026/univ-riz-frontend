import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Building2, CheckCircle, XCircle } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import baseApi from '@/services/baseApi';

export default function CityTownMaster({ cityTowns = [], setCityTowns, countries = [], states = [], districts = [], showNotification }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [formData, setFormData] = useState({
    countryId: '',
    stateId: '',
    districtId: '',
    cityTownName: '',
    pincode: '',
    status: 'Active',
  });
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  const { data: fetchedData, isSuccess } = useQuery({
    queryKey: ['cityTowns'],
    queryFn: async () => {
      const response = await baseApi.get('/city-towns');
      if (response.data.success) {
        return response.data.data.map((c) => ({
          id: c.city_town_id.toString(),
          cityTownName: c.city_town_name,
          pincode: c.pincode || '',
          districtId: c.district_id.toString(),
          districtName: c.district?.district_name || '',
          stateId: c.district?.state_id ? c.district.state_id.toString() : '',
          stateName: c.district?.state?.state_name || '',
          countryId: c.district?.state?.country_id ? c.district.state.country_id.toString() : '',
          countryName: c.district?.state?.country?.country_name || '',
          status: c.status,
          createdAt: c.created_at || new Date().toISOString(),
        }));
      }
      return [];
    }
  });

  useEffect(() => {
    if (isSuccess && fetchedData) {
      setCityTowns(fetchedData);
    }
  }, [isSuccess, fetchedData, setCityTowns]);

  const createMutation = useMutation({
    mutationFn: (data) => baseApi.post('/city-towns', data),
    onSuccess: (res) => {
      showNotification(`City/Town "${res.data.data.city_town_name}" created successfully!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['cityTowns'] });
      setIsFormOpen(false);
    },
    onError: (err) => {
      showNotification(err.response?.data?.message || 'Error creating city/town', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => baseApi.put(`/city-towns/${id}`, data),
    onSuccess: (res) => {
      showNotification(`City/Town "${res.data.data.city_town_name}" updated successfully!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['cityTowns'] });
      setIsFormOpen(false);
    },
    onError: (err) => {
      showNotification(err.response?.data?.message || 'Error updating city/town', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => baseApi.delete(`/city-towns/${id}`),
    onSuccess: () => {
      showNotification('City/Town deleted successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['cityTowns'] });
      setItemToDelete(null);
      setIsDeleteOpen(false);
    },
    onError: (err) => {
      showNotification(err.response?.data?.message || 'Error deleting city/town', 'error');
      setIsDeleteOpen(false);
    }
  });

  // Cascading states for form
  const availableStatesForForm = useMemo(() => {
    if (!formData.countryId) return [];
    return states.filter((s) => s.countryId === formData.countryId);
  }, [states, formData.countryId]);

  // Cascading districts for form
  const availableDistrictsForForm = useMemo(() => {
    if (!formData.stateId) return [];
    return districts.filter((d) => d.stateId === formData.stateId);
  }, [districts, formData.stateId]);

  // Cascading states for filter
  const availableStatesForFilter = useMemo(() => {
    if (countryFilter === 'ALL') return states;
    return states.filter((s) => s.countryId === countryFilter);
  }, [states, countryFilter]);

  // Cascading districts for filter
  const availableDistrictsForFilter = useMemo(() => {
    if (stateFilter !== 'ALL') {
      return districts.filter((d) => d.stateId === stateFilter);
    }
    if (countryFilter !== 'ALL') {
      const stateIds = availableStatesForFilter.map((s) => s.id);
      return districts.filter((d) => stateIds.includes(d.stateId));
    }
    return districts;
  }, [districts, stateFilter, countryFilter, availableStatesForFilter]);

  const handleCreateOpen = () => {
    setEditingItem(null);
    const initialCountry = countries.length > 0 ? countries[0].id : '';
    const filteredSt = states.filter((s) => s.countryId === initialCountry);
    const initialState = filteredSt.length > 0 ? filteredSt[0].id : '';
    const filteredDist = districts.filter((d) => d.stateId === initialState);
    const initialDistrict = filteredDist.length > 0 ? filteredDist[0].id : '';

    setFormData({
      countryId: initialCountry,
      stateId: initialState,
      districtId: initialDistrict,
      cityTownName: '',
      pincode: '',
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
      districtId: item.districtId,
      cityTownName: item.cityTownName,
      pincode: item.pincode,
      status: item.status,
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const handleCountryChange = (e) => {
    const selectedCountryId = e.target.value;
    const matchingStates = states.filter((s) => s.countryId === selectedCountryId);
    const nextStateId = matchingStates.length > 0 ? matchingStates[0].id : '';
    const matchingDistricts = districts.filter((d) => d.stateId === nextStateId);
    const nextDistrictId = matchingDistricts.length > 0 ? matchingDistricts[0].id : '';

    setFormData((prev) => ({
      ...prev,
      countryId: selectedCountryId,
      stateId: nextStateId,
      districtId: nextDistrictId,
    }));
  };

  const handleStateChange = (e) => {
    const selectedStateId = e.target.value;
    const matchingDistricts = districts.filter((d) => d.stateId === selectedStateId);
    const nextDistrictId = matchingDistricts.length > 0 ? matchingDistricts[0].id : '';

    setFormData((prev) => ({
      ...prev,
      stateId: selectedStateId,
      districtId: nextDistrictId,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!formData.countryId) tempErrors.countryId = 'Country selection is required';
    if (!formData.stateId) tempErrors.stateId = 'State selection is required';
    if (!formData.districtId) tempErrors.districtId = 'District selection is required';
    if (!formData.cityTownName.trim()) tempErrors.cityTownName = 'City/Town Name is required';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      city_town_name: formData.cityTownName.trim(),
      pincode: formData.pincode.trim() || null,
      district_id: formData.districtId,
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
    if (!Array.isArray(cityTowns)) return [];
    return cityTowns.filter((item) => {
      if (!item) return false;
      const search = (searchTerm || '').toLowerCase();
      const matchSearch =
        (item.cityTownName || '').toLowerCase().includes(search) ||
        (item.pincode || '').toLowerCase().includes(search) ||
        (item.districtName || '').toLowerCase().includes(search) ||
        (item.stateName || '').toLowerCase().includes(search) ||
        (item.countryName || '').toLowerCase().includes(search);
      const matchStatus = statusFilter === 'ALL' || (item.status || '').toUpperCase() === statusFilter;
      const matchCountry = countryFilter === 'ALL' || item.countryId === countryFilter;
      const matchState = stateFilter === 'ALL' || item.stateId === stateFilter;
      const matchDistrict = districtFilter === 'ALL' || item.districtId === districtFilter;

      return matchSearch && matchStatus && matchCountry && matchState && matchDistrict;
    });
  }, [cityTowns, searchTerm, statusFilter, countryFilter, stateFilter, districtFilter]);

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-blue-700 to-sky-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-600/10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">City / Town Master</h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5">Select Country, State & District, then enter City/Town Name with Pincode.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleCreateOpen}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 font-medium rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" /> Add City / Town
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
            placeholder="Search city/pincode..."
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
                setDistrictFilter('ALL');
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
              onChange={(e) => {
                setStateFilter(e.target.value);
                setDistrictFilter('ALL');
              }}
              className="flex-1 sm:flex-none sm:max-w-[150px] truncate pl-3.5 pr-8 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-white/60 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            >
              <option value="ALL">All States</option>
              {availableStatesForFilter.map((s) => (
                <option key={s.id} value={s.id}>{s.stateName}</option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">District:</span>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="flex-1 sm:flex-none sm:max-w-[150px] truncate pl-3.5 pr-8 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-white/60 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            >
              <option value="ALL">All Districts</option>
              {availableDistrictsForFilter.map((d) => (
                <option key={d.id} value={d.id}>{d.districtName}</option>
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
                  className={`px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${isSelected
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
                <th className="px-6 py-4">CITY / TOWN NAME</th>
                <th className="px-6 py-4">PINCODE</th>
                <th className="px-6 py-4">DISTRICT</th>
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
                        <Building2 className="w-4 h-4" />
                      </div>
                      {item.cityTownName}
                    </td>
                    <td className="px-6 py-4 font-semibold text-blue-600 dark:text-blue-400">
                      {item.pincode || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                      {item.districtName || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                      {item.stateName || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                      {item.countryName || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'Active'
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
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                    No cities/towns found.
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
        title={editingItem ? 'Edit City / Town' : 'Add City / Town'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Select Country *</label>
            <select
              name="countryId"
              value={formData.countryId}
              onChange={handleCountryChange}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950/40 border ${errors.countryId ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
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
              onChange={handleStateChange}
              disabled={!formData.countryId}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950/40 border ${errors.stateId ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
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
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Select District *</label>
            <select
              name="districtId"
              value={formData.districtId}
              onChange={handleInputChange}
              disabled={!formData.stateId}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950/40 border ${errors.districtId ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white disabled:opacity-50`}
            >
              <option value="">Select District</option>
              {availableDistrictsForForm.map((d) => (
                <option key={d.id} value={d.id}>{d.districtName}</option>
              ))}
            </select>
            {errors.districtId && <p className="text-red-500 text-xs mt-1">{errors.districtId}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">City / Town Name *</label>
              <input
                type="text"
                name="cityTownName"
                value={formData.cityTownName}
                onChange={handleInputChange}
                placeholder="e.g. Pune City, Pasadena"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950/40 border ${errors.cityTownName ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white`}
              />
              {errors.cityTownName && <p className="text-red-500 text-xs mt-1">{errors.cityTownName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pincode / Postal Code</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                placeholder="e.g. 411001"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
              />
            </div>
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
              {editingItem ? 'Save Changes' : 'Create City / Town'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete City / Town"
        message={`Are you sure you want to delete city/town "${itemToDelete?.cityTownName}"?`}
      />
    </div>
  );
}
