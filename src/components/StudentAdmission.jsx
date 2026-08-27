import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus, Loader2,
  UserCheck,
  Search,
  Trash2,
  Eye,
  CheckCircle,
  CheckCircle2,
  FileText,
  Upload,
  Calendar,
  Building,
  MapPin,
  Shield,
  Phone,
  Mail,
  Award,
  BookOpen,
  GraduationCap,
  Plus,
  Edit2,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Save
} from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import baseApi from '@/services/baseApi';

const formatName = (name) => {
  if (!name) return name;
  return name
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};



export default function StudentAdmission({ showNotification }) {
  const queryClient = useQueryClient();

  // View Mode: 'form' for Admission Form, 'list' for Student Directory
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active Form Tab State
  const [activeFormTab, setActiveFormTab] = useState('personal');

  // Saved Section Badges State
  const [savedSections, setSavedSections] = useState({
    personal: false,
    admission: false,
    guardian: false,
    academic: false,
    address: false,
    documents: false
  });

  // Form State
  const initialFormState = {
    // Personal Info
    first_name: '',
    middle_name: '',
    last_name: '',
    displayed_as: '',
    date_of_birth: '',
    student_phone: '',
    used_in_whatsapp: false,
    whatsapp_number: '',
    email_id: '',
    religion: '',
    blood_group: '',
    category: '',
    domicile: '',

    // Admission Details
    university: '',
    course_id: '',
    session_from_id: '',
    session_to_id: '',
    date_of_admission: new Date().toISOString().split('T')[0],
    last_qualification: '',
    last_qualification_level: '',
    year_of_passing_last_qualification: new Date().getFullYear().toString(),
    last_institute_name: '',

    // Guardian Info
    father_name: '',
    mother_name: '',
    guardian_name: '',

    // Present Address
    present_address: '',
    present_city_town_id: '',
    present_state_id: '',
    present_district_id: '',
    present_country_id: '',
    present_pincode: '',

    // Permanent Address
    permanent_address: '',
    permanent_city_town_id: '',
    permanent_state_id: '',
    permanent_district_id: '',
    permanent_country_id: '',
    permanent_pincode: '',

    // Document Text & Files
    aadhar_number: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [files, setFiles] = useState({
    profile_picture: null,
    aadhar_front: null,
    aadhar_back: null,
    last_qualification_cert: null,
    clc_migration_cert: null
  });

  // ACADEMIC DETAILS STATE
  const [academicTab, setAcademicTab] = useState('10th');
  const [academicRecords, setAcademicRecords] = useState([]);
  const [currentAcademicInput, setCurrentAcademicInput] = useState({
    board_university_name: '',
    school_college_name: '',
    state: '',
    city: '',
    passing_year: '',
    aggregate_marks_cgpa: '',
    marksheet_file: null,
    migration_cert_file: null
  });

  const [errors, setErrors] = useState({});
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const resetForm = () => {
    setFormData(initialFormState);
    setAcademicRecords([]);
    setSavedSections({
      personal: false,
      admission: false,
      guardian: false,
      academic: false,
      address: false,
      documents: false
    });
    setFiles({
      profile_picture: null,
      aadhar_front: null,
      aadhar_back: null,
      last_qualification_cert: null,
      clc_migration_cert: null
    });
    setErrors({});
    setEditingStudent(null);
    setSameAsPermanent(false);
    setActiveFormTab('personal');
  };

  const handleSameAsPermanentChange = (e) => {
    const checked = e.target.checked;
    setSameAsPermanent(checked);
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        present_address: prev.permanent_address,
        present_country_id: prev.permanent_country_id,
        present_state_id: prev.permanent_state_id,
        present_district_id: prev.permanent_district_id,
        present_city_town_id: prev.permanent_city_town_id,
        present_pincode: prev.permanent_pincode
      }));
      setErrors((prev) => {
        const nextErrs = { ...prev };
        delete nextErrs.present_address;
        delete nextErrs.present_country_id;
        delete nextErrs.present_state_id;
        delete nextErrs.present_district_id;
        delete nextErrs.present_city_town_id;
        delete nextErrs.present_pincode;
        return nextErrs;
      });
    }
  };

  // Tabs definitions
  const formTabs = [
    { id: 'personal', label: 'Personal Info', icon: UserCheck, title: 'Personal Information' },
    { id: 'guardian', label: 'Guardian Info', icon: Shield, title: 'Guardian Information' },
    { id: 'academic', label: 'Academic Details', icon: GraduationCap, title: 'Academic Details' },
    { id: 'address', label: 'Address', icon: MapPin, title: 'Communication Address' },
    { id: 'documents', label: 'Documents', icon: Upload, title: 'Upload Documents' }
  ];

  // Section specific validations
  const validatePersonal = () => {
    const errs = {};
    let hasPhoneLengthError = false;
    let hasAadharLengthError = false;

    if (!formData.session_from_id) errs.session_from_id = true;
    if (!formData.first_name) errs.first_name = true;
    if (!formData.date_of_birth) errs.date_of_birth = true;

    if (!formData.student_phone) {
      errs.student_phone = true;
    } else if (formData.student_phone.length < 10) {
      errs.student_phone = true;
      hasPhoneLengthError = true;
    }

    if (formData.whatsapp_number && formData.whatsapp_number.length < 10) {
      errs.whatsapp_number = true;
      hasPhoneLengthError = true;
    }

    if (!formData.email_id) errs.email_id = true;
    if (!formData.religion) errs.religion = true;
    if (!formData.blood_group) errs.blood_group = true;
    if (!formData.category) errs.category = true;
    
    if (!formData.aadhar_number) {
      errs.aadhar_number = true;
    } else if (formData.aadhar_number.length !== 12) {
      errs.aadhar_number = true;
      hasAadharLengthError = true;
    }

    setErrors((prev) => ({ ...prev, ...errs }));

    if (hasPhoneLengthError) {
      showNotification('Phone and WhatsApp numbers must be exactly 10 digits', 'error');
    }
    if (hasAadharLengthError) {
      showNotification('Aadhar Number must be exactly 12 digits', 'error');
    }

    return Object.keys(errs).length === 0;
  };

  const validateGuardian = () => {
    const errs = {};
    if (!formData.father_name) errs.father_name = true;
    if (!formData.guardian_name) errs.guardian_name = true;
    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  const validateDocuments = () => {
    const errs = {};
    if (!files.profile_picture && !editingStudent?.profile_picture_url) errs.profile_picture = true;
    if (!files.aadhar_front && !editingStudent?.aadhar_front_url) errs.aadhar_front = true;
    if (!files.aadhar_back && !editingStudent?.aadhar_back_url) errs.aadhar_back = true;
    if (!files.last_qualification_cert && !editingStudent?.last_qualification_cert_url) errs.last_qualification_cert = true;
    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  const validateAdmission = () => {
    return true;
  };

  const validateAddress = () => {
    const errs = {};
    if (!formData.domicile) errs.domicile = true;
    
    if (!formData.permanent_address) errs.permanent_address = true;
    if (!formData.permanent_country_id) errs.permanent_country_id = true;
    if (!formData.permanent_state_id) errs.permanent_state_id = true;
    if (!formData.permanent_district_id) errs.permanent_district_id = true;
    if (!formData.permanent_city_town_id) errs.permanent_city_town_id = true;
    if (!formData.permanent_pincode) errs.permanent_pincode = true;

    if (!formData.present_address) errs.present_address = true;
    if (!formData.present_country_id) errs.present_country_id = true;
    if (!formData.present_state_id) errs.present_state_id = true;
    if (!formData.present_district_id) errs.present_district_id = true;
    if (!formData.present_city_town_id) errs.present_city_town_id = true;
    if (!formData.present_pincode) errs.present_pincode = true;

    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  // Save Section and Auto-advance to Next Tab
  const handleSaveAndNext = (sectionKey, sectionTitle, validateFn) => {
    if (validateFn) {
      const isValid = validateFn();
      if (!isValid) {
        showNotification(`Please fill in mandatory fields in ${sectionTitle}`, 'error');
        return;
      }
    }

    const fName = formatName(formData.first_name);
    const mName = formatName(formData.middle_name);
    const lName = formatName(formData.last_name);

    const formattedData = {
      ...formData,
      status: 'Pending',
      first_name: fName,
      middle_name: mName,
      last_name: lName,
      father_name: formatName(formData.father_name),
      mother_name: formatName(formData.mother_name),
      guardian_name: formatName(formData.guardian_name),
      displayed_as: [fName, mName, lName].filter(Boolean).join(' ')
    };

    saveDraftMutation.mutate({
      id: editingStudent?.student_id?.toString() || editingStudent?.id,
      data: formattedData,
      files,
      academicRecords,
      sectionKey,
      sectionTitle
    });
  };

  const handleAcademicSaveAndNext = () => {
    let updatedRecords = [...academicRecords];
    let updatedFiles = { ...files };
    
    // Auto-save current input if user forgot to click "+ Save Qualification"
    if (currentAcademicInput.board_university_name || currentAcademicInput.school_college_name || currentAcademicInput.passing_year || currentAcademicInput.aggregate_marks_cgpa) {
      if (['10th', '12th'].includes(academicTab)) {
        if (!currentAcademicInput.board_university_name || !currentAcademicInput.school_college_name || !currentAcademicInput.passing_year || !currentAcademicInput.aggregate_marks_cgpa) {
          showNotification(`Please fill all mandatory fields for ${academicTab}`, 'error');
          return;
        }
      }
      
      const newRecord = {
        qualification_level: academicTab,
        board_university_name: currentAcademicInput.board_university_name,
        school_college_name: currentAcademicInput.school_college_name,
        state: currentAcademicInput.state,
        city: currentAcademicInput.city,
        passing_year: currentAcademicInput.passing_year,
        aggregate_marks_cgpa: currentAcademicInput.aggregate_marks_cgpa
      };
      
      updatedRecords = updatedRecords.filter((r) => r.qualification_level !== academicTab);
      updatedRecords.push(newRecord);
      
      if (currentAcademicInput.marksheet_file || currentAcademicInput.migration_cert_file) {
        if (currentAcademicInput.marksheet_file) {
          updatedFiles[`marksheet_${academicTab}`] = currentAcademicInput.marksheet_file;
        }
        if (currentAcademicInput.migration_cert_file) {
          updatedFiles[`migration_${academicTab}`] = currentAcademicInput.migration_cert_file;
        }
      }
      
      // Update local state so UI reflects it
      setAcademicRecords(updatedRecords);
      setFiles(updatedFiles);
    }

    const has10th = updatedRecords.some(r => r.qualification_level === '10th');
    const has12th = updatedRecords.some(r => r.qualification_level === '12th');
    
    if (!has10th || !has12th) {
      showNotification('10th and 12th qualifications are mandatory', 'error');
      if (!has10th) setAcademicTab('10th');
      else setAcademicTab('12th');
      return;
    }

    const fName = formatName(formData.first_name);
    const mName = formatName(formData.middle_name);
    const lName = formatName(formData.last_name);

    const formattedData = {
      ...formData,
      status: 'Pending',
      first_name: fName,
      middle_name: mName,
      last_name: lName,
      father_name: formatName(formData.father_name),
      mother_name: formatName(formData.mother_name),
      guardian_name: formatName(formData.guardian_name),
      displayed_as: [fName, mName, lName].filter(Boolean).join(' ')
    };

    saveDraftMutation.mutate({
      id: editingStudent?.student_id?.toString() || editingStudent?.id,
      data: formattedData,
      files: updatedFiles,
      academicRecords: updatedRecords,
      sectionKey: 'academic',
      sectionTitle: 'Academic Details'
    });
  };

  // Populate academic input on tab switch
  useEffect(() => {
    const existing = academicRecords.find((r) => r.qualification_level === academicTab);
    if (existing) {
      setCurrentAcademicInput({
        board_university_name: existing.board_university_name || '',
        school_college_name: existing.school_college_name || '',
        state: existing.state || '',
        city: existing.city || '',
        passing_year: existing.passing_year || '',
        aggregate_marks_cgpa: existing.aggregate_marks_cgpa || '',
        marksheet_file: files[`marksheet_${academicTab}`] || null,
        migration_cert_file: files[`migration_${academicTab}`] || null
      });
    } else {
      setCurrentAcademicInput({
        board_university_name: '',
        school_college_name: '',
        state: '',
        city: '',
        passing_year: '',
        aggregate_marks_cgpa: '',
        marksheet_file: null,
        migration_cert_file: null
      });
    }
  }, [academicTab, academicRecords]);

  // Fetch Master Data
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

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const res = await baseApi.get('/countries');
      return res.data?.data || [];
    }
  });

  const { data: states = [] } = useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const res = await baseApi.get('/states');
      return res.data?.data || [];
    }
  });

  const { data: districts = [] } = useQuery({
    queryKey: ['districts'],
    queryFn: async () => {
      const res = await baseApi.get('/districts');
      return res.data?.data || [];
    }
  });

  const { data: cityTowns = [] } = useQuery({
    queryKey: ['city-towns'],
    queryFn: async () => {
      const res = await baseApi.get('/city-towns');
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

  const uniqueMappedSessions = useMemo(() => {
    const mappingSessionIds = new Set(sessionCourseMappings.map(m => m.session_id?.toString() || m.session_id));
    return sessions.filter(s => mappingSessionIds.has(s.session_id?.toString() || s.id?.toString()));
  }, [sessions, sessionCourseMappings]);

  // Fetch Student Profiles list
  const { data: studentProfiles = [], isLoading } = useQuery({
    queryKey: ['student-profiles'],
    queryFn: async () => {
      const res = await baseApi.get('/student-profiles');
      return res.data?.data || [];
    }
  });

  // Submit Admission Profile Mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const formDataToSend = new FormData();
      Object.keys(payload.data).forEach((key) => {
        if (payload.data[key] !== null && payload.data[key] !== undefined) {
          formDataToSend.append(key, payload.data[key]);
        }
      });
      formDataToSend.append('academic_records', JSON.stringify(payload.academicRecords));

      Object.keys(payload.files).forEach((key) => {
        if (payload.files[key]) {
          formDataToSend.append(key, payload.files[key]);
        }
      });

      // Explicitly set new applications to Pending so they don't bypass Verification
      formDataToSend.set('status', 'Pending');

      return baseApi.post('/student-profiles', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      showNotification('Student Admission Profile submitted successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['student-profiles'] });
      resetForm();
      setViewMode('list');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Error submitting application';
      showNotification(msg, 'error');
    }
  });

  // Update Student Profile Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const formDataToSend = new FormData();
      Object.keys(payload.data).forEach((key) => {
        if (payload.data[key] !== null && payload.data[key] !== undefined) {
          formDataToSend.append(key, payload.data[key]);
        }
      });
      formDataToSend.append('academic_records', JSON.stringify(payload.academicRecords));

      Object.keys(payload.files).forEach((key) => {
        if (payload.files[key]) {
          formDataToSend.append(key, payload.files[key]);
        }
      });

      return baseApi.put(`/student-profiles/${payload.id}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      showNotification('Student Profile updated successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['student-profiles'] });
      resetForm();
      setViewMode('list');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Error updating student profile';
      showNotification(msg, 'error');
    }
  });

  // Save Draft Mutation (used during Save & Next step-by-step saves)
  const saveDraftMutation = useMutation({
    mutationFn: async (payload) => {
      const formDataToSend = new FormData();
      Object.keys(payload.data).forEach((key) => {
        if (payload.data[key] !== null && payload.data[key] !== undefined) {
          formDataToSend.append(key, payload.data[key]);
        }
      });
      formDataToSend.append('academic_records', JSON.stringify(payload.academicRecords));

      Object.keys(payload.files).forEach((key) => {
        if (payload.files[key]) {
          formDataToSend.append(key, payload.files[key]);
        }
      });

      if (payload.id) {
        return baseApi.put(`/student-profiles/${payload.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Explicitly set new drafts to Pending so they don't bypass Verification
        formDataToSend.set('status', 'Pending');
        return baseApi.post('/student-profiles', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
    },
    onSuccess: (res, variables) => {
      const savedStudent = res.data?.data;
      if (savedStudent) {
        setEditingStudent(savedStudent);
      }
      queryClient.invalidateQueries({ queryKey: ['student-profiles'] });
      
      const { sectionKey, sectionTitle } = variables;
      setSavedSections((prev) => ({ ...prev, [sectionKey]: true }));
      showNotification(`${sectionTitle} saved successfully!`, 'success');

      // Auto-advance to next tab
      const currentIndex = formTabs.findIndex((t) => t.id === sectionKey);
      if (currentIndex < formTabs.length - 1) {
        setActiveFormTab(formTabs[currentIndex + 1].id);
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Error saving draft';
      showNotification(msg, 'error');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => baseApi.delete(`/student-profiles/${id}`),
    onSuccess: () => {
      showNotification('Student record deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['student-profiles'] });
      setIsDeleteOpen(false);
      setStudentToDelete(null);
    },
    onError: (err) => {
      showNotification(err.response?.data?.message || 'Error deleting student profile', 'error');
      setIsDeleteOpen(false);
    }
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;

    if (['student_phone', 'whatsapp_number'].includes(name) && typeof val === 'string') {
      val = val.replace(/\D/g, '').slice(0, 10);
    }
    if (['present_pincode', 'permanent_pincode'].includes(name) && typeof val === 'string') {
      val = val.replace(/\D/g, '').slice(0, 10);
    }
    if (name === 'aadhar_number' && typeof val === 'string') {
      val = val.replace(/\D/g, '').slice(0, 12);
    }

    setFormData((prev) => {
      const nextState = { ...prev, [name]: val };

      // Auto-populate displayed_as from name fields
      if (['first_name', 'middle_name', 'last_name'].includes(name)) {
        const firstName = name === 'first_name' ? val : prev.first_name;
        const middleName = name === 'middle_name' ? val : prev.middle_name;
        const lastName = name === 'last_name' ? val : prev.last_name;
        nextState.displayed_as = formatName([firstName, middleName, lastName].filter(Boolean).join(' '));
      }

      if (name === 'student_phone' && prev.used_in_whatsapp) {
        nextState.whatsapp_number = val;
      }
      if (name === 'used_in_whatsapp' && val === true) {
        nextState.whatsapp_number = prev.student_phone;
      }
      if (sameAsPermanent && name.startsWith('permanent_')) {
        const presField = name.replace('permanent_', 'present_');
        nextState[presField] = val;
      }
      
      if (name === 'permanent_city_town_id' && val) {
        const ct = cityTowns.find((c) => c.city_town_id?.toString() === val || c.id?.toString() === val);
        if (ct && ct.pincode) {
          nextState.permanent_pincode = ct.pincode;
          if (sameAsPermanent) {
            nextState.present_pincode = ct.pincode;
          }
        }
      }
      
      if (name === 'present_city_town_id' && val && !sameAsPermanent) {
        const ct = cityTowns.find((c) => c.city_town_id?.toString() === val || c.id?.toString() === val);
        if (ct && ct.pincode) {
          nextState.present_pincode = ct.pincode;
        }
      }

      if (name === 'session_from_id') {
        nextState.session_to_id = val;
      }
      
      return nextState;
    });
    setErrors((prev) => {
      const nextErrs = { ...prev };
      if (val) {
        delete nextErrs[name];
        if (sameAsPermanent && name.startsWith('permanent_')) {
          delete nextErrs[name.replace('permanent_', 'present_')];
        }
        if (name === 'permanent_city_town_id') {
          delete nextErrs.permanent_pincode;
          if (sameAsPermanent) delete nextErrs.present_pincode;
        }
        if (name === 'present_city_town_id') {
          delete nextErrs.present_pincode;
        }
      }
      return nextErrs;
    });
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles((prev) => ({ ...prev, [name]: selectedFiles[0] }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: null }));
      }
    }
  };

  // Academic Input Handlers
  const handleAcademicInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'passing_year') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }
    setCurrentAcademicInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleAcademicFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setCurrentAcademicInput((prev) => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleSaveAcademicRecord = () => {
    if (['10th', '12th'].includes(academicTab)) {
      if (!currentAcademicInput.board_university_name || !currentAcademicInput.school_college_name || !currentAcademicInput.passing_year || !currentAcademicInput.aggregate_marks_cgpa) {
        showNotification(`Please fill all mandatory fields for ${academicTab}`, 'error');
        return;
      }
    }

    const currentYearStr = currentAcademicInput.passing_year;
    if (currentYearStr) {
      const currentYear = parseInt(currentYearStr, 10);
      if (!isNaN(currentYear)) {
        const tabsOrder = ['10th', '12th', 'Graduation', 'Post Graduation'];
        const currentIndex = tabsOrder.indexOf(academicTab);

        for (let i = 0; i < currentIndex; i++) {
          const prevRecord = academicRecords.find((r) => r.qualification_level === tabsOrder[i]);
          if (prevRecord && prevRecord.passing_year) {
            const prevYear = parseInt(prevRecord.passing_year, 10);
            if (!isNaN(prevYear) && currentYear <= prevYear) {
              setErrors(prev => ({ ...prev, academic_passing_year: `${academicTab} passing year must be after ${tabsOrder[i]} passing year (${prevYear})` }));
              return;
            }
          }
        }

        for (let i = currentIndex + 1; i < tabsOrder.length; i++) {
          const nextRecord = academicRecords.find((r) => r.qualification_level === tabsOrder[i]);
          if (nextRecord && nextRecord.passing_year) {
            const nextYear = parseInt(nextRecord.passing_year, 10);
            if (!isNaN(nextYear) && currentYear >= nextYear) {
              setErrors(prev => ({ ...prev, academic_passing_year: `${academicTab} passing year must be before ${tabsOrder[i]} passing year (${nextYear})` }));
              return;
            }
          }
        }
      }
    }

    setErrors(prev => {
      const next = { ...prev };
      delete next.academic_passing_year;
      return next;
    });

    const newRecord = {
      qualification_level: academicTab,
      board_university_name: currentAcademicInput.board_university_name,
      school_college_name: currentAcademicInput.school_college_name,
      state: currentAcademicInput.state,
      city: currentAcademicInput.city,
      passing_year: currentAcademicInput.passing_year,
      aggregate_marks_cgpa: currentAcademicInput.aggregate_marks_cgpa
    };

    setAcademicRecords((prev) => {
      const filtered = prev.filter((r) => r.qualification_level !== academicTab);
      return [...filtered, newRecord];
    });

    if (currentAcademicInput.marksheet_file || currentAcademicInput.migration_cert_file) {
      setFiles((prev) => ({
        ...prev,
        [`marksheet_${academicTab}`]: currentAcademicInput.marksheet_file,
        [`migration_${academicTab}`]: currentAcademicInput.migration_cert_file
      }));
    }

    showNotification(`${academicTab} qualification details added! Click 'Save & Next' to confirm.`, 'info');

    // Auto-advance to next tab
    const tabs = ['10th', '12th', 'Graduation', 'Post Graduation'];
    const idx = tabs.indexOf(academicTab);
    if (idx !== -1 && idx < tabs.length - 1) {
      setAcademicTab(tabs[idx + 1]);
    }
  };

  const handleRemoveAcademicRecord = (level) => {
    setAcademicRecords((prev) => {
      const nextRecords = prev.filter((r) => r.qualification_level !== level);
      if (nextRecords.length === 0) {
        setSavedSections((sPrev) => ({ ...sPrev, academic: false }));
      }
      return nextRecords;
    });

    setFiles((prev) => {
      const next = { ...prev };
      delete next[`marksheet_${level}`];
      delete next[`migration_${level}`];
      return next;
    });

    if (academicTab === level) {
      setCurrentAcademicInput({
        board_university_name: '',
        school_college_name: '',
        state: '',
        city: '',
        passing_year: '',
        aggregate_marks_cgpa: '',
        marksheet_file: null,
        migration_cert_file: null
      });
    }
    showNotification(`${level} qualification removed`, 'info');
  };

  const validateFullForm = () => {
    const pValid = validatePersonal();
    const aValid = validateAdmission();
    const gValid = validateGuardian();
    const addValid = validateAddress();
    const dValid = validateDocuments();
    
    if (!pValid) return { valid: false, section: 'Personal Info' };
    if (!aValid) return { valid: false, section: 'Admission' };
    if (!gValid) return { valid: false, section: 'Guardian Info' };
    if (!addValid) return { valid: false, section: 'Address' };
    if (!dValid) return { valid: false, section: 'Documents' };
    
    return { valid: true };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Only strictly validate all tabs if creating a new student (Enroll Process)
    if (!editingStudent) {
      const validationResult = validateFullForm();
      if (!validationResult.valid) {
        showNotification(`Please fill in all mandatory fields in the ${validationResult.section} section`, 'error');
        return;
      }
    }

    const fName = formatName(formData.first_name);
    const mName = formatName(formData.middle_name);
    const lName = formatName(formData.last_name);

    const formattedData = {
      ...formData,
      status: 'Active',
      first_name: fName,
      middle_name: mName,
      last_name: lName,
      father_name: formatName(formData.father_name),
      mother_name: formatName(formData.mother_name),
      guardian_name: formatName(formData.guardian_name),
      displayed_as: [fName, mName, lName].filter(Boolean).join(' ')
    };

    if (editingStudent) {
      updateMutation.mutate({
        id: editingStudent.student_id?.toString() || editingStudent.id,
        data: formattedData,
        files,
        academicRecords
      });
    } else {
      createMutation.mutate({ data: formattedData, files, academicRecords });
    }
  };

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setFormData({
      first_name: student.first_name || '',
      middle_name: student.middle_name || '',
      last_name: student.last_name || '',
      displayed_as: formatName([student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ')) || '',
      date_of_birth: student.date_of_birth ? new Date(student.date_of_birth).toISOString().split('T')[0] : '',
      student_phone: student.student_phone || '',
      used_in_whatsapp: student.used_in_whatsapp || false,
      whatsapp_number: student.whatsapp_number || '',
      email_id: student.email_id || '',
      religion: student.religion || '',
      blood_group: student.blood_group || '',
      category: student.category || '',
      domicile: student.domicile || '',
      university: student.university || '',
      course_id: student.course_id?.toString() || '',
      session_from_id: student.session_from_id?.toString() || '',
      session_to_id: student.session_to_id?.toString() || '',
      date_of_admission: student.date_of_admission ? new Date(student.date_of_admission).toISOString().split('T')[0] : '',
      last_qualification: student.last_qualification || '',
      last_qualification_level: student.last_qualification_level || '',
      year_of_passing_last_qualification: student.year_of_passing_last_qualification?.toString() || '',
      last_institute_name: student.last_institute_name || '',
      father_name: student.father_name || '',
      mother_name: student.mother_name || '',
      guardian_name: student.guardian_name || '',
      present_address: student.present_address || '',
      present_city_town_id: student.present_city_town_id?.toString() || '',
      present_state_id: student.present_state_id?.toString() || '',
      present_district_id: student.present_district_id?.toString() || '',
      present_country_id: student.present_country_id?.toString() || '',
      present_pincode: student.present_pincode || '',
      permanent_address: student.permanent_address || '',
      permanent_city_town_id: student.permanent_city_town_id?.toString() || '',
      permanent_state_id: student.permanent_state_id?.toString() || '',
      permanent_district_id: student.permanent_district_id?.toString() || '',
      permanent_country_id: student.permanent_country_id?.toString() || '',
      permanent_pincode: student.permanent_pincode || '',
      aadhar_number: student.aadhar_number || ''
    });

    if (student.academic_details) {
      setAcademicRecords(student.academic_details.map((rec) => ({
        qualification_level: rec.qualification_level,
        board_university_name: rec.board_university_name || '',
        school_college_name: rec.school_college_name || '',
        state: rec.state || '',
        city: rec.city || '',
        passing_year: rec.passing_year || '',
        aggregate_marks_cgpa: rec.aggregate_marks_cgpa || '',
        marksheet_url: rec.marksheet_url,
        migration_cert_url: rec.migration_cert_url
      })));
    } else {
      setAcademicRecords([]);
    }

    const computedSavedSections = {
      personal: !!(student.first_name && student.date_of_birth && student.student_phone),
      admission: !!(student.course_id && student.session_from_id),
      guardian: !!(student.father_name && student.guardian_name),
      academic: student.academic_details && student.academic_details.length > 0,
      address: !!(student.domicile && student.permanent_address && student.permanent_country_id && student.permanent_state_id && student.permanent_district_id && student.permanent_city_town_id && student.permanent_pincode && student.present_address && student.present_country_id && student.present_state_id && student.present_district_id && student.present_city_town_id && student.present_pincode),
      documents: !!(student.profile_picture_url || student.aadhar_front_url || student.aadhar_back_url || student.last_qualification_cert_url || student.clc_migration_cert_url)
    };

    setSavedSections(computedSavedSections);

    const same = student.present_address === student.permanent_address &&
      student.present_country_id?.toString() === student.permanent_country_id?.toString() &&
      student.present_state_id?.toString() === student.permanent_state_id?.toString() &&
      student.present_district_id?.toString() === student.permanent_district_id?.toString() &&
      student.present_city_town_id?.toString() === student.permanent_city_town_id?.toString() &&
      student.present_pincode === student.permanent_pincode &&
      (student.present_address !== '' && student.present_address !== null);
    setSameAsPermanent(!!same);

    const order = ['personal', 'guardian', 'academic', 'address', 'documents'];
    const firstUnsaved = order.find((key) => !computedSavedSections[key]) || 'personal';

    setViewMode('form');
    setActiveFormTab(firstUnsaved);
  };

  // Filtered Students list
  const filteredStudents = useMemo(() => {
    return studentProfiles.filter((s) => {
      const full = `${s.first_name} ${s.last_name || ''} ${s.email_id} ${s.student_phone} ${s.aadhar_number}`.toLowerCase();
      return full.includes(searchTerm.toLowerCase());
    });
  }, [studentProfiles, searchTerm]);
  const uniqueSessionFroms = Array.from(
    new Map(
      sessions.map((s) => [s.session_year?.split('-')[0]?.trim() || s.session_year, s])
    ).values()
  );

  const uniqueSessionTos = Array.from(
    new Map(
      sessions.map((s) => {
        const parts = s.session_year?.split('-');
        const toYear = parts?.length > 1 ? parts[1]?.trim() : (parts?.[0]?.trim() || s.session_year);
        return [toYear, s];
      })
    ).values()
  );

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-blue-700 to-sky-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-600/10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
            <UserCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {editingStudent ? 'Edit Student Profile' : 'Enroll Process'}
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
              {editingStudent ? `Modifying profile for ${editingStudent.first_name} ${editingStudent.last_name || ''}` : 'Manage and enroll students'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {viewMode === 'list' ? (
            <button
              onClick={() => { resetForm(); setViewMode('form'); }}
              className="px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Add Enrollment
            </button>
          ) : (
            <button
              onClick={() => setViewMode('list')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl backdrop-blur-xs border border-white/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Back to Profiles
            </button>
          )}
        </div>
      </div>

      {viewMode === 'form' ? (
        /* ADMISSION FORM VIEW */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TABBED NAVIGATION BAR */}
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-wrap sm:flex-nowrap gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {formTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeFormTab === tab.id;
                const isSaved = savedSections[tab.id];

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFormTab(tab.id)}
                    className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer border ${isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                      <span className="truncate">{tab.label}</span>
                    </div>

                    {isSaved && (
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-500'}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE TAB CONTENT CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            {/* Tab Header Banner */}
            <div className="bg-blue-50/70 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {formTabs.find((t) => t.id === activeFormTab)?.icon &&
                  React.createElement(formTabs.find((t) => t.id === activeFormTab).icon, {
                    className: 'w-5 h-5 text-blue-600'
                  })}
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  {formTabs.find((t) => t.id === activeFormTab)?.title}
                </h3>
              </div>

              {savedSections[activeFormTab] && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-4 h-4" /> Section Saved
                </span>
              )}
            </div>

            {/* TAB 1: Personal Information */}
            {activeFormTab === 'personal' && (
              <div className="p-6 space-y-6 animate-in fade-in-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Session <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="session_from_id"
                      value={formData.session_from_id}
                      onChange={handleInputChange}
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.session_from_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    >
                      <option value="">Choose Session...</option>
                      {uniqueMappedSessions.map((s) => (
                        <option key={s.session_id?.toString() || s.id} value={s.session_id?.toString() || s.id}>
                          {s.session_year || s.sessionYear}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="ENTER FIRST NAME"
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.first_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="middle_name"
                      value={formData.middle_name}
                      onChange={handleInputChange}
                      placeholder="ENTER MIDDLE NAME"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="ENTER LAST NAME"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Displayed As
                    </label>
                    <input
                      type="text"
                      name="displayed_as"
                      value={formData.displayed_as}
                      onChange={handleInputChange}
                      placeholder="ENTER DISPLAY NAME"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Date Of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.date_of_birth ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Student Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="student_phone"
                      value={formData.student_phone}
                      onChange={handleInputChange}
                      placeholder="Student Phone Number"
                      maxLength={10}
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.student_phone ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    />
                    {formData.student_phone && formData.student_phone.length < 10 && (
                      <p className="text-red-500 text-[10px] mt-1">Must be exactly 10 digits</p>
                    )}
                    <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        name="used_in_whatsapp"
                        checked={formData.used_in_whatsapp}
                        onChange={handleInputChange}
                        className="w-3.5 h-3.5 text-blue-600 rounded"
                      />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Used in WhatsApp</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      name="whatsapp_number"
                      value={formData.whatsapp_number}
                      onChange={handleInputChange}
                      placeholder="WhatsApp Number"
                      maxLength={10}
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.whatsapp_number ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    />
                    {formData.whatsapp_number && formData.whatsapp_number.length < 10 && (
                      <p className="text-red-500 text-[10px] mt-1">Must be exactly 10 digits</p>
                    )}
                  </div>

                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Email ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email_id"
                      value={formData.email_id}
                      onChange={handleInputChange}
                      placeholder="Enter Email ID"
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.email_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Religion <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="religion"
                      value={formData.religion}
                      onChange={handleInputChange}
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.religion ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    >
                      <option value="">Choose...</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Muslim">Muslim</option>
                      <option value="Christian">Christian</option>
                      <option value="Sikh">Sikh</option>
                      <option value="Buddhism">Buddhism</option>
                      <option value="Jainism">Jainism</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Blood Group <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleInputChange}
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.blood_group ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    >
                      <option value="">Choose...</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.category ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    >
                      <option value="">Choose...</option>
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Aadhar Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="aadhar_number"
                      value={formData.aadhar_number}
                      onChange={handleInputChange}
                      placeholder="Enter Aadhar Number"
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.aadhar_number ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={saveDraftMutation.isPending}
                    onClick={() => handleSaveAndNext('personal', 'Personal Information', validatePersonal)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> {saveDraftMutation.isPending && activeFormTab === 'personal' ? 'Saving...' : 'Save & Next'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Guardian Information */}
            {activeFormTab === 'guardian' && (
              <div className="p-6 space-y-6 animate-in fade-in-50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Father's Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="father_name"
                      value={formData.father_name}
                      onChange={handleInputChange}
                      placeholder="Enter Father's Name"
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.father_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Mother's Name
                    </label>
                    <input
                      type="text"
                      name="mother_name"
                      value={formData.mother_name}
                      onChange={handleInputChange}
                      placeholder="Enter Mother's Name"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Guardian's Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="guardian_name"
                      value={formData.guardian_name}
                      onChange={handleInputChange}
                      placeholder="Enter Guardian's Name"
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.guardian_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('personal')}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button
                    type="button"
                    disabled={saveDraftMutation.isPending}
                    onClick={() => handleSaveAndNext('guardian', 'Guardian Information', validateGuardian)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> {saveDraftMutation.isPending && activeFormTab === 'guardian' ? 'Saving...' : 'Save & Next'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: Academic Details */}
            {activeFormTab === 'academic' && (
              <div className="p-6 space-y-6 animate-in fade-in-50">
                {/* Qualification Sub-Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
                  {['10th', '12th', 'Graduation', 'Post Graduation'].map((tab) => {
                    const isSaved = academicRecords.some((r) => r.qualification_level === tab);
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setAcademicTab(tab)}
                        className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${academicTab === tab
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-t-lg'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                          }`}
                      >
                        <span>{tab}</span>
                        {isSaved && <FileCheck className="w-3.5 h-3.5 text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-Tab Input Form */}
                <div className="bg-slate-50/50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {academicTab} Qualification Details
                    </h4>
                    <span className="text-[10px] text-slate-400">{['10th', '12th'].includes(academicTab) ? 'Fields with * are mandatory' : 'All fields below are optional'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Board / University Name {['10th', '12th'].includes(academicTab) && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        name="board_university_name"
                        value={currentAcademicInput.board_university_name}
                        onChange={handleAcademicInputChange}
                        placeholder="e.g. CBSE / BSEB / Delhi University"
                        className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        School / College Name {['10th', '12th'].includes(academicTab) && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        name="school_college_name"
                        value={currentAcademicInput.school_college_name}
                        onChange={handleAcademicInputChange}
                        placeholder="Enter School or College Name"
                        className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={currentAcademicInput.state}
                        onChange={handleAcademicInputChange}
                        placeholder="State"
                        className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={currentAcademicInput.city}
                        onChange={handleAcademicInputChange}
                        placeholder="City"
                        className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Passing Year {['10th', '12th'].includes(academicTab) && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        name="passing_year"
                        value={currentAcademicInput.passing_year}
                        onChange={handleAcademicInputChange}
                        placeholder="e.g. 2022"
                        className={`w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border ${errors.academic_passing_year ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white`}
                      />
                      {errors.academic_passing_year && (
                        <p className="text-red-500 text-[10px] mt-1">{errors.academic_passing_year}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Aggregate Marks / CGPA {['10th', '12th'].includes(academicTab) && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        name="aggregate_marks_cgpa"
                        value={currentAcademicInput.aggregate_marks_cgpa}
                        onChange={handleAcademicInputChange}
                        placeholder="e.g. 85% or 8.5 CGPA"
                        className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Marksheet Upload
                      </label>
                      <input
                        key={`marksheet_${academicTab}`}
                        type="file"
                        name="marksheet_file"
                        accept="image/*,application/pdf"
                        onChange={handleAcademicFileChange}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Migration Certificate Upload
                      </label>
                      <input
                        key={`migration_${academicTab}`}
                        type="file"
                        name="migration_cert_file"
                        accept="image/*,application/pdf"
                        onChange={handleAcademicFileChange}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-end justify-end sm:col-span-2 lg:col-span-1">
                      <button
                        type="button"
                        onClick={handleSaveAcademicRecord}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-semibold text-xs rounded-lg transition-all cursor-pointer shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> Save Qualification
                      </button>
                    </div>
                  </div>
                </div>

                {/* Saved Grid */}
                {academicRecords.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-500" />
                      Saved Academic Qualifications Grid ({academicRecords.length})
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {academicRecords.map((rec) => (
                        <div
                          key={rec.qualification_level}
                          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 relative group hover:border-blue-400 transition-all"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              {rec.qualification_level}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAcademicRecord(rec.qualification_level)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Remove qualification"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium uppercase">Board / Univ</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{rec.board_university_name || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium uppercase">School / College</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{rec.school_college_name || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium uppercase">Passing Year</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{rec.passing_year || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium uppercase">Marks / CGPA</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{rec.aggregate_marks_cgpa || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium uppercase">State & City</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {[rec.city, rec.state].filter(Boolean).join(', ') || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('guardian')}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleAcademicSaveAndNext}
                    disabled={saveDraftMutation.isPending && activeFormTab === 'academic'}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> {saveDraftMutation.isPending && activeFormTab === 'academic' ? 'Saving...' : 'Save & Next'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: Address */}
            {activeFormTab === 'address' && (
              <div className="p-6 space-y-6 animate-in fade-in-50">
                {/* Permanent Address Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    Permanent Address
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="permanent_address"
                      rows="2"
                      value={formData.permanent_address}
                      onChange={handleInputChange}
                      placeholder="Enter Permanent Address"
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.permanent_address ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white resize-none`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="permanent_country_id"
                        value={formData.permanent_country_id}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.permanent_country_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                      >
                        <option value="">Choose...</option>
                        {countries.map((c) => (
                          <option key={c.country_id?.toString() || c.id} value={c.country_id?.toString() || c.id}>
                            {c.country_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="permanent_state_id"
                        value={formData.permanent_state_id}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.permanent_state_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                      >
                        <option value="">Choose...</option>
                        {states.filter((st) => st.country_id?.toString() === formData.permanent_country_id).map((st) => (
                          <option key={st.state_id?.toString() || st.id} value={st.state_id?.toString() || st.id}>
                            {st.state_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="permanent_district_id"
                        value={formData.permanent_district_id}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.permanent_district_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                      >
                        <option value="">Choose...</option>
                        {districts.filter((d) => d.state_id?.toString() === formData.permanent_state_id).map((d) => (
                          <option key={d.district_id?.toString() || d.id} value={d.district_id?.toString() || d.id}>
                            {d.district_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        City / Town <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="permanent_city_town_id"
                        value={formData.permanent_city_town_id}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.permanent_city_town_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                      >
                        <option value="">Choose...</option>
                        {cityTowns.filter((ct) => ct.district_id?.toString() === formData.permanent_district_id).map((ct) => (
                          <option key={ct.city_town_id?.toString() || ct.id} value={ct.city_town_id?.toString() || ct.id}>
                            {ct.city_town_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Domicile <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="domicile"
                        value={formData.domicile}
                        onChange={handleInputChange}
                        placeholder="Enter Domicile State"
                        className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.domicile ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Pincode <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="permanent_pincode"
                        value={formData.permanent_pincode}
                        onChange={handleInputChange}
                        placeholder="Pincode"
                        className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.permanent_pincode ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white`}
                      />
                    </div>
                  </div>
                </div>

                {/* Present Address Section */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white pb-1.5 flex items-center justify-between">
                    <span>Present Address</span>
                    <label className="flex items-center gap-1.5 font-normal text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={sameAsPermanent}
                        onChange={handleSameAsPermanentChange}
                        className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/30"
                      />
                      <span>Present address same as permanent address</span>
                    </label>
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="present_address"
                      rows="2"
                      value={formData.present_address}
                      onChange={handleInputChange}
                      disabled={sameAsPermanent}
                      placeholder={sameAsPermanent ? "Same as permanent address" : "Enter Present Address"}
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.present_address ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white resize-none disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-900`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="present_country_id"
                        value={formData.present_country_id}
                        onChange={handleInputChange}
                        disabled={sameAsPermanent}
                        className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.present_country_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-900`}
                      >
                        <option value="">Choose...</option>
                        {countries.map((c) => (
                          <option key={c.country_id?.toString() || c.id} value={c.country_id?.toString() || c.id}>
                            {c.country_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="present_state_id"
                        value={formData.present_state_id}
                        onChange={handleInputChange}
                        disabled={sameAsPermanent}
                        className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.present_state_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-900`}
                      >
                        <option value="">Choose...</option>
                        {states.filter((st) => st.country_id?.toString() === formData.present_country_id).map((st) => (
                          <option key={st.state_id?.toString() || st.id} value={st.state_id?.toString() || st.id}>
                            {st.state_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="present_district_id"
                        value={formData.present_district_id}
                        onChange={handleInputChange}
                        disabled={sameAsPermanent}
                        className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.present_district_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-900`}
                      >
                        <option value="">Choose...</option>
                        {districts.filter((d) => d.state_id?.toString() === formData.present_state_id).map((d) => (
                          <option key={d.district_id?.toString() || d.id} value={d.district_id?.toString() || d.id}>
                            {d.district_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        City / Town <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="present_city_town_id"
                        value={formData.present_city_town_id}
                        onChange={handleInputChange}
                        disabled={sameAsPermanent}
                        className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.present_city_town_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-900`}
                      >
                        <option value="">Choose...</option>
                        {cityTowns.filter((ct) => ct.district_id?.toString() === formData.present_district_id).map((ct) => (
                          <option key={ct.city_town_id?.toString() || ct.id} value={ct.city_town_id?.toString() || ct.id}>
                            {ct.city_town_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Pincode <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="present_pincode"
                        value={formData.present_pincode}
                        onChange={handleInputChange}
                        disabled={sameAsPermanent}
                        placeholder="Pincode"
                        className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border ${errors.present_pincode ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-900`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('academic')}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button
                    type="button"
                    disabled={saveDraftMutation.isPending}
                    onClick={() => handleSaveAndNext('address', 'Communication Address', validateAddress)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> {saveDraftMutation.isPending && activeFormTab === 'address' ? 'Saving...' : 'Save & Next'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 6: Upload Documents */}
            {activeFormTab === 'documents' && (
              <div className="p-6 space-y-6 animate-in fade-in-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-2">
                      <span>Profile Picture (Max 2 MB) {!editingStudent?.profile_picture_url && <span className="text-red-500">*</span>}</span>
                      {editingStudent?.profile_picture_url && (
                        <a href={editingStudent.profile_picture_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline font-normal">(View Uploaded)</a>
                      )}
                    </label>
                    <input
                      type="file"
                      name="profile_picture"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>



                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-2">
                      <span>Aadhar Front {!editingStudent?.aadhar_front_url && <span className="text-red-500">*</span>}</span>
                      {editingStudent?.aadhar_front_url && (
                        <a href={editingStudent.aadhar_front_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline font-normal">(View Uploaded)</a>
                      )}
                    </label>
                    <input
                      type="file"
                      name="aadhar_front"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-2">
                      <span>Aadhar Back {!editingStudent?.aadhar_back_url && <span className="text-red-500">*</span>}</span>
                      {editingStudent?.aadhar_back_url && (
                        <a href={editingStudent.aadhar_back_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline font-normal">(View Uploaded)</a>
                      )}
                    </label>
                    <input
                      type="file"
                      name="aadhar_back"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-2">
                      <span>Last Qualification Certificate {!editingStudent?.last_qualification_cert_url && <span className="text-red-500">*</span>}</span>
                      {editingStudent?.last_qualification_cert_url && (
                        <a href={editingStudent.last_qualification_cert_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline font-normal">(View Uploaded)</a>
                      )}
                    </label>
                    <input
                      type="file"
                      name="last_qualification_cert"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-2">
                      <span>CLC / Migration Certificate</span>
                      {editingStudent?.clc_migration_cert_url && (
                        <a href={editingStudent.clc_migration_cert_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline font-normal">(View Uploaded)</a>
                      )}
                    </label>
                    <input
                      type="file"
                      name="clc_migration_cert"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('address')}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button
                    type="button"
                    disabled={saveDraftMutation.isPending}
                    onClick={() => handleSaveAndNext('documents', 'Upload Documents', validateDocuments)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    {saveDraftMutation.isPending && activeFormTab === 'documents' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )} {saveDraftMutation.isPending && activeFormTab === 'documents' ? 'Saving...' : 'Save Documents'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Persistent Form Action Footer */}
          {activeFormTab === 'documents' && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {(editingStudent ? updateMutation.isPending : createMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {editingStudent
                  ? (updateMutation.isPending ? 'Saving Changes...' : 'Save Changes')
                  : (createMutation.isPending ? 'Submitting Application...' : 'Submit Application')
                }
              </button>
            </div>
          )}
        </form>
      ) : viewMode === 'detail' && selectedStudent ? (
        /* STUDENT PROFILE DETAIL VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs animate-in fade-in-50 print:border-none print:shadow-none print:p-0">
          <div className="flex items-center justify-between mb-8 print:hidden">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Student Profile Details</h2>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Print / Save PDF
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
              {selectedStudent.profile_picture_url ? (
                <img src={selectedStudent.profile_picture_url} alt="Profile" className="w-32 h-32 rounded-2xl object-cover border-4 border-slate-100 dark:border-slate-800 shadow-sm" />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <UserPlus className="w-12 h-12" />
                </div>
              )}
              <div className="text-center md:text-left space-y-2">
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{`${selectedStudent.first_name} ${selectedStudent.middle_name || ''} ${selectedStudent.last_name || ''}`}</h3>
                <div className="text-slate-500 font-medium">
                  {selectedStudent.course?.course_name || 'N/A'} • {selectedStudent.session_from?.session_year || 'N/A'}
                </div>
              </div>
            </div>

            {/* Details Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Personal Details */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-sm border-b border-slate-200 dark:border-slate-800 pb-2">Personal Details</h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                  <div><span className="block text-xs font-semibold text-slate-400 uppercase">Date of Birth</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.date_of_birth ? new Date(selectedStudent.date_of_birth).toLocaleDateString() : '-'}</span></div>
                  <div><span className="block text-xs font-semibold text-slate-400 uppercase">Gender</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.gender || '-'}</span></div>
                  <div><span className="block text-xs font-semibold text-slate-400 uppercase">Category</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.category || '-'}</span></div>
                  <div><span className="block text-xs font-semibold text-slate-400 uppercase">Blood Group</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.blood_group || '-'}</span></div>
                  <div><span className="block text-xs font-semibold text-slate-400 uppercase">Aadhar</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.aadhar_number || '-'}</span></div>
                  <div><span className="block text-xs font-semibold text-slate-400 uppercase">Phone</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.student_phone || '-'}</span></div>
                  <div className="col-span-2"><span className="block text-xs font-semibold text-slate-400 uppercase">Email</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.email_id || '-'}</span></div>
                </div>
              </div>

              {/* Guardian Info */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-sm border-b border-slate-200 dark:border-slate-800 pb-2">Guardian Info</h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                  <div><span className="block text-xs font-semibold text-slate-400 uppercase">Father</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.father_name || '-'}</span></div>
                  <div><span className="block text-xs font-semibold text-slate-400 uppercase">Occupation</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.father_occupation || '-'}</span></div>
                  <div><span className="block text-xs font-semibold text-slate-400 uppercase">Mother</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.mother_name || '-'}</span></div>
                  <div><span className="block text-xs font-semibold text-slate-400 uppercase">Occupation</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.mother_occupation || '-'}</span></div>
                  <div className="col-span-2"><span className="block text-xs font-semibold text-slate-400 uppercase">Guardian Contact</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.parent_contact_no || '-'}</span></div>
                </div>
              </div>

              {/* Admission Details */}
              <div className="space-y-4 md:col-span-2">
                <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-sm border-b border-slate-200 dark:border-slate-800 pb-2">Admission Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-2 text-sm">
                  <div className="col-span-2"><span className="block text-xs font-semibold text-slate-400 uppercase">University</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.university || '-'}</span></div>
                  <div><span className="block text-xs font-semibold text-slate-400 uppercase">Course</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.course?.course_name || '-'}</span></div>
                  <div><span className="block text-xs font-semibold text-slate-400 uppercase">Session</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.session_from?.session_year || '-'}</span></div>
                  <div><span className="block text-xs font-semibold text-slate-400 uppercase">Admission Type</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.admission_type || '-'}</span></div>
                  <div><span className="block text-xs font-semibold text-slate-400 uppercase">Status</span> <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStudent.student_status || '-'}</span></div>
                </div>
              </div>

              {/* Addresses */}
              <div className="space-y-4 md:col-span-2">
                <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-sm border-b border-slate-200 dark:border-slate-800 pb-2">Addresses</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <span className="block text-xs font-semibold text-slate-400 uppercase mb-2">Present Address</span>
                    {selectedStudent.present_address ? (
                      <div className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        {selectedStudent.present_address}<br/>
                        {selectedStudent.present_city_town?.city_town_name && `${selectedStudent.present_city_town.city_town_name}, `}
                        {selectedStudent.present_district?.district_name && `${selectedStudent.present_district.district_name}`}<br/>
                        {selectedStudent.present_state?.state_name && `${selectedStudent.present_state.state_name}, `}
                        {selectedStudent.present_country?.country_name && `${selectedStudent.present_country.country_name}`}
                        {selectedStudent.present_pincode && ` - ${selectedStudent.present_pincode}`}
                      </div>
                    ) : <span className="text-slate-400">-</span>}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <span className="block text-xs font-semibold text-slate-400 uppercase mb-2">Permanent Address</span>
                    {selectedStudent.permanent_address ? (
                      <div className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        {selectedStudent.permanent_address}<br/>
                        {selectedStudent.permanent_city_town?.city_town_name && `${selectedStudent.permanent_city_town.city_town_name}, `}
                        {selectedStudent.permanent_district?.district_name && `${selectedStudent.permanent_district.district_name}`}<br/>
                        {selectedStudent.permanent_state?.state_name && `${selectedStudent.permanent_state.state_name}, `}
                        {selectedStudent.permanent_country?.country_name && `${selectedStudent.permanent_country.country_name}`}
                        {selectedStudent.permanent_pincode && ` - ${selectedStudent.permanent_pincode}`}
                      </div>
                    ) : <span className="text-slate-400">-</span>}
                  </div>
                </div>
              </div>

              {/* Academic Qualifications */}
              {selectedStudent.academic_details && selectedStudent.academic_details.length > 0 && (
                <div className="space-y-4 md:col-span-2">
                  <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-sm border-b border-slate-200 dark:border-slate-800 pb-2">Academic Qualifications</h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-500">
                        <tr>
                          <th className="p-3">Level</th>
                          <th className="p-3">Board / University</th>
                          <th className="p-3">School / College</th>
                          <th className="p-3">Year</th>
                          <th className="p-3">Marks/CGPA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {selectedStudent.academic_details.map((acad) => (
                          <tr key={acad.academic_id?.toString() || acad.qualification_level}>
                            <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{acad.qualification_level}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{acad.board_university_name || '-'}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{acad.school_college_name || '-'}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{acad.passing_year || '-'}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{acad.aggregate_marks_cgpa || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* STUDENT DIRECTORY / LIST VIEW */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student by name, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">STUDENT NAME</th>
                    <th className="px-6 py-4">AADHAR NUMBER</th>
                    <th className="px-6 py-4">CONTACT</th>
                    <th className="px-6 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((st) => (
                      <tr key={st.student_id?.toString() || st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white flex items-center gap-3">
                          {st.profile_picture_url ? (
                            <img
                              src={st.profile_picture_url}
                              alt={st.first_name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                              {st.first_name?.[0]}
                            </div>
                          )}
                          <div>
                            <div>{`${st.first_name} ${st.middle_name || ''} ${st.last_name || ''}`}</div>
                            <span className="text-[10px] font-normal text-slate-400">{st.university}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {st.aadhar_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5" title="Phone Number">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium">{st.student_phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5" title="Email Address">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[11px]">{st.email_id || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedStudent(st);
                                setViewMode('detail');
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditClick(st)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600"
                              title="Edit Record"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setStudentToDelete(st);
                                setIsDeleteOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                        No student admission records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(studentToDelete?.student_id?.toString() || studentToDelete?.id)}
        title="Delete Student Record"
        message={`Are you sure you want to delete the profile for ${studentToDelete?.first_name}?`}
      />
    </div>
  );
}
