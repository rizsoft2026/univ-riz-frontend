import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Search,
  BookOpen,
  Layers,
  CheckCircle,
  AlertCircle,
  Save,
  Edit2,
  Trash2,
  Calendar,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  Info,
  Check,
  Eye,
  X
} from 'lucide-react';
import baseApi from '@/services/baseApi';
import { useSessions } from '../hooks/useSessions';
import { useCourses } from '../hooks/useCourses';
import { useCodifications } from '../hooks/useCodifications';
import { useSubjectGroups } from '../hooks/useSubjectGroups';
import { useSubjects } from '../hooks/useSubjects';
import { useCurriculumMappings } from '../hooks/useCurriculumMappings';
import {
  useStudentCurriculumMappings,
  useSaveStudentCurriculumMapping,
  useDeleteStudentCurriculumMapping,
} from '../hooks/useStudentCurriculumMappings';
import ConfirmModal from './ConfirmModal';

const generateStudentId = (
  st,
  coursesList = [],
  currentSelectedCourseId = null,
  studentSessionObj = null
) => {
  if (!st) return 'N/A';

  const getInitials = (name) => {
    if (!name) return 'SDU';
    const words = name.split(' ').filter(Boolean);
    if (words.length === 1) return name.substring(0, 4).toUpperCase();
    return words.map((w) => w[0]).join('').toUpperCase().substring(0, 4);
  };

  const uni = getInitials(st.university);

  // Session Year resolution
  let year = 'YYYY';
  const sessYear =
    studentSessionObj?.session_year ||
    st.session_from?.session_year ||
    st.session_year;

  if (sessYear) {
    year = sessYear.toString().split('-')[0].trim();
  }

  // Sequential Student ID Number
  const rawId = st.student_id || st.id || st.student_code;
  const idNum = rawId ? rawId.toString().padStart(4, '0') : '0000';

  // Course Code resolution
  let courseCodeStr = '';
  let targetCourseId = currentSelectedCourseId;

  if (!targetCourseId) {
    if (st.course_id) {
      targetCourseId = st.course_id;
    } else if (Array.isArray(st.course_ids) && st.course_ids.length > 0) {
      let cId = st.course_ids[0];
      while (typeof cId === 'object' && cId !== null && cId.course_id !== undefined) {
        cId = cId.course_id;
      }
      targetCourseId = cId;
    }
  }

  if (targetCourseId && coursesList.length > 0) {
    const course = coursesList.find(
      (c) =>
        (c.course_id?.toString() || c.id?.toString()) === targetCourseId.toString()
    );
    if (course) {
      const cCode = course.code || course.course_code;
      if (cCode) {
        courseCodeStr = `/${cCode}`;
      }
    }
  }

  return `${uni}/${year}${courseCodeStr}/${idNum}`;
};

