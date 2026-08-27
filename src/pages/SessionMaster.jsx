import { useState, useMemo } from 'react';
import { useSessions, useCreateSession, useUpdateSession, useDeleteSession } from '../hooks/useSessions';
import SessionForm from '../components/session/SessionForm';
import SessionTable from '../components/session/SessionTable';
import { Search, Plus, Filter, AlertCircle, Loader2, ChevronRight, Home, ChevronLeft, Trash2, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SessionMaster = () => {
  const { data: sessions = [], isLoading, isError, error } = useSessions();
  const createMutation = useCreateSession();
  const updateMutation = useUpdateSession();
  const deleteMutation = useDeleteSession();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // States for delete/toggle status confirmation
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', session: null });

  // Filtering logic
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) =>
      session.sessionName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sessions, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredSessions.length / rowsPerPage);

  const currentSessions = useMemo(() => {
    const startIdx = (currentPage - 1) * rowsPerPage;
    return filteredSessions.slice(startIdx, startIdx + rowsPerPage);
  }, [filteredSessions, currentPage]);

  const handleOpenForm = (session = null) => {
    setSelectedSession(session);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedSession(null);
  };

  const handleSubmit = (data) => {
    if (selectedSession) {
      updateMutation.mutate({ ...selectedSession, ...data });
    } else {
      createMutation.mutate(data);
    }
    handleCloseForm();
  };

  const confirmAction = (type, session) => {
    setConfirmDialog({ isOpen: true, type, session });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.type === 'delete') {
      deleteMutation.mutate(confirmDialog.session.id);
    } else if (confirmDialog.type === 'toggleStatus') {
      const newStatus = confirmDialog.session.status === 'Active' ? 'Inactive' : 'Active';
      updateMutation.mutate({ ...confirmDialog.session, status: newStatus });
    }
    setConfirmDialog({ isOpen: false, type: '', session: null });
  };

  // Reset to page 1 when searching
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      {/* Sticky Header */}
      <header className="shrink-0 z-20 bg-white border-b border-gray-100 px-8 py-5 shadow-sm rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <Home className="w-3.5 h-3.5" />
            <ChevronRight className="w-3 h-3" />
            <span>Academic Setup</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600">Session Master</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Session Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage academic sessions across all programs in the university.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02, translateY: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpenForm()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-sm shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Add New Session
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 flex flex-col overflow-hidden">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 shrink-0"
        >
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search sessions by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium shadow-sm">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </motion.div>

        {/* Data State Handling */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Loading academic sessions...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to load sessions</h3>
              <p className="text-gray-500 text-sm max-w-sm">{error.message || 'An unexpected error occurred.'}</p>
            </div>
          ) : (
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              className="flex flex-col flex-1 overflow-hidden space-y-4"
            >
              <SessionTable
                sessions={currentSessions}
                onEdit={handleOpenForm}
                onView={(session) => console.log('View', session)}
                onDelete={(session) => confirmAction('delete', session)}
                onToggleStatus={(session) => confirmAction('toggleStatus', session)}
              />

              {/* Pagination Controls */}
              {totalPages > 0 && (
                <div className="shrink-0 bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between sm:px-6 shadow-sm">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(currentPage * rowsPerPage, filteredSessions.length)}</span> of <span className="font-semibold text-gray-900">{filteredSessions.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2.5 py-2 rounded-l-lg border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {/* Page Numbers */}
                        <div className="flex px-1 items-center bg-white border-y border-gray-200">
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i + 1}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold transition-colors ${currentPage === i + 1
                                ? 'z-10 bg-blue-50 text-blue-600 rounded-md my-1'
                                : 'bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md my-1'
                                }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2.5 py-2 rounded-r-lg border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <SessionForm
            isOpen={isFormOpen}
            onClose={handleCloseForm}
            initialData={selectedSession}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${confirmDialog.type === 'delete' ? 'bg-red-100' : 'bg-blue-100'}`}>
                  {confirmDialog.type === 'delete' ? <Trash2 className="w-5 h-5 text-red-600" /> : <Power className="w-5 h-5 text-blue-600" />}
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {confirmDialog.type === 'delete' ? 'Delete Session' : 'Change Status'}
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {confirmDialog.type === 'delete'
                  ? `Are you sure you want to completely remove "${confirmDialog.session?.sessionName}"? This action cannot be undone and may affect related academic records.`
                  : `Are you sure you want to change the status of "${confirmDialog.session?.sessionName}" to ${confirmDialog.session?.status === 'Active' ? 'Inactive' : 'Active'}?`}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDialog({ isOpen: false, type: '', session: null })}
                  className="px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={deleteMutation.isPending || updateMutation.isPending}
                  className={`px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all shadow-sm ${confirmDialog.type === 'delete' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                    }`}
                >
                  {deleteMutation.isPending || updateMutation.isPending ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SessionMaster;
