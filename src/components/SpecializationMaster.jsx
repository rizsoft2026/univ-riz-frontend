import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, BookOpen, CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { useSpecializations, useCreateSpecialization, useUpdateSpecialization, useDeleteSpecialization } from '../hooks/useSpecializations';
import { useCourses, useUpdateCourse, useDeleteCourse } from '../hooks/useCourses';
import { useQueryClient } from '@tanstack/react-query';

export default function SpecializationMaster({ showNotification }) {
  const { data: specializations = [], isLoading } = useSpecializations();
  const queryClient = useQueryClient();
  const { data: courses = [] } = useCourses();
  const updateCourseMutation = useUpdateCourse();
  const deleteCourseMutation = useDeleteCourse();
  
  const createMutation = useCreateSpecialization();
  const updateMutation = useUpdateSpecialization();
  const deleteMutation = useDeleteSpecialization();
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteCourseOpen, setIsDeleteCourseOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseFormData, setCourseFormData] = useState({ status: 'Active' });
  const [editingSpec, setEditingSpec] = useState(null);
  const [specToDelete, setSpecToDelete] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    courseId: '',
    code: '',
    specializations: [],
    status: 'Active',
  });
  const [currentName, setCurrentName] = useState('');
  const [errors, setErrors] = useState({});

  // Handle opening form for Create
  const handleCreateOpen = () => {
    setEditingSpec(null);
    setFormData({
      courseId: '',
      code: '',
      specializations: [],
      status: 'Active',
    });
    setCurrentName('');
    setErrors({});
    setIsFormOpen(true);
  };

  const handleAddForCourse = (specs) => {
    setEditingSpec(null);
    const courseId = specs[0]?.course_id || '';
    setFormData({
      courseId: courseId,
      code: '',
      specializations: [],
      status: 'Active'
    });
    setErrors({});
    setCurrentName('');
    setIsFormOpen(true);
  };

  // Handle opening form for Edit
  const handleEditOpen = (spec) => {
    setEditingSpec(spec);
    setFormData({
      courseId: spec.course_id || '',
      code: spec.code || '',
      specializations: [spec.name],
      status: spec.status,
    });
    setCurrentName('');
    setErrors({});
    setIsFormOpen(true);
  };

  const handleGlobalInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'code') {
      value = value.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9\-]/g, '');
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddChip = () => {
    const trimmed = currentName.trim();
    if (!trimmed) return;
    
    // Validate uniqueness locally before adding
    if (formData.specializations.find(name => name.toUpperCase() === trimmed.toUpperCase())) {
      setErrors(prev => ({ ...prev, currentName: 'This specialization name is already added' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      specializations: [...prev.specializations, trimmed]
    }));
    setCurrentName('');
    setErrors(prev => ({ ...prev, currentName: null }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddChip();
    }
  };

  const removeChip = (index) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
    }));
  };

  // Validate form
  const validateForm = () => {
    const tempErrors = {};
    const codePattern = /^[A-Z0-9\-]{2,20}$/;

    if (!formData.courseId) {
      tempErrors.courseId = 'Course is required';
    }

    if (!formData.code) {
      tempErrors.code = 'Specialization Code is required';
    } else if (!codePattern.test(formData.code)) {
      tempErrors.code = 'Code must be 2-20 characters (alphanumeric and hyphens only)';
    }

    if (formData.specializations.length === 0) {
      if (!currentName.trim()) {
        tempErrors.currentName = 'Add at least one specialization name';
      } else {
        // Automatically add if they forgot to hit Add but typed something
        handleAddChip();
      }
    } else {
      formData.specializations.forEach((name, index) => {
        if (name.trim().length < 3) {
          tempErrors[`name_${index}`] = 'Names must be at least 3 characters';
        } else {
          // Check global duplicate name
          const isGlobalDuplicate = (specializations || []).find(
            (s) =>
              s && (s.name || '').toUpperCase() === name.toUpperCase() &&
              (!editingSpec || s.id !== editingSpec.id)
          );
          if (isGlobalDuplicate) {
            tempErrors[`name_${index}`] = `'${name}' already exists in database`;
          }
        }
      });
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Form Submit (Create/Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingSpec) {
        // Update
        const name = formData.specializations[0] || currentName;
        await updateMutation.mutateAsync({
          id: editingSpec.id,
          code: formData.code.trim().toUpperCase(),
          name: name.trim(),
          description: editingSpec.description || '', // Preserve existing description
          courseId: formData.courseId,
          status: formData.status,
        });
        showNotification(`Specialization updated successfully!`, 'success');
      } else {
        // Create
        // Ensure any pending text in currentName is added
        let finalSpecs = [...formData.specializations];
        if (currentName.trim()) {
           finalSpecs.push(currentName.trim());
        }
        
        const payloadSpecs = finalSpecs.map(name => ({
          name: name,
          description: '',
        }));
        await createMutation.mutateAsync({
          courseId: formData.courseId,
          code: formData.code.trim().toUpperCase(),
          specializations: payloadSpecs,
          status: formData.status,
        });
        showNotification(`Specializations created successfully!`, 'success');
      }
      setIsFormOpen(false);
    } catch (error) {
      showNotification(error.response?.data?.message || 'An error occurred while saving the specialization', 'error');
    }
  };

  // Handle Delete Confirmation
  const handleDeleteOpen = (spec) => {
    setSpecToDelete(spec);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!specToDelete) return;

    try {
      await deleteMutation.mutateAsync(specToDelete.id);
      showNotification(`Specialization "${specToDelete.name}" deleted successfully!`, 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to delete specialization.', 'error');
    }

    setSpecToDelete(null);
    setIsDeleteOpen(false);
  };

  const handleDeleteCourseConfirm = async () => {
    if (!courseToDelete) return;
    try {
      const courseId = courseToDelete.specs[0]?.course_id;
      if (courseId) {
        await deleteCourseMutation.mutateAsync(courseId);
        queryClient.invalidateQueries({ queryKey: ['specializations'] });
        showNotification(`Course "${courseToDelete.courseName}" deleted successfully!`, 'success');
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to delete course.', 'error');
    }
    setCourseToDelete(null);
    setIsDeleteCourseOpen(false);
  };

  const handleEditCourseOpen = (spec) => {
    if (!spec.course_id) return;
    const course = courses.find(c => c.id === spec.course_id);
    if (!course) return;
    setEditingCourse(course);
    setCourseFormData({ status: course.status || 'Active' });
    setIsEditCourseOpen(true);
  };

  const submitEditCourse = async () => {
    if (!editingCourse) return;
    try {
      await updateCourseMutation.mutateAsync({
        id: editingCourse.id,
        code: editingCourse.code,
        name: editingCourse.name,
        subject_group_id: editingCourse.subject_group_id,
        faculty_id: editingCourse.faculty_id,
        status: courseFormData.status
      });
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      showNotification(`Course ${editingCourse.name} status updated to ${courseFormData.status}!`, 'success');
      setIsEditCourseOpen(false);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to update course.', 'error');
    }
  };

  // Filter specializations
  const filteredSpecs = useMemo(() => {
    if (!Array.isArray(specializations)) return [];
    return specializations.filter((s) => {
      if (!s) return false;
      const search = (searchTerm || '').toLowerCase();
      const matchSearch =
        (s.code || '').toLowerCase().includes(search) ||
        (s.name || '').toLowerCase().includes(search) ||
        (s.description && s.description.toLowerCase().includes(search));

      const specStatus = (s.status || '').toUpperCase();
      const courseStatus = (s.course?.status || '').toUpperCase();
      
      const matchStatus =
        statusFilter === 'ALL' || 
        specStatus === statusFilter || 
        courseStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [specializations, searchTerm, statusFilter]);

  const groupedSpecs = useMemo(() => {
    const groups = {};
    filteredSpecs.forEach(spec => {
      const courseKey = spec.course ? `${spec.course.code} - ${spec.course.name}` : 'Unassigned Course';
      if (!groups[courseKey]) groups[courseKey] = [];
      groups[courseKey].push(spec);
    });
    return groups;
  }, [filteredSpecs]);

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {/* Header Box */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-blue-700 to-sky-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-600/10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Specialization Master</h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5">Define specialization subjects for academic curricula.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
        <button
          onClick={handleCreateOpen}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 font-medium rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" /> Add Specialization
        </button>
      
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-blue-100/80 dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-slate-800 shadow-xs max-w-full overflow-hidden">
        {/* Search */}
        <div className="relative w-full sm:w-80 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code, name, description..."
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

      {/* Grid Layout Section */}
      <div className="space-y-8 mt-6">
        {isLoading ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Loading Specializations...</p>
          </div>
        ) : Object.keys(groupedSpecs).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(groupedSpecs).map(([courseName, specs]) => (
              <div 
                key={courseName} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Course Header */}
                <div className="bg-slate-50 dark:bg-slate-800/50 flex flex-col">
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 leading-tight">
                            {courseName.includes('-') ? courseName.split('-')[1].trim() : courseName}
                          </h3>
                          {specs[0]?.course?.status && (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${specs[0].course.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                              {specs[0].course.status === 'Active' ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                          {courseName.includes('-') ? courseName.split('-')[0].trim() : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1 p-4 pt-0 w-full">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditCourseOpen(specs[0])}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all shadow-sm flex items-center gap-1.5"
                        title="Edit Course Status"
                      >
                        <Edit2 className="w-4 h-4" /> <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleAddForCourse(specs)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all shadow-sm flex items-center gap-1.5"
                        title="Add Specialization to this Course"
                      >
                        <Plus className="w-4 h-4" /> <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">Add Spec</span>
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setCourseToDelete({ courseName, specs });
                        setIsDeleteCourseOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all shadow-sm group/del flex items-center gap-1.5"
                      title="Delete this entire course"
                    >
                      <Trash2 className="w-4 h-4 group-hover/del:scale-110 transition-transform" /> <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">Delete Course</span>
                    </button>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
                </div>
                
                {/* Specializations List */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    Specializations
                  </h4>
                  {specs.map((spec) => (
                    <div 
                      key={spec.id}
                      className="group flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-xs shrink-0">
                            {spec.code}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm truncate">
                            {spec.name}
                          </span>
                          {spec.status !== 'Active' && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-500">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditOpen(spec)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteOpen(spec)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-slate-400 dark:text-slate-500">
              No specializations found. Try adding a new specialization or adjusting your filters.
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingSpec ? 'Edit Specialization' : 'Add Specialization'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course (Global) */}
          <div className="space-y-1">
            <label htmlFor="courseId" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Select Course
            </label>
            <select
              id="courseId"
              name="courseId"
              value={formData.courseId}
              onChange={handleGlobalInputChange}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${errors.courseId ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                } rounded-xl focus:outline-none focus:ring-2 dark:text-white appearance-none cursor-pointer`}
            >
              <option value="">-- Select a Course --</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
            {errors.courseId && (
              <p className="text-red-500 text-xs mt-1">{errors.courseId}</p>
            )}
          </div>

          {/* Code (Global) */}
          <div className="space-y-1">
            <label htmlFor="code" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Specialization Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleGlobalInputChange}
              placeholder="e.g. SPEC-AI"
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${errors.code ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                } rounded-xl focus:outline-none focus:ring-2 font-mono dark:text-white uppercase`}
            />
            {errors.code ? (
              <p className="text-red-500 text-xs mt-1">{errors.code}</p>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">Uppercase letters, numbers, and hyphens only.</p>
            )}
          </div>

          {/* Add Specializations (Dynamic) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {editingSpec ? 'Specialization Name' : 'Add Specializations'}
            </label>
            {!editingSpec ? (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type name and click Add..."
                    className={`flex-1 px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${errors.currentName ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                  />
                  <button
                    type="button"
                    onClick={handleAddChip}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
                {errors.currentName && <p className="text-red-500 text-xs mt-1">{errors.currentName}</p>}

                {formData.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 min-h-[60px]">
                    {formData.specializations.map((name, index) => (
                      <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{name}</span>
                        <button
                          type="button"
                          onClick={() => removeChip(index)}
                          className="text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-1">
                <input
                  type="text"
                  value={formData.specializations[0] || currentName}
                  onChange={(e) => setFormData(prev => ({...prev, specializations: [e.target.value]}))}
                  placeholder="e.g. Artificial Intelligence"
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${errors.name_0 ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                />
                {errors.name_0 && <p className="text-red-500 text-xs mt-1">{errors.name_0}</p>}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
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
                  onChange={handleGlobalInputChange}
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
                  onChange={handleGlobalInputChange}
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
              {editingSpec ? 'Save Changes' : 'Create Specialization'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Specialization"
        message={`Are you sure you want to delete specialization "${specToDelete?.name}"? This action cannot be undone.`}
      />

      {/* Edit Course Modal */}
      <Modal
        isOpen={isEditCourseOpen}
        onClose={() => setIsEditCourseOpen(false)}
        title="Edit Course Status"
      >
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Course Name
              </label>
              <div className="px-3.5 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 cursor-not-allowed">
                {editingCourse?.name || ''}
              </div>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Course Status
              </label>
              <div className="flex gap-4">
                <label className="flex-1 flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Active</span>
                  </div>
                  <input
                    type="radio"
                    name="courseStatus"
                    value="Active"
                    checked={courseFormData.status === 'Active'}
                    onChange={() => setCourseFormData({ status: 'Active' })}
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
                    name="courseStatus"
                    value="Inactive"
                    checked={courseFormData.status === 'Inactive'}
                    onChange={() => setCourseFormData({ status: 'Inactive' })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded-full"
                  />
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditCourseOpen(false)}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submitEditCourse}
              disabled={updateCourseMutation?.isPending}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2"
            >
              {updateCourseMutation?.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal (Course) */}
      <ConfirmModal
        isOpen={isDeleteCourseOpen}
        onClose={() => {
          setIsDeleteCourseOpen(false);
          setCourseToDelete(null);
        }}
        onConfirm={handleDeleteCourseConfirm}
        title="Delete Course"
        message={`Are you sure you want to completely delete the course "${courseToDelete?.courseName}" and all of its associated data? This action cannot be undone.`}
        confirmText={deleteCourseMutation?.isPending ? 'Deleting...' : 'Delete Course'}
        isDestructive={true}
      />
    </div>
  );
}
