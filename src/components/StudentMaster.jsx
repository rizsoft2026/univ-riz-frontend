import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
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
  Mail,
  Trash2
} from 'lucide-react';
import baseApi from '@/services/baseApi';

const generateStudentId = (st, courses = []) => {
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
  
  let courseCode = '';
  if (courses.length > 0) {
    const parsedCourseIds = Array.isArray(st.course_ids)
      ? st.course_ids
      : (st.course_id ? [{ course_id: st.course_id }] : []);
    
    if (parsedCourseIds.length > 0) {
      let cId = parsedCourseIds[0];
      while (typeof cId === 'object' && cId !== null && cId.course_id !== undefined) cId = cId.course_id;
      const course = courses.find(c => (c.course_id?.toString() || c.id?.toString()) === cId?.toString());
      if (course && (course.code || course.course_code)) {
        courseCode = `/${course.code || course.course_code}`;
      }
    }
  }

  return `${uni}/${year}${courseCode}/${id}`;
};

export default function StudentMaster({ showNotification }) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Queries
  const { data: studentProfiles = [], isLoading } = useQuery({
    queryKey: ['student-profiles', { is_final: true }],
    queryFn: async () => {
      const res = await baseApi.get('/student-profiles?is_final=true');
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

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await baseApi.delete(`/student-profiles/${id}?is_final=true`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['student-profiles']);
      if (showNotification) {
        showNotification('Student record deleted successfully', 'success');
      }
    },
    onError: (error) => {
      console.error('Error deleting student:', error);
      if (showNotification) {
        showNotification(error.response?.data?.message || 'Failed to delete student', 'error');
      }
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this student record? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter students
  const filteredStudents = React.useMemo(() => {
    return studentProfiles.filter(s => {
      // Must have been enrolled in a course
      const hasEnrollmentDetails = s.university && (s.course_id || (Array.isArray(s.course_ids) && s.course_ids.length > 0));
      if (!hasEnrollmentDetails) return false;

      // Only show students who have been fully verified and admitted
      if (s.status !== 'Active') return false;

      const fullName = `${s.first_name || ''} ${s.middle_name || ''} ${s.last_name || ''}`.toLowerCase();
      const studentId = generateStudentId(s, courses).toLowerCase();
      const aadhar = s.aadhar_number || '';
      const query = searchTerm.toLowerCase();

      return fullName.includes(query) || studentId.includes(query) || aadhar.includes(query);
    });
  }, [studentProfiles, searchTerm, courses]);


  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-blue-800 via-blue-700 to-sky-700 text-white p-6 sm:p-8 rounded-3xl overflow-hidden shadow-lg shadow-blue-800/10 border border-blue-900/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 pointer-events-none flex items-center justify-center">
          <Users className="w-64 h-64 transform translate-x-20 translate-y-10" />
        </div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Student Master</h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5">Manage and view comprehensive student records</p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        {/* Search & Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Student Records</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">View all enrolled and pending students</p>
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
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No records found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No students match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Aadhar Number</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Session</th>
                  <th className="px-6 py-4">Course Code</th>
                  <th className="px-6 py-4">Enrolled Course</th>
                  <th className="px-6 py-4">Specialization Course</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map(student => (
                  <tr key={student.student_id || student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {generateStudentId(student, courses)}
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
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {(() => {
                        const parsedCourseIds = Array.isArray(student.course_ids)
                          ? student.course_ids
                          : (student.course_id ? [{ course_id: student.course_id, specialization_id: student.specialization_id }] : []);

                        if (parsedCourseIds.length === 0) return '-';

                        return (
                          <div className="flex flex-col gap-2">
                            {parsedCourseIds.map((item, idx) => {
                              let cId = item;
                              while (typeof cId === 'object' && cId !== null && cId.course_id !== undefined) cId = cId.course_id;
                              
                              const course = courses.find(c => (c.course_id?.toString() || c.id?.toString()) === cId?.toString());
                              if (!course) return null;
                              return <span key={idx} className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-max border border-slate-200 dark:border-slate-700">{course.course_code || 'N/A'}</span>;
                            })}
                          </div>
                        );
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
                              let cId = item;
                              while (typeof cId === 'object' && cId !== null && cId.course_id !== undefined) cId = cId.course_id;
                              
                              let sId = typeof item === 'object' ? item.specialization_id : null;
                              while (typeof sId === 'object' && sId !== null && sId.specialization_id !== undefined) sId = sId.specialization_id;
                              
                              const course = courses.find(c => (c.course_id?.toString() || c.id?.toString()) === cId?.toString());
                              const spec = specializations.find(s => (s.specialization_id?.toString() || s.id?.toString()) === sId?.toString());

                              if (!course) return null;

                              return (
                                <div key={idx} className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg text-xs text-slate-800 dark:text-slate-100 w-max max-w-[250px] flex flex-col border border-slate-200 dark:border-slate-700 shadow-sm" title={`${course.course_name}${spec ? ` - ${spec.specialization_name}` : ''}`}>
                                  <span className="font-extrabold truncate" title={course.course_name}>
                                    {course.course_name}
                                  </span>
                                  {spec && <span className="text-slate-600 dark:text-slate-400 font-semibold mt-1 flex items-center gap-1.5 truncate"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> {spec.specialization_name}</span>}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {(() => {
                        const parsedCourseIds = Array.isArray(student.course_ids)
                          ? student.course_ids
                          : (student.course_id ? [{ course_id: student.course_id, specialization_id: student.specialization_id }] : []);

                        if (parsedCourseIds.length === 0) return <span className="text-slate-400 italic">None</span>;

                        return (
                          <div className="flex flex-col gap-2">
                            {parsedCourseIds.map((item, idx) => {
                              let sId = typeof item === 'object' ? item.specialization_id : null;
                              while (typeof sId === 'object' && sId !== null && sId.specialization_id !== undefined) sId = sId.specialization_id;
                              
                              const spec = specializations.find(s => (s.specialization_id?.toString() || s.id?.toString()) === sId?.toString());

                              if (!spec) return <span key={idx} className="text-slate-400 italic font-normal text-xs">-</span>;
                              
                              return (
                                <div key={idx} className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-800 w-max">
                                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 mb-0.5">{spec.specialization_code || 'N/A'}</span>
                                  <span className="text-xs">{spec.specialization_name}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const hasEnrollmentDetails = student.university && (student.course_id || (Array.isArray(student.course_ids) && student.course_ids.length > 0));
                        const displayStatus = hasEnrollmentDetails ? (student.status || 'Active') : 'Pending';
                        return (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${displayStatus === 'Active'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : displayStatus === 'Rejected'
                              ? 'bg-rose-50 text-rose-600 border-rose-200'
                              : 'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>
                            {displayStatus}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(student.student_id || student.id)}
                        disabled={deleteMutation.isLoading}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
