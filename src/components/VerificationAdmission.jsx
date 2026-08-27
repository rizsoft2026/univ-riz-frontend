import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  User,
  MapPin,
  Calendar,
  BookOpen,
  Phone,
  Mail
} from 'lucide-react';
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

export default function VerificationAdmission({ showNotification }) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [documentChecks, setDocumentChecks] = useState({
    profilePicture: false,
    aadharCard: false,
    lastQualification: false,
    migrationCert: false
  });
  const [confirmEnrollment, setConfirmEnrollment] = useState({ isOpen: false, student: null, courseId: '', fullCourseItem: null });
  const [confirmAdmit, setConfirmAdmit] = useState({ isOpen: false, student: null });

  // Queries
  const { data: studentProfiles = [], isLoading } = useQuery({
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

  const { data: specializations = [] } = useQuery({
    queryKey: ['specializations'],
    queryFn: async () => {
      const res = await baseApi.get('/specializations');
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

  // Filter students who have completed course enrollment (have courses/university details)
  const filteredStudents = React.useMemo(() => {
    return studentProfiles.filter(s => {
      const hasEnrollmentDetails = s.university && (s.course_id || (Array.isArray(s.course_ids) && s.course_ids.length > 0));
      if (!hasEnrollmentDetails) return false;

      // If they are already verified and admitted, don't show them here
      if (s.status === 'Active') return false;

      const fullName = `${s.first_name || ''} ${s.middle_name || ''} ${s.last_name || ''}`.toLowerCase();
      const tempId = generateTempId(s, courses).toLowerCase();
      const aadhar = s.aadhar_number || '';
      const query = searchTerm.toLowerCase();

      return fullName.includes(query) || tempId.includes(query) || aadhar.includes(query);
    });
  }, [studentProfiles, searchTerm, courses]);

  // Mutation to update student status (Approve / Reject)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ studentId, status, courseUpdates }) => {
      // Re-fetch full student details to make sure we don't overwrite anything
      const studentRes = await baseApi.get(`/student-profiles/${studentId}`);
      const currentStudent = studentRes.data?.data;
      if (!currentStudent) throw new Error('Student profile not found');

      const formDataToSend = new FormData();
      const updatedData = { ...currentStudent, status, ...(courseUpdates || {}) };

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

      // Skip file fields (sending files as string URLs will cause issues or duplicate uploads)
      const keysToSkip = [
        'student_photo', 'student_signature',
        'marksheet_10th', 'marksheet_12th', 'marksheet_diploma', 'marksheet_ug', 'marksheet_pg',
        'migration_10th', 'migration_12th', 'migration_diploma', 'migration_ug', 'migration_pg',
        'profile_picture', 'aadhar_front', 'aadhar_back', 'last_qualification_cert', 'clc_migration_cert'
      ];

      Object.keys(updatedData).forEach((key) => {
        if (updatedData[key] !== null && updatedData[key] !== undefined && !keysToSkip.includes(key)) {
          if (typeof updatedData[key] === 'object' && (key === 'academic_records' || key === 'course_ids')) {
            formDataToSend.append(key, JSON.stringify(updatedData[key]));
          } else if (typeof updatedData[key] !== 'object') {
            formDataToSend.append(key, updatedData[key]);
          }
        }
      });

      return baseApi.put(`/student-profiles/${studentId}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: (_, variables) => {
      const msg = variables.status === 'Active'
        ? 'Student documents verified & final admission approved!'
        : 'Student admission status set to Pending.';
      showNotification(msg, 'success');
      queryClient.invalidateQueries({ queryKey: ['student-profiles'] });
      setIsVerifyModalOpen(false);
      setSelectedStudent(null);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Error updating student status';
      showNotification(msg, 'error');
    }
  });

  const handleOpenVerify = (student) => {
    setSelectedStudent(student);
    setDocumentChecks({
      profilePicture: student.status === 'Active' || !!student.profile_picture_url,
      aadharCard: student.status === 'Active' || (!!student.aadhar_front_url && !!student.aadhar_back_url),
      lastQualification: student.status === 'Active' || !!student.last_qualification_cert_url,
      migrationCert: student.status === 'Active' || !!student.clc_migration_cert_url
    });
    setIsVerifyModalOpen(true);
  };

  const handleVerifySubmit = (status) => {
    if (status === 'Active') {
      const allChecked = Object.values(documentChecks).every(Boolean);
      if (!allChecked) {
        showNotification('Please verify all documents before granting final admission', 'error');
        return;
      }
    }

    updateStatusMutation.mutate({
      studentId: selectedStudent.student_id || selectedStudent.id,
      status
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-blue-800 via-blue-700 to-sky-700 text-white p-6 sm:p-8 rounded-3xl overflow-hidden shadow-lg shadow-blue-800/10 border border-blue-900/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 pointer-events-none flex items-center justify-center">
          <ShieldCheck className="w-64 h-64 transform translate-x-20 translate-y-10" />
        </div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
            <UserCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Verification Document & Final Admission</h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5">Verify uploaded documents and confirm final student admission status</p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        {/* Search & Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Verify Applicants</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review student profiles waiting for document checks and final enrollment</p>
          </div>
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by name, ID, or Aadhar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
        </div>

        {/* Table/List */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading student records...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No applicants found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No students have completed their course enrollment details yet.</p>
          </div>
        ) : (
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
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map(student => (
                  <tr key={student.student_id || student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {generateTempId(student, courses)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {student.profile_picture_url ? (
                          <img src={student.profile_picture_url} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center text-xs">
                            {(student.first_name?.[0] || '')}{(student.last_name?.[0] || '')}
                          </div>
                        )}
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
                        if (student.session_from?.session_year) return student.session_from.session_year.trim();
                        const session = sessions.find(s => (s.session_id?.toString() || s.id?.toString()) === student.session_from_id?.toString());
                        return session ? session.session_year?.trim() : 'N/A';
                      })()}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <select
                        value={(() => {
                          const parsed = Array.isArray(student.course_ids) ? student.course_ids : (student.course_id ? [student.course_id] : []);
                          // If there are multiple courses, don't default to the first one visually, force them to choose.
                          if (parsed.length > 1) return '';
                          const firstItem = parsed[0];
                          const cId = typeof firstItem === 'object' ? firstItem?.course_id : firstItem;
                          return cId ? cId.toString() : '';
                        })()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            // Find the full object from the student's current course_ids to preserve specialization
                            const parsed = Array.isArray(student.course_ids) ? student.course_ids : [];
                            const originalItem = parsed.find(item => {
                               let cId = typeof item === 'object' ? item.course_id : item;
                               if (typeof cId === 'object' && cId !== null && cId.course_id) cId = cId.course_id;
                               return cId?.toString() === val.toString();
                            });
                            
                            setConfirmEnrollment({ 
                               isOpen: true, 
                               student, 
                               courseId: val,
                               fullCourseItem: originalItem || val 
                            });
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">Select a course...</option>
                        {(() => {
                          const parsed = Array.isArray(student.course_ids) ? student.course_ids : (student.course_id ? [student.course_id] : []);
                          const enrolledCourseIds = parsed.map(item => typeof item === 'object' ? item?.course_id?.toString() : item?.toString());
                          const enrolledCourses = courses.filter(c => enrolledCourseIds.includes(c.course_id?.toString() || c.id?.toString()));

                          return enrolledCourses.map(c => (
                            <option key={c.course_id || c.id} value={c.course_id || c.id}>
                              {c.course_name} {c.course_code ? `(${c.course_code})` : ''}
                            </option>
                          ));
                        })()}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {student.status === 'Active' ? (
                        <button
                          onClick={() => handleOpenVerify(student)}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ml-auto bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Verified
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const parsed = Array.isArray(student.course_ids) ? student.course_ids : [];
                            if (parsed.length > 1) {
                              showNotification('Please select a single final course from the dropdown before verifying', 'error');
                              return;
                            }
                            setConfirmAdmit({ isOpen: true, student });
                          }}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ml-auto bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/10"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verify & Admit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification Dialog / Modal */}
      {isVerifyModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Document Verification & Final Admission</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Applicant: {selectedStudent.first_name} {selectedStudent.last_name}</p>
                </div>
              </div>
              <button
                onClick={() => { setIsVerifyModalOpen(false); setSelectedStudent(null); }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Personal Info</h4>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">DOB: {selectedStudent.date_of_birth ? new Date(selectedStudent.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Phone: {selectedStudent.student_phone}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Category: {selectedStudent.category} | Blood: {selectedStudent.blood_group}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address details</h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium line-clamp-2" title={selectedStudent.permanent_address}>
                      {selectedStudent.permanent_address || 'No permanent address added'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Pincode: {selectedStudent.permanent_pincode || 'N/A'}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admission Session</h4>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">University: {selectedStudent.university}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Passing Year: {selectedStudent.year_of_passing_last_qualification}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Last Inst: {selectedStudent.last_institute_name}</p>
                  </div>
                </div>
              </div>

              {/* Documents Checklist & Previews */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Uploaded Verification Files</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Profile Photo Doc */}
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200">Profile Picture</h5>
                          <p className="text-[10px] text-slate-400">Official applicant photograph</p>
                        </div>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={documentChecks.profilePicture}
                          onChange={(e) => setDocumentChecks(prev => ({ ...prev, profilePicture: e.target.checked }))}
                          disabled={selectedStudent.status === 'Active'}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500/20"
                        />
                        <span>Verified</span>
                      </label>
                    </div>

                    {selectedStudent.profile_picture_url ? (
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <img src={selectedStudent.profile_picture_url} className="w-12 h-12 object-cover rounded-lg border" alt="Profile" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Photo uploaded</p>
                          <a href={selectedStudent.profile_picture_url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                            View File <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl border border-rose-100 dark:border-rose-950/30 text-xs font-medium text-center">
                        No Profile Picture uploaded
                      </div>
                    )}
                  </div>

                  {/* Aadhar Card Doc */}
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200">Aadhar Card Verification</h5>
                          <p className="text-[10px] text-slate-400">National identity proof (UIDAI)</p>
                        </div>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={documentChecks.aadharCard}
                          onChange={(e) => setDocumentChecks(prev => ({ ...prev, aadharCard: e.target.checked }))}
                          disabled={selectedStudent.status === 'Active'}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500/20"
                        />
                        <span>Verified</span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        UID: <span className="font-mono text-slate-700 dark:text-slate-200">{selectedStudent.aadhar_number || 'N/A'}</span>
                      </div>

                      <div className="flex gap-2">
                        {selectedStudent.aadhar_front_url ? (
                          <a href={selectedStudent.aadhar_front_url} target="_blank" rel="noreferrer" className="flex-1 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 p-2 rounded-lg border text-center text-[10px] font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1">
                            Aadhar Front <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <div className="flex-1 bg-rose-50/50 p-2 rounded-lg border text-center text-[10px] text-rose-500 font-medium">Front Missing</div>
                        )}

                        {selectedStudent.aadhar_back_url ? (
                          <a href={selectedStudent.aadhar_back_url} target="_blank" rel="noreferrer" className="flex-1 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 p-2 rounded-lg border text-center text-[10px] font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1">
                            Aadhar Back <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <div className="flex-1 bg-rose-50/50 p-2 rounded-lg border text-center text-[10px] text-rose-500 font-medium">Back Missing</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Last Qualification Marksheet */}
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200">Last Qualification Marksheet</h5>
                          <p className="text-[10px] text-slate-400">Board/University marksheet/certificate</p>
                        </div>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={documentChecks.lastQualification}
                          onChange={(e) => setDocumentChecks(prev => ({ ...prev, lastQualification: e.target.checked }))}
                          disabled={selectedStudent.status === 'Active'}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500/20"
                        />
                        <span>Verified</span>
                      </label>
                    </div>

                    {selectedStudent.last_qualification_cert_url ? (
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-5 h-5 text-purple-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{selectedStudent.last_qualification || 'Certificate'}</p>
                            <p className="text-[9px] text-slate-400">{selectedStudent.last_qualification_level}</p>
                          </div>
                        </div>
                        <a href={selectedStudent.last_qualification_cert_url} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all">
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl border border-rose-100 dark:border-rose-950/30 text-xs font-medium text-center">
                        No Qualification Certificate uploaded
                      </div>
                    )}
                  </div>

                  {/* CLC / Migration certificate */}
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200">CLC / Migration Certificate</h5>
                          <p className="text-[10px] text-slate-400">College leaving/Migration certificate</p>
                        </div>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={documentChecks.migrationCert}
                          onChange={(e) => setDocumentChecks(prev => ({ ...prev, migrationCert: e.target.checked }))}
                          disabled={selectedStudent.status === 'Active'}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500/20"
                        />
                        <span>Verified</span>
                      </label>
                    </div>

                    {selectedStudent.clc_migration_cert_url ? (
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-5 h-5 text-amber-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">Migration / CLC File</p>
                            <p className="text-[9px] text-slate-400">Secondary document proof</p>
                          </div>
                        </div>
                        <a href={selectedStudent.clc_migration_cert_url} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all">
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl border border-rose-100 dark:border-rose-950/30 text-xs font-medium text-center">
                        No CLC / Migration Certificate uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div>
                {selectedStudent.status === 'Active' ? (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> This student's admission is already active/completed.
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">
                    All document checkboxes must be ticked to activate admission.
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setIsVerifyModalOpen(false); setSelectedStudent(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                {selectedStudent.status !== 'Active' && (
                  <>
                    <button
                      onClick={() => handleVerifySubmit('Pending')}
                      disabled={updateStatusMutation.isPending}
                      className="px-4 py-2 border border-amber-200 text-amber-600 hover:bg-amber-50 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Keep Pending
                    </button>
                    <button
                      onClick={() => handleVerifySubmit('Active')}
                      disabled={updateStatusMutation.isPending}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-50"
                    >
                      {updateStatusMutation.isPending ? (
                        'Saving...'
                      ) : (
                        <><CheckCircle className="w-3.5 h-3.5" /> Approve & Final Admit</>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Enrollment Confirmation Modal */}
      {confirmEnrollment.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Enroll Course</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to enroll <strong>{confirmEnrollment.student?.first_name} {confirmEnrollment.student?.last_name}</strong> in this course?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmEnrollment({ isOpen: false, student: null, courseId: '', fullCourseItem: null })}
                className="px-5 py-2 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                No, cancel
              </button>
              <button
                onClick={() => {
                  updateStatusMutation.mutate({
                    studentId: confirmEnrollment.student.student_id || confirmEnrollment.student.id,
                    status: 'Pending',
                    courseUpdates: { 
                      course_ids: [confirmEnrollment.fullCourseItem || confirmEnrollment.courseId], 
                      course_id: confirmEnrollment.courseId 
                    }
                  });
                  setConfirmEnrollment({ isOpen: false, student: null, courseId: '', fullCourseItem: null });
                }}
                disabled={updateStatusMutation.isPending}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              >
                Yes, enroll
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Verify & Admit Confirmation Modal */}
      {confirmAdmit.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Final Admission</h3>
            {(() => {
              if (!confirmAdmit.student) return null;
              const parsed = Array.isArray(confirmAdmit.student.course_ids) ? confirmAdmit.student.course_ids : (confirmAdmit.student.course_id ? [confirmAdmit.student.course_id] : []);
              const cId = parsed.length > 0 ? (typeof parsed[0] === 'object' ? parsed[0].course_id : parsed[0]) : null;
              const selectedCourse = courses.find(c => (c.course_id?.toString() || c.id?.toString()) === cId?.toString());
              
              return (
                <div className="mb-6 text-left bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 text-center">
                    Please confirm final admission for this student:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-slate-500">Student Name:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{confirmAdmit.student.first_name} {confirmAdmit.student.last_name}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-slate-500">Enrolled Course:</span>
                      <strong className="text-slate-800 dark:text-slate-200 text-right">{selectedCourse ? selectedCourse.course_name : '-'}</strong>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-500">Course Code:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{selectedCourse && selectedCourse.course_code ? selectedCourse.course_code : '-'}</strong>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmAdmit({ isOpen: false, student: null })}
                className="px-5 py-2 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                No, cancel
              </button>
              <button
                onClick={() => {
                  updateStatusMutation.mutate({
                    studentId: confirmAdmit.student.student_id || confirmAdmit.student.id,
                    status: 'Active'
                  });
                  setConfirmAdmit({ isOpen: false, student: null });
                }}
                disabled={updateStatusMutation.isPending}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              >
                Yes, verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
