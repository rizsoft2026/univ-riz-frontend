import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Book, CheckCircle, XCircle, AlertCircle, ArrowRight, Layers, Tag, Bookmark, Sparkles, Filter, ChevronDown, ChevronRight, ChevronLeft, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from '../hooks/useSubjects';
import { useSubjectGroups } from '../hooks/useSubjectGroups';
import { useCodifications } from '../hooks/useCodifications';
import { useOnClickOutside } from 'usehooks-ts';

const TYPE_STYLES = {
  Major: {
    wrapper: 'border-blue-200/70 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/10',
    headerBg: 'bg-blue-100/60 dark:bg-blue-950/50 border-blue-200/80 dark:border-blue-900/50',
    iconText: 'text-blue-600 dark:text-blue-400',
    hoverIconText: 'hover:text-blue-600 dark:hover:text-blue-400',
    title: 'text-blue-950 dark:text-blue-200',
    badge: 'bg-blue-600 text-white shadow-xs',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700/60',
    codeBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200/80 dark:border-blue-900/50',
    codeText: 'text-blue-700 dark:text-blue-300',
    badgeWrapper: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/50',
    icon: Bookmark
  },
  Minor: {
    wrapper: 'border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10',
    headerBg: 'bg-emerald-100/60 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-900/50',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    hoverIconText: 'hover:text-emerald-600 dark:hover:text-emerald-400',
    title: 'text-emerald-950 dark:text-emerald-200',
    badge: 'bg-emerald-600 text-white shadow-xs',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700/60',
    codeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-900/50',
    codeText: 'text-emerald-700 dark:text-emerald-300',
    badgeWrapper: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/50',
    icon: Tag
  },
  SEC: {
    wrapper: 'border-amber-200/70 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10',
    headerBg: 'bg-amber-100/60 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-900/50',
    iconText: 'text-amber-600 dark:text-amber-400',
    hoverIconText: 'hover:text-amber-600 dark:hover:text-amber-400',
    title: 'text-amber-950 dark:text-amber-200',
    badge: 'bg-amber-600 text-white shadow-xs',
    hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700/60',
    codeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200/80 dark:border-amber-900/50',
    codeText: 'text-amber-700 dark:text-amber-300',
    badgeWrapper: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/50',
    icon: Sparkles
  },
  'Multidisciplinary Co': {
    wrapper: 'border-purple-200/70 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/10',
    headerBg: 'bg-purple-100/60 dark:bg-purple-950/50 border-purple-200/80 dark:border-purple-900/50',
    iconText: 'text-purple-600 dark:text-purple-400',
    hoverIconText: 'hover:text-purple-600 dark:hover:text-purple-400',
    title: 'text-purple-950 dark:text-purple-200',
    badge: 'bg-purple-600 text-white shadow-xs',
    hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700/60',
    codeBg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200/80 dark:border-purple-900/50',
    codeText: 'text-purple-700 dark:text-purple-300',
    badgeWrapper: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-900/50',
    icon: Layers
  },
  default: {
    wrapper: 'border-purple-200/70 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/10',
    headerBg: 'bg-purple-100/60 dark:bg-purple-950/50 border-purple-200/80 dark:border-purple-900/50',
    iconText: 'text-purple-600 dark:text-purple-400',
    hoverIconText: 'hover:text-purple-600 dark:hover:text-purple-400',
    title: 'text-purple-950 dark:text-purple-200',
    badge: 'bg-purple-600 text-white shadow-xs',
    hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700/60',
    codeBg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200/80 dark:border-purple-900/50',
    codeText: 'text-purple-700 dark:text-purple-300',
    badgeWrapper: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-900/50',
    icon: Layers
  }
};

const cleanTypeName = (type) => {
  if (!type) return '';
  return type
    .replace(/\s*\([^)]*\)?/g, '')
    .replace(/\s*\(.*$/, '')
    .trim();
};

