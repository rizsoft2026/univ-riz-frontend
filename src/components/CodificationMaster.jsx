import React, { useState, useMemo, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Hash, CheckCircle, XCircle, AlertCircle, Loader2, ChevronDown, Layers } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { useCodifications, useCreateCodification, useUpdateCodification, useDeleteCodification } from '../hooks/useCodifications';
import { useSubjectGroups } from '../hooks/useSubjectGroups';
import { useOnClickOutside } from 'usehooks-ts';

export default function CodificationMaster({ setActiveTab, showNotification }) {
  // Data from API
  const { data: codifications = [], isLoading: isLoadingCodifications } = useCodifications();
  const { data: subjectGroups = [], isLoading: isLoadingGroups } = useSubjectGroups();
  
  const createMutation = useCreateCodification();
  const updateMutation = useUpdateCodification();
  const deleteMutation = useDeleteCodification();

  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [groupFilter, setGroupFilter] = useState('ALL');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCodification, setEditingCodification] = useState(null);
  const [codificationToDelete, setCodificationToDelete] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    subjectGroupIds: [],
    category: '',
    description: '',
    status: 'Active',
  });
  const [errors, setErrors] = useState({});

  // Subject Group Dropdown states in Modal
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const groupDropdownRef = useRef(null);
  useOnClickOutside(groupDropdownRef, () => setIsGroupDropdownOpen(false));

  const filteredSubjectGroupsDropdown = useMemo(() => {
    if (!Array.isArray(subjectGroups)) return [];
    return subjectGroups.filter(g => g && g.status === 'Active' &&
      ((g.name || '').toLowerCase().includes((groupSearchTerm || '').toLowerCase()) ||
        (g.code || '').toLowerCase().includes((groupSearchTerm || '').toLowerCase()))
    );
  }, [subjectGroups, groupSearchTerm]);

  // Handle opening form for Create
  const handleCreateOpen = () => {
    setEditingCodification(null);
    setFormData({
      code: '',
      subjectGroupIds: [],
      category: '',
      description: '',
      status: 'Active',
    });
    setErrors({});
    setIsFormOpen(true);
  };

  // Handle opening form for Edit
  const handleEditOpen = (codification) => {
    setEditingCodification(codification);
    setFormData({
      code: codification.code,
      subjectGroupIds: codification.subjectGroups.map(g => g.id),
      category: codification.category,
      description: codification.description || '',
      status: codification.status,
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'code') {
      value = value.toUpperCase().replace(/\s+/g, '-');
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validate form
  const validateForm = () => {
    const tempErrors = {};

    if (!formData.code.trim()) {
      tempErrors.code = 'Codification Code is required.';
    }

    if (!formData.subjectGroupIds || formData.subjectGroupIds.length === 0) {
      tempErrors.subjectGroupIds = 'At least one Subject Group is required.';
    }

    if (!formData.category || !formData.category.trim()) {
      tempErrors.category = 'Category name is required.';
    }

    if (formData.description && formData.description.length > 250) {
      tempErrors.description = 'Description cannot exceed 250 characters.';
    }

    // Check code + group uniqueness
    const duplicate = (codifications || []).find(
      (c) => 
        c && (c.code || '').toUpperCase() === formData.code.trim().toUpperCase() && 
        formData.subjectGroupIds.includes(c.subjectGroupId) &&
        (!editingCodification || !editingCodification.ids.includes(c.id))
    );

    if (duplicate) {
      tempErrors.code = 'This code is already mapped to one of the selected Subject Groups.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Form Submit (Create/Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      code: formData.code.trim().toUpperCase(),
      subjectGroupIds: formData.subjectGroupIds,
      category: formData.category.trim(),
      description: formData.description.trim(),
      status: formData.status
    };

    if (editingCodification) {
      // Update
      updateMutation.mutate({
        id: editingCodification.id,
        ...payload
      }, {
        onSuccess: () => {
          showNotification(`Codification "${formData.code}" updated successfully!`, 'success');
          setIsFormOpen(false);
        },
        onError: (err) => {
          showNotification(err.response?.data?.message || 'Failed to update codification', 'error');
        }
      });
    } else {
      // Create
      createMutation.mutate(payload, {
        onSuccess: () => {
          showNotification(`Codification "${formData.code}" created successfully!`, 'success');
          setIsFormOpen(false);
        },
        onError: (err) => {
          showNotification(err.response?.data?.message || 'Failed to create codification', 'error');
        }
      });
    }
  };

  // Handle Delete Confirmation
  const handleDeleteOpen = (codification) => {
    setCodificationToDelete(codification);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!codificationToDelete) return;
    deleteMutation.mutate(codificationToDelete.id, {
      onSuccess: () => {
        showNotification(`Codification "${codificationToDelete.code}" deleted successfully!`, 'success');
        setIsDeleteOpen(false);
        setCodificationToDelete(null);
      },
      onError: (err) => {
        showNotification(err.response?.data?.message || 'Failed to delete codification', 'error');
      }
    });
  };

  // Group codifications by code to support multiple subject groups per code
  const groupedCodifications = useMemo(() => {
    if (!Array.isArray(codifications)) return [];
    const groups = {};
    codifications.forEach(c => {
      if (!c) return;
      const code = c.code;
      if (!groups[code]) {
        groups[code] = {
          id: c.id,
          code: c.code,
          category: c.category,
          status: c.status,
          description: c.description || '',
          subjectGroups: [],
          ids: []
        };
      }
      if (c.subjectGroup) {
        groups[code].subjectGroups.push(c.subjectGroup);
      }
      groups[code].ids.push(c.id);
    });
    return Object.values(groups);
  }, [codifications]);

  // Filter grouped codifications
  const filteredCodifications = useMemo(() => {
    return groupedCodifications.filter((c) => {
      const search = (searchTerm || '').toLowerCase();
      const groupNameMatches = c.subjectGroups.some(g => 
        (g.name || '').toLowerCase().includes(search) || 
        (g.code || '').toLowerCase().includes(search)
      );

      const matchSearch =
        (c.code || '').toLowerCase().includes(search) ||
        (c.category || '').toLowerCase().includes(search) ||
        (c.description || '').toLowerCase().includes(search) ||
        groupNameMatches;

      const matchStatus =
        statusFilter === 'ALL' || (c.status || '').toUpperCase() === statusFilter;

      const matchGroup =
        groupFilter === 'ALL' || c.subjectGroups.some(g => g.id === groupFilter);

      return matchSearch && matchStatus && matchGroup;
    });
  }, [groupedCodifications, searchTerm, statusFilter, groupFilter]);

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {/* Header Box */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-blue-700 to-sky-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-600/10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
            <Hash className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Codification Master</h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
              Manage academic codifications mapped with Subject Groups and custom Categories.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleCreateOpen}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 font-medium rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer text-sm font-bold"
          >
            <Plus className="w-4 h-4" /> Add Codification
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-blue-100/80 dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-slate-800 shadow-xs max-w-full overflow-hidden">
        {/* Search */}
        <div className="relative w-full xl:w-96 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Code, Group or Category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-950/40 border border-white/60 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-white placeholder:text-slate-400 shadow-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Subject Group Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">Group:</span>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="flex-1 sm:flex-none max-w-[200px] truncate px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-white/60 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            >
              <option value="ALL">All Subject Groups</option>
              {subjectGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
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

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">CODE</th>
                <th scope="col" className="px-6 py-4">CATEGORY</th>
                <th scope="col" className="px-6 py-4">SUBJECT GROUP</th>
                <th scope="col" className="px-6 py-4">DESCRIPTION</th>
                <th scope="col" className="px-6 py-4">STATUS</th>
                <th scope="col" className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoadingCodifications || isLoadingGroups ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
                    <p className="mt-2 text-sm text-slate-500">Loading codifications...</p>
                  </td>
                </tr>
              ) : filteredCodifications.length > 0 ? (
                filteredCodifications.map((codification) => {
                  return (
                    <tr key={codification.code} className="odd:bg-blue-50/40 even:bg-white dark:odd:bg-slate-800/30 dark:even:bg-slate-900 hover:bg-blue-100/50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-mono font-bold rounded-lg text-xs">
                          {codification.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                        {codification.category}
                      </td>
                      <td className="px-6 py-4 text-slate-800 dark:text-white">
                        {codification.subjectGroups && codification.subjectGroups.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {codification.subjectGroups.map((g) => (
                              <span
                                key={g.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 rounded-md text-[11px] font-semibold"
                              >
                                <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[120px]">{g.name}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {codification.description || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          codification.status === 'Active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {codification.status === 'Active' ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          {codification.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleEditOpen(codification)}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            title="Edit Codification"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOpen(codification)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                            title="Delete Codification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400 dark:text-slate-500">
                    No Codifications Found. Click "Add Codification" to create your first academic codification.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCodification ? 'Edit Codification' : 'Add Codification'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Codification Code */}
          <div className="space-y-1">
            <label htmlFor="code" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Codification Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder="Example: MJ1"
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${
                errors.code ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
              } rounded-xl focus:outline-none focus:ring-2 font-mono dark:text-white uppercase`}
            />
            {errors.code && (
              <p className="text-red-500 text-xs mt-1">{errors.code}</p>
            )}
          </div>

          {/* Category Input Box */}
          <div className="space-y-1">
            <label htmlFor="category" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Category Name
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="Type Category Name (e.g. Major Subject, Minor Subject, SEC...)"
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${
                errors.category ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
              } rounded-xl focus:outline-none focus:ring-2 dark:text-white`}
            />
            {errors.category && (
              <p className="text-red-500 text-xs mt-1">{errors.category}</p>
            )}
          </div>

          {/* Subject Group Dropdown */}
          <div className="space-y-1">
            <label htmlFor="subjectGroupIds" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Subject Groups
            </label>
            <div className="relative" ref={groupDropdownRef}>
              <div
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${
                  errors.subjectGroupIds ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                } rounded-xl focus:outline-none focus:ring-2 dark:text-white cursor-pointer flex justify-between items-center`}
                onClick={() => {
                  setIsGroupDropdownOpen(!isGroupDropdownOpen);
                  if (!isGroupDropdownOpen) setGroupSearchTerm('');
                }}
              >
                <span className={formData.subjectGroupIds && formData.subjectGroupIds.length > 0 ? 'text-slate-800 dark:text-white' : 'text-slate-400'}>
                  {formData.subjectGroupIds && formData.subjectGroupIds.length > 0
                    ? (() => {
                        const selectedNames = formData.subjectGroupIds.map(id => {
                          const g = subjectGroups.find(g => g.id === id);
                          return g ? g.name : '';
                        }).filter(Boolean);
                        return selectedNames.length > 2
                          ? `${selectedNames.length} groups selected`
                          : selectedNames.join(', ');
                      })()
                    : 'Select Subject Groups'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>

              {isGroupDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search groups..."
                        value={groupSearchTerm}
                        onChange={(e) => setGroupSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 dark:text-white placeholder:text-slate-400"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto">
                    {filteredSubjectGroupsDropdown.length > 0 ? (
                      filteredSubjectGroupsDropdown.map((g) => {
                        const isChecked = formData.subjectGroupIds && formData.subjectGroupIds.includes(g.id);
                        return (
                          <div
                            key={g.id}
                            className={`px-3.5 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${
                              isChecked ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-200'
                            }`}
                            onClick={() => {
                              const currentIds = formData.subjectGroupIds || [];
                              const newIds = isChecked
                                ? currentIds.filter(id => id !== g.id)
                                : [...currentIds, g.id];
                              setFormData(prev => ({ ...prev, subjectGroupIds: newIds }));
                            }}
                          >
                            <span className="flex-1">
                              {g.name} <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">({g.code})</span>
                            </span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 ml-2 cursor-pointer"
                            />
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-3.5 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                        No active subject groups found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.subjectGroupIds && (
              <p className="text-red-500 text-xs mt-1">{errors.subjectGroupIds}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="description" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Description <span className="text-slate-400 lowercase font-normal">(Optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter a short description..."
              rows={3}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${
                errors.description ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
              } rounded-xl focus:outline-none focus:ring-2 dark:text-white resize-none`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Status
            </label>
            <div className="flex gap-4">
              <label className="flex-1 flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Active</span>
                </div>
                <input
                  type="radio"
                  name="status"
                  value="Active"
                  checked={formData.status === 'Active'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded-full"
                />
              </label>
              <label className="flex-1 flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Inactive</span>
                </div>
                <input
                  type="radio"
                  name="status"
                  value="Inactive"
                  checked={formData.status === 'Inactive'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded-full"
                />
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-70 flex items-center gap-2"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingCodification ? 'Save Changes' : 'Create Codification'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Codification"
        message={`Are you sure you want to delete codification "${codificationToDelete?.code}"? This action cannot be undone.`}
      />
    </div>
  );
}
