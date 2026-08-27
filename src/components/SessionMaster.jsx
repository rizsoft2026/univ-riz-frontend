import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import baseApi from '@/services/baseApi';

export default function SessionMaster({ sessions, setSessions, showNotification }) {
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    fromYear: '',
    toYear: '',
    status: 'Active',
  });
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  const { data: fetchedSessions, isSuccess } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await baseApi.get('/sessions');
      if (response.data.success) {
        return response.data.data.map((s) => ({
          id: (s.session_id || s.id || '').toString(),
          fromYear: s.from_year ?? s.fromYear,
          toYear: s.to_year ?? s.toYear,
          sessionYear: s.session_year || s.sessionYear || (s.from_year && s.to_year ? `${s.from_year}-${s.to_year}` : ''),
          duration: s.duration || (s.from_year && s.to_year ? `${s.to_year - s.from_year} ${s.to_year - s.from_year === 1 ? 'Year' : 'Years'}` : ''),
          status: s.status || 'Active',
          createdAt: s.created_at || s.createdAt || new Date().toISOString(),
        }));
      }
      return [];
    }
  });

  useEffect(() => {
    if (isSuccess && fetchedSessions) {
      setSessions(fetchedSessions);
    }
  }, [isSuccess, fetchedSessions, setSessions]);

  const createMutation = useMutation({
    mutationFn: (newSession) => baseApi.post('/sessions', newSession),
    onSuccess: (response) => {
      const s = response.data.data;
      showNotification(`Session ${s.session_year} created successfully!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setIsFormOpen(false);
    },
    onError: (error) => {
      showNotification(error.response?.data?.message || 'Error creating session', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => baseApi.put(`/sessions/${id}`, data),
    onSuccess: (response) => {
      const s = response.data.data;
      showNotification(`Session ${s.session_year} updated successfully!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setIsFormOpen(false);
    },
    onError: (error) => {
      showNotification(error.response?.data?.message || 'Error updating session', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => baseApi.delete(`/sessions/${id}`),
    onSuccess: (_, variables) => {
      const deletedSession = sessions.find(s => s.id === variables);
      showNotification(`Session ${deletedSession?.sessionYear || ''} deleted successfully!`.replace(/\s+/g, ' ').trim(), 'success');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setSessionToDelete(null);
      setIsDeleteOpen(false);
    },
    onError: (error) => {
      showNotification(error.response?.data?.message || 'Error deleting session', 'error');
      setIsDeleteOpen(false);
    }
  });

  // Auto-generate session year and duration
  const generatedSessionYear = useMemo(() => {
    if (formData.fromYear && formData.toYear) {
      return `${formData.fromYear}-${formData.toYear}`;
    }
    return '';
  }, [formData.fromYear, formData.toYear]);

  const calculatedDuration = useMemo(() => {
    const from = parseInt(formData.fromYear, 10);
    const to = parseInt(formData.toYear, 10);
    if (!isNaN(from) && !isNaN(to) && to > from) {
      const diff = to - from;
      return `${diff} ${diff === 1 ? 'Year' : 'Years'}`;
    }
    return '';
  }, [formData.fromYear, formData.toYear]);

  // Handle opening form for Create
  const handleCreateOpen = () => {
    const currentYear = new Date().getFullYear();
    setEditingSession(null);
    setFormData({
      fromYear: currentYear.toString(),
      toYear: (currentYear + 1).toString(),
      status: 'Active',
    });
    setErrors({});
    setIsFormOpen(true);
  };

  // Handle opening form for Edit
  const handleEditOpen = (session) => {
    setEditingSession(session);
    setFormData({
      fromYear: session.fromYear.toString(),
      toYear: session.toYear.toString(),
      status: session.status,
    });
    setErrors({});
    setIsFormOpen(true);
  };

  // Form input change handlers
  const handleFromYearChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => {
      const nextFrom = val;
      // Proactively default toYear to fromYear + 1 to ease user input
      const nextTo = !isNaN(parseInt(val, 10)) ? (parseInt(val, 10) + 1).toString() : prev.toYear;
      return { ...prev, fromYear: nextFrom, toYear: nextTo };
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validate form
  const validateForm = () => {
    const tempErrors = {};
    const fromVal = parseInt(formData.fromYear, 10);
    const toVal = parseInt(formData.toYear, 10);

    if (!formData.fromYear) {
      tempErrors.fromYear = 'From Year is required';
    } else if (isNaN(fromVal) || fromVal < 1900 || fromVal > 2100) {
      tempErrors.fromYear = 'Enter a valid year between 1900 and 2100';
    }

    if (!formData.toYear) {
      tempErrors.toYear = 'To Year is required';
    } else if (isNaN(toVal) || toVal < 1900 || toVal > 2100) {
      tempErrors.toYear = 'Enter a valid year between 1900 and 2100';
    } else if (toVal <= fromVal) {
      tempErrors.toYear = 'To Year must be greater than From Year';
    }

    // Check uniqueness (excluding current editing session)
    const sessionYear = `${formData.fromYear}-${formData.toYear}`;
    const duplicate = sessions.find(
      (s) => 
        `${s.fromYear}-${s.toYear}` === sessionYear && 
        (!editingSession || s.id !== editingSession.id)
    );

    if (duplicate) {
      tempErrors.general = `Session for ${sessionYear} already exists`;
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Form Submit (Create/Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const fromVal = parseInt(formData.fromYear, 10);
    const toVal = parseInt(formData.toYear, 10);

    const payload = {
      from_year: fromVal,
      to_year: toVal,
      status: formData.status
    };

    if (editingSession) {
      updateMutation.mutate({ id: editingSession.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteOpen = (session) => {
    setSessionToDelete(session);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!sessionToDelete) return;
    deleteMutation.mutate(sessionToDelete.id);
  };

  // Filter sessions
  const filteredSessions = useMemo(() => {
    if (!Array.isArray(sessions)) return [];
    return sessions.filter((s) => {
      if (!s) return false;
      const sessionYear = String(s.sessionYear || (s.fromYear && s.toYear ? `${s.fromYear}-${s.toYear}` : s.session_year) || '');
      const duration = String(s.duration || (s.fromYear && s.toYear ? `${s.toYear - s.fromYear} ${s.toYear - s.fromYear === 1 ? 'Year' : 'Years'}` : '') || '');
      const status = String(s.status || '');

      const search = (searchTerm || '').toLowerCase();
      const matchSearch =
        sessionYear.toLowerCase().includes(search) ||
        duration.toLowerCase().includes(search);

      const matchStatus =
        statusFilter === 'ALL' || status.toUpperCase() === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [sessions, searchTerm, statusFilter]);

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {/* Header Box */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-blue-700 to-sky-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-600/10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Session Master</h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
              Manage academic years, terms, and active sessions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl backdrop-blur-xs border border-white/20 self-start sm:self-auto">
          <button
            onClick={handleCreateOpen}
            className="px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 bg-white text-blue-700 shadow-sm hover:bg-blue-50"
          >
            <Plus className="w-4 h-4" /> Add Session
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-blue-100/80 dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-slate-800 shadow-xs max-w-full overflow-hidden">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by year or duration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-950/40 border border-white/60 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-white placeholder:text-slate-400 shadow-sm"
          />
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

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">SESSION YEAR</th>
                <th scope="col" className="px-6 py-4">FROM YEAR</th>
                <th scope="col" className="px-6 py-4">TO YEAR</th>
                <th scope="col" className="px-6 py-4">DURATION</th>
                <th scope="col" className="px-6 py-4">STATUS</th>
                <th scope="col" className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="odd:bg-blue-50/40 even:bg-white dark:odd:bg-slate-800/30 dark:even:bg-slate-900 hover:bg-blue-100/50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white flex items-center gap-3">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400 shadow-xs">
                        <Calendar className="w-4 h-4" />
                      </div>
                      {session.sessionYear || (session.fromYear && session.toYear ? `${session.fromYear}-${session.toYear}` : session.session_year) || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{session.fromYear ?? session.from_year ?? '—'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{session.toYear ?? session.to_year ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {session.duration || (session.fromYear && session.toYear ? `${session.toYear - session.fromYear} ${session.toYear - session.fromYear === 1 ? 'Year' : 'Years'}` : '—')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        session.status === 'Active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {session.status === 'Active' ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleEditOpen(session)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          title="Edit Session"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOpen(session)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                          title="Delete Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400 dark:text-slate-500">
                    No sessions found. Try adding a new session or adjusting your filters.
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
        title={editingSession ? 'Edit Academic Session' : 'Add Academic Session'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 bg-danger-50 dark:bg-danger-950/30 text-danger-700 dark:text-danger-400 text-sm rounded-xl border border-danger-100 dark:border-danger-900/35 font-medium">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* From Year */}
            <div className="space-y-1">
              <label htmlFor="fromYear" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                From Year
              </label>
              <input
                type="number"
                id="fromYear"
                name="fromYear"
                value={formData.fromYear}
                onChange={handleFromYearChange}
                placeholder="e.g. 2025"
                min="1900"
                max="2100"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${
                  errors.fromYear ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                } rounded-xl focus:outline-none focus:ring-2 dark:text-white`}
              />
              {errors.fromYear && (
                <p className="text-red-500 text-xs mt-1">{errors.fromYear}</p>
              )}
            </div>

            {/* To Year */}
            <div className="space-y-1">
              <label htmlFor="toYear" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                To Year
              </label>
              <input
                type="number"
                id="toYear"
                name="toYear"
                value={formData.toYear}
                onChange={handleInputChange}
                placeholder="e.g. 2026"
                min="1900"
                max="2100"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${
                  errors.toYear ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                } rounded-xl focus:outline-none focus:ring-2 dark:text-white`}
              />
              {errors.toYear && (
                <p className="text-red-500 text-xs mt-1">{errors.toYear}</p>
              )}
            </div>
          </div>

          {/* Read Only Auto-Generated Preview Fields */}
          {generatedSessionYear && calculatedDuration && (
            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-blue-600/80 dark:text-blue-400/80 font-medium">Auto-generated Session:</span>
                <span className="font-bold text-blue-800 dark:text-blue-300">{generatedSessionYear}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-600/80 dark:text-blue-400/80 font-medium">Calculated Duration:</span>
                <span className="font-bold text-blue-800 dark:text-blue-300">{calculatedDuration}</span>
              </div>
            </div>
          )}

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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              {editingSession ? 'Save Changes' : 'Create Session'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Academic Session"
        message={`Are you sure you want to delete session ${sessionToDelete?.sessionYear}? This action cannot be undone.`}
      />
    </div>
  );
}
