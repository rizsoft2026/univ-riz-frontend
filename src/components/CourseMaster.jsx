import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, GraduationCap, CheckCircle, XCircle, AlertCircle, ArrowRight, Loader2, ChevronDown } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from '../hooks/useCourses';
import { useSubjectGroups } from '../hooks/useSubjectGroups';
import { useFaculties } from '../hooks/useFaculties';
import { useOnClickOutside } from 'usehooks-ts';

export default function CourseMaster({ setActiveTab, showNotification }) {
  // Fetch data using React Query
  const { data: courses = [], isLoading: isLoadingCourses } = useCourses();
  const { data: subjectGroups = [], isLoading: isLoadingGroups } = useSubjectGroups();
  const { data: faculties = [], isLoading: isLoadingFaculties } = useFaculties();
  
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [facultyFilter, setFacultyFilter] = useState('ALL');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    courseFullName: '',
    subjectGroupId: '',
    facultyId: '',
    status: 'Active',
  });
  const [errors, setErrors] = useState({});

  // Dropdown states
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const dropdownRef = React.useRef(null);
  useOnClickOutside(dropdownRef, () => setIsGroupDropdownOpen(false));

  const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState(false);
  const [facultySearchTerm, setFacultySearchTerm] = useState('');
  const facultyDropdownRef = React.useRef(null);
  useOnClickOutside(facultyDropdownRef, () => setIsFacultyDropdownOpen(false));

  const filteredDropdownGroups = useMemo(() => {
    if (!Array.isArray(subjectGroups)) return [];
    return subjectGroups.filter(g => 
      g && (g.name || '').toLowerCase().includes((groupSearchTerm || '').toLowerCase()) || 
      (g.code || '').toLowerCase().includes((groupSearchTerm || '').toLowerCase())
    );
  }, [subjectGroups, groupSearchTerm]);

  const filteredDropdownFaculties = useMemo(() => {
    if (!Array.isArray(faculties)) return [];
    return faculties.filter(f => 
      f && (f.name || '').toLowerCase().includes((facultySearchTerm || '').toLowerCase()) || 
      (f.code || '').toLowerCase().includes((facultySearchTerm || '').toLowerCase())
    );
  }, [faculties, facultySearchTerm]);

  // Helper to map subjectGroupId to Group Name
  const getSubjectGroupName = (groupId) => {
    const group = subjectGroups.find((g) => g.id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  // Helper to map subjectGroupId to Group Code
  const getSubjectGroupCode = (groupId) => {
    const group = subjectGroups.find((g) => g.id === groupId);
    return group ? group.code : '—';
  };

  const getFacultyName = (facId) => {
    const fac = faculties.find((f) => f.id === facId);
    return fac ? fac.code : '—';
  };

  // Handle opening form for Create
  const handleCreateOpen = () => {
    if (subjectGroups.length === 0) {
      showNotification('You must create a Subject Group before creating a course.', 'warning');
      return;
    }
    
    setEditingCourse(null);
    setFormData({
      code: '',
      name: '',
      courseFullName: '',
      subjectGroupId: subjectGroups[0]?.id || '',
      facultyId: '',
      status: 'Active',
    });
    setErrors({});
    setIsFormOpen(true);
  };

  // Handle opening form for Edit
  const handleEditOpen = (course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      courseFullName: course.course_full_name || '',
      subjectGroupId: course.subject_group_id,
      facultyId: course.faculty_id || '',
      status: course.status,
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'code') {
      // Auto uppercase code and replace spaces with hyphens/remove special chars
      value = value.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9\-]/g, '');
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validate form
  const validateForm = () => {
    const tempErrors = {};
    const codePattern = /^[A-Z0-9\-]{2,20}$/;

    if (!formData.code) {
      tempErrors.code = 'Course Code is required';
    } else if (!codePattern.test(formData.code)) {
      tempErrors.code = 'Code must be 2-20 characters (alphanumeric and hyphens only)';
    }

    if (!formData.name) {
      tempErrors.name = 'Course Name is required';
    } else if (formData.name.trim().length < 3) {
      tempErrors.name = 'Name must be at least 3 characters long';
    }

    if (!formData.subjectGroupId) {
      tempErrors.subjectGroupId = 'Subject Group is required';
    }

    // Check code uniqueness
    const duplicate = (courses || []).find(
      (c) => 
        c && (c.code || '').toUpperCase() === formData.code.toUpperCase() && 
        (!editingCourse || c.id !== editingCourse.id)
    );

    if (duplicate) {
      tempErrors.code = 'This Course Code already exists';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Form Submit (Create/Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingCourse) {
      updateMutation.mutate({
        id: editingCourse.id,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        course_full_name: formData.courseFullName.trim(),
        subject_group_id: formData.subjectGroupId,
        faculty_id: formData.facultyId || null,
        status: formData.status
      }, {
        onSuccess: () => {
          showNotification(`Course "${formData.name}" updated successfully!`, 'success');
          setIsFormOpen(false);
        },
        onError: (err) => {
          showNotification(err.response?.data?.message || 'Failed to update course', 'error');
        }
      });
    } else {
      createMutation.mutate({
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        course_full_name: formData.courseFullName.trim(),
        subject_group_id: formData.subjectGroupId,
        faculty_id: formData.facultyId || null,
        status: formData.status
      }, {
        onSuccess: () => {
          showNotification(`Course "${formData.name}" created successfully!`, 'success');
          setIsFormOpen(false);
        },
        onError: (err) => {
          showNotification(err.response?.data?.message || 'Failed to create course', 'error');
        }
      });
    }
  };

  // Handle Delete Confirmation
  const handleDeleteOpen = (course) => {
    setCourseToDelete(course);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!courseToDelete) return;
    deleteMutation.mutate(courseToDelete.id, {
      onSuccess: () => {
        showNotification(`Course "${courseToDelete.name}" deleted successfully!`, 'success');
        setIsDeleteOpen(false);
        setCourseToDelete(null);
      },
      onError: (err) => {
        showNotification(err.response?.data?.message || 'Failed to delete course', 'error');
      }
    });
  };

  // Filter courses
  const filteredCourses = useMemo(() => {
    if (!Array.isArray(courses)) return [];
    return courses.filter((c) => {
      if (!c) return false;
      const search = (searchTerm || '').toLowerCase();
      const matchSearch =
        (c.code || '').toLowerCase().includes(search) ||
        (c.name || '').toLowerCase().includes(search) ||
        getSubjectGroupName(c.subject_group_id).toLowerCase().includes(search) ||
        (c.faculty_id ? getFacultyName(c.faculty_id).toLowerCase().includes(search) : false);

      const matchStatus =
        statusFilter === 'ALL' || (c.status || '').toUpperCase() === statusFilter;

      const matchGroup =
        groupFilter === 'ALL' || c.subject_group_id === groupFilter;

      const matchFaculty =
        facultyFilter === 'ALL' || c.faculty_id === facultyFilter;

      return matchSearch && matchStatus && matchGroup && matchFaculty;
    });
  }, [courses, searchTerm, statusFilter, groupFilter, facultyFilter, subjectGroups, faculties]);

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {/* If no Subject Groups exist, display a gorgeous empty block/alert page */}
      {isLoadingGroups ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500">Loading dependencies...</p>
        </div>
      ) : subjectGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-full text-amber-500 mb-4">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Subject Groups Needed</h3>
          <p className="text-slate-400 dark:text-slate-400 max-w-md mt-2 text-sm leading-relaxed">
            You must create at least one Subject Group in the **Bucket Subject Group Master** before you can define courses.
          </p>
          <button
            onClick={() => setActiveTab('groups')}
            className="flex items-center justify-center gap-2 mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer text-sm"
          >
            Go to Subject Groups <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Header Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-blue-700 to-sky-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-600/10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Course Master</h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5">Manage curriculum courses and bind them to their corresponding Subject Groups.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={handleCreateOpen}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 font-medium rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4" /> Add Course
            </button>
          
        </div>
      </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-blue-100/80 dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-slate-800 shadow-xs max-w-full overflow-hidden">
            {/* Search */}
            <div className="relative w-full lg:w-80 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by code, course name, group..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-950/40 border border-white/60 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-white placeholder:text-slate-400 shadow-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Subject Group Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">Group:</span>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-white/60 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                >
                  <option value="ALL">All Subject Groups</option>
                  {subjectGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Faculty Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">Faculty:</span>
                <select
                  value={facultyFilter}
                  onChange={(e) => setFacultyFilter(e.target.value)}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-white/60 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                >
                  <option value="ALL">All Faculties</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.code} ({f.name})
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
                    <th scope="col" className="px-6 py-4">COURSE CODE</th>
                    <th scope="col" className="px-6 py-4">COURSE FULL NAME</th>
                    <th scope="col" className="px-6 py-4">COURSE NAME</th>
                    <th scope="col" className="px-6 py-4">SUBJECT GROUP</th>
                    <th scope="col" className="px-6 py-4">FACULTY</th>
                    <th scope="col" className="px-6 py-4">STATUS</th>
                    <th scope="col" className="px-6 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoadingCourses || isLoadingGroups || isLoadingFaculties ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
                        <p className="mt-2 text-sm text-slate-500">Loading courses...</p>
                      </td>
                    </tr>
                  ) : filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => (
                      <tr key={course.id} className="odd:bg-blue-50/40 even:bg-white dark:odd:bg-slate-800/30 dark:even:bg-slate-900 hover:bg-blue-100/50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-mono font-bold rounded-lg text-xs">
                            {course.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {course.course_full_name || '-'}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                          {course.name}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {getSubjectGroupName(course.subject_group_id)}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {getFacultyName(course.faculty_id)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            course.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}>
                            {course.status === 'Active' ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            {course.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => handleEditOpen(course)}
                              className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                              title="Edit Course"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteOpen(course)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                              title="Delete Course"
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
                        No courses found. Try adding a new course or adjusting your filters.
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
            title={editingCourse ? 'Edit Course Details' : 'Add New Course'}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Code */}
              <div className="space-y-1">
                <label htmlFor="code" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Course Code
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g. CS-101"
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${
                    errors.code ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                  } rounded-xl focus:outline-none focus:ring-2 font-mono dark:text-white uppercase`}
                />
                {errors.code ? (
                  <p className="text-red-500 text-xs mt-1">{errors.code}</p>
                ) : (
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">Uppercase letters, numbers, and hyphens only.</p>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label htmlFor="courseFullName" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Course Full Name (Optional)
                </label>
                <input
                  type="text"
                  id="courseFullName"
                  name="courseFullName"
                  value={formData.courseFullName}
                  onChange={handleInputChange}
                  placeholder="e.g. Bachelor of Science"
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600 rounded-xl focus:outline-none focus:ring-2 dark:text-white`}
                />
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label htmlFor="name" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Course Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. BSc"
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${
                    errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                  } rounded-xl focus:outline-none focus:ring-2 dark:text-white`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Subject Group Dropdown */}
              <div className="space-y-1">
                <label htmlFor="subjectGroupId" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Subject Group
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${
                      errors.subjectGroupId ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                    } rounded-xl focus:outline-none focus:ring-2 dark:text-white cursor-pointer flex justify-between items-center`}
                    onClick={() => {
                      setIsGroupDropdownOpen(!isGroupDropdownOpen);
                      if (!isGroupDropdownOpen) setGroupSearchTerm('');
                    }}
                  >
                    <span className={formData.subjectGroupId ? 'text-slate-800 dark:text-white' : 'text-slate-400'}>
                      {formData.subjectGroupId 
                        ? (() => {
                            const g = subjectGroups.find(g => g.id === formData.subjectGroupId);
                            return g ? `${g.name} (${g.code})` : 'Select Subject Group';
                          })()
                        : 'Select Subject Group'}
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
                        {filteredDropdownGroups.length > 0 ? (
                          filteredDropdownGroups.map((g) => (
                            <div
                              key={g.id}
                              className={`px-3.5 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                                formData.subjectGroupId === g.id ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-200'
                              }`}
                              onClick={() => {
                                handleInputChange({ target: { name: 'subjectGroupId', value: g.id } });
                                setIsGroupDropdownOpen(false);
                              }}
                            >
                              {g.name} <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">({g.code})</span>
                            </div>
                          ))
                        ) : (
                          <div className="px-3.5 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                            No subject groups found.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {errors.subjectGroupId && (
                  <p className="text-red-500 text-xs mt-1">{errors.subjectGroupId}</p>
                )}
              </div>

              {/* Faculty Dropdown (Optional) */}
              <div className="space-y-1">
                <label htmlFor="facultyId" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Faculty (Optional)
                </label>
                <div className="relative" ref={facultyDropdownRef}>
                  <div
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white cursor-pointer flex justify-between items-center"
                    onClick={() => {
                      setIsFacultyDropdownOpen(!isFacultyDropdownOpen);
                      if (!isFacultyDropdownOpen) setFacultySearchTerm('');
                    }}
                  >
                    <span className={formData.facultyId ? 'text-slate-800 dark:text-white' : 'text-slate-400'}>
                      {formData.facultyId 
                        ? (() => {
                            const f = faculties.find(fac => fac.id === formData.facultyId);
                            return f ? `${f.code} (${f.name})` : 'Select Faculty';
                          })()
                        : 'Select Faculty (Optional)'}
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
                          className="px-3.5 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500 italic"
                          onClick={() => {
                            handleInputChange({ target: { name: 'facultyId', value: '' } });
                            setIsFacultyDropdownOpen(false);
                          }}
                        >
                          None (No Faculty)
                        </div>
                        {filteredDropdownFaculties.length > 0 ? (
                          filteredDropdownFaculties.map((f) => (
                            <div
                              key={f.id}
                              className={`px-3.5 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                                formData.facultyId === f.id ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-200'
                              }`}
                              onClick={() => {
                                handleInputChange({ target: { name: 'facultyId', value: f.id } });
                                setIsFacultyDropdownOpen(false);
                              }}
                            >
                              {f.code} <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">({f.name})</span>
                            </div>
                          ))
                        ) : (
                          <div className="px-3.5 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                            No faculties found.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
                  {editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <ConfirmModal
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleDeleteConfirm}
            title="Delete Course"
            message={`Are you sure you want to delete course "${courseToDelete?.name}"? This action cannot be undone.`}
          />
        </>
      )}
    </div>
  );
}
