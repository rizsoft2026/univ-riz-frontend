import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Layers, CheckCircle, XCircle, AlertCircle, ArrowRight, CornerRightDown, Loader2, Calendar, GraduationCap, BookOpen, FolderGit, ChevronDown } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { useCurriculumMappings, useCreateCurriculumMapping, useUpdateCurriculumMapping, useDeleteCurriculumMapping } from '../hooks/useCurriculumMappings';
import { useSessions } from '../hooks/useSessions';
import { useCourses } from '../hooks/useCourses';
import { useCodifications } from '../hooks/useCodifications';
import { useSessionCourseMappings } from '../hooks/useSessionCourseMappings';
import { useSubjectGroups } from '../hooks/useSubjectGroups';
import { useSubjects } from '../hooks/useSubjects';
import { useOnClickOutside } from 'usehooks-ts';

const SEMESTER_OPTIONS = [
  'Semester I',
  'Semester II',
  'Semester III',
  'Semester IV',
  'Semester V',
  'Semester VI',
  'Semester VII',
  'Semester VIII'
];

export default function CurriculumMapping({ setActiveTab, showNotification }) {
  // Fetch data using React Query
  const { data: curriculumMappings = [], isLoading: isLoadingMappings } = useCurriculumMappings();
  const { data: sessions = [], isLoading: isLoadingSessions } = useSessions();
  const { data: courses = [], isLoading: isLoadingCourses } = useCourses();
  const { data: codifications = [], isLoading: isLoadingCodifications } = useCodifications();
  const { data: sessionCourseMappings = [], isLoading: isLoadingSessionCourseMappings } = useSessionCourseMappings();
  const { data: subjectGroups = [], isLoading: isLoadingSubjectGroups } = useSubjectGroups();
  const { data: subjects = [], isLoading: isLoadingSubjects } = useSubjects();

  const createMutation = useCreateCurriculumMapping();
  const updateMutation = useUpdateCurriculumMapping();
  const deleteMutation = useDeleteCurriculumMapping();
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sessionFilter, setSessionFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [mappingToDelete, setMappingToDelete] = useState(null);
  const [isAddMappingOpen, setIsAddMappingOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    sessionId: '',
    courseId: '',
    semester: '',
    subjectGroupId: '',
    codificationId: '',
    status: 'Active',
  });
  const [errors, setErrors] = useState({});

  // Dropdown states
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const [sessionSearchTerm, setSessionSearchTerm] = useState('');
  const sessionDropdownRef = React.useRef(null);
  useOnClickOutside(sessionDropdownRef, () => setIsSessionDropdownOpen(false));

  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const courseDropdownRef = React.useRef(null);
  useOnClickOutside(courseDropdownRef, () => setIsCourseDropdownOpen(false));

  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
  const [semesterSearchTerm, setSemesterSearchTerm] = useState('');
  const semesterDropdownRef = React.useRef(null);
  useOnClickOutside(semesterDropdownRef, () => setIsSemesterDropdownOpen(false));

  const [isCodificationDropdownOpen, setIsCodificationDropdownOpen] = useState(false);
  const [codificationSearchTerm, setCodificationSearchTerm] = useState('');
  const codificationDropdownRef = React.useRef(null);
  useOnClickOutside(codificationDropdownRef, () => setIsCodificationDropdownOpen(false));

  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const groupDropdownRef = React.useRef(null);
  useOnClickOutside(groupDropdownRef, () => setIsGroupDropdownOpen(false));

  const lastEditedSessionId = React.useRef(null);


  // Helper functions
  const getSessionName = (id) => sessions.find((s) => s.id === id)?.sessionYear || 'Unknown Session';
  const getCourseName = (id) => courses.find((c) => c.id === id)?.name || 'Unknown Course';
  const getCodificationCode = (id) => codifications.find((c) => c.id === id)?.code || 'Unknown Code';
  const getSubjectGroupName = (id) => {
    if (id === 'unknown') return 'Unknown Group';
    const group = subjectGroups.find((g) => g.id === id);
    return group ? `${group.name} (${group.code})` : 'Unknown Group';
  };

  // Derivations for dependent data
  const availableSessions = useMemo(() => {
    const activeSessionCourseMappings = sessionCourseMappings.filter(m => m.status === 'Active');
    const mappedSessionIds = new Set(activeSessionCourseMappings.map(m => m.session_id));
    return sessions.filter(s => s.status === 'Active' && mappedSessionIds.has(s.id));
  }, [sessions, sessionCourseMappings]);

  // Derived states for dependent dropdowns
  const availableCoursesForSession = useMemo(() => {
    if (!formData.sessionId) return [];
    const activeSessionCourseMappings = sessionCourseMappings.filter(m => m.status === 'Active');
    const mappingsForSession = activeSessionCourseMappings.filter((m) => m.session_id === formData.sessionId);
    return mappingsForSession.map((m) => courses.find((c) => c.id === m.course_id && c.status === 'Active')).filter(Boolean);
  }, [formData.sessionId, sessionCourseMappings, courses]);

  const selectedCodification = useMemo(() => {
    if (!formData.codificationId) return null;
    return codifications.find(c => c.id === formData.codificationId) || null;
  }, [formData.codificationId, codifications]);

  const getCodificationType = (codification) => {
    if (!codification) return 'INDEPENDENT';
    const code = (codification.code || '').toUpperCase().trim();
    const category = (codification.category || '').toUpperCase().trim();

    // Major check
    if (category.includes('MAJOR') || /^MJ/.test(code)) {
      return 'MAJOR';
    }

    // SEC check
    if (category.includes('SKILL ENHANCEMENT') || /^SEC/.test(code)) {
      return 'SEC';
    }

    // Even Minor Series check (MN2A, MN-2A, MN2B, MN-2B, MN2, MN4, MN6, MN8)
    if (/^MN-?[2468]/i.test(code)) {
      return 'INDEPENDENT';
    }

    // Odd Minor Series check (MN-1A, MN1A, MN-1B, MN1B, MN-1C, MN1C, MN1, MN3, MN5, MN7)
    if (/^MN-?1[A-Z]?$/i.test(code) || /^MN-?[1357][A-Z]?$/i.test(code) || category.includes('MINOR')) {
      return 'ODD_MINOR_SERIES';
    }

    // Independent Groups & Minors (VAC, AEC, MDC, Project, Internship, etc.)
    return 'INDEPENDENT';
  };

  const codificationType = useMemo(() => {
    return getCodificationType(selectedCodification);
  }, [selectedCodification]);

  const groupLabel = codificationType === 'ODD_MINOR_SERIES' ? 'Minor' : 'Major';

  const availableSubjectGroupsForCourse = useMemo(() => {
    if (!formData.courseId || !formData.codificationId) return [];

    const selectedCourse = courses.find((c) => c.id === formData.courseId);
    const selectedCodificationObj = codifications.find((c) => c.id === formData.codificationId);
    if (!selectedCourse || !selectedCodificationObj) return [];

    const codType = getCodificationType(selectedCodificationObj);

    if (codType === 'ODD_MINOR_SERIES') {
      // 1. Check if ANY odd minor mapping (MN-1x) was previously saved for this Session + Course
      const existingMinorMapping = curriculumMappings.find((m) => {
        if (m.session_id !== formData.sessionId || m.course_id !== formData.courseId) return false;
        if (editingMapping && m.id === editingMapping.id) return false;
        if (!m.bucket_subject_group_id) return false;

        const savedCod = codifications.find((c) => c.id === m.codification_id);
        if (!savedCod) return false;

        return getCodificationType(savedCod) === 'ODD_MINOR_SERIES';
      });

      if (existingMinorMapping) {
        // Auto-lock/restrict to the same Subject Group chosen for MN-1A (e.g., Chemistry)
        return subjectGroups.filter(
          (g) => g.status === 'Active' && g.id === existingMinorMapping.bucket_subject_group_id
        );
      }

      // 2. If no previous MN-1x mapping saved yet, resolve minor subject groups configured in SessionCourseMapping
      const sessionCourseMapping = sessionCourseMappings.find(
        (m) => m.session_id === formData.sessionId && m.course_id === formData.courseId
      );

      const minorCourseIds = sessionCourseMapping?.minor_course_subject_ids || [];
      const minorCourseGroups = courses
        .filter((c) => minorCourseIds.includes(c.id))
        .map((c) => c.subject_group_id)
        .filter(Boolean);

      if (minorCourseGroups.length > 0) {
        return subjectGroups.filter(
          (g) =>
            g.status === 'Active' &&
            g.id !== selectedCourse.subject_group_id &&
            minorCourseGroups.includes(g.id)
        );
      }
    }

    // For all other codifications (Major, SEC, MDC, VAC, AEC, MN2A, MN-2A, etc.)
    // We restrict groups to the ones mapped to this codification code in CodificationMaster
    const code = selectedCodificationObj.code;
    const mappedGroupIds = codifications
      .filter(c => c.code === code && c.subjectGroupId)
      .map(c => c.subjectGroupId);

    return subjectGroups.filter((g) =>
      g.status === 'Active' &&
      (mappedGroupIds.length === 0 || mappedGroupIds.includes(g.id))
    );
  }, [
    formData.sessionId,
    formData.courseId,
    formData.codificationId,
    courses,
    codifications,
    subjectGroups,
    sessionCourseMappings,
    curriculumMappings,
    editingMapping,
  ]);

  const filteredSessionsDropdown = useMemo(() => {
    if (!Array.isArray(availableSessions)) return [];
    return availableSessions.filter(s =>
      s && (s.sessionYear || '').toLowerCase().includes((sessionSearchTerm || '').toLowerCase())
    );
  }, [availableSessions, sessionSearchTerm]);

  const filteredCoursesDropdown = useMemo(() => {
    if (!Array.isArray(availableCoursesForSession)) return [];
    return availableCoursesForSession.filter(c =>
      c && ((c.name || '').toLowerCase().includes((courseSearchTerm || '').toLowerCase()) ||
        (c.code || '').toLowerCase().includes((courseSearchTerm || '').toLowerCase()))
    );
  }, [availableCoursesForSession, courseSearchTerm]);

  const selectedSessionCourseMapping = useMemo(() => {
    if (!formData.sessionId || !formData.courseId) return null;
    return sessionCourseMappings.find(m => m.session_id === formData.sessionId && m.course_id === formData.courseId) || null;
  }, [formData.sessionId, formData.courseId, sessionCourseMappings]);

  const isYearWise = selectedSessionCourseMapping?.courseType === 'Year Wise';

  const termOptions = useMemo(() => {
    if (!selectedSessionCourseMapping) return SEMESTER_OPTIONS;
    const duration = parseInt(selectedSessionCourseMapping.courseDuration, 10) || (isYearWise ? 4 : 8);
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return Array.from({ length: duration }, (_, i) =>
      isYearWise ? `Year ${i + 1}` : `Semester ${romanNumerals[i] || (i + 1)}`
    );
  }, [selectedSessionCourseMapping, isYearWise]);

  const filteredSemestersDropdown = useMemo(() => {
    return termOptions.filter(sem =>
      sem.toLowerCase().includes(semesterSearchTerm.toLowerCase())
    );
  }, [semesterSearchTerm, termOptions]);

  // Derived states for filter dropdowns to only show options with data
  const filterDropdownSessions = useMemo(() => {
    const mappedSessionIds = new Set(curriculumMappings.map(m => m.session_id));
    return availableSessions.filter(s => mappedSessionIds.has(s.id));
  }, [availableSessions, curriculumMappings]);

  const filterDropdownCourses = useMemo(() => {
    const filteredMappings = curriculumMappings.filter(m => sessionFilter === 'ALL' || m.session_id === sessionFilter);
    const mappedCourseIds = new Set(filteredMappings.map(m => m.course_id));
    return courses.filter(c => c.status === 'Active' && mappedCourseIds.has(c.id));
  }, [courses, curriculumMappings, sessionFilter]);

  const filterDropdownSemesters = useMemo(() => {
    const filteredMappings = curriculumMappings.filter(m => {
      const matchSession = sessionFilter === 'ALL' || m.session_id === sessionFilter;
      const matchCourse = courseFilter === 'ALL' || m.course_id === courseFilter;
      return matchSession && matchCourse;
    });
    const mappedSemesters = Array.from(new Set(filteredMappings.map(m => m.semester).filter(Boolean)));
    return mappedSemesters.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [curriculumMappings, sessionFilter, courseFilter]);

  const filteredCodificationsDropdown = useMemo(() => {
    if (!Array.isArray(codifications)) return [];
    const unique = [];
    const seen = new Set();
    codifications.forEach(c => {
      if (c && c.status === 'Active' && !seen.has(c.code)) {
        seen.add(c.code);
        if (
          (c.code || '').toLowerCase().includes((codificationSearchTerm || '').toLowerCase()) ||
          (c.category || '').toLowerCase().includes((codificationSearchTerm || '').toLowerCase())
        ) {
          unique.push(c);
        }
      }
    });
    return unique;
  }, [codifications, codificationSearchTerm]);

  const filteredGroupsDropdown = useMemo(() => {
    if (!Array.isArray(availableSubjectGroupsForCourse)) return [];
    return availableSubjectGroupsForCourse.filter(g =>
      g && ((g.name || '').toLowerCase().includes((groupSearchTerm || '').toLowerCase()) ||
        (g.code || '').toLowerCase().includes((groupSearchTerm || '').toLowerCase()))
    );
  }, [availableSubjectGroupsForCourse, groupSearchTerm]);

  // Auto-select single option or sync subjectGroupId/codificationId when choices change
  React.useEffect(() => {
    if (!isFormOpen) return;
    const code = selectedCodification?.code;
    if (availableSubjectGroupsForCourse.length === 1) {
      const singleGroupId = availableSubjectGroupsForCourse[0].id;
      if (formData.subjectGroupId !== singleGroupId) {
        const matchingCod = codifications.find(c => c.code === code && c.subjectGroupId === singleGroupId);
        setFormData((prev) => ({
          ...prev,
          subjectGroupId: singleGroupId,
          codificationId: matchingCod ? matchingCod.id : prev.codificationId
        }));
      }
    } else if (
      formData.subjectGroupId &&
      !availableSubjectGroupsForCourse.some((g) => g.id === formData.subjectGroupId)
    ) {
      setFormData((prev) => ({ ...prev, subjectGroupId: '' }));
    }
  }, [availableSubjectGroupsForCourse, isFormOpen, selectedCodification, codifications]);

  // Handle opening form for Create
  const handleCreateOpen = () => {
    if (sessions.length === 0 || courses.length === 0 || codifications.length === 0) {
      showNotification('Missing master data required to create a curriculum mapping.', 'warning');
      return;
    }

    setEditingMapping(null);
    setFormData({
      sessionId: '',
      courseId: '',
      semester: '',
      subjectGroupId: '',
      codificationId: '',
      status: 'Active',
    });
    setErrors({});
    setIsFormOpen(true);
  };

  // Handle opening form for Create from a specific course/semester
  const handleCreateOpenForCourse = (sessionId, courseId, semester) => {
    if (sessions.length === 0 || courses.length === 0 || codifications.length === 0) {
      showNotification('Missing master data required to create a curriculum mapping.', 'warning');
      return;
    }

    setEditingMapping(null);
    setFormData({
      sessionId: sessionId || '',
      courseId: courseId || '',
      semester: semester || '',
      subjectGroupId: '',
      codificationId: '',
      status: 'Active',
    });
    setErrors({});
    setIsAddMappingOpen(true);
  };

  // Handle opening form for Edit
  const handleEditOpen = (mapping) => {
    lastEditedSessionId.current = mapping.session_id;
    setEditingMapping(mapping);
    setIsAddMappingOpen(true);
    setFormData({
      sessionId: mapping.session_id,
      courseId: mapping.course_id,
      semester: mapping.semester,
      subjectGroupId: mapping.bucket_subject_group_id || '',
      codificationId: mapping.codification_id,
      status: mapping.status,
    });
    setErrors({});

    setTimeout(() => {
      const formElement = document.getElementById('add-mapping-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'sessionId') {
        next.courseId = '';
        next.subjectGroupId = '';
      }
      if (name === 'courseId' || name === 'codificationId') {
        next.subjectGroupId = '';
      }
      return next;
    });
  };

  // Validate form
  const validateForm = () => {
    const tempErrors = {};

    if (!formData.sessionId) tempErrors.sessionId = 'Academic Session is required.';
    if (!formData.courseId) tempErrors.courseId = 'Course is required.';
    if (!formData.semester) tempErrors.semester = 'Semester is required.';
    if (!formData.subjectGroupId) tempErrors.subjectGroupId = 'Subject Group is required.';
    if (!formData.codificationId) tempErrors.codificationId = 'Codification is required.';

    // Check unique combination (session + course + semester + codification + subject group)
    const duplicate = curriculumMappings.find(
      (m) =>
        m.session_id === formData.sessionId &&
        m.course_id === formData.courseId &&
        m.semester === formData.semester &&
        m.codification_id === formData.codificationId &&
        m.bucket_subject_group_id === formData.subjectGroupId &&
        (!editingMapping || m.id !== editingMapping.id)
    );

    if (duplicate) {
      tempErrors.general = 'This mapping already exists.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Form Submit (Create/Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const course = courses.find((c) => c.id === formData.courseId);

    if (editingMapping) {
      // Update
      updateMutation.mutate({
        id: editingMapping.id,
        sessionId: formData.sessionId,
        courseId: formData.courseId,
        codificationId: formData.codificationId,
        bucketSubjectGroupId: formData.subjectGroupId || null,
        semester: formData.semester,
        status: formData.status
      }, {
        onSuccess: () => {
          showNotification('Curriculum Mapping updated successfully!', 'success');
          setEditingMapping(null);
          setFormData({ sessionId: '', courseId: '', semester: '', subjectGroupId: '', codificationId: '', status: 'Active' });

          if (lastEditedSessionId.current) {
            setTimeout(() => {
              const sessionElement = document.getElementById(`session-${lastEditedSessionId.current}`);
              if (sessionElement) {
                sessionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
              lastEditedSessionId.current = null;
            }, 100);
          }
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
        codificationId: formData.codificationId,
        bucketSubjectGroupId: formData.subjectGroupId || null,
        semester: formData.semester,
        status: formData.status
      }, {
        onSuccess: () => {
          showNotification('Curriculum Mapping created successfully!', 'success');
          setFormData({ sessionId: '', courseId: '', semester: '', subjectGroupId: '', codificationId: '', status: 'Active' });
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
        showNotification('Curriculum Mapping deleted successfully!', 'success');
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
    return curriculumMappings.filter((m) => {
      const session = sessions.find(s => s.id === m.session_id);
      const course = courses.find(c => c.id === m.course_id);
      const codification = codifications.find(c => c.id === m.codification_id);

      if (!session || session.status !== 'Active' ||
        !course || course.status !== 'Active' ||
        !codification || codification.status !== 'Active') {
        return false;
      }

      const sessionCourseMapping = sessionCourseMappings.find(
        scm => scm.session_id === m.session_id && scm.course_id === m.course_id
      );

      if (!sessionCourseMapping || sessionCourseMapping.status !== 'Active') {
        return false;
      }

      const courseName = (course.name || '').toLowerCase();
      const semester = (m.semester || '').toLowerCase();
      const search = (searchTerm || '').toLowerCase();

      const matchSearch = courseName.includes(search) || semester.includes(search);

      const matchStatus = statusFilter === 'ALL' || (m.status || '').toUpperCase() === statusFilter;
      const matchSession = sessionFilter === 'ALL' || m.session_id === sessionFilter;
      const matchCourse = courseFilter === 'ALL' || m.course_id === courseFilter;
      const matchSemester = semesterFilter === 'ALL' || m.semester === semesterFilter;

      return matchSearch && matchStatus && matchSession && matchCourse && matchSemester;
    });
  }, [curriculumMappings, searchTerm, statusFilter, sessionFilter, courseFilter, semesterFilter, courses, sessions, codifications, sessionCourseMappings]);

  const groupedMappings = useMemo(() => {
    const grouped = {};

    filteredMappings.forEach(mapping => {
      const subjectGroupId = mapping.bucket_subject_group_id || 'unknown';
      const codification = codifications.find(c => c.id === mapping.codification_id);
      const isMinor = codification && (
        (codification.category || '').toLowerCase().includes('minor') ||
        (codification.code || '').toLowerCase().includes('minor')
      );
      const type = isMinor ? 'Minor' : 'Major';

      if (!grouped[mapping.session_id]) {
        grouped[mapping.session_id] = {};
      }
      if (!grouped[mapping.session_id][mapping.course_id]) {
        grouped[mapping.session_id][mapping.course_id] = {};
      }
      if (!grouped[mapping.session_id][mapping.course_id][mapping.semester]) {
        grouped[mapping.session_id][mapping.course_id][mapping.semester] = {};
      }
      if (!grouped[mapping.session_id][mapping.course_id][mapping.semester][subjectGroupId]) {
        grouped[mapping.session_id][mapping.course_id][mapping.semester][subjectGroupId] = {};
      }
      if (!grouped[mapping.session_id][mapping.course_id][mapping.semester][subjectGroupId][type]) {
        grouped[mapping.session_id][mapping.course_id][mapping.semester][subjectGroupId][type] = [];
      }

      grouped[mapping.session_id][mapping.course_id][mapping.semester][subjectGroupId][type].push(mapping);
    });

    return grouped;
  }, [filteredMappings, codifications]);

  const flattenedTableData = useMemo(() => {
    const rows = [];

    Object.keys(groupedMappings).forEach((sessionId) => {
      const sessionCourses = groupedMappings[sessionId];
      let sessionRowSpan = 0;
      const sessionStartIdx = rows.length;

      Object.keys(sessionCourses).forEach((courseId) => {
        const courseSemesters = sessionCourses[courseId];
        let courseRowSpan = 0;
        const courseStartIdx = rows.length;

        Object.keys(courseSemesters).forEach((semester) => {
          const semesterGroups = courseSemesters[semester];
          let semesterRowSpan = 0;
          const semesterStartIdx = rows.length;

          Object.keys(semesterGroups).forEach((subjectGroupId) => {
            const groupTypes = semesterGroups[subjectGroupId];
            let groupRowSpan = 0;
            const groupStartIdx = rows.length;

            Object.keys(groupTypes).forEach((type) => {
              const subjectsList = groupTypes[type];
              const typeRowSpan = subjectsList.length;
              const typeStartIdx = rows.length;

              subjectsList.forEach((mapping) => {
                rows.push({
                  mapping,
                  sessionId,
                  courseId,
                  semester,
                  subjectGroupId,
                  type,
                  isFirstInSession: rows.length === sessionStartIdx,
                  isFirstInCourse: rows.length === courseStartIdx,
                  isFirstInSemester: rows.length === semesterStartIdx,
                  isFirstInGroup: rows.length === groupStartIdx,
                  isFirstInType: rows.length === typeStartIdx,
                });
              });

              groupRowSpan += typeRowSpan;
            });

            if (rows[groupStartIdx]) rows[groupStartIdx].groupRowSpan = groupRowSpan;
            semesterRowSpan += groupRowSpan;
          });

          if (rows[semesterStartIdx]) rows[semesterStartIdx].semesterRowSpan = semesterRowSpan;
          courseRowSpan += semesterRowSpan;
        });

        if (rows[courseStartIdx]) rows[courseStartIdx].courseRowSpan = courseRowSpan;
        sessionRowSpan += courseRowSpan;
      });

      if (rows[sessionStartIdx]) rows[sessionStartIdx].sessionRowSpan = sessionRowSpan;
    });

    return rows;
  }, [groupedMappings]);

  const isLoadingDependencies = isLoadingSessions || isLoadingCourses || isLoadingCodifications;
  const hasDependencies = sessions.length > 0 && courses.length > 0 && codifications.length > 0;

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {isLoadingDependencies ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500">Loading master dependencies...</p>
        </div>
      ) : !hasDependencies ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-full text-amber-500 mb-4">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Master Data Required</h3>
          <p className="text-slate-400 dark:text-slate-400 max-w-md mt-2 text-sm leading-relaxed">
            You must have at least one Session, Course, Subject, and Codification code created before you can configure the curriculum.
          </p>
        </div>
      ) : (
        <>

          {/* Header Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-blue-700 to-sky-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-600/10">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
                <Layers className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Curriculum Mapping</h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-0.5">Configure the academic curriculum by mapping sessions, courses, semesters, subjects, and codification codes.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <button
                onClick={() => setIsAddMappingOpen(!isAddMappingOpen)}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 active:bg-blue-100 rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Mapping
              </button>
            </div>
          </div>

          {/* Main Content Area (Table + Filters) */}
          <div className="space-y-5">

            {/* Search & Filter Bar */}
            <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-blue-100/80 dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-slate-800 shadow-xs max-w-full overflow-hidden">

              {/* Filters (Now on left) */}
              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">

                {/* Session Filter */}
                <select
                  value={sessionFilter}
                  onChange={(e) => setSessionFilter(e.target.value)}
                  className="flex-1 sm:flex-none max-w-full sm:max-w-[140px] truncate pl-3.5 pr-8 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-white/60 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                >
                  <option value="ALL">All Sessions</option>
                  {filterDropdownSessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.sessionYear}</option>
                  ))}
                </select>

                {/* Course Filter */}
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="flex-1 sm:flex-none max-w-full sm:max-w-[150px] truncate pl-3.5 pr-8 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-white/60 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                >
                  <option value="ALL">All Courses</option>
                  {filterDropdownCourses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* Semester Filter */}
                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="flex-1 sm:flex-none max-w-full sm:max-w-[140px] truncate pl-3.5 pr-8 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-white/60 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                >
                  <option value="ALL">All Semesters</option>
                  {filterDropdownSemesters.map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>

              </div>

              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                {/* Search (Now on right) */}
                <div className="relative w-full sm:w-72 shrink-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Course, Semester or Subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-950/40 border border-white/60 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-white placeholder:text-slate-400 shadow-sm"
                  />
                </div>

                {/* Status Tab Filter (Now on right) */}
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

            {/* Modal Add/Edit Form Section */}
            <Modal
              isOpen={isAddMappingOpen}
              onClose={() => {
                setIsAddMappingOpen(false);
                if (editingMapping) setEditingMapping(null);
                setFormData({ sessionId: '', courseId: '', semester: '', subjectGroupId: '', codificationId: '', status: 'Active' });
                setErrors({});
              }}
              title={editingMapping ? 'Edit Mapping Details' : 'Add Mapping'}
            >
              <form onSubmit={handleSubmit} id="add-mapping-form" className="space-y-6">
                {errors.general && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/40 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.general}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Academic Session Dropdown */}
                  <div className="space-y-1">
                    <label htmlFor="sessionId" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Academic Session
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
                              const s = availableSessions.find(s => s.id === formData.sessionId);
                              return s ? s.sessionYear : 'Session';
                            })()
                            : 'Session'}
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

                    {errors.sessionId && <p className="text-red-500 text-xs mt-1">{errors.sessionId}</p>}
                  </div>

                  {/* Course Dropdown */}
                  <div className="space-y-1">
                    <label htmlFor="courseId" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Course
                    </label>

                    <div className="relative" ref={courseDropdownRef}>
                      <div
                        className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${errors.courseId ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                          } rounded-xl focus:outline-none focus:ring-2 dark:text-white ${!formData.sessionId || availableCoursesForSession.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          } flex justify-between items-center`}
                        onClick={() => {
                          if (!formData.sessionId || availableCoursesForSession.length === 0) return;
                          setIsCourseDropdownOpen(!isCourseDropdownOpen);
                          if (!isCourseDropdownOpen) setCourseSearchTerm('');
                        }}
                      >
                        <span className={formData.courseId ? 'text-slate-800 dark:text-white' : 'text-slate-400'}>
                          {!formData.sessionId
                            ? 'Select Course'
                            : availableCoursesForSession.length === 0
                              ? 'No courses mapped to this session...'
                              : formData.courseId
                                ? (() => {
                                  const c = availableCoursesForSession.find(c => c.id === formData.courseId);
                                  return c ? c.name : 'Add course';
                                })()
                                : 'Add course'}
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
                                  {c.name}
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

                    {errors.courseId && <p className="text-red-500 text-xs mt-1">{errors.courseId}</p>}
                  </div>

                  {/* Semester Dropdown */}
                  <div className="space-y-1">
                    <label htmlFor="semester" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {isYearWise ? 'Year' : 'Semester'}
                    </label>

                    <div className="relative" ref={semesterDropdownRef}>
                      <div
                        className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${errors.semester ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                          } rounded-xl focus:outline-none focus:ring-2 dark:text-white cursor-pointer ${!formData.courseId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex justify-between items-center`}
                        onClick={() => {
                          if (!formData.courseId) return;
                          setIsSemesterDropdownOpen(!isSemesterDropdownOpen);
                          if (!isSemesterDropdownOpen) setSemesterSearchTerm('');
                        }}
                      >
                        <span className={formData.semester ? 'text-slate-800 dark:text-white' : 'text-slate-400'}>
                          {!formData.courseId
                            ? `Select ${isYearWise ? 'Year' : 'Semester'}`
                            : formData.semester || `Add ${isYearWise ? 'year' : 'semester'}`}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>

                      {isSemesterDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col">
                          <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                              <input
                                type="text"
                                placeholder={`Search ${isYearWise ? 'years' : 'semesters'}...`}
                                value={semesterSearchTerm}
                                onChange={(e) => setSemesterSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 dark:text-white placeholder:text-slate-400"
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="overflow-y-auto">
                            {filteredSemestersDropdown.length > 0 ? (
                              filteredSemestersDropdown.map((sem) => (
                                <div
                                  key={sem}
                                  className={`px-3.5 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${formData.semester === sem ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-200'
                                    }`}
                                  onClick={() => {
                                    handleInputChange({ target: { name: 'semester', value: sem } });
                                    setIsSemesterDropdownOpen(false);
                                  }}
                                >
                                  {sem}
                                </div>
                              ))
                            ) : (
                              <div className="px-3.5 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                                No {isYearWise ? 'years' : 'semesters'} found.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {errors.semester && <p className="text-red-500 text-xs mt-1">{errors.semester}</p>}
                  </div>

                  {/* Codification Dropdown */}
                  <div className="space-y-1">
                    <label htmlFor="codificationId" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Codification
                    </label>

                    <div className="relative" ref={codificationDropdownRef}>
                      <div
                        className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${errors.codificationId ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                          } rounded-xl focus:outline-none focus:ring-2 dark:text-white cursor-pointer ${(!formData.sessionId || !formData.courseId || !formData.semester) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex justify-between items-center`}
                        onClick={() => {
                          if (!formData.sessionId || !formData.courseId || !formData.semester) return;
                          setIsCodificationDropdownOpen(!isCodificationDropdownOpen);
                          if (!isCodificationDropdownOpen) setCodificationSearchTerm('');
                        }}
                      >
                        <span className={formData.codificationId ? 'text-slate-800 dark:text-white' : 'text-slate-400'}>
                          {(!formData.sessionId || !formData.courseId || !formData.semester)
                            ? 'Select Codification'
                            : formData.codificationId
                              ? (() => {
                                const c = codifications.find(c => c.id === formData.codificationId);
                                return c ? c.code : 'add codification';
                              })()
                              : 'add codification'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>

                      {isCodificationDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col">
                          <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Search codifications..."
                                value={codificationSearchTerm}
                                onChange={(e) => setCodificationSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 dark:text-white placeholder:text-slate-400"
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="overflow-y-auto">
                            {filteredCodificationsDropdown.length > 0 ? (
                              filteredCodificationsDropdown.map((c) => (
                                <div
                                  key={c.id}
                                  className={`px-3.5 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${formData.codificationId === c.id ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-200'
                                    }`}
                                  onClick={() => {
                                    handleInputChange({ target: { name: 'codificationId', value: c.id } });
                                    setIsCodificationDropdownOpen(false);
                                  }}
                                >
                                  {c.code}
                                </div>
                              ))
                            ) : (
                              <div className="px-3.5 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                                No codifications found.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {errors.codificationId && <p className="text-red-500 text-xs mt-1">{errors.codificationId}</p>}
                  </div>

                  {/* Major/Minor Dropdown */}
                  <div className="space-y-1">
                    <label htmlFor="subjectGroupId" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Subject Group
                    </label>

                    <div className="relative" ref={groupDropdownRef}>
                      <div
                        className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${errors.subjectGroupId ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                          } rounded-xl focus:outline-none focus:ring-2 dark:text-white ${!formData.courseId || !formData.codificationId || availableSubjectGroupsForCourse.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          } flex justify-between items-center`}
                        onClick={() => {
                          if (!formData.courseId || !formData.codificationId || availableSubjectGroupsForCourse.length === 0) return;
                          setIsGroupDropdownOpen(!isGroupDropdownOpen);
                          if (!isGroupDropdownOpen) setGroupSearchTerm('');
                        }}
                      >
                        <span className={formData.subjectGroupId ? 'text-slate-800 dark:text-white' : 'text-slate-400'}>
                          {!formData.courseId
                            ? 'Please select a Course first...'
                            : !formData.codificationId
                              ? 'Select Subject Group'
                              : availableSubjectGroupsForCourse.length === 0
                                ? `No ${groupLabel.toLowerCase()}s available for this course...`
                                : formData.subjectGroupId
                                  ? (() => {
                                    const g = availableSubjectGroupsForCourse.find(g => g.id === formData.subjectGroupId);
                                    return g ? `${g.name} (${g.code})` : 'Add Subject Group';
                                  })()
                                  : 'Add Subject Group'}
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
                            {filteredGroupsDropdown.length > 0 ? (
                              filteredGroupsDropdown.map((g) => (
                                <div
                                  key={g.id}
                                  className={`px-3.5 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${formData.subjectGroupId === g.id ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-200'
                                    }`}
                                  onClick={() => {
                                    const code = selectedCodification?.code;
                                    const matchingCod = codifications.find(c => c.code === code && c.subjectGroupId === g.id);
                                    setFormData(prev => ({
                                      ...prev,
                                      subjectGroupId: g.id,
                                      codificationId: matchingCod ? matchingCod.id : prev.codificationId
                                    }));
                                    setIsGroupDropdownOpen(false);
                                  }}
                                >
                                  {g.name} ({g.code})
                                </div>
                              ))
                            ) : (
                              <div className="px-3.5 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                                No groups found.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {errors.subjectGroupId && <p className="text-red-500 text-xs mt-1">{errors.subjectGroupId}</p>}
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
                </div>

                <div className="flex justify-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (editingMapping) setEditingMapping(null);
                      setFormData({ sessionId: '', courseId: '', semester: '', subjectGroupId: '', codificationId: '', status: 'Active' });
                      setErrors({});
                      setIsAddMappingOpen(false);
                    }}
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

            {/* Accordion Layout based on sketch */}
            <div className="space-y-8 pb-10">
              {isLoadingMappings ? (
                <div className="flex flex-col items-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Loading mappings...</p>
                </div>
              ) : filteredMappings.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 shadow-xs">
                  No Curriculum Mappings Found. Click "Create Mapping" to configure the first academic curriculum.
                </div>
              ) : (
                Object.entries(groupedMappings).map(([sessionId, sessionCourses]) => (
                  <div key={sessionId} id={`session-${sessionId}`} className="space-y-6">
                    {/* Session Header */}
                    <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-700 pb-2">
                      <div className="flex items-center gap-3">
                        <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                          Session: {getSessionName(sessionId)}
                        </h2>
                      </div>
                    </div>

                    {/* Inner Content */}
                    <div className="mt-6 space-y-4">
                      {Object.entries(sessionCourses).map(([courseId, courseSemesters]) => (
                        <div key={courseId} className="ml-0 sm:ml-4 space-y-4">
                          <CourseMappingCard
                            sessionId={sessionId}
                            courseId={courseId}
                            courseSemesters={courseSemesters}
                            getCourseName={getCourseName}
                            getCodificationCode={getCodificationCode}
                            getSubjectGroupName={getSubjectGroupName}
                            handleEditOpen={handleEditOpen}
                            handleDeleteOpen={handleDeleteOpen}
                            handleCreateOpenForCourse={handleCreateOpenForCourse}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>



          {/* Delete Confirmation Modal */}
          <ConfirmModal
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleDeleteConfirm}
            title="Delete Mapping"
            message={`Are you sure you want to delete this curriculum mapping? This action cannot be undone.`}
          />
        </>
      )}
    </div>
  );
}

const CourseMappingCard = ({ sessionId, courseId, courseSemesters, getCourseName, getCodificationCode, getSubjectGroupName, handleEditOpen, handleDeleteOpen, handleCreateOpenForCourse }) => {
  const semestersList = Object.keys(courseSemesters).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );
  const [activeTab, setActiveTab] = React.useState(semestersList[0]);

  // If the activeTab isn't in courseSemesters anymore, reset to first
  React.useEffect(() => {
    if (!courseSemesters[activeTab] && semestersList.length > 0) {
      setActiveTab(semestersList[0]);
    }
  }, [courseSemesters, activeTab, semestersList]);

  const detailsRef = React.useRef(null);
  const isYearly = semestersList.some(sem => sem.toLowerCase().includes('year'));
  const termLabel = isYearly ? 'Year' : 'Semester';

  return (
    <details ref={detailsRef} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
      <summary className="bg-slate-50 dark:bg-slate-800/80 px-5 py-3 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 list-none focus:outline-none focus:ring-2 focus:ring-blue-500/20">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 shrink-0">
          <BookOpen className="w-5 h-5" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
            Course: {getCourseName(courseId)}
          </h3>
        </div>

        {/* Tabs inside Header */}
        {semestersList.length > 0 && (
          <div className="flex overflow-x-auto gap-2 flex-1 lg:justify-start lg:ml-6 no-scrollbar">
            {semestersList.map(sem => (
              <button
                key={sem}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveTab(sem);
                  if (detailsRef.current) detailsRef.current.open = true;
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${activeTab === sem ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200 dark:border-blue-800/50' : 'bg-white/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 shadow-xs'}`}
              >
                {sem.startsWith('Semester') || sem.toLowerCase().includes('year') ? sem : `Semester ${sem}`}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCreateOpenForCourse(sessionId, courseId, activeTab);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
          <span className="text-sm font-medium text-slate-500 whitespace-nowrap">
            {semestersList.length} {termLabel}{semestersList.length !== 1 ? 's' : ''}
          </span>
          <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-xs transition-transform duration-200 group-open:rotate-180 ml-2 shrink-0">
            <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-300" />
          </div>
        </div>
      </summary>

      <div className="border-t border-slate-200 dark:border-slate-700">
        {/* Tab Content */}
        <div className="overflow-x-auto">
          {activeTab && courseSemesters[activeTab] && (() => {
            const semesterGroups = courseSemesters[activeTab];
            const semesterMappings = [];
            Object.values(semesterGroups).forEach(group => {
              Object.values(group).forEach(typeArr => {
                semesterMappings.push(...typeArr);
              });
            });

            return (
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Codification</th>
                    <th className="px-4 py-3">Subject Group</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {semesterMappings.map(mapping => (
                    <tr key={mapping.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center justify-center px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-lg font-bold text-xs shadow-xs">
                          {getCodificationCode(mapping.codification_id)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[13px]">
                          {getSubjectGroupName(mapping.bucket_subject_group_id)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${mapping.status === 'Active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${mapping.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {mapping.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={(e) => { e.preventDefault(); handleEditOpen(mapping); }} className="p-1.5 text-blue-500 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-900/40 rounded-lg transition-colors cursor-pointer" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.preventDefault(); handleDeleteOpen(mapping); }} className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-100 dark:border-red-900/40 rounded-lg transition-colors cursor-pointer" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>
    </details>
  );
};
