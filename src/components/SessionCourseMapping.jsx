import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Link as LinkIcon, CheckCircle, XCircle, AlertCircle, Loader2, ChevronDown, ChevronRight, Maximize2, Minimize2, BookOpen } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { useSessionCourseMappings, useCreateSessionCourseMapping, useUpdateSessionCourseMapping, useDeleteSessionCourseMapping } from '../hooks/useSessionCourseMappings';
import { useSessions } from '../hooks/useSessions';
import { useCourses } from '../hooks/useCourses';
import { useFaculties } from '../hooks/useFaculties';
import { useOnClickOutside } from 'usehooks-ts';

export default function SessionCourseMapping({ setActiveTab, showNotification }) {
  // Fetch data using React Query
  const { data: mappings = [], isLoading: isLoadingMappings } = useSessionCourseMappings();
  const { data: sessions = [], isLoading: isLoadingSessions } = useSessions();
  const { data: courses = [], isLoading: isLoadingCourses } = useCourses();
  const { data: faculties = [], isLoading: isLoadingFaculties } = useFaculties();

  const createMutation = useCreateSessionCourseMapping();
  const updateMutation = useUpdateSessionCourseMapping();
  const deleteMutation = useDeleteSessionCourseMapping();
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sessionFilter, setSessionFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');

  // Accordion State
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (sessionId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const handleExpandAll = () => {
    const all = {};
    sessions.forEach(s => {
      all[s.id] = true;
    });
    setExpandedGroups(all);
  };

  const handleCollapseAll = () => {
    const all = {};
    sessions.forEach(s => {
      all[s.id] = false;
    });
    setExpandedGroups(all);
  };

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [mappingToDelete, setMappingToDelete] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    sessionId: '',
    courseId: '',
    facultyId: '',
    minorCourseSubjectIds: [],
    courseType: 'Semester Wise',
    status: 'Active',
  });
  const [errors, setErrors] = useState({});

  // Fetch minor courses dynamically based on selected faculty and excluded main course
  const { data: minorCourses = [], isLoading: isLoadingMinorCourses } = useCourses(
    formData.facultyId || null,
    formData.courseId || null
  );

  const selectedFacultyObj = useMemo(() => {
    if (!formData.facultyId) return null;
    return faculties.find(f => f.id === formData.facultyId) || null;
  }, [formData.facultyId, faculties]);

  // Bulk action handlers for minor selection
  const handleSelectAllFiltered = () => {
    const visibleIds = filteredMinorSubjectsDropdown.map(c => c.id);
    setFormData(prev => ({
      ...prev,
      minorCourseSubjectIds: Array.from(new Set([...(prev.minorCourseSubjectIds || []), ...visibleIds]))
    }));
  };

  const handleClearAllMinor = () => {
    setFormData(prev => ({
      ...prev,
      minorCourseSubjectIds: []
    }));
  };

  // Dropdown states
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const [sessionSearchTerm, setSessionSearchTerm] = useState('');
  const sessionDropdownRef = React.useRef(null);
  useOnClickOutside(sessionDropdownRef, () => setIsSessionDropdownOpen(false));

  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const courseDropdownRef = React.useRef(null);
  useOnClickOutside(courseDropdownRef, () => setIsCourseDropdownOpen(false));

  const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState(false);
  const [facultySearchTerm, setFacultySearchTerm] = useState('');
  const facultyDropdownRef = React.useRef(null);
  useOnClickOutside(facultyDropdownRef, () => setIsFacultyDropdownOpen(false));

  const [isMinorSubjectDropdownOpen, setIsMinorSubjectDropdownOpen] = useState(false);
  const [minorSubjectSearchTerm, setMinorSubjectSearchTerm] = useState('');
  const minorSubjectDropdownRef = React.useRef(null);
  useOnClickOutside(minorSubjectDropdownRef, () => setIsMinorSubjectDropdownOpen(false));

  const filteredSessionsDropdown = useMemo(() => {
    if (!Array.isArray(sessions)) return [];
    return sessions.filter(s => s?.status === 'Active' &&
      (s.sessionYear || s.session_year || '').toLowerCase().includes((sessionSearchTerm || '').toLowerCase())
    );
  }, [sessions, sessionSearchTerm]);

  const filteredCoursesDropdown = useMemo(() => {
    if (!Array.isArray(courses)) return [];
    return courses.filter(c => c?.status === 'Active' &&
      ((c.name || '').toLowerCase().includes((courseSearchTerm || '').toLowerCase()) ||
        (c.code || '').toLowerCase().includes((courseSearchTerm || '').toLowerCase()))
    );
  }, [courses, courseSearchTerm]);

  const filteredFacultiesDropdown = useMemo(() => {
    if (!Array.isArray(faculties)) return [];
    return faculties.filter(f => f?.status === 'Active' &&
      ((f.facultyName || f.name || '').toLowerCase().includes((facultySearchTerm || '').toLowerCase()))
    );
  }, [faculties, facultySearchTerm]);

  const filteredMinorSubjectsDropdown = useMemo(() => {
    if (!Array.isArray(minorCourses)) return [];
    return minorCourses.filter(c => {
      // Must be active
      if (c?.status !== 'Active') return false;

      // Filter strictly by selected faculty if facultyId is set
      if (formData.facultyId && c.faculty_id && c.faculty_id.toString() !== formData.facultyId.toString()) {
        return false;
      }

      // Filter by Search Term
      const search = (minorSubjectSearchTerm || '').toLowerCase();
      if (!search) return true;

      const nameMatch = (c.name || '').toLowerCase().includes(search);
      const codeMatch = (c.code || '').toLowerCase().includes(search);
      return nameMatch || codeMatch;
    });
  }, [minorCourses, minorSubjectSearchTerm, formData.facultyId]);


  // Helper functions
  const getSessionName = (sessionId) => {
    const session = sessions.find((s) => s.id === sessionId);
    return session ? session.sessionYear : 'Unknown Session';
  };

  const getCourseName = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : 'Unknown Course';
  };

  // Build a summary for selected minor courses — groups by faculty when ALL courses of that faculty are selected
  const getMinorSelectionSummary = (selectedIds, allCoursesList, excludeCourseId) => {
    if (!selectedIds || selectedIds.length === 0) return [];

    const activeCourses = (allCoursesList || []).filter(
      c => c.status === 'Active' && c.id !== excludeCourseId
    );

    // Group all active courses by faculty_id
    const coursesByFaculty = {};
    activeCourses.forEach(c => {
      const fId = c.faculty_id;
      if (fId) {
        if (!coursesByFaculty[fId]) coursesByFaculty[fId] = [];
        coursesByFaculty[fId].push(c.id);
      }
    });

    const summary = [];
    const accountedIds = new Set();

    // Only group if EVERY course of that faculty is selected
    Object.entries(coursesByFaculty).forEach(([facultyId, courseIds]) => {
      if (courseIds.length > 1) {
        const allSelected = courseIds.every(id => selectedIds.includes(id));
        if (allSelected) {
          const faculty = faculties.find(f => f.id === facultyId || f.id === facultyId.toString());
          let facultyName = `Faculty ${facultyId}`;
          if (faculty) {
            const name = faculty.name || faculty.facultyName || '';
            const code = faculty.code || faculty.facultyCode || '';
            facultyName = code ? code : name;
          }
          summary.push({ type: 'group', label: `All ${facultyName} Courses`, count: courseIds.length });
          courseIds.forEach(id => accountedIds.add(id));
        }
      }
    });

    // Remaining individual selections
    selectedIds.forEach(id => {
      if (!accountedIds.has(id)) {
        const course = activeCourses.find(c => c.id === id);
        summary.push({ type: 'individual', id, name: course ? course.name : 'Unknown Course' });
      }
    });

    return summary;
  };

  const calculatedDuration = useMemo(() => {
    if (!formData.sessionId || !formData.courseType) return '';
    const session = sessions.find(s => s.id === formData.sessionId);
    if (!session) return '';
    const from = parseInt(session.fromYear);
    const to = parseInt(session.toYear);
    if (isNaN(from) || isNaN(to)) return '';
    const diff = to - from;
    if (formData.courseType === 'Semester Wise') {
      return diff * 2;
    } else if (formData.courseType === 'Year Wise') {
      return diff;
    }
    return '';
  }, [formData.sessionId, formData.courseType, sessions]);

  // Handle opening form for Create
  const handleCreateOpen = (sessionId = '') => {
    if (sessions.length === 0 || courses.length === 0) {
      showNotification('You must have at least one Session and one Course to create a mapping.', 'warning');
      return;
    }

    setEditingMapping(null);
    setFormData({
      sessionId: sessionId || sessions[0]?.id || '',
      courseId: courses[0]?.id || '',
      facultyId: '',
      minorCourseSubjectIds: [],
      courseType: 'Semester Wise',
      status: 'Active',
    });
    setErrors({});
    setIsFormOpen(true);
  };

  // Handle opening form for Edit
  const handleEditOpen = (mapping) => {
    setEditingMapping(mapping);
    setFormData({
      sessionId: mapping.session_id,
      courseId: mapping.course_id,
      facultyId: mapping.faculty_id || '',
      minorCourseSubjectIds: mapping.minor_course_subject_ids || [],
      courseType: mapping.courseType || 'Semester Wise',
      status: mapping.status,
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'facultyId') {
        // Reset minor course selection when faculty changes so selected minor courses match the chosen faculty
        next.minorCourseSubjectIds = [];
      }
      return next;
    });
  };

  // Validate form
  const validateForm = () => {
    const tempErrors = {};

    if (!formData.sessionId) {
      tempErrors.sessionId = 'Session is required.';
    }

    if (!formData.courseId) {
      tempErrors.courseId = 'Course is required.';
    }

    // Check mapping uniqueness
    const duplicate = mappings.find(
      (m) =>
        m.session_id === formData.sessionId &&
        m.course_id === formData.courseId &&
        (!editingMapping || m.id !== editingMapping.id)
    );

    if (duplicate) {
      tempErrors.general = 'This Session-Course mapping already exists.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Form Submit (Create/Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingMapping) {
      // Update
      updateMutation.mutate({
        id: editingMapping.id,
        sessionId: formData.sessionId,
        courseId: formData.courseId,
        facultyId: formData.facultyId || undefined,
        minorCourseSubjectIds: formData.minorCourseSubjectIds,
        courseType: formData.courseType,
        courseDuration: calculatedDuration || undefined,
        status: formData.status
      }, {
        onSuccess: () => {
          showNotification('Mapping updated successfully!', 'success');
          setIsFormOpen(false);
        },
        onError: (err) => {
          showNotification(err.response?.data?.message || 'Failed to update mapping', 'error');
        }
      });
    } else {
      // Create
      createMutation.mutate({
        sessionId: formData.sessionId,
        courseId: formData.courseId,
        facultyId: formData.facultyId || undefined,
        minorCourseSubjectIds: formData.minorCourseSubjectIds,
        courseType: formData.courseType,
        courseDuration: calculatedDuration || undefined,
        status: formData.status
      }, {
        onSuccess: () => {
          showNotification('Mapping created successfully!', 'success');
          setIsFormOpen(false);
        },
        onError: (err) => {
          showNotification(err.response?.data?.message || 'Failed to create mapping', 'error');
        }
      });
    }
  };

  // Handle Delete Confirmation
  const handleDeleteOpen = (mapping) => {
    setMappingToDelete(mapping);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!mappingToDelete) return;
    deleteMutation.mutate(mappingToDelete.id, {
      onSuccess: () => {
        showNotification('Mapping deleted successfully!', 'success');
        setIsDeleteOpen(false);
        setMappingToDelete(null);
      },
      onError: (err) => {
        showNotification(err.response?.data?.message || 'Failed to delete mapping', 'error');
      }
    });
  };

  // Filter mappings
  const filteredMappings = useMemo(() => {
    if (!Array.isArray(mappings)) return [];
    return mappings.filter((m) => {
      const session = (sessions || []).find(s => s?.id === m.session_id);
      const course = (courses || []).find(c => c?.id === m.course_id);
      if (!session || session.status !== 'Active' || !course || course.status !== 'Active') return false;

      const sessionName = (session.sessionYear || session.session_year || '').toLowerCase();
      const courseName = (course.name || '').toLowerCase();
      const search = (searchTerm || '').toLowerCase();

      const matchSearch = sessionName.includes(search) || courseName.includes(search);

      const matchStatus =
        statusFilter === 'ALL' || m.status.toUpperCase() === statusFilter;

      const matchSession =
        sessionFilter === 'ALL' || m.session_id === sessionFilter;

      const matchCourse =
        courseFilter === 'ALL' || m.course_id === courseFilter;

      return matchSearch && matchStatus && matchSession && matchCourse;
    });
  }, [mappings, searchTerm, statusFilter, sessionFilter, courseFilter, sessions, courses]);

  const groupedMappings = useMemo(() => {
    // Group by session_id
    const grouped = {};
    filteredMappings.forEach(mapping => {
      if (!grouped[mapping.session_id]) {
        grouped[mapping.session_id] = [];
      }
      grouped[mapping.session_id].push(mapping);
    });

    // Return as array of groups sorted by session year (descending usually makes sense, but we'll sort by string for now)
    return Object.keys(grouped)
      .map(sessionId => ({
        sessionId,
        sessionName: getSessionName(sessionId),
        mappings: grouped[sessionId]
      }))
      .sort((a, b) => b.sessionName.localeCompare(a.sessionName));
  }, [filteredMappings, sessions]);

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {/* Empty Dependency Alert */}
      {isLoadingSessions || isLoadingCourses ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500">Loading dependencies...</p>
        </div>
      ) : (sessions.length === 0 || courses.length === 0) ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-full text-amber-500 mb-4">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Master Data Required</h3>
          <p className="text-slate-400 dark:text-slate-400 max-w-md mt-2 text-sm leading-relaxed">
            You must have at least one Session and one Course created before you can set up mappings.
          </p>
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab('sessions')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer text-sm"
            >
              Go to Sessions
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer text-sm"
            >
              Go to Courses
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Header Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-blue-700 to-sky-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-600/10">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
                <LinkIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Session Mapping</h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
                  Map courses to academic sessions to configure the active curriculum.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="flex items-center gap-1 bg-white/10 border border-white/20 p-1 rounded-xl shadow-sm">
                <button
                  onClick={handleExpandAll}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white/90 hover:text-white rounded-lg hover:bg-white/20 transition-all cursor-pointer"
                  title="Expand All Accordions"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Expand All
                </button>
                <button
                  onClick={handleCollapseAll}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white/90 hover:text-white rounded-lg hover:bg-white/20 transition-all cursor-pointer"
                  title="Collapse All Accordions"
                >
                  <Minimize2 className="w-3.5 h-3.5" /> Collapse All
                </button>
              </div>
              <button
                onClick={() => handleCreateOpen()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 font-bold rounded-xl transition-all shadow-md cursor-pointer text-sm"
              >
                <Plus className="w-4 h-4" /> Create Mapping
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-blue-100/80 dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-slate-800 shadow-xs max-w-full overflow-hidden">
            {/* Search */}
            <div className="relative w-full xl:w-80 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Session or Course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-950/40 border border-white/60 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-white placeholder:text-slate-400 shadow-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              {/* Session Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">Session:</span>
                <select
                  value={sessionFilter}
                  onChange={(e) => setSessionFilter(e.target.value)}
                  className="flex-1 sm:flex-none max-w-[160px] truncate pl-3.5 pr-8 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-white/60 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                >
                  <option value="ALL">All Sessions</option>
                  {sessions.filter(s => s.status === 'Active').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.sessionYear}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">Course:</span>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="flex-1 sm:flex-none max-w-[170px] truncate pl-3.5 pr-8 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-white/60 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                >
                  <option value="ALL">All Courses</option>
                  {courses.filter(c => c.status === 'Active').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
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

          {/* Accordion List Section */}
          <div className="space-y-4">
            {isLoadingMappings ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-10 text-center">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
                <p className="mt-2 text-sm text-slate-500">Loading mappings...</p>
              </div>
            ) : groupedMappings.length > 0 ? (
              groupedMappings.map((group) => {
                const isExpanded = expandedGroups[group.sessionId] ?? true; // Default expanded
                const totalCourses = group.mappings.length;
                const activeCourses = group.mappings.filter(m => m.status === 'Active').length;

                return (
                  <div key={group.sessionId} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-200">
                    {/* Accordion Header */}
                    <div
                      onClick={() => toggleGroup(group.sessionId)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors select-none group/header"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                              {group.sessionName}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Academic Session Mapping
                            </p>
                          </div>

                          <div onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleCreateOpen(group.sessionId)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200/60 dark:border-blue-800/60 transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Course
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                        <div className="hidden sm:flex items-center gap-2">
                          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-900/40">
                            Total Courses: {totalCourses}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                            Active: {activeCourses}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Accordion Body */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {group.mappings.map(mapping => (
                            <div key={mapping.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors group/card">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <BookOpen className="w-4 h-4" />
                                  </div>
                                  <h4 className="font-semibold text-slate-800 dark:text-white line-clamp-1" title={getCourseName(mapping.course_id)}>
                                    {getCourseName(mapping.course_id)}
                                  </h4>
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2 flex-wrap flex-1 mr-2 overflow-hidden">
                                  <span className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${mapping.status === 'Active'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                    }`}>
                                    {mapping.status === 'Active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    {mapping.status}
                                  </span>

                                  {mapping.courseDuration && mapping.courseType && (
                                    <span className="inline-flex shrink-0 items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                                      Duration: {mapping.courseDuration} {mapping.courseType === 'Semester Wise' ? 'Sem' : 'Year'}
                                    </span>
                                  )}

                                  {Array.isArray(mapping.minor_course_subject_ids) && mapping.minor_course_subject_ids.length > 0 ? (
                                    (() => {
                                      const summary = getMinorSelectionSummary(mapping.minor_course_subject_ids, courses, mapping.course_id);
                                      return summary.map((item, idx) => (
                                        item.type === 'group' ? (
                                          <span key={`group-${idx}`} className="inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50" title={`${item.label} (${item.count} courses)`}>
                                            Minor: {item.label}
                                          </span>
                                        ) : (
                                          <span key={item.id} className="inline-flex shrink-0 items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 max-w-[150px] truncate" title={item.name}>
                                            Minor: {item.name}
                                          </span>
                                        )
                                      ));
                                    })()
                                  ) : (
                                    <span className="inline-flex shrink-0 items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
                                      No Minors
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleEditOpen(mapping)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                                    title="Edit Mapping"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOpen(mapping)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                                    title="Delete Mapping"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-10 text-center text-slate-400 dark:text-slate-500">
                No Session Course Mappings Found. Click "Create Mapping" to add your first mapping.
              </div>
            )}
          </div>

          {/* Add/Edit Modal */}
          <Modal
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            title={editingMapping ? 'Edit Mapping Details' : 'Add Session Course Mapping'}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General Error Message */}
              {errors.general && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/40 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.general}
                </div>
              )}

              {/* Session Dropdown */}
              <div className="space-y-1">
                <label htmlFor="sessionId" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Session
                </label>
                <div className="relative" ref={sessionDropdownRef}>
                  <div
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${errors.sessionId ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                      } rounded-xl focus:outline-none focus:ring-2 dark:text-white cursor-pointer flex justify-between items-center`}
                    onClick={() => {
                      setIsSessionDropdownOpen(!isSessionDropdownOpen);
                      if (!isSessionDropdownOpen) setSessionSearchTerm('');
                    }}
                  >
                    <span className={formData.sessionId ? 'text-slate-800 dark:text-white' : 'text-slate-400'}>
                      {formData.sessionId
                        ? (() => {
                          const s = sessions.find(s => s.id === formData.sessionId);
                          return s ? s.sessionYear : 'Select a Session';
                        })()
                        : 'Select a Session'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>

                  {isSessionDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search sessions..."
                            value={sessionSearchTerm}
                            onChange={(e) => setSessionSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 dark:text-white placeholder:text-slate-400"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto">
                        {filteredSessionsDropdown.length > 0 ? (
                          filteredSessionsDropdown.map((s) => (
                            <div
                              key={s.id}
                              className={`px-3.5 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${formData.sessionId === s.id ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-200'
                                }`}
                              onClick={() => {
                                handleInputChange({ target: { name: 'sessionId', value: s.id } });
                                setIsSessionDropdownOpen(false);
                              }}
                            >
                              {s.sessionYear}
                            </div>
                          ))
                        ) : (
                          <div className="px-3.5 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                            No active sessions found.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {errors.sessionId && (
                  <p className="text-red-500 text-xs mt-1">{errors.sessionId}</p>
                )}
              </div>

              {/* Course Dropdown */}
              <div className="space-y-1">
                <label htmlFor="courseId" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Course
                </label>
                <div className="relative" ref={courseDropdownRef}>
                  <div
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${errors.courseId ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                      } rounded-xl focus:outline-none focus:ring-2 dark:text-white cursor-pointer flex justify-between items-center`}
                    onClick={() => {
                      setIsCourseDropdownOpen(!isCourseDropdownOpen);
                      if (!isCourseDropdownOpen) setCourseSearchTerm('');
                    }}
                  >
                    <span className={formData.courseId ? 'text-slate-800 dark:text-white' : 'text-slate-400'}>
                      {formData.courseId
                        ? (() => {
                          const c = courses.find(c => c.id === formData.courseId);
                          return c ? `${c.name} (${c.code})` : 'Select a Course';
                        })()
                        : 'Select a Course'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>

                  {isCourseDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search courses..."
                            value={courseSearchTerm}
                            onChange={(e) => setCourseSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 dark:text-white placeholder:text-slate-400"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto">
                        {filteredCoursesDropdown.length > 0 ? (
                          filteredCoursesDropdown.map((c) => (
                            <div
                              key={c.id}
                              className={`px-3.5 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${formData.courseId === c.id ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-200'
                                }`}
                              onClick={() => {
                                handleInputChange({ target: { name: 'courseId', value: c.id } });
                                setIsCourseDropdownOpen(false);
                              }}
                            >
                              {c.name} <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">({c.code})</span>
                            </div>
                          ))
                        ) : (
                          <div className="px-3.5 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                            No active courses found.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {errors.courseId && (
                  <p className="text-red-500 text-xs mt-1">{errors.courseId}</p>
                )}
              </div>

              {/* Faculty Dropdown */}
              <div className="space-y-1">
                <label htmlFor="facultyId" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Faculty
                </label>
                <div className="relative" ref={facultyDropdownRef}>
                  <div
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600 rounded-xl focus:outline-none focus:ring-2 dark:text-white cursor-pointer flex justify-between items-center`}
                    onClick={() => {
                      setIsFacultyDropdownOpen(!isFacultyDropdownOpen);
                      if (!isFacultyDropdownOpen) setFacultySearchTerm('');
                    }}
                  >
                    <span className={formData.facultyId ? 'text-slate-800 dark:text-white' : 'text-slate-400'}>
                      {formData.facultyId
                        ? (() => {
                          const f = faculties.find(f => f.id === formData.facultyId);
                          return f ? `${f.name} (${f.code})` : 'Select a Faculty';
                        })()
                        : 'Select a Faculty'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>

                  {isFacultyDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search faculties..."
                            value={facultySearchTerm}
                            onChange={(e) => setFacultySearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 dark:text-white placeholder:text-slate-400"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto">
                        <div
                          className={`px-3.5 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${formData.facultyId === '' ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-200'
                            }`}
                          onClick={() => {
                            handleInputChange({ target: { name: 'facultyId', value: '' } });
                            setIsFacultyDropdownOpen(false);
                          }}
                        >
                          -- No Faculty --
                        </div>
                        {filteredFacultiesDropdown.length > 0 ? (
                          filteredFacultiesDropdown.map((f) => (
                            <div
                              key={f.id}
                              className={`px-3.5 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${formData.facultyId === f.id ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-200'
                                }`}
                              onClick={() => {
                                handleInputChange({ target: { name: 'facultyId', value: f.id } });
                                setIsFacultyDropdownOpen(false);
                              }}
                            >
                              {f.name} <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">({f.code})</span>
                            </div>
                          ))
                        ) : (
                          <div className="px-3.5 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                            No active faculties found.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Minor Subject Course Dropdown */}
              <div className="space-y-1">
                <label htmlFor="minorCourseSubjectId" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Minor Subject Course
                </label>
                <div className="relative" ref={minorSubjectDropdownRef}>
                  <div
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600 rounded-xl focus:outline-none focus:ring-2 dark:text-white cursor-pointer flex justify-between items-center`}
                    onClick={() => {
                      setIsMinorSubjectDropdownOpen(!isMinorSubjectDropdownOpen);
                      if (!isMinorSubjectDropdownOpen) setMinorSubjectSearchTerm('');
                    }}
                  >
                    <span className={formData.minorCourseSubjectIds.length > 0 ? 'text-slate-800 dark:text-white font-medium' : 'text-slate-400'}>
                      {formData.minorCourseSubjectIds.length > 0
                        ? (() => {
                          const summary = getMinorSelectionSummary(formData.minorCourseSubjectIds, courses, formData.courseId);
                          const groupLabels = summary.filter(s => s.type === 'group').map(s => s.label);
                          const individuals = summary.filter(s => s.type === 'individual');
                          const parts = [];
                          if (groupLabels.length > 0) parts.push(groupLabels.join(', '));
                          if (individuals.length > 0 && individuals.length <= 2) {
                            parts.push(individuals.map(s => s.name).join(', '));
                          } else if (individuals.length > 2) {
                            parts.push(`${individuals.length} more course(s)`);
                          }
                          return parts.join(' + ') || `${formData.minorCourseSubjectIds.length} Minor Subject Course(s) Selected`;
                        })()
                        : formData.facultyId
                          ? `Select Minor Courses for ${selectedFacultyObj?.name || selectedFacultyObj?.facultyName || 'Selected Faculty'}`
                          : 'Select Minor Subjects'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>

                  {isMinorSubjectDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-72 overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 space-y-2">
                        {/* Selected Faculty Indicator */}
                        {selectedFacultyObj ? (
                          <div className="px-2.5 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-lg flex items-center justify-between">
                            <span>Showing options for: {selectedFacultyObj.name || selectedFacultyObj.facultyName}</span>
                            <span className="text-[10px] text-blue-500 font-normal">({filteredMinorSubjectsDropdown.length} course(s))</span>
                          </div>
                        ) : (
                          <div className="px-2.5 py-1.5 text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg">
                            Tip: Select a Faculty above to filter course options specifically for that faculty.
                          </div>
                        )}

                        {/* Search Input */}
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search minor courses..."
                            value={minorSubjectSearchTerm}
                            onChange={(e) => setMinorSubjectSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 dark:text-white placeholder:text-slate-400"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>

                        {/* Quick Action Buttons */}
                        {filteredMinorSubjectsDropdown.length > 0 && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={handleSelectAllFiltered}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              + Select All {selectedFacultyObj ? (selectedFacultyObj.name || selectedFacultyObj.facultyName) + ' Courses' : 'Courses'}
                            </button>
                            {formData.minorCourseSubjectIds.length > 0 && (
                              <button
                                type="button"
                                onClick={handleClearAllMinor}
                                className="px-2 py-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                              >
                                Clear All ({formData.minorCourseSubjectIds.length})
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="overflow-y-auto">
                        {filteredMinorSubjectsDropdown.length > 0 ? (
                          filteredMinorSubjectsDropdown.map((c) => {
                            const isSelected = formData.minorCourseSubjectIds.includes(c.id);

                            return (
                              <label
                                key={c.id}
                                className={`px-3.5 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-3 ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                                  }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      setFormData(prev => {
                                        const current = prev.minorCourseSubjectIds || [];
                                        if (e.target.checked) {
                                          return { ...prev, minorCourseSubjectIds: [...current, c.id] };
                                        } else {
                                          return { ...prev, minorCourseSubjectIds: current.filter(id => id !== c.id) };
                                        }
                                      });
                                    }}
                                  />
                                  <div className={isSelected ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-slate-700 dark:text-slate-200'}>
                                    {c.name} <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">({c.code})</span>
                                  </div>
                                </div>
                              </label>
                            );
                          })
                        ) : (
                          <div className="px-3.5 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                            {formData.facultyId ? 'No active courses found for the selected faculty.' : 'No active courses found.'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Course Type */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Course Type
                </label>
                <div className="flex gap-4">
                  <label className="flex-1 flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Semester Wise</span>
                    </div>
                    <input
                      type="radio"
                      name="courseType"
                      value="Semester Wise"
                      checked={formData.courseType === 'Semester Wise'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded-full"
                    />
                  </label>
                  <label className="flex-1 flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Year Wise</span>
                    </div>
                    <input
                      type="radio"
                      name="courseType"
                      value="Year Wise"
                      checked={formData.courseType === 'Year Wise'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded-full"
                    />
                  </label>
                </div>
              </div>

              {/* Calculated Duration Preview */}
              {calculatedDuration && (
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl flex justify-between items-center text-sm">
                  <span className="text-blue-600/80 dark:text-blue-400/80 font-medium">Calculated Duration:</span>
                  <span className="font-bold text-blue-800 dark:text-blue-300">{calculatedDuration} {formData.courseType === 'Semester Wise' ? 'Semesters' : 'Years'}</span>
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-70 flex items-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingMapping ? 'Save Changes' : 'Create Mapping'}
                </button>
              </div>
            </form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <ConfirmModal
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleDeleteConfirm}
            title="Delete Mapping"
            message={`Are you sure you want to delete this mapping? This action cannot be undone.`}
          />
        </>
      )}
    </div>
  );
}
