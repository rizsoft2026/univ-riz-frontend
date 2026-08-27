import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Search, Save, ChevronRight, Eye, Edit2, Trash2, X, Phone, Mail } from 'lucide-react';
import baseApi from '@/services/baseApi';

const generateTempId = (st) => {
  if (!st) return 'N/A';
  const getInitials = (name) => {
    if (!name) return 'UNK';
    const words = name.split(' ').filter(Boolean);
    if (words.length === 1) return name.substring(0, 4).toUpperCase();
    return words.map(w => w[0]).join('').toUpperCase().substring(0, 4);
  };
  const uni = getInitials(st.university);
  const year = st.session_from?.session_year ? st.session_from.session_year.split('-')[0].trim() : 'YYYY';
  const id = st.student_id ? st.student_id.toString().padStart(4, '0') : '0000';

  return `Temp${uni}/${year}/${id}`;
};

export default function EnrollCourse({ showNotification }) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    university: '',
    course_id: '',
    course_ids: [],
    course_specializations: {},
    session_from_id: '',
    session_to_id: '',
    date_of_admission: new Date().toISOString().split('T')[0],
    last_qualification: '',
    last_qualification_level: '',
    year_of_passing_last_qualification: new Date().getFullYear().toString(),
    last_institute_name: ''
  });
  const [errors, setErrors] = useState({});

  // Queries
  const { data: studentProfiles = [] } = useQuery({
    queryKey: ['student-profiles'],
    queryFn: async () => {
      const res = await baseApi.get('/student-profiles');
      return res.data?.data || [];
    }
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await baseApi.get('/courses');
      return res.data?.data || [];
    }
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await baseApi.get('/sessions');
      return res.data?.data || [];
    }
  });

  const { data: sessionCourseMappings = [] } = useQuery({
    queryKey: ['sessionCourseMappings'],
    queryFn: async () => {
      const res = await baseApi.get('/session-course-mappings');
      return res.data?.data || [];
    }
  });

  const { data: specializations = [] } = useQuery({
    queryKey: ['specializations'],
    queryFn: async () => {
      const res = await baseApi.get('/specializations');
      return res.data?.data || [];
    }
  });

  const availableCourses = React.useMemo(() => {
    if (!formData.session_from_id) return [];
    
    const mappedCourseIds = new Set(
      sessionCourseMappings
        .filter(m => (m.session_id?.toString() || m.session_id) === formData.session_from_id?.toString())
        .map(m => m.course_id?.toString() || m.course_id)
    );

    return courses.filter(c => mappedCourseIds.has(c.course_id?.toString() || c.id?.toString()));
  }, [courses, sessionCourseMappings, formData.session_from_id]);

  const availableSpecializations = React.useMemo(() => {
    if (!formData.course_ids || formData.course_ids.length === 0) return [];
    return specializations.filter(s => formData.course_ids.includes(s.course_id?.toString() || s.id?.toString()));
  }, [specializations, formData.course_ids]);

  // Unique sessions
  const uniqueSessionFroms = sessions.filter(
    (s, i, self) => i === self.findIndex((t) => t.session_id === s.session_id)
  );
  const uniqueSessionTos = uniqueSessionFroms;

  const filteredStudents = studentProfiles.filter(s => {
    // Only show students who have saved academic details
    const hasAcademicDetails = s.university && s.course_id;
    if (!hasAcademicDetails) return false;

    const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    const sid = s.student_id ? String(s.student_id) : '';
    const tempId = generateTempId(s, courses).toLowerCase();
    const st = searchTerm.toLowerCase();
    return name.includes(st) || sid.includes(st) || tempId.includes(st);
  });

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setFormData({
      university: student.university || '',
      course_id: student.course_id?.toString() || '',
      course_ids: Array.isArray(student.course_ids) ? student.course_ids.map(c => {
        if (typeof c === 'object' && c !== null) {
          return (c.course_id?.course_id || c.course_id || c.id || '').toString();
        }
        return c?.toString() || '';
      }).filter(Boolean) : (student.course_id ? [student.course_id.toString()].filter(Boolean) : []),
      course_specializations: Array.isArray(student.course_ids) ? student.course_ids.reduce((acc, c) => {
        if (typeof c === 'object' && c !== null) {
          const cId = (c.course_id?.course_id || c.course_id || c.id)?.toString();
          const sId = (c.course_id?.specialization_id || c.specialization_id)?.toString();
          if (cId && sId) acc[cId] = sId;
        }
        return acc;
      }, {}) : {},
      session_from_id: student.session_from_id || '',
      session_to_id: student.session_to_id || '',
      date_of_admission: student.date_of_admission ? new Date(student.date_of_admission).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      last_qualification: student.last_qualification || '',
      last_qualification_level: student.last_qualification_level || '',
      year_of_passing_last_qualification: student.year_of_passing_last_qualification || new Date().getFullYear().toString(),
      last_institute_name: student.last_institute_name || ''
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.university) errs.university = true;
    if (!formData.course_ids || formData.course_ids.length === 0) errs.course_id = true;
    if (!formData.session_from_id) errs.session_from_id = true;
    if (!formData.session_to_id) errs.session_to_id = true;
    if (!formData.date_of_admission) errs.date_of_admission = true;
    if (!formData.last_qualification) errs.last_qualification = true;
    if (!formData.last_qualification_level) errs.last_qualification_level = true;
    if (!formData.year_of_passing_last_qualification) errs.year_of_passing_last_qualification = true;
    if (!formData.last_institute_name) errs.last_institute_name = true;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      // Re-fetch full student to not overwrite anything
      const studentRes = await baseApi.get(`/student-profiles/${payload.id}`);
      const currentStudent = studentRes.data?.data;
      if (!currentStudent) throw new Error('Student not found');

      const formDataToSend = new FormData();
      // Force status to Pending when enrolling/updating courses so they must be re-verified
      const updatedData = { ...currentStudent, ...payload.data, status: 'Pending' };

      if (updatedData.course_ids && Array.isArray(updatedData.course_ids)) {
        updatedData.course_ids = updatedData.course_ids.map(id => {
          let cId = id;
          if (typeof id === 'object' && id !== null) {
            cId = id.course_id?.course_id || id.course_id || id.id || id;
          }
          if (typeof cId === 'object' && cId !== null) {
            cId = cId.course_id || cId;
          }
          cId = cId?.toString() || '';
          
          const sId = updatedData.course_specializations?.[cId] || 
                     (typeof id === 'object' && id !== null ? (id.course_id?.specialization_id || id.specialization_id) : null) || 
                     null;
                     
          return {
            course_id: cId,
            specialization_id: sId
          };
        });
        
        if (updatedData.course_ids.length > 0) {
          updatedData.course_id = updatedData.course_ids[0].course_id;
          updatedData.specialization_id = updatedData.course_ids[0].specialization_id || null;
        } else {
          updatedData.course_id = null;
          updatedData.specialization_id = null;
        }
      }

      // Ensure we don't send files as strings if they are URLs
      const keysToSkip = ['student_photo', 'student_signature', 'marksheet_10th', 'marksheet_12th', 'marksheet_diploma', 'marksheet_ug', 'marksheet_pg', 'migration_10th', 'migration_12th', 'migration_diploma', 'migration_ug', 'migration_pg'];

      Object.keys(updatedData).forEach((key) => {
        if (updatedData[key] !== null && updatedData[key] !== undefined && !keysToSkip.includes(key)) {
          // Handle objects/arrays correctly
          if (typeof updatedData[key] === 'object' && (key === 'academic_records' || key === 'course_ids')) {
            formDataToSend.append(key, JSON.stringify(updatedData[key]));
          } else if (typeof updatedData[key] !== 'object') {
            formDataToSend.append(key, updatedData[key]);
          }
        }
      });

      return baseApi.put(`/student-profiles/${payload.id}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      showNotification('Student admission details updated successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['student-profiles'] });
      setSelectedStudent(null);
      setIsFormOpen(false);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Error updating student details';
      showNotification(msg, 'error');
    }
  });

  const deleteAcademicMutation = useMutation({
    mutationFn: async (student) => {
      const formDataToSend = new FormData();
      formDataToSend.append('university', '');
      formDataToSend.append('course_id', '');
      formDataToSend.append('session_from_id', '');
      formDataToSend.append('session_to_id', '');
      formDataToSend.append('date_of_admission', '');
      formDataToSend.append('last_qualification', '');
      formDataToSend.append('last_qualification_level', '');
      formDataToSend.append('year_of_passing_last_qualification', '');
      formDataToSend.append('last_institute_name', '');
      formDataToSend.append('status', 'Pending');

      return baseApi.put(`/student-profiles/${student.student_id || student.id}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      showNotification('Academic details deleted successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['student-profiles'] });
      setDeletingStudent(null);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Error deleting academic details';
      showNotification(msg, 'error');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      showNotification('Please select a student first', 'error');
      return;
    }
    if (!validate()) {
      showNotification('Please fill all required fields', 'error');
      return;
    }
    updateMutation.mutate({ id: selectedStudent.student_id || selectedStudent.id, data: formData });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-blue-800 via-blue-700 to-sky-700 text-white p-6 sm:p-8 rounded-3xl overflow-hidden shadow-lg shadow-blue-800/10 border border-blue-900/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 pointer-events-none flex items-center justify-center">
          <BookOpen className="w-64 h-64 transform translate-x-20 translate-y-10" />
        </div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Enroll Course</h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5">Manage admission details for enrolled students</p>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 self-start sm:self-auto">
          {!isFormOpen ? (
            <button
              onClick={() => {
                setIsFormOpen(true);
                setSelectedStudent(null);
                setFormData({
                  university: '',
                  course_id: '',
                  course_ids: [],
                  course_specializations: {},
                  session_from_id: '',
                  session_to_id: '',
                  date_of_admission: new Date().toISOString().split('T')[0],
                  last_qualification: '',
                  last_qualification_level: '',
                  year_of_passing_last_qualification: new Date().getFullYear().toString(),
                  last_institute_name: ''
                });
                setErrors({});
              }}
              className="px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" /> Add Academy Details
            </button>
          ) : (
            <button
              onClick={() => {
                setIsFormOpen(false);
                setSelectedStudent(null);
              }}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl backdrop-blur-xs border border-white/20 transition-all cursor-pointer flex items-center gap-2"
            >
              Back to List
            </button>
          )}
        </div>
      </div>

      {isFormOpen ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {selectedStudent ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center text-lg">
                  {(selectedStudent.first_name?.[0] || '')}{(selectedStudent.last_name?.[0] || '')}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Admission Details</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold flex items-center justify-center text-lg">
                  ?
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">New Admission Details</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select a student to begin</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Select Student <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedStudent?.student_id || selectedStudent?.id || ''}
                onChange={(e) => {
                  const studentId = e.target.value;
                  const student = studentProfiles.find(s => (s.student_id?.toString() || s.id?.toString()) === studentId);
                  if (student) {
                    handleSelectStudent(student);
                  } else {
                    setSelectedStudent(null);
                    setFormData({
                      university: '',
                      course_id: '',
                      session_from_id: '',
                      session_to_id: '',
                      date_of_admission: new Date().toISOString().split('T')[0],
                      last_qualification: '',
                      last_qualification_level: '',
                      year_of_passing_last_qualification: new Date().getFullYear().toString(),
                      last_institute_name: ''
                    });
                  }
                }}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white font-medium"
              >
                <option value="">Choose Student...</option>
                {studentProfiles.map(s => (
                  <option key={s.student_id?.toString() || s.id} value={s.student_id?.toString() || s.id}>
                    {s.first_name} {s.last_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedStudent && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Aadhar Number
                    </label>
                    <input
                      type="text"
                      disabled
                      value={selectedStudent.aadhar_number || 'N/A'}
                      className="w-full px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg cursor-not-allowed text-slate-500 dark:text-slate-400 font-medium tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={selectedStudent.email_id || 'N/A'}
                      className="w-full px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg cursor-not-allowed text-slate-500 dark:text-slate-400 font-medium truncate"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      disabled
                      value={selectedStudent.student_phone || 'N/A'}
                      className="w-full px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg cursor-not-allowed text-slate-500 dark:text-slate-400 font-medium tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      University <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="university"
                      value={formData.university}
                      onChange={handleInputChange}
                      placeholder="Enter University Name"
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.university ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Applying Course(s) <span className="text-red-500">*</span>
                    </label>
                    <div 
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.course_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-lg cursor-pointer flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                      onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                    >
                      <span className="truncate">
                        {formData.course_ids?.length > 0 
                          ? (courses.filter(c => formData.course_ids.includes(c.course_id?.toString() || c.id?.toString())).map(c => c.course_name).join(', ') || 'Choose courses...') 
                          : 'Choose courses...'}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isCourseDropdownOpen ? 'rotate-90' : ''}`} />
                    </div>
                    
                    {isCourseDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {availableCourses.length === 0 && (!formData.course_ids || formData.course_ids.length === 0) ? (
                          <div className="px-3.5 py-3 text-xs text-slate-500 text-center">No courses available for selected session.</div>
                        ) : (
                          // Include availableCourses and any selected courses that are not in availableCourses (so they can be deselected)
                          [
                            ...availableCourses,
                            ...courses.filter(c => 
                              formData.course_ids?.includes(c.course_id?.toString() || c.id?.toString()) && 
                              !availableCourses.some(ac => (ac.course_id?.toString() || ac.id?.toString()) === (c.course_id?.toString() || c.id?.toString()))
                            )
                          ].map((c) => {
                            const id = c.course_id?.toString() || c.id?.toString();
                            const isSelected = formData.course_ids?.includes(id);
                            return (
                              <div 
                                key={id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newIds = isSelected 
                                    ? formData.course_ids.filter(v => v !== id)
                                    : [...(formData.course_ids || []), id];
                                  setFormData(prev => ({ ...prev, course_ids: newIds, course_id: newIds[0] || '' }));
                                  if (errors.course_id) setErrors(prev => ({...prev, course_id: false}));
                                }}
                                className="px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300"
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                  {isSelected && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                {c.course_name} ({c.course_code})
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Session From <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="session_from_id"
                      value={formData.session_from_id}
                      onChange={handleInputChange}
                      disabled
                      className="w-full px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg cursor-not-allowed text-slate-500 dark:text-slate-400"
                    >
                      <option value="">Choose...</option>
                      {uniqueSessionFroms.map((s) => (
                        <option key={s.session_id?.toString() || s.id} value={s.session_id?.toString() || s.id}>
                          {s.session_year?.split('-')[0]?.trim() || s.session_year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Session To <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="session_to_id"
                      value={formData.session_to_id}
                      onChange={handleInputChange}
                      disabled
                      className="w-full px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg cursor-not-allowed text-slate-500 dark:text-slate-400"
                    >
                      <option value="">Choose...</option>
                      {uniqueSessionTos.map((s) => {
                        const parts = s.session_year?.split('-');
                        const toYear = parts?.length > 1 ? parts[1]?.trim() : (parts?.[0]?.trim() || s.session_year);
                        return (
                          <option key={s.session_id?.toString() || s.id} value={s.session_id?.toString() || s.id}>
                            {toYear}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Date Of Admission <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date_of_admission"
                      value={formData.date_of_admission}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.date_of_admission ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Last Qualification <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_qualification"
                      value={formData.last_qualification}
                      onChange={handleInputChange}
                      placeholder="Enter Last Qualification"
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.last_qualification ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Last Qualification Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="last_qualification_level"
                      value={formData.last_qualification_level}
                      onChange={handleInputChange}
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.last_qualification_level ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    >
                      <option value="">Choose...</option>
                      <option value="10th Standard">10th Standard</option>
                      <option value="12th / Senior Secondary">12th / Senior Secondary</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bachelor Degree">Bachelor Degree</option>
                      <option value="Master Degree">Master Degree</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Year Of Passing <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="year_of_passing_last_qualification"
                      value={formData.year_of_passing_last_qualification}
                      onChange={handleInputChange}
                      placeholder="Enter Year"
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.year_of_passing_last_qualification ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Last Institute Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_institute_name"
                      value={formData.last_institute_name}
                      onChange={handleInputChange}
                      placeholder="Enter Last Institute Name"
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.last_institute_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    />
                  </div>
                </div>

                {formData.course_ids?.length > 0 && (
                  <div className="mt-6 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">Selected Courses & Specializations</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Choose optional specializations for your selected courses.</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 dark:bg-slate-900/20 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <th className="px-4 py-3">Course Name</th>
                            <th className="px-4 py-3">Specialization (Optional)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                          {formData.course_ids.map(courseId => {
                            const course = courses.find(c => (c.course_id?.toString() || c.id?.toString()) === courseId);
                            const courseSpecializations = specializations.filter(s => (s.course_id?.toString() || s.id?.toString()) === courseId);
                            
                            return (
                              <tr key={courseId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                                  {course?.course_name} {course?.course_code ? `(${course.course_code})` : ''}
                                </td>
                                <td className="px-4 py-3">
                                  {courseSpecializations.length > 0 ? (
                                    <select
                                      value={formData.course_specializations?.[courseId] || ''}
                                      onChange={(e) => {
                                        setFormData(prev => ({
                                          ...prev,
                                          course_specializations: {
                                            ...prev.course_specializations,
                                            [courseId]: e.target.value
                                          }
                                        }));
                                      }}
                                      className="w-full max-w-xs px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white"
                                    >
                                      <option value="">Select Specialization...</option>
                                      {courseSpecializations.map((s) => (
                                        <option key={s.specialization_id?.toString() || s.id} value={s.specialization_id?.toString() || s.id}>
                                          {s.specialization_name} ({s.specialization_code})
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">No specializations available</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleSubmit}
                    disabled={updateMutation.isPending}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'Saving...' : (
                      <><Save className="w-4 h-4" /> Save Admission Details <ChevronRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Select Student</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Search and select a student to manage their admission details</p>
            </div>
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Temporary ID</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Aadhar Number</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Session</th>
                  <th className="px-6 py-4">Enrolled Courses</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map(student => (
                  <tr key={student.student_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {generateTempId(student, courses)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center text-xs">
                          {(student.first_name?.[0] || '')}{(student.last_name?.[0] || '')}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {student.first_name} {student.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {student.aadhar_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5" title="Phone Number">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">{student.student_phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Email Address">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[11px]">{student.email_id || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {(() => {
                        if (student.session_from?.session_year) return student.session_from.session_year;
                        const session = sessions.find(s => (s.session_id?.toString() || s.id?.toString()) === student.session_from_id?.toString());
                        return session ? session.session_year : 'N/A';
                      })()}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {(() => {
                        const parsedCourseIds = Array.isArray(student.course_ids) 
                          ? student.course_ids 
                          : (student.course_id ? [{ course_id: student.course_id, specialization_id: student.specialization_id }] : []);
                        
                        if (parsedCourseIds.length === 0) return <span className="text-slate-400 italic">None</span>;
                        
                        return (
                          <div className="flex flex-col gap-1">
                            {parsedCourseIds.map((item, idx) => {
                              const cId = typeof item === 'object' ? item.course_id : item;
                              const sId = typeof item === 'object' ? item.specialization_id : null;
                              const course = courses.find(c => (c.course_id?.toString() || c.id?.toString()) === cId?.toString());
                              const spec = specializations.find(s => (s.specialization_id?.toString() || s.id?.toString()) === sId?.toString());
                              
                              if (!course) return null;
                              
                              return (
                                <div key={idx} className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-md text-[11px] text-slate-700 dark:text-slate-300 w-max max-w-[250px] flex flex-col" title={`${course.course_name}${spec ? ` - ${spec.specialization_name}` : ''}`}>
                                  <span className="font-bold truncate">{course.course_name} {course.course_code ? `(${course.course_code})` : ''}</span>
                                  {spec && <span className="text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 truncate"><div className="w-1 h-1 rounded-full bg-slate-400"></div> {spec.specialization_name}</span>}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const hasEnrollmentDetails = student.university && student.course_id;
                        const displayStatus = hasEnrollmentDetails ? (student.status || 'Active') : 'Pending';
                        return (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                            displayStatus === 'Active'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : displayStatus === 'Pending'
                              ? 'bg-amber-50 text-amber-600 border-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {displayStatus}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setViewingStudent(student)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer animate-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            handleSelectStudent(student);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer animate-all"
                          title="Edit Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingStudent(student)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer animate-all"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                      No students found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Academic Details</h3>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center text-lg">
                  {(viewingStudent.first_name?.[0] || '')}{(viewingStudent.last_name?.[0] || '')}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">{viewingStudent.first_name} {viewingStudent.last_name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{generateTempId(viewingStudent, courses)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase block">University</span>
                  <span className="font-medium text-slate-800 dark:text-white">{viewingStudent.university || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase block mb-2">Selected Courses & Specializations</span>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100/50 dark:bg-slate-800/50 text-xs text-slate-500">
                        <tr>
                          <th className="px-4 py-2 font-semibold">Course</th>
                          <th className="px-4 py-2 font-semibold">Specialization</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(() => {
                          const parsedCourseIds = Array.isArray(viewingStudent.course_ids) 
                            ? viewingStudent.course_ids 
                            : (viewingStudent.course_id ? [{ course_id: viewingStudent.course_id }] : []);
                            
                          if (parsedCourseIds.length === 0) return <tr><td colSpan="2" className="px-4 py-3 text-slate-500 italic text-center">No courses enrolled.</td></tr>;
                          
                          return parsedCourseIds.map((item, idx) => {
                            const cId = typeof item === 'object' ? item.course_id : item;
                            const sId = typeof item === 'object' ? item.specialization_id : null;
                            const course = courses.find(c => (c.course_id?.toString() || c.id?.toString()) === cId?.toString());
                            const spec = specializations.find(s => (s.specialization_id?.toString() || s.id?.toString()) === sId?.toString());
                            
                            return (
                              <tr key={idx}>
                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                                  {course?.course_name || 'Unknown'} {course?.course_code ? `(${course.course_code})` : ''}
                                </td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                  {spec ? `${spec.specialization_name} (${spec.specialization_code})` : <span className="text-slate-400 italic">None</span>}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase block">Session From</span>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {sessions.find(s => (s.session_id?.toString() || s.id?.toString()) === viewingStudent.session_from_id?.toString())?.session_year?.split('-')?.[0] || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase block">Session To</span>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {sessions.find(s => (s.session_id?.toString() || s.id?.toString()) === viewingStudent.session_to_id?.toString())?.session_year?.split('-')?.[1] || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase block">Date Of Admission</span>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {viewingStudent.date_of_admission ? new Date(viewingStudent.date_of_admission).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase block">Last Qualification</span>
                  <span className="font-medium text-slate-800 dark:text-white">{viewingStudent.last_qualification || 'N/A'} ({viewingStudent.last_qualification_level || 'N/A'})</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase block">Year Of Passing</span>
                  <span className="font-medium text-slate-800 dark:text-white">{viewingStudent.year_of_passing_last_qualification || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase block">Last Institute Name</span>
                  <span className="font-medium text-slate-800 dark:text-white">{viewingStudent.last_institute_name || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Delete Academic Details</h3>
              <button
                onClick={() => setDeletingStudent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-sm text-slate-600 dark:text-slate-300 space-y-3">
              <p>Are you sure you want to delete the academic details for <span className="font-semibold text-slate-800 dark:text-white">{deletingStudent.first_name} {deletingStudent.last_name}</span>?</p>
              <p className="text-xs text-red-500 dark:text-red-400 font-medium">This will clear all course enrollment information. The student's status will return to pending and they will be removed from this list view.</p>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteAcademicMutation.mutate(deletingStudent);
                }}
                disabled={deleteAcademicMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer disabled:opacity-50"
              >
                {deleteAcademicMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