export default function StudentCurriculumMapping({ showNotification }) {
  // Master data queries
  const { data: studentProfiles = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['student-profiles', { is_final: true }],
    queryFn: async () => {
      try {
        const res = await baseApi.get('/student-profiles?is_final=true');
        return res.data?.data || [];
      } catch (err) {
        console.error('Error fetching student profiles:', err);
        return [];
      }
    },
  });

  const { data: sessions = [] } = useSessions();
  const { data: courses = [] } = useCourses();
  const { data: codifications = [] } = useCodifications();
  const { data: subjectGroups = [] } = useSubjectGroups();
  const { data: subjects = [] } = useSubjects();
  const { data: curriculumMappings = [] } = useCurriculumMappings();

  // Backend Database queries for saved student curriculum mappings
  const { data: dbSavedMappings = [] } = useStudentCurriculumMappings();
  const saveMutation = useSaveStudentCurriculumMapping();
  const deleteMutation = useDeleteStudentCurriculumMapping();

  const savedStudentMappings = useMemo(() => {
    return dbSavedMappings.map((m) => {
      const st = m.student || {};
      const crs = m.course || {};
      const sess = m.session || {};

      const activeSessionYear = sess.session_year || st.session_year || 'N/A';
      const studentName = `${st.first_name || ''} ${st.last_name || ''}`.trim() || `Student #${m.student_id}`;
      const courseName = crs.course_name || crs.name || 'Enrolled Course';

      return {
        id: m.id?.toString(),
        student_id: m.student_id?.toString(),
        student_name: studentName,
        student_code: generateStudentId(st, courses, m.course_id?.toString(), sess),
        course_id: m.course_id?.toString(),
        course_name: courseName,
        session_id: m.session_id ? m.session_id.toString() : '',
        session_year: activeSessionYear,
        semester_mappings: m.semester_mappings || {},
        updatedAt: m.updated_at,
      };
    });
  }, [dbSavedMappings, courses]);

  // Component UI State
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [activeTab, setActiveTabState] = useState('SAVED'); // 'CREATE' | 'SAVED'
  const [savedSearchTerm, setSavedSearchTerm] = useState('');
  
  // Mapping selections state for currently selected student & course
  // Structure: { [semester]: { [codificationId]: { groupId: string, subjectId: string } } }
  const [currentSelections, setCurrentSelections] = useState({});
  const isEditingRef = React.useRef(false);

  // Modal for delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState(null);

  // Modal for viewing student curriculum
  const [viewingMapping, setViewingMapping] = useState(null);
  const [modalActiveSemester, setModalActiveSemester] = useState('');

  // Filter active registered students
  const activeStudents = useMemo(() => {
    return studentProfiles.filter((s) => {
      const hasCourse =
        s.course_id || (Array.isArray(s.course_ids) && s.course_ids.length > 0);
      return s.status === 'Active' && s.university && hasCourse;
    });
  }, [studentProfiles]);

  const filteredStudentDropdown = useMemo(() => {
    if (!studentSearchTerm) return activeStudents;
    const term = studentSearchTerm.toLowerCase();
    return activeStudents.filter((s) => {
      const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      const code = generateStudentId(s, courses).toLowerCase();
      const email = (s.email_id || '').toLowerCase();
      return name.includes(term) || code.includes(term) || email.includes(term);
    });
  }, [activeStudents, studentSearchTerm, courses]);

  // Selected Student Details
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return activeStudents.find(
      (s) => (s.student_id?.toString() || s.id?.toString()) === selectedStudentId.toString()
    );
  }, [selectedStudentId, activeStudents]);

  // Derive Student's Available Courses
  const studentAvailableCourses = useMemo(() => {
    if (!selectedStudent) return [];

    const parsedCourseIds = Array.isArray(selectedStudent.course_ids)
      ? selectedStudent.course_ids
      : selectedStudent.course_id
        ? [{ course_id: selectedStudent.course_id }]
        : [];

    const result = [];
    parsedCourseIds.forEach((item) => {
      let cId = item;
      while (typeof cId === 'object' && cId !== null && cId.course_id !== undefined) {
        cId = cId.course_id;
      }
      if (cId) {
        const found = courses.find(
          (c) => (c.course_id?.toString() || c.id?.toString()) === cId.toString()
        );
        if (found && !result.some((c) => (c.course_id?.toString() || c.id?.toString()) === (found.course_id?.toString() || found.id?.toString()))) {
          result.push(found);
        }
      }
    });

    return result;
  }, [selectedStudent, courses]);

  // Auto-select course when student changes
  useEffect(() => {
    if (studentAvailableCourses.length > 0) {
      const firstCourseId = studentAvailableCourses[0].course_id || studentAvailableCourses[0].id;
      setSelectedCourseId(firstCourseId?.toString() || '');
    } else {
      setSelectedCourseId('');
    }
  }, [studentAvailableCourses]);

  // Derive Session for student
  const studentSession = useMemo(() => {
    if (!selectedStudent) return null;

    // 1. Direct object attached on student profile
    if (selectedStudent.session_from && typeof selectedStudent.session_from === 'object') {
      const sessId = selectedStudent.session_from.session_id || selectedStudent.session_from.id;
      const matched = sessions.find(
        (s) => (s.session_id?.toString() || s.id?.toString()) === sessId?.toString()
      );
      if (matched) return matched;
      if (selectedStudent.session_from.session_year) {
        return selectedStudent.session_from;
      }
    }

    // 2. Lookup by session_from_id or session_from primitive
    const rawSessId =
      selectedStudent.session_from_id ||
      (typeof selectedStudent.session_from !== 'object' ? selectedStudent.session_from : null);

    if (rawSessId) {
      const matched = sessions.find(
        (s) => (s.session_id?.toString() || s.id?.toString()) === rawSessId.toString()
      );
      if (matched) return matched;
    }

    // 3. Lookup by session_year string if present on student
    if (selectedStudent.session_year) {
      const matched = sessions.find(
        (s) => s.session_year?.trim() === selectedStudent.session_year?.trim()
      );
      if (matched) return matched;
      return { session_year: selectedStudent.session_year, session_id: rawSessId };
    }

    return null;
  }, [selectedStudent, sessions]);

  // Fetch Curriculum Mappings for selected student's Course & Session
  const matchedCurriculum = useMemo(() => {
    if (!selectedStudent || !selectedCourseId) return [];

    const sessIdStr = (studentSession?.session_id || studentSession?.id)?.toString();
    const sessYearStr = (studentSession?.session_year || selectedStudent?.session_from?.session_year || selectedStudent?.session_year)?.trim();
    const courseIdStr = selectedCourseId.toString();

    return curriculumMappings.filter((m) => {
      const mSessStr = m.session_id?.toString();
      const mCourseStr = m.course_id?.toString();

      const isSessionMatch =
        (sessIdStr && mSessStr === sessIdStr) ||
        (sessYearStr && m.session_year?.trim() === sessYearStr) ||
        !mSessStr;

      return (
        isSessionMatch &&
        mCourseStr === courseIdStr &&
        (m.status === 'Active' || !m.status)
      );
    });
  }, [selectedStudent, selectedCourseId, studentSession, curriculumMappings]);

  // Group matched curriculum by Semester -> Codification
  // Returns: { [semester]: [ { codificationId, codification, subjectGroupIds: [] } ] }
  const curriculumBySemester = useMemo(() => {
    if (matchedCurriculum.length === 0) return {};

    const grouped = {};
    matchedCurriculum.forEach((m) => {
      const sem = m.semester || 'Semester I';
      if (!grouped[sem]) grouped[sem] = {};

      const codId = m.codification_id?.toString();
      if (!codId) return;

      if (!grouped[sem][codId]) {
        grouped[sem][codId] = {
          codificationId: codId,
          codification: codifications.find(
            (c) => (c.codification_id?.toString() || c.id?.toString()) === codId
          ),
          subjectGroupIds: new Set(),
        };
      }

      if (m.bucket_subject_group_id) {
        grouped[sem][codId].subjectGroupIds.add(m.bucket_subject_group_id.toString());
      }
    });

    // Convert subjectGroupIds Set to Array
    const result = {};
    Object.keys(grouped).forEach((sem) => {
      result[sem] = Object.values(grouped[sem]).map((item) => ({
        ...item,
        subjectGroupIds: Array.from(item.subjectGroupIds),
      }));
    });

    return result;
  }, [matchedCurriculum, codifications]);

  // Derive available semesters from curriculum and auto-select the first one
  const availableSemesters = useMemo(() => {
    return Object.keys(curriculumBySemester);
  }, [curriculumBySemester]);

  useEffect(() => {
    if (availableSemesters.length > 0) {
      setSelectedSemester((prev) => (availableSemesters.includes(prev) ? prev : availableSemesters[0]));
    }
  }, [availableSemesters]);

  // Load existing saved mapping for the selected student & course
  useEffect(() => {
    if (!selectedStudent || !selectedCourseId) {
      if (Object.keys(currentSelections).length > 0) {
        setCurrentSelections({});
        isEditingRef.current = false;
      }
      return;
    }

    const stIdStr = selectedStudent.student_id?.toString() || selectedStudent.id?.toString();
    const existing = savedStudentMappings.find(
      (m) =>
        m.student_id?.toString() === stIdStr &&
        m.course_id?.toString() === selectedCourseId.toString()
    );

    // Always initialize defaults for ALL semesters from curriculum
    const initial = {};
    Object.keys(curriculumBySemester).forEach((sem) => {
      initial[sem] = {};
      curriculumBySemester[sem].forEach((item) => {
        const codId = item.codificationId;
        const gIds = item.subjectGroupIds;
        initial[sem][codId] = {
          groupId: gIds.length === 1 ? gIds[0] : '',
          subjectId: '',
        };
      });
    });

    let targetSelections;
    if (existing && existing.semester_mappings) {
      // Merge saved data on top of defaults — saved semesters override defaults,
      // unsaved semesters keep their default initialization
      const merged = { ...initial };
      Object.keys(existing.semester_mappings).forEach((sem) => {
        merged[sem] = {
          ...initial[sem],
          ...existing.semester_mappings[sem],
        };
      });
      targetSelections = merged;
    } else {
      targetSelections = initial;
    }

    // Only update state if the new selections are actually different from current state
    if (!isEditingRef.current && JSON.stringify(targetSelections) !== JSON.stringify(currentSelections)) {
      setCurrentSelections(targetSelections);
    }
  }, [selectedStudent, selectedCourseId, curriculumBySemester, savedStudentMappings, currentSelections]);

  // Handler to update Subject Group for a codification
  const handleGroupChange = (semester, codificationId, groupId) => {
    isEditingRef.current = true;
    setCurrentSelections((prev) => ({
      ...prev,
      [semester]: {
        ...prev[semester],
        [codificationId]: {
          groupId,
          subjectId: '', // reset subject selection when group changes
        },
      },
    }));
  };

  // Handler to update Subject for a codification
  const handleSubjectChange = (semester, codificationId, subjectId) => {
    isEditingRef.current = true;
    setCurrentSelections((prev) => ({
      ...prev,
      [semester]: {
        ...prev[semester],
        [codificationId]: {
          ...prev[semester]?.[codificationId],
          subjectId,
        },
      },
    }));
  };

  // Save Mapping Handler
  const handleSaveMapping = async () => {
    if (!selectedStudent || !selectedCourseId) {
      showNotification?.('Please select a student and course first.', 'warning');
      return;
    }

    if (Object.keys(curriculumBySemester).length === 0) {
      showNotification?.('No curriculum exists for this course to map.', 'warning');
      return;
    }

    const stIdStr = selectedStudent.student_id?.toString() || selectedStudent.id?.toString();
    const sessIdStr = (
      studentSession?.session_id ||
      studentSession?.id ||
      selectedStudent?.session_from_id ||
      null
    )?.toString();

    // Build semester_mappings: only include the selected semester's data,
    // merged with any previously saved data for other semesters
    const existingSavedMapping = savedStudentMappings.find(
      (m) =>
        m.student_id?.toString() === stIdStr &&
        m.course_id?.toString() === selectedCourseId.toString()
    );
    const previouslySavedSemesters = existingSavedMapping?.semester_mappings || {};

    // Merge: keep previously saved semesters, update only the selected one
    const mergedSemesterMappings = {
      ...previouslySavedSemesters,
    };

    if (selectedSemester && currentSelections[selectedSemester]) {
      mergedSemesterMappings[selectedSemester] = currentSelections[selectedSemester];
    } else {
      // Fallback: save all current selections if no semester is selected
      Object.assign(mergedSemesterMappings, currentSelections);
    }

    const payload = {
      student_id: stIdStr,
      course_id: selectedCourseId.toString(),
      session_id: sessIdStr || null,
      semester_mappings: mergedSemesterMappings,
      status: 'Active',
    };

    try {
      await saveMutation.mutateAsync(payload);
      showNotification?.('Student Curriculum Mapping saved to database successfully!', 'success');
      isEditingRef.current = false;
      setActiveTabState('SAVED');
    } catch (err) {
      console.error('Error saving student mapping:', err);
      showNotification?.('Failed to save student mapping to database.', 'error');
    }
  };

  // Delete Mapping Handler
  const handleDeleteMapping = async () => {
    if (!mappingToDelete) return;
    try {
      await deleteMutation.mutateAsync(mappingToDelete.id);
      setIsDeleteModalOpen(false);
      setMappingToDelete(null);
      showNotification?.('Student Curriculum Mapping deleted successfully from database!', 'success');
    } catch (err) {
      console.error('Error deleting student mapping:', err);
      showNotification?.('Failed to delete student mapping from database.', 'error');
    }
  };

  // Helper function to resolve group name by ID
  const getGroupName = (gId) => {
    if (!gId) return 'Unknown Group';
    const group = subjectGroups.find(
      (g) => (g.bucket_subject_group_id?.toString() || g.id?.toString()) === gId.toString()
    );
    return group ? `${group.subject_group_name || group.name} (${group.subject_group_code || group.code})` : `Group #${gId}`;
  };

  // Helper function to resolve subject name by ID
  const getSubjectName = (sId) => {
    if (!sId) return 'N/A';
    const subject = subjects.find(
      (s) => (s.subject_id?.toString() || s.id?.toString()) === sId.toString()
    );
    return subject ? `${subject.subject_name || subject.name} (${subject.subject_code || subject.code})` : `Subject #${sId}`;
  };

  // Filter saved mappings for display
  const filteredSavedMappings = useMemo(() => {
    if (!savedSearchTerm) return savedStudentMappings;
    const term = savedSearchTerm.toLowerCase();
    return savedStudentMappings.filter(
      (m) =>
        (m.student_name || '').toLowerCase().includes(term) ||
        (m.student_code || '').toLowerCase().includes(term) ||
        (m.course_name || '').toLowerCase().includes(term) ||
        (m.session_year || '').toLowerCase().includes(term)
    );
  }, [savedStudentMappings, savedSearchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Banner Header */}
      <div className="relative bg-gradient-to-r from-blue-800 via-blue-700 to-sky-700 text-white p-6 sm:p-8 rounded-3xl overflow-hidden shadow-lg shadow-blue-800/10 border border-blue-900/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 pointer-events-none flex items-center justify-center">
          <Layers className="w-64 h-64 transform translate-x-20 translate-y-10" />
        </div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Student Curriculum Mapping
            </h2>
            <p className="text-blue-100/90 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Map registered student choices to the course curriculum. When multiple subject groups exist for a codification, pick the required group from the dropdown.
            </p>
          </div>
        </div>

        {/* Navigation Button */}
        <div className="relative z-10">
          {activeTab === 'SAVED' ? (
            <button
              onClick={() => setActiveTabState('CREATE')}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer bg-white text-blue-800 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              Create Student Curriculum
            </button>
          ) : (
            <button
              onClick={() => setActiveTabState('SAVED')}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer bg-white text-blue-800 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
            >
              <span>Saved Student Curriculums</span>
              <span className="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded-full font-semibold">
                {savedStudentMappings.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {activeTab === 'CREATE' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student & Course Selection Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    1. Select Registered Student
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose from active student master records
                  </p>
                </div>
              </div>

              {/* Student Search Dropdown */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Registered Student
                </label>
                <div className="relative">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white"
                  >
                    <option value="">-- Choose a Student --</option>
                    {filteredStudentDropdown.map((s) => {
                      const stId = s.student_id || s.id;
                      return (
                        <option key={stId} value={stId}>
                          {s.first_name} {s.last_name || ''} ({generateStudentId(s, courses)})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Student Profile Card (if selected) */}
              {selectedStudent ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    {selectedStudent.profile_picture_url ? (
                      <img
                        src={selectedStudent.profile_picture_url}
                        alt="Student"
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {selectedStudent.first_name?.[0]}
                        {selectedStudent.last_name?.[0]}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {selectedStudent.first_name} {selectedStudent.last_name}
                      </h4>
                      <p className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                        {generateStudentId(selectedStudent, courses, selectedCourseId, studentSession)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Academic Session
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {studentSession?.session_year || selectedStudent?.session_from?.session_year || selectedStudent?.session_year || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Aadhar Number
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {selectedStudent.aadhar_number || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-dashed border-blue-200 dark:border-blue-900/40 rounded-2xl text-center">
                  <Info className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    Select a student above to load their course details and curriculum mapping choices.
                  </p>
                </div>
              )}

              {/* Student Course Selection */}
              {selectedStudent && (
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    2. Enrolled Course in Student Master
                  </label>
                  {studentAvailableCourses.length > 0 ? (
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white"
                    >
                      {studentAvailableCourses.map((c) => {
                        const cId = c.course_id || c.id;
                        return (
                          <option key={cId} value={cId}>
                            {c.course_name || c.name} ({c.course_code || c.code})
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <p className="text-xs text-rose-500 font-semibold italic">
                      No valid course enrolled for this student in Student Master.
                    </p>
                  )}
                </div>
              )}

              {/* Semester Selection */}
              {selectedStudent && selectedCourseId && availableSemesters.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    3. Select Semester
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white"
                  >
                    {availableSemesters.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Curriculum Mapping Grid & Subject Group Selection */}
          <div className="lg:col-span-8 space-y-6">
            {!selectedStudent ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
                <GraduationCap className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                  No Student Selected
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                  Please pick a student from the dropdown menu on the left to view and configure their course curriculum mapping.
                </p>
              </div>
            ) : Object.keys(curriculumBySemester).length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-amber-300 dark:border-amber-900/50 shadow-sm p-10 text-center flex flex-col items-center justify-center min-h-[380px]">
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-full text-amber-600 mb-3">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  No Curriculum Created Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 leading-relaxed">
                  There is no curriculum mapped in the <strong>Curriculum Mapping</strong> module for the selected course and session. Please create a curriculum entry for this course first.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Curriculum Structure & Subject Group Assignment
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Codifications with multiple subject groups will display a dropdown for subject group selection.
                    </p>
                  </div>
                  {/* <button
                    onClick={handleSaveMapping}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save Student Curriculum
                  </button> */}
                </div>

                {/* Semesters Loop - filtered by selected semester */}
                <div className="space-y-6">
                  {Object.keys(curriculumBySemester)
                    .filter((semester) => !selectedSemester || semester === selectedSemester)
                    .map((semester) => {
                    const codificationsList = curriculumBySemester[semester];

                    return (
                      <div
                        key={semester}
                        className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/40 dark:bg-slate-950/40"
                      >
                        {/* Semester Header */}
                        <div className="bg-slate-100/80 dark:bg-slate-800/80 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            {semester}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700">
                            {codificationsList.length} Codification(s)
                          </span>
                        </div>

                        {/* Codifications Table/List */}
                        <div className="p-4 space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                          {codificationsList.map((item) => {
                            const { codificationId, codification, subjectGroupIds } = item;
                            const currentGroupSelection =
                              currentSelections[semester]?.[codificationId]?.groupId || '';
                            const currentSubjectSelection =
                              currentSelections[semester]?.[codificationId]?.subjectId || '';

                            const codCode =
                              codification?.codification_code || codification?.code || 'COD';
                            const codName =
                              codification?.codification_name || codification?.name || 'Codification';

                            // Available subjects under the selected subject group AND matching the specific codification (e.g. MJ1)
                            const availableSubjectsForGroup = subjects.filter((s) => {
                              if (!currentGroupSelection) return false;
                              const sgId =
                                s.bucket_subject_group_id?.toString() || s.subject_group_id?.toString();
                              if (sgId !== currentGroupSelection.toString()) return false;
                              if (s.status && s.status !== 'Active') return false;

                              // Check codification match:
                              // 1. Direct codification_id match if present
                              if (s.codification_id && codificationId) {
                                if (s.codification_id.toString() === codificationId.toString()) {
                                  return true;
                                }
                              }

                              // 2. Fallback match by codification code in subject code or subject name/type
                              if (codCode) {
                                const cleanCodCode = codCode.replace(/[^A-Z0-9]/gi, '').toLowerCase();
                                const cleanSubCode = (s.code || '').replace(/[^A-Z0-9]/gi, '').toLowerCase();
                                const cleanSubName = (s.name || '').replace(/[^A-Z0-9]/gi, '').toLowerCase();
                                if (cleanSubCode.includes(cleanCodCode) || cleanSubName.includes(cleanCodCode)) {
                                  return true;
                                }
                              }

                              // If codification_id is missing on subject and code doesn't match, return false
                              // If codification_id was present but didn't match codificationId, return false
                              return !s.codification_id && !codCode;
                            });

                            const hasMultipleGroups = subjectGroupIds.length > 1;

                            return (
                              <div
                                key={codificationId}
                                className="pt-4 first:pt-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-start"
                              >
                                {/* Codification Info */}
                                <div className="md:col-span-4 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs rounded border border-blue-200 dark:border-blue-800">
                                      {codCode}
                                    </span>
                                    {hasMultipleGroups && (
                                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[10px] rounded border border-amber-200 dark:border-amber-800">
                                        Multiple Groups ({subjectGroupIds.length})
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="font-bold text-slate-800 dark:text-white text-xs mt-1">
                                    {codName}
                                  </h5>
                                </div>

                                {/* Subject Group Selection (Single fixed badge vs Dropdown) */}
                                <div className="md:col-span-4 space-y-1.5">
                                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Subject Group
                                  </label>
                                  {hasMultipleGroups ? (
                                    /* MULTIPLE GROUPS: Show Dropdown! */
                                    <select
                                      value={currentGroupSelection}
                                      onChange={(e) =>
                                        handleGroupChange(semester, codificationId, e.target.value)
                                      }
                                      className="w-full px-3 py-2 bg-amber-50/50 dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-white shadow-xs"
                                    >
                                      <option value="">-- Choose Subject Group --</option>
                                      {subjectGroupIds.map((gId) => (
                                        <option key={gId} value={gId?.toString()}>
                                          {getGroupName(gId)}
                                        </option>
                                      ))}
                                    </select>
                                  ) : subjectGroupIds.length === 1 ? (
                                    /* SINGLE GROUP: Show fixed badge */
                                    <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      <span className="truncate">{getGroupName(subjectGroupIds[0])}</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">No group linked</span>
                                  )}
                                </div>

                                {/* Specific Subject Selection */}
                                <div className="md:col-span-4 space-y-1.5">
                                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Mapped Subject
                                  </label>
                                  <select
                                    value={currentSubjectSelection}
                                    onChange={(e) =>
                                      handleSubjectChange(semester, codificationId, e.target.value)
                                    }
                                    disabled={!currentGroupSelection}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800/50"
                                  >
                                    <option value="">
                                      {!currentGroupSelection
                                        ? '-- Select Group First --'
                                        : availableSubjectsForGroup.length === 0
                                        ? `No Subjects Available for ${codCode}`
                                        : '-- Select Subject --'}
                                    </option>
                                    {availableSubjectsForGroup.map((sub) => {
                                      const sId = sub.subject_id || sub.id;
                                      return (
                                        <option key={sId} value={sId?.toString()}>
                                          {sub.subject_name || sub.name} ({sub.subject_code || sub.code})
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveMapping}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save Student Curriculum
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SAVED MAPPINGS TAB */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Saved Student Curriculums
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                List of all configured student curriculum choices
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search by student name, code, course..."
                value={savedSearchTerm}
                onChange={(e) => setSavedSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            </div>
          </div>

          {filteredSavedMappings.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
              <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No saved curriculum found
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Configure student curriculum mappings under the "Create Student Curriculum" tab.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-sm uppercase font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Student Info</th>
                    <th className="px-6 py-4">Session & Course</th>
                    <th className="px-6 py-4">Curriculum Selections</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSavedMappings.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {m.student_name}
                          </span>
                          <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                            {m.student_code}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                            {m.course_name}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                            Session: {m.session_year}
                          </span>
                        </div>
                      </td>
                                            <td className="px-6 py-4">
                        {Object.keys(m.semester_mappings || {}).length > 0 ? (
                          <button
                            onClick={() => {
                              setViewingMapping(m);
                              const semesters = Object.keys(m.semester_mappings || {});
                              setModalActiveSemester(semesters[0] || '');
                            }}
                            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors shadow-sm cursor-pointer"
                          >
                            <Eye className="w-4 h-4" /> View Curriculum
                          </button>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500 italic">No mapping configured</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedStudentId(m.student_id);
                              setSelectedCourseId(m.course_id);
                              setActiveTabState('CREATE');
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Edit Mapping"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setMappingToDelete(m);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Delete Mapping"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setMappingToDelete(null);
        }}
        onConfirm={handleDeleteMapping}
        title="Delete Student Curriculum Mapping"
        message={`Are you sure you want to delete the mapping for ${mappingToDelete?.student_name}? This action cannot be undone.`}
        confirmText="Delete Mapping"
      />

      {/* View Curriculum Modal */}
      {viewingMapping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800 animate-in scale-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/20">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Student Curriculum Details
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Showing curriculum selections for <span className="font-bold text-slate-800 dark:text-slate-200">{viewingMapping.student_name}</span> ({viewingMapping.student_code})
                </p>
              </div>
              <button
                onClick={() => setViewingMapping(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Semester Tabs */}
            <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-950/10 border-b border-slate-100 dark:border-slate-800/60 overflow-x-auto flex gap-2">
              {Object.keys(viewingMapping.semester_mappings || {}).map((sem) => (
                <button
                  key={sem}
                  onClick={() => setModalActiveSemester(sem)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    modalActiveSemester === sem
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {sem}
                </button>
              ))}
            </div>

            {/* Modal Content / Table */}
            <div className="p-6 overflow-y-auto flex-1 min-h-[300px]">
              {modalActiveSemester ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Codification Code</th>
                        <th className="px-4 py-3">Subject Group</th>
                        <th className="px-4 py-3">Actual Subject</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(() => {
                        const semCods = viewingMapping.semester_mappings[modalActiveSemester] || {};
                        const codIds = Object.keys(semCods);
                        if (codIds.length === 0) {
                          return (
                            <tr>
                              <td colSpan="3" className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 italic">
                                No mappings configured for this semester.
                              </td>
                            </tr>
                          );
                        }
                        return codIds.map((codId) => {
                          const sel = semCods[codId];
                          const codObj = codifications.find(
                            (c) =>
                              (c.codification_id?.toString() || c.id?.toString()) ===
                              codId.toString()
                          );
                          return (
                            <tr key={codId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                                {codObj?.codification_code || codObj?.code || 'COD'}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                                {getGroupName(sel.groupId)}
                              </td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                                {sel.subjectId ? getSubjectName(sel.subjectId) : (
                                  <span className="text-slate-400 dark:text-slate-500 italic">No subject selected</span>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 italic">
                  Select a semester tab to view curriculum details.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex justify-end">
              <button
                onClick={() => setViewingMapping(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
