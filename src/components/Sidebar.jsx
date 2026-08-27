import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  FolderGit,
  GraduationCap,
  Sun,
  Moon,
  X,
  Book,
  BookOpen,
  Hash,
  Layers,
  Network,
  Globe,
  MapPin,
  Navigation,
  Building2,
  UserCheck,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Users,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode
}) {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState({
    academicMasters: false,
    mappings: false,
    locationMasters: false,
    studentManagement: false,
    studentAdmissionSection: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <aside className={`fixed top-0 bottom-0 left-0 z-45 flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">UNI-RIZ</h1>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Portal</span>
          </div>
        </div>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {/* Dashboard Tab */}
        <button
          onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${activeTab === 'dashboard'
            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
        >
          <LayoutDashboard className="w-5 h-5 text-slate-400" />
          Dashboard
        </button>

        {/* Academic Masters Section */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSection('academicMasters')}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-slate-400" />
              <span>Academic Masters</span>
            </div>
            {openSections.academicMasters ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          <div className={`space-y-1 pl-11 pr-2 ${openSections.academicMasters ? 'block' : 'hidden'}`}>
            <button
              onClick={() => { setActiveTab('sessions'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'sessions'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              Session Master
            </button>

            {/* Faculty Master Tab */}
            <button
              onClick={() => { setActiveTab('faculties'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'faculties'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              Faculty Master
            </button>

            {/* Subject Group Master Tab */}
            <button
              onClick={() => { setActiveTab('groups'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'groups'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              Subject Groups
            </button>

            {/* Course Master Tab */}
            <button
              onClick={() => { setActiveTab('courses'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'courses'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              Courses
            </button>

            {/* Specialization Master Tab */}
            <button
              onClick={() => { setActiveTab('specializations'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'specializations'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              Specialization Master
            </button>

            {/* Codification Master Tab */}
            <button
              onClick={() => { setActiveTab('codifications'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'codifications'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              Codifications
            </button>

            {/* Session Course Mapping Tab */}
            <button
              onClick={() => { setActiveTab('sessionCourseMappings'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'sessionCourseMappings'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              Session Mapping
            </button>

            {/* Curriculum Mapping Tab */}
            <button
              onClick={() => { setActiveTab('curriculum'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'curriculum'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              Curriculum
            </button>

            {/* Subject Master Tab */}
            <button
              onClick={() => { setActiveTab('subjects'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'subjects'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              Subjects
            </button>
          </div>
        </div>

        {/* Location Masters Section */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSection('locationMasters')}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-slate-400" />
              <span>Location Masters</span>
            </div>
            {openSections.locationMasters ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          <div className={`space-y-1 pl-11 pr-2 ${openSections.locationMasters ? 'block' : 'hidden'}`}>
            {/* Country Master Tab */}
            <button
              onClick={() => { setActiveTab('countries'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'countries'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              Countries
            </button>

            {/* State Master Tab */}
            <button
              onClick={() => { setActiveTab('states'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'states'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              States
            </button>

            {/* District Master Tab */}
            <button
              onClick={() => { setActiveTab('districts'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'districts'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              Districts
            </button>

            {/* City/Town Master Tab */}
            <button
              onClick={() => { setActiveTab('cityTowns'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'cityTowns'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              City / Towns
            </button>
          </div>
        </div>

        {/* Student Management Section */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSection('studentManagement')}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-slate-400" />
              <span>Admission Process</span>
            </div>
            {openSections.studentManagement ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          <div className={`space-y-1 pl-11 pr-2 ${openSections.studentManagement ? 'block' : 'hidden'}`}>
            {/* Student Admission Tab */}
            <button
              onClick={() => { setActiveTab('studentAdmission'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'studentAdmission'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              Enroll Process
            </button>
            <button
              onClick={() => { setActiveTab('enrollCourse'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'enrollCourse'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              Enroll Course
            </button>
            <button
              onClick={() => { setActiveTab('verificationAdmission'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'verificationAdmission'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              Verification Document & Final Admission
            </button>
          </div>
        </div>

        {/* Student Admission Section */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSection('studentAdmissionSection')}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-slate-400" />
              <span>Student Admission</span>
            </div>
            {openSections.studentAdmissionSection ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          <div className={`space-y-1 pl-11 pr-2 ${openSections.studentAdmissionSection ? 'block' : 'hidden'}`}>
            <button
              onClick={() => { setActiveTab('studentMaster'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'studentMaster'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              Student Master
            </button>
          </div>
        </div>

      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => {
            localStorage.removeItem('isAuthenticated');
            navigate('/login');
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer text-white bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Sidebar Footer Details */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-xs">
            AD
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Administrator</p>
            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Super Admin</span>
          </div>
        </div>
        {/* Dark Mode toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </aside>
  );
}