const getStyleForType = (type) => {
  if (!type) return TYPE_STYLES.default;
  const cleaned = cleanTypeName(type);
  if (TYPE_STYLES[type]) return TYPE_STYLES[type];
  if (TYPE_STYLES[cleaned]) return TYPE_STYLES[cleaned];
  const lower = type.toLowerCase();
  if (lower.includes('major')) return TYPE_STYLES.Major;
  if (lower.includes('minor')) return TYPE_STYLES.Minor;
  if (lower.includes('sec') || lower.includes('skill')) return TYPE_STYLES.SEC;
  if (lower.includes('multi')) return TYPE_STYLES['Multidisciplinary Co'];
  if (lower.includes('value')) return TYPE_STYLES.SEC;
  return TYPE_STYLES.default;
};

export default function SubjectMaster({ setActiveTab, showNotification }) {
  // Data from API
  const { data: subjects = [], isLoading: isLoadingSubjects } = useSubjects();
  const { data: subjectGroups = [], isLoading: isLoadingGroups } = useSubjectGroups();
  const { data: codifications = [], isLoading: isLoadingCodifications } = useCodifications();

  const createMutation = useCreateSubject();
  const updateMutation = useUpdateSubject();
  const deleteMutation = useDeleteSubject();
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [groupFilter, setGroupFilter] = useState('ALL');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5); // Default 5 bucket groups per page

  // Reset pagination to page 1 whenever filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, groupFilter, pageSize]);

  // Accordion open/close state tracking per group id
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroupCollapse = (groupId) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleExpandAll = () => setCollapsedGroups({});
  const handleCollapseAll = () => {
    const allCollapsed = {};
    subjectGroups.forEach((g) => {
      allCollapsed[g.id] = true;
    });
    setCollapsedGroups(allCollapsed);
  };

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    subjectGroupId: '',
    type: 'Major',
    status: 'Active',
  });
  const [errors, setErrors] = useState({});

  // Dropdown states
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const groupDropdownRef = React.useRef(null);
  useOnClickOutside(groupDropdownRef, () => setIsGroupDropdownOpen(false));

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [typeSearchTerm, setTypeSearchTerm] = useState('');
  const typeDropdownRef = React.useRef(null);
  useOnClickOutside(typeDropdownRef, () => setIsTypeDropdownOpen(false));

  const [isCodificationDropdownOpen, setIsCodificationDropdownOpen] = useState(false);
  const [codificationSearchTerm, setCodificationSearchTerm] = useState('');
  const codificationDropdownRef = React.useRef(null);
  useOnClickOutside(codificationDropdownRef, () => setIsCodificationDropdownOpen(false));

  const filteredGroupsDropdown = useMemo(() => {
    if (!Array.isArray(subjectGroups)) return [];
    return subjectGroups.filter(g => g && g.status === 'Active' && ((g.name || '').toLowerCase().includes((groupSearchTerm || '').toLowerCase()) || (g.code || '').toLowerCase().includes((groupSearchTerm || '').toLowerCase()))).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [subjectGroups, groupSearchTerm]);

  const SUBJECT_TYPES = useMemo(() => {
    if (!codifications) return [];
    const uniqueCategories = [...new Set(codifications.map(c => c.category))];
    return uniqueCategories.filter(Boolean).sort((a, b) => a.localeCompare(b)).map(cat => ({ value: cat, label: cat }));
  }, [codifications]);

  const filteredTypesDropdown = useMemo(() => {
    return SUBJECT_TYPES.filter(t =>
      t.label.toLowerCase().includes(typeSearchTerm.toLowerCase())
    );
  }, [SUBJECT_TYPES, typeSearchTerm]);


  // Helper to map subjectGroupId to Group Name
  const getSubjectGroupName = (groupId) => {
    const group = subjectGroups.find((g) => g.id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  const getCodificationCode = (codificationId) => {
    const cod = codifications?.find((c) => c.id === codificationId);
    return cod ? cod.code : '';
  };

  // Helper to get subject category from codification first, then fallback to subject.type
  const getSubjectCategory = (sub) => {
    if (!sub) return 'Major';
    if (sub.codification_id) {
      const cod = codifications?.find((c) => c.id === sub.codification_id);
      if (cod && cod.category) return cod.category;
    }
    return sub.type || 'Major';
  };

  // Handle opening form for Create (with optional pre-selected group & type)
  const handleCreateOpen = (groupId = '', type = null) => {
    if (subjectGroups.length === 0) {
      showNotification('You must create a Bucket Subject Group before creating a subject.', 'warning');
      return;
    }

    setEditingSubject(null);

    let initialGroupId = groupId || '';
    let initialType = type || '';
    let initialCodificationId = '';

    if (initialGroupId) {
      const matchingCod = (codifications || []).find(
        c => c.subjectGroupId === initialGroupId && 
             c.status === 'Active' && 
             (!initialType || c.category === initialType)
      );
      if (matchingCod) {
        initialCodificationId = matchingCod.id;
        initialType = matchingCod.category;
      }
    }

    setFormData({
      code: '',
      name: '',
      subjectGroupId: initialGroupId,
      codificationId: initialCodificationId,
      type: initialType || (SUBJECT_TYPES[0]?.value || ''),
      status: 'Active',
    });
    setErrors({});
    setIsFormOpen(true);
  };

  // Handle opening form for Edit
  const handleEditOpen = (subject) => {
    setEditingSubject(subject);

    const group = subjectGroups.find(g => g.id === subject.subject_group_id);
    const prefix = group ? `${group.code}-` : '';
    let codeWithoutPrefix = subject.code;
    if (prefix && codeWithoutPrefix.startsWith(prefix)) {
      codeWithoutPrefix = codeWithoutPrefix.substring(prefix.length);
    }

    setFormData({
      code: codeWithoutPrefix,
      name: subject.name,
      subjectGroupId: subject.subject_group_id,
      codificationId: subject.codification_id || '',
      type: getSubjectCategory(subject),
      status: subject.status,
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

    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === 'subjectGroupId' && value) {
        const matchingCod = (codifications || []).find(
          c => c.subjectGroupId === value && c.status === 'Active'
        );
        if (matchingCod) {
          next.type = matchingCod.category;
        }
      }

      if (name === 'type') {
        // If type changed manually, only clear codificationId if current codification category doesn't match
        const currentCod = (codifications || []).find(c => c.id === prev.codificationId);
        if (currentCod && currentCod.category !== value) {
          next.codificationId = '';
        }
      }
      return next;
    });
  };

  // Validate form
  const validateForm = () => {
    const tempErrors = {};
    const codePattern = /^[A-Z0-9\-]{1,20}$/;

    const selectedGroup = subjectGroups.find(g => g.id === formData.subjectGroupId);
    const groupCodePrefix = selectedGroup ? selectedGroup.code : '';
    const finalCode = groupCodePrefix ? `${groupCodePrefix}-${formData.code.trim().toUpperCase()}` : formData.code.trim().toUpperCase();

    if (!formData.code) {
      tempErrors.code = 'Subject Code suffix is required.';
    } else if (!codePattern.test(formData.code)) {
      tempErrors.code = 'Code must be 1-20 characters (alphanumeric and hyphens only)';
    }

    if (!formData.name) {
      tempErrors.name = 'Subject Name is required.';
    } else if (formData.name.trim().length < 3) {
      tempErrors.name = 'Name must be at least 3 characters long';
    }

    if (!formData.subjectGroupId) {
      tempErrors.subjectGroupId = 'Bucket Subject Group is required.';
    }

    if (!formData.codificationId) {
      tempErrors.codificationId = 'Codification is required.';
    }

    if (!formData.type) {
      tempErrors.type = 'Subject Type is required.';
    }

    // Check code uniqueness
    const duplicate = (subjects || []).find(
      (s) =>
        s && (s.code || '').toUpperCase() === finalCode &&
        (!editingSubject || s.id !== editingSubject.id)
    );

    if (duplicate) {
      tempErrors.code = 'Subject Code already exists.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Form Submit (Create/Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const selectedGroup = subjectGroups.find(g => g.id === formData.subjectGroupId);
    const groupCodePrefix = selectedGroup ? selectedGroup.code : '';
    const finalCode = groupCodePrefix ? `${groupCodePrefix}-${formData.code.trim().toUpperCase()}` : formData.code.trim().toUpperCase();

    const cod = (codifications || []).find(c => c.id === formData.codificationId);
    const categoryType = cod?.category || formData.type;

    if (editingSubject) {
      // Update
      updateMutation.mutate({
        id: editingSubject.id,
        code: finalCode,
        name: formData.name.trim(),
        subject_group_id: formData.subjectGroupId,
        codification_id: formData.codificationId,
        type: categoryType,
        status: formData.status
      }, {
        onSuccess: () => {
          showNotification(`Subject "${formData.name}" updated successfully!`, 'success');
          setIsFormOpen(false);
        },
        onError: (err) => {
          showNotification(err.response?.data?.message || 'Failed to update subject', 'error');
        }
      });
    } else {
      // Create
      createMutation.mutate({
        code: finalCode,
        name: formData.name.trim(),
        subject_group_id: formData.subjectGroupId,
        codification_id: formData.codificationId,
        type: categoryType,
        status: formData.status
      }, {
        onSuccess: () => {
          showNotification(`Subject "${formData.name}" created successfully!`, 'success');
          setIsFormOpen(false);
        },
        onError: (err) => {
          showNotification(err.response?.data?.message || 'Failed to create subject', 'error');
        }
      });
    }
  };

  // Handle Delete Confirmation
  const handleDeleteOpen = (subject) => {
    setSubjectToDelete(subject);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!subjectToDelete) return;
    deleteMutation.mutate(subjectToDelete.id, {
      onSuccess: () => {
        showNotification(`Subject "${subjectToDelete.name}" deleted successfully!`, 'success');
        setIsDeleteOpen(false);
        setSubjectToDelete(null);
      },
      onError: (err) => {
        showNotification(err.response?.data?.message || 'Failed to delete subject', 'error');
      }
    });
  };

  // Filter subjects
  const filteredSubjects = useMemo(() => {
    if (!Array.isArray(subjects)) return [];
    return subjects.filter((s) => {
      if (!s) return false;
      const search = (searchTerm || '').toLowerCase();
      const matchSearch =
        (s.code || '').toLowerCase().includes(search) ||
        (s.name || '').toLowerCase().includes(search);

      const matchStatus =
        statusFilter === 'ALL' || (s.status || '').toUpperCase() === statusFilter;

      const matchGroup =
        groupFilter === 'ALL' || s.subject_group_id === groupFilter;

      return matchSearch && matchStatus && matchGroup;
    });
  }, [subjects, searchTerm, statusFilter, groupFilter]);

  // Group filtered subjects by Bucket Group
  const activeBucketGroups = useMemo(() => {
    let activeGroups = subjectGroups.filter(g => g.status === 'Active');

    // Hide groups that have no subjects matching the current filters
    activeGroups = activeGroups.filter(g =>
      filteredSubjects.some(s => s.subject_group_id === g.id)
    );

    if (groupFilter !== 'ALL') {
      return activeGroups.filter((g) => g.id === groupFilter);
    }
    return activeGroups;
  }, [subjectGroups, groupFilter, filteredSubjects]);

  // Calculate Pagination slice
  const totalGroupsCount = activeBucketGroups.length;
  const numericPageSize = pageSize === 'ALL' ? totalGroupsCount : Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(totalGroupsCount / (numericPageSize || 1)));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedBucketGroups = useMemo(() => {
    if (pageSize === 'ALL') return activeBucketGroups;
    const startIndex = (safePage - 1) * numericPageSize;
    return activeBucketGroups.slice(startIndex, startIndex + numericPageSize);
  }, [activeBucketGroups, safePage, pageSize, numericPageSize]);

  const startRecordNum = totalGroupsCount === 0 ? 0 : (safePage - 1) * (pageSize === 'ALL' ? totalGroupsCount : Number(pageSize)) + 1;
  const endRecordNum = pageSize === 'ALL' ? totalGroupsCount : Math.min(safePage * Number(pageSize), totalGroupsCount);

  // Derived available codifications based on Subject Type
  const availableCodifications = useMemo(() => {
    const activeCodifications = codifications.filter(c => c.status === 'Active');
    if (!formData.type) return activeCodifications;
    return activeCodifications.filter(c => c.category === formData.type);
  }, [codifications, formData.type]);

  const filteredCodificationsDropdown = useMemo(() => {
    if (!Array.isArray(availableCodifications)) return [];
    return availableCodifications.filter(c => c && ((c.code || '').toLowerCase().includes((codificationSearchTerm || '').toLowerCase()) || (c.category || '').toLowerCase().includes((codificationSearchTerm || '').toLowerCase()))).filter((c, index, self) => index === self.findIndex((t) => t.code === c.code)).sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  }, [availableCodifications, codificationSearchTerm]);


  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {isLoadingGroups || isLoadingSubjects ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500">Loading dependencies...</p>
        </div>
      ) : subjectGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-full text-amber-500 mb-4">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Bucket Subject Groups Needed</h3>
          <p className="text-slate-400 dark:text-slate-400 max-w-md mt-2 text-sm leading-relaxed">
            You must create at least one Bucket Subject Group before you can define subjects.
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
                <Book className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Subject Master</h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
                  Collapsible Accordion layout for Bucket Subject Groups categorized by Major, Minor, and SEC.
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
                <Plus className="w-4 h-4" /> Add New Subject
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
                placeholder="Search by Subject Code or Subject Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-950/40 border border-white/60 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-white placeholder:text-slate-400 shadow-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Bucket Group Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">Bucket:</span>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="flex-1 sm:flex-none sm:max-w-[180px] truncate pl-3.5 pr-8 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-white/60 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                >
                  <option value="ALL">All Bucket Groups</option>
                  {subjectGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
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

          {/* Accordion Bucket Grid Display */}
          <div className="space-y-4">
            {paginatedBucketGroups.map((group) => {
              const groupSubjects = filteredSubjects.filter((s) => s.subject_group_id === group.id);

              const groupedByType = groupSubjects.reduce((acc, sub) => {
                const t = getSubjectCategory(sub);
                if (!acc[t]) acc[t] = [];
                acc[t].push(sub);
                return acc;
              }, {});
              const groupTypes = Object.keys(groupedByType).sort();

              const totalGroupSubjects = subjects.filter((s) => s.subject_group_id === group.id).length;
              const isCollapsed = !!collapsedGroups[group.id];

              return (
                <div
                  key={group.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
                >
                  {/* Accordion Header Box */}
                  <div
                    onClick={() => toggleGroupCollapse(group.id)}
                    className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/60 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                        title={isCollapsed ? 'Expand' : 'Collapse'}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>

                      <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {group.name}
                          </h3>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-900/40">
                            {group.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {group.description || 'Bucket Subject Group'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      {/* Breakdown Summary Badges */}
                      <div className="hidden md:flex items-center gap-2">
                        {groupTypes.map((type) => {
                          const style = getStyleForType(type);
                          return (
                            <span key={type} className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${style.badgeWrapper}`}>
                              {cleanTypeName(type)}: {groupedByType[type].length}
                            </span>
                          );
                        })}
                      </div>

                      <span className="text-xs font-medium px-3 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full text-slate-600 dark:text-slate-300 shadow-2xs">
                        Total: <strong className="text-blue-600 dark:text-blue-400">{totalGroupSubjects}</strong>
                      </span>
                      <button
                        onClick={() => handleCreateOpen(group.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200/60 dark:border-blue-800/60 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Subject
                      </button>
                    </div>
                  </div>

                  {/* Accordion Collapsible Content */}
                  {!isCollapsed && (() => {
                    const visibleCols = groupTypes.length;

                    if (visibleCols === 0) {
                      return (
                        <div className="p-8 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 italic text-sm">
                          No subjects defined in this group yet. Click "Add Subject" to create one.
                        </div>
                      );
                    }

                    return (
                      <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-4">
                        {groupTypes.map((type) => {
                          const typeSubjects = groupedByType[type];
                          const style = getStyleForType(type);
                          const Icon = style.icon;
                          const displayType = cleanTypeName(type);

                          return (
                            <div
                              key={type}
                              className={`rounded-2xl border ${style.wrapper} bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all`}
                            >
                              {/* Type Header Bar */}
                              <div className={`px-4 sm:px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${style.headerBg}`}>
                                <div className="flex items-center gap-2.5">
                                  <div className={`p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 shadow-2xs ${style.iconText}`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <h4 className={`text-xs font-bold uppercase tracking-wider ${style.title}`}>
                                    {displayType}
                                  </h4>
                                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${style.badge}`}>
                                    {typeSubjects.length}
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleCreateOpen(group.id, type)}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${style.iconText}`}
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add {displayType} Subject
                                </button>
                              </div>

                              {/* Subject Rows Table View */}
                              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {/* Header row for larger screens */}
                                <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-5 py-2.5 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/60">
                                  <div className="col-span-2">Codification</div>
                                  <div className="col-span-2">Subject Code</div>
                                  <div className="col-span-4 md:col-span-5">Subject Name</div>
                                  <div className="col-span-2 md:col-span-2">Status</div>
                                  <div className="col-span-2 md:col-span-1 text-right">Actions</div>
                                </div>

                                {typeSubjects.map((sub) => (
                                  <div
                                    key={sub.id}
                                    className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-3 px-4 sm:px-5 py-3 items-center hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                                  >
                                    {/* Codification */}
                                    <div className="col-span-2 w-full sm:w-auto flex items-center justify-between sm:justify-start">
                                      <span className="sm:hidden text-xs text-slate-400 font-medium">Codification:</span>
                                      {sub.codification_id && getCodificationCode(sub.codification_id) ? (
                                        <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-md border border-purple-100 dark:border-purple-900/40 shrink-0" title="Codification">
                                          {getCodificationCode(sub.codification_id)}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-slate-300 dark:text-slate-600 font-mono">—</span>
                                      )}
                                    </div>

                                    {/* Subject Code */}
                                    <div className="col-span-2 w-full sm:w-auto flex items-center justify-between sm:justify-start">
                                      <span className="sm:hidden text-xs text-slate-400 font-medium">Code:</span>
                                      <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border shrink-0 ${style.codeBg} ${style.codeText}`}>
                                        {sub.code}
                                      </span>
                                    </div>

                                    {/* Subject Name */}
                                    <div className="col-span-4 md:col-span-5 w-full">
                                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 break-words" title={sub.name}>
                                        {sub.name}
                                      </span>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2 md:col-span-2 w-full sm:w-auto flex items-center justify-between sm:justify-start">
                                      <span className="sm:hidden text-xs text-slate-400 font-medium">Status:</span>
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        sub.status === 'Active'
                                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50'
                                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        {sub.status}
                                      </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-2 md:col-span-1 w-full sm:w-auto flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                                      <button
                                        onClick={() => handleEditOpen(sub)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                                        title="Edit Subject"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteOpen(sub)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                                        title="Delete Subject"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              );
            })}

            {activeBucketGroups.length === 0 && (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500">
                No matching Bucket Groups or Subjects found.
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {totalGroupsCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800">
              {/* Left Side: Summary & Page Size */}
              <div className="flex items-center gap-4 text-[13px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800 shadow-2xs">
                  <span>Showing</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{startRecordNum}</span>
                  <span>-</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{endRecordNum}</span>
                  <span>of</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{totalGroupsCount}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Rows per page:</span>
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                      className="appearance-none pl-3 pr-8 py-1.5 text-[13px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs transition-all cursor-pointer"
                    >
                      <option value={2}>2</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value="ALL">All</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Right Side: Page Controls */}
              {pageSize !== 'ALL' && totalPages > 1 && (
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-2xs">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all cursor-pointer disabled:cursor-not-allowed"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      const isActive = safePage === pageNum;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[28px] h-7 px-2 mx-0.5 text-[13px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center ${isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-600'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all cursor-pointer disabled:cursor-not-allowed"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Add/Edit Modal */}
          <Modal
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            title={editingSubject ? 'Edit Subject Details' : 'Add New Subject'}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Bucket Subject Group Dropdown */}
              <div className="space-y-1">
                <label htmlFor="subjectGroupId" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Bucket Subject Group
                </label>
                <div className="relative" ref={groupDropdownRef}>
                  <div
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${errors.subjectGroupId ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
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
                          return g ? `${g.name} (${g.code})` : 'Please select bucket subject group';
                        })()
                        : 'Please select bucket subject group'}
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
                                handleInputChange({ target: { name: 'subjectGroupId', value: g.id } });
                                setIsGroupDropdownOpen(false);
                              }}
                            >
                              {g.name} <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">({g.code})</span>
                            </div>
                          ))
                        ) : (
                          <div className="px-3.5 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                            No active groups found.
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

              {/* Subject Type Dropdown */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="type" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Subject Category / Type
                  </label>
                </div>
                <div className="relative" ref={typeDropdownRef}>
                  <div
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${errors.type ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                      } rounded-xl focus:outline-none focus:ring-2 dark:text-white cursor-pointer flex justify-between items-center`}
                    onClick={() => {
                      setIsTypeDropdownOpen(!isTypeDropdownOpen);
                      if (!isTypeDropdownOpen) setTypeSearchTerm('');
                    }}
                  >
                    <span className={formData.type ? 'text-slate-800 dark:text-white' : 'text-slate-400'}>
                      {formData.type ? cleanTypeName(SUBJECT_TYPES.find(t => t.value === formData.type)?.label || formData.type) : 'Select subject category'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>

                  {isTypeDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search types..."
                            value={typeSearchTerm}
                            onChange={(e) => setTypeSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 dark:text-white placeholder:text-slate-400"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto">
                        {filteredTypesDropdown.length > 0 ? (
                          filteredTypesDropdown.map((t) => (
                            <div
                              key={t.value}
                              className={`px-3.5 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${formData.type === t.value ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-200'
                                }`}
                              onClick={() => {
                                handleInputChange({ target: { name: 'type', value: t.value } });
                                setIsTypeDropdownOpen(false);
                              }}
                            >
                              {cleanTypeName(t.label)}
                            </div>
                          ))
                        ) : (
                          <div className="px-3.5 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                            No types found.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {errors.type && (
                  <p className="text-red-500 text-xs mt-1">{errors.type}</p>
                )}
              </div>

              {/* Codification Dropdown */}
              <div className="space-y-1">
                <label htmlFor="codificationId" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Codification
                </label>
                <div className="relative" ref={codificationDropdownRef}>
                  <div
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${errors.codificationId ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                      } rounded-xl focus:outline-none focus:ring-2 dark:text-white ${!formData.type ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex justify-between items-center`}
                    onClick={() => {
                      if (!formData.type) return;
                      setIsCodificationDropdownOpen(!isCodificationDropdownOpen);
                      if (!isCodificationDropdownOpen) setCodificationSearchTerm('');
                    }}
                  >
                    <span className={formData.codificationId ? 'text-slate-800 dark:text-white' : 'text-slate-400'}>
                      {!formData.type
                        ? 'Please select a Subject Type first'
                        : formData.codificationId
                          ? (() => {
                            const c = availableCodifications.find(c => c.id === formData.codificationId);
                            return c ? `${c.code} - ${c.category}` : 'Select a Codification';
                          })()
                          : 'Select a Codification'}
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
                              {c.code} <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">- {c.category}</span>
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
                {errors.codificationId && (
                  <p className="text-red-500 text-xs mt-1">{errors.codificationId}</p>
                )}
              </div>

              {/* Code */}
              <div className="space-y-1">
                <label htmlFor="code" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Subject Code
                </label>
                <div className="flex items-center">
                  {subjectGroups.find(g => g.id === formData.subjectGroupId)?.code && (
                    <span className="shrink-0 whitespace-nowrap inline-flex items-center px-3 text-sm font-bold text-slate-500 bg-slate-100 border border-r-0 border-slate-200 dark:border-slate-800 rounded-l-xl dark:bg-slate-800 dark:text-slate-400 h-[42px]">
                      {subjectGroups.find(g => g.id === formData.subjectGroupId).code}-
                    </span>
                  )}
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="E.g. 101 or CS1"
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${errors.code ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                      } ${subjectGroups.find(g => g.id === formData.subjectGroupId)?.code ? 'rounded-r-xl' : 'rounded-xl'} focus:outline-none focus:ring-2 font-mono dark:text-white uppercase h-[42px]`}
                  />
                </div>
                {errors.code ? (
                  <p className="text-red-500 text-xs mt-1">{errors.code}</p>
                ) : (
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">Uppercase letters, numbers and hyphens only.</p>
                )}
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label htmlFor="name" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Subject Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Discrete Mathematics"
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950/40 border ${errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-600'
                    } rounded-xl focus:outline-none focus:ring-2 dark:text-white`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
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
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <ConfirmModal
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleDeleteConfirm}
            title="Delete Subject"
            message={`Are you sure you want to delete subject "${subjectToDelete?.name}"? This action cannot be undone.`}
          />
        </>
      )}
    </div>
  );
}

