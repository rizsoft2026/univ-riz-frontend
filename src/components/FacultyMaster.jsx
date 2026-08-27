import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, BookOpen, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { useFaculties, useCreateFaculty, useUpdateFaculty, useDeleteFaculty } from '../hooks/useFaculties';

export default function FacultyMaster({ setActiveTab, showNotification }) {
  // Data from API
  const { data: faculties = [], isLoading } = useFaculties();
  const createMutation = useCreateFaculty();
  const updateMutation = useUpdateFaculty();
  const deleteMutation = useDeleteFaculty();

  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [facultyToDelete, setFacultyToDelete] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    status: 'Active',
  });
  const [errors, setErrors] = useState({});

  // Handle opening form for Create
  const handleCreateOpen = () => {
    setEditingFaculty(null);
    setFormData({
      code: '',
      name: '',
      status: 'Active',
    });
    setErrors({});
    setIsFormOpen(true);
  };

  // Handle opening form for Edit
  const handleEditOpen = (faculty) => {
    setEditingFaculty(faculty);
    setFormData({
      code: faculty.code,
      name: faculty.name,
      status: faculty.status,
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
      tempErrors.code = 'Faculty Code is required.';
    }

    if (!formData.name.trim()) {
      tempErrors.name = 'Faculty Name is required.';
    }

    // Check code uniqueness
    const duplicateCode = (faculties || []).find(
      (f) => 
        f && (f.code || '').toUpperCase() === formData.code.trim().toUpperCase() && 
        (!editingFaculty || f.id !== editingFaculty.id)
    );

    if (duplicateCode) {
      tempErrors.code = 'Faculty Code already exists.';
    }

    // Check name uniqueness
    const duplicateName = (faculties || []).find(
      (f) => 
        f && (f.name || '').toLowerCase() === formData.name.trim().toLowerCase() && 
        (!editingFaculty || f.id !== editingFaculty.id)
    );

    if (duplicateName) {
      tempErrors.name = 'Faculty Name already exists.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Form Submit (Create/Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingFaculty) {
      // Update
      updateMutation.mutate({
        id: editingFaculty.id,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        status: formData.status
      }, {
        onSuccess: () => {
          showNotification(`Faculty "${formData.code}" updated successfully!`, 'success');
          setIsFormOpen(false);
        },
        onError: (err) => {
          showNotification(err.response?.data?.message || 'Failed to update faculty', 'error');
        }
      });
    } else {
      // Create
      createMutation.mutate({
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        status: formData.status
      }, {
        onSuccess: () => {
          showNotification(`Faculty "${formData.code}" created successfully!`, 'success');
          setIsFormOpen(false);
        },
        onError: (err) => {
          showNotification(err.response?.data?.message || 'Failed to create faculty', 'error');
        }
      });
    }
  };

  // Handle Delete Confirmation
  const handleDeleteOpen = (faculty) => {
    setFacultyToDelete(faculty);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!facultyToDelete) return;
    deleteMutation.mutate(facultyToDelete.id, {
      onSuccess: () => {
        showNotification(`Faculty "${facultyToDelete.code}" deleted successfully!`, 'success');
        setIsDeleteOpen(false);
        setFacultyToDelete(null);
      },
      onError: (err) => {
        showNotification(err.response?.data?.message || 'Failed to delete faculty', 'error');
      }
    });
  };

  // Filter faculties
  const filteredFaculties = useMemo(() => {
    if (!Array.isArray(faculties)) return [];
    return faculties.filter((f) => {
      if (!f) return false;
      const search = (searchTerm || '').toLowerCase();
      const matchSearch =
        (f.code || '').toLowerCase().includes(search) ||
        (f.name || '').toLowerCase().includes(search);

      const matchStatus =
        statusFilter === 'ALL' || (f.status || '').toUpperCase() === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [faculties, searchTerm, statusFilter]);

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {/* Header Box */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-blue-700 to-sky-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-600/10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Faculty Master</h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5">Manage academic faculties (e.g., B.Sc) across the university.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
        <button
          onClick={handleCreateOpen}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 font-medium rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" /> Add Faculty
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
            placeholder="Search by Code or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-950/40 border border-white/60 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-white placeholder:text-slate-400 shadow-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
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
                <th scope="col" className="px-6 py-4">NAME</th>
                <th scope="col" className="px-6 py-4">STATUS</th>
                <th scope="col" className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
                    <p className="mt-2 text-sm text-slate-500">Loading faculties...</p>
                  </td>
                </tr>
              ) : filteredFaculties.length > 0 ? (
                filteredFaculties.map((faculty) => (
                  <tr key={faculty.id} className="odd:bg-blue-50/40 even:bg-white dark:odd:bg-slate-800/30 dark:even:bg-slate-900 hover:bg-blue-100/50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-mono font-bold rounded-lg text-xs">
                        {faculty.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                      {faculty.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        faculty.status === 'Active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {faculty.status === 'Active' ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        {faculty.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleEditOpen(faculty)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          title="Edit Faculty"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOpen(faculty)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                          title="Delete Faculty"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-slate-400 dark:text-slate-500">
                    No Faculties Found. Click "Add Faculty" to create your first faculty.
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
        title={editingFaculty ? 'Edit Faculty' : 'Add Faculty'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code */}
          <div className="space-y-1">
            <label htmlFor="code" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Faculty Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder="Example: B.Sc"
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${
                errors.code ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
              } rounded-xl focus:outline-none focus:ring-2 font-mono dark:text-white uppercase`}
            />
            {errors.code && (
              <p className="text-red-500 text-xs mt-1">{errors.code}</p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label htmlFor="name" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Faculty Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Example: Bachelor in Science"
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${
                errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
              } rounded-xl focus:outline-none focus:ring-2 dark:text-white`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
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
              {editingFaculty ? 'Save Changes' : 'Create Faculty'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Faculty"
        message={`Are you sure you want to delete faculty "${facultyToDelete?.code}"? This action cannot be undone.`}
      />
    </div>
  );
}
