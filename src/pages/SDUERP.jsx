import PageMeta from '@/components/PageMeta';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import SessionMaster from '@/components/SessionMaster';
import SubjectGroupMaster from '@/components/SubjectGroupMaster';
import SpecializationMaster from '@/components/SpecializationMaster';
import CodificationMaster from '@/components/CodificationMaster';
import FacultyMaster from '@/components/FacultyMaster';
import SubjectMaster from '@/components/SubjectMaster';
import CourseMaster from '@/components/CourseMaster';
import SessionCourseMapping from '@/components/SessionCourseMapping';
import CurriculumMapping from '@/components/CurriculumMapping';
import CountryMaster from '@/components/CountryMaster';
import StateMaster from '@/components/StateMaster';
import DistrictMaster from '@/components/DistrictMaster';
import CityTownMaster from '@/components/CityTownMaster';
import StudentAdmission from '@/components/StudentAdmission';
import EnrollCourse from '@/components/EnrollCourse';
import VerificationAdmission from '@/components/VerificationAdmission';
import StudentMaster from '@/components/StudentMaster';
import StudentCurriculumMapping from '@/components/StudentCurriculumMapping';
import Notification from '@/components/Notification';
import {
  Calendar,
  FolderGit,
  GraduationCap,
  Book,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

// Seed mock data for first-time visits
const SEED_SESSIONS = [
  {
    id: 's-1',
    fromYear: 2024,
    toYear: 2025,
    sessionYear: '2024-2025',
    duration: '1 Year',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 's-2',
    fromYear: 2025,
    toYear: 2026,
    sessionYear: '2025-2026',
    duration: '1 Year',
    status: 'Active',
    createdAt: new Date().toISOString(),
  }
];

const SEED_SUBJECT_GROUPS = [
  {
    id: 'g-1',
    code: 'SCI-MATH',
    name: 'Mathematics & Algebra',
    description: 'Core mathematics curriculum covering Algebra, Geometry, and Advanced Calculus.',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'g-2',
    code: 'CS-PROG',
    name: 'Computer Science & IT',
    description: 'Programming methodologies, software engineering, databases, and algorithms.',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'g-3',
    code: 'LANG-LIT',
    name: 'Language & Literature',
    description: 'English communication, writing composition, and global literature studies.',
    status: 'Inactive',
    createdAt: new Date().toISOString(),
  }
];

const SEED_SUBJECTS = [
  {
    id: 'sub-1',
    code: 'MATH101',
    name: 'Discrete Mathematics',
    subject_group_id: 'g-1',
    type: 'Major',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-2',
    code: 'PHY101',
    name: 'Classical Mechanics',
    subject_group_id: 'g-1',
    type: 'Major',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-3',
    code: 'ENG101',
    name: 'English Communication',
    subject_group_id: 'g-3',
    type: 'Minor',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-4',
    code: 'CHEM101',
    name: 'Organic Chemistry',
    subject_group_id: 'g-1',
    type: 'Major',
    status: 'Inactive',
    createdAt: new Date().toISOString(),
  }
];

const SEED_COURSES = [
  {
    id: 'c-1',
    code: 'CS-101',
    name: 'Introduction to Programming (Python)',
    subject_group_id: 'g-2',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c-2',
    code: 'MATH-201',
    name: 'Multivariable Calculus II',
    subject_group_id: 'g-1',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c-3',
    code: 'LIT-102',
    name: 'Classical Shakespearean Literature',
    subject_group_id: 'g-3',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c-4',
    code: 'CS-302',
    name: 'Machine Learning & Neural Networks',
    subject_group_id: 'g-2',
    status: 'Inactive',
    createdAt: new Date().toISOString(),
  }
];

const SEED_MAPPINGS = [
  {
    id: 'm-1',
    course_id: 'c-1',
    subject_id: 'sub-1',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm-2',
    course_id: 'c-2',
    subject_id: 'sub-2',
    status: 'Active',
    createdAt: new Date().toISOString(),
  }
];

const SEED_CODIFICATIONS = [
  {
    id: 'cod-1',
    code: 'MJ1',
    category: 'Major Subject',
    description: 'Major Subject - Semester I',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cod-2',
    code: 'MN1A',
    category: 'Minor Subject',
    description: 'Minor Subject Group A',
    status: 'Active',
    createdAt: new Date().toISOString(),
  }
];

const SEED_CURRICULUM_MAPPINGS = [
  {
    id: 'cm-1',
    session_id: 's-1',
    course_id: 'c-1',
    semester: 'Semester I',
    subject_id: 'sub-1',
    codification_id: 'cod-1',
    status: 'Active',
    createdAt: new Date().toISOString(),
  }
];

const TAB_LABELS = {
  dashboard: 'Dashboard',
  studentAdmission: 'Student Admission',
  sessions: 'Sessions',
  groups: 'Subject Groups',
  specializations: 'Specializations',
  codifications: 'Codifications',
  faculties: 'Faculty Master',
  subjects: 'Subjects',
  courses: 'Courses',
  sessionCourseMappings: 'Session Mapping',
  curriculum: 'Curriculum',
  countries: 'Country Master',
  states: 'State Master',
  districts: 'District Master',
  cityTowns: 'City/Town Master',
  studentMaster: 'Student Master',
  studentCurriculumMapping: 'Student Curriculum Mapping',
};

const SDUIndex = () => {
  const [sessions, setSessions] = useLocalStorage('sdu_sessions', SEED_SESSIONS);
  const [subjectGroups, setSubjectGroups] = useLocalStorage('sdu_subject_groups', SEED_SUBJECT_GROUPS);
  const [subjects, setSubjects] = useLocalStorage('sdu_subjects', SEED_SUBJECTS);
  const [courses, setCourses] = useLocalStorage('sdu_courses', SEED_COURSES);
  const [codifications, setCodifications] = useLocalStorage('sdu_codifications', SEED_CODIFICATIONS);
  const [sessionCourseMappings, setSessionCourseMappings] = useLocalStorage('sdu_session_course_mappings', []);
  const [curriculumMappings, setCurriculumMappings] = useLocalStorage('sdu_curriculum_mappings', SEED_CURRICULUM_MAPPINGS);

  const [countries, setCountries] = useLocalStorage('sdu_countries', []);
  const [states, setStates] = useLocalStorage('sdu_states', []);
  const [districts, setDistricts] = useLocalStorage('sdu_districts', []);
  const [cityTowns, setCityTowns] = useLocalStorage('sdu_city_towns', []);

  // Active navigation tab from URL
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const setActiveTab = (tab) => setSearchParams({ tab });


  // Notification state
  const [notification, setNotification] = useState({ message: '', type: 'success' });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const handleCloseNotification = () => {
    setNotification({ message: '', type: 'success' });
  };

  // Stats calculation
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => s.status === 'Active').length;
  const totalGroups = subjectGroups.length;
  const activeGroups = subjectGroups.filter(g => g.status === 'Active').length;
  const totalSubjects = subjects.length;
  const activeSubjects = subjects.filter(s => s.status === 'Active').length;
  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.status === 'Active').length;

  return (
    <>
      <PageMeta title="SDU ERP" />

      <div className="p-6 w-full mx-auto max-w-7xl 2xl:max-w-[1600px]">

        {/* Main conditional rendering of pages */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">

            {/* Dashboard Banner */}
            <div className="relative bg-gradient-to-r from-blue-800 via-blue-700 to-sky-700 text-white p-8 rounded-3xl overflow-hidden shadow-lg shadow-blue-800/10 border border-blue-900/10">
              <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center pointer-events-none">
                <GraduationCap className="w-80 h-80 transform translate-x-20 translate-y-10" />
              </div>
              <div className="relative z-10 max-w-xl">
                <span className="px-3 py-1 bg-blue-500/30 border border-blue-400/20 text-blue-100 rounded-full text-xs font-bold uppercase tracking-wider">
                  Welcome to SDU ERP
                </span>
                <h2 className="text-3xl font-extrabold mt-3 leading-tight tracking-tight">
                  Manage your curriculum masters efficiently.
                </h2>
                <p className="text-blue-100/85 text-sm mt-2 leading-relaxed">
                  Set up your Session years, group subjects into structured buckets, and manage your course catalogue. Changes are stored locally and immediately reactive.
                </p>
              </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Sessions</span>
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1.5">{totalSessions}</h3>
                  <span className="text-xs font-medium text-emerald-500 flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {activeSessions} Active
                  </span>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl text-blue-700 dark:text-blue-400">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Subject Groups</span>
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1.5">{totalGroups}</h3>
                  <span className="text-xs font-medium text-emerald-500 flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {activeGroups} Active
                  </span>
                </div>
                <div className="p-4 bg-sky-50 dark:bg-sky-950/30 rounded-2xl text-sky-700 dark:text-sky-400">
                  <FolderGit className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Subjects</span>
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1.5">{totalSubjects}</h3>
                  <span className="text-xs font-medium text-emerald-500 flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {activeSubjects} Active
                  </span>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl text-indigo-700 dark:text-indigo-400">
                  <Book className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Courses</span>
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1.5">{totalCourses}</h3>
                  <span className="text-xs font-medium text-emerald-500 flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {activeCourses} Active
                  </span>
                </div>
                <div className="p-4 bg-teal-50 dark:bg-teal-950/30 rounded-2xl text-teal-700 dark:text-teal-400">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick Actions & Hierarchy */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4 lg:col-span-1">
                <h3 className="text-md font-bold text-gray-800 dark:text-white">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('sessions')}
                    className="w-full flex items-center justify-between p-3.5 bg-blue-50/30 dark:bg-gray-900/30 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 rounded-xl transition-all text-left text-xs font-bold border border-blue-100/30 dark:border-blue-900/30 cursor-pointer group"
                  >
                    <span>Create New Session</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => setActiveTab('groups')}
                    className="w-full flex items-center justify-between p-3.5 bg-blue-50/30 dark:bg-gray-900/30 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 rounded-xl transition-all text-left text-xs font-bold border border-blue-100/30 dark:border-blue-900/30 cursor-pointer group"
                  >
                    <span>Define Subject Group</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => setActiveTab('courses')}
                    className="w-full flex items-center justify-between p-3.5 bg-blue-50/30 dark:bg-gray-900/30 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 rounded-xl transition-all text-left text-xs font-bold border border-blue-100/30 dark:border-blue-900/30 cursor-pointer group"
                  >
                    <span>Add Course Entry</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm lg:col-span-2 space-y-4">
                <h3 className="text-md font-bold text-gray-800 dark:text-white">ERP Relational Hierarchy</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Data validation rules are enforced natively across all masters to protect relational integrity:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-blue-50/20 dark:bg-gray-900/20 border border-blue-100/30 dark:border-blue-900/30 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">1</div>
                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 mt-2">Subject Group</h4>
                    <p className="text-[10px] text-gray-400 mt-1">Defines buckets like Science, Commerce, Language etc.</p>
                  </div>
                  <div className="p-4 bg-blue-50/20 dark:bg-gray-900/20 border border-blue-100/30 dark:border-blue-900/30 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs">2</div>
                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 mt-2">Courses</h4>
                    <p className="text-[10px] text-gray-400 mt-1">Requires group association. Displays the group name.</p>
                  </div>
                  <div className="p-4 bg-blue-50/20 dark:bg-gray-900/20 border border-blue-100/30 dark:border-blue-900/30 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs">3</div>
                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 mt-2">Validation Rules</h4>
                    <p className="text-[10px] text-gray-400 mt-1">Restricts course creation if no groups exist. Prevents group deletion if courses are linked.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'studentAdmission' && (
          <StudentAdmission
            showNotification={showNotification}
          />
        )}

        {activeTab === 'enrollCourse' && (
          <EnrollCourse
            showNotification={showNotification}
          />
        )}

        {activeTab === 'verificationAdmission' && (
          <VerificationAdmission
            showNotification={showNotification}
          />
        )}

        {activeTab === 'studentMaster' && (
          <StudentMaster />
        )}

        {activeTab === 'studentCurriculumMapping' && (
          <StudentCurriculumMapping showNotification={showNotification} />
        )}

        {activeTab === 'sessions' && (
          <SessionMaster
            sessions={sessions}
            setSessions={setSessions}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'groups' && (
          <SubjectGroupMaster
            subjectGroups={subjectGroups}
            setSubjectGroups={setSubjectGroups}
            courses={courses}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'specializations' && (
          <SpecializationMaster
            showNotification={showNotification}
          />
        )}

        {activeTab === 'faculties' && (
          <FacultyMaster
            setActiveTab={setActiveTab}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'codifications' && (
          <CodificationMaster
            codifications={codifications}
            setCodifications={setCodifications}
            setActiveTab={setActiveTab}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'subjects' && (
          <SubjectMaster
            subjects={subjects}
            setSubjects={setSubjects}
            subjectGroups={subjectGroups}
            setActiveTab={setActiveTab}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'courses' && (
          <CourseMaster
            courses={courses}
            setCourses={setCourses}
            subjectGroups={subjectGroups}
            setActiveTab={setActiveTab}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'countries' && (
          <CountryMaster
            countries={countries}
            setCountries={setCountries}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'states' && (
          <StateMaster
            states={states}
            setStates={setStates}
            countries={countries}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'districts' && (
          <DistrictMaster
            districts={districts}
            setDistricts={setDistricts}
            countries={countries}
            states={states}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'cityTowns' && (
          <CityTownMaster
            cityTowns={cityTowns}
            setCityTowns={setCityTowns}
            countries={countries}
            states={states}
            districts={districts}
            showNotification={showNotification}
          />
        )}


        {activeTab === 'sessionCourseMappings' && (
          <SessionCourseMapping
            mappings={sessionCourseMappings}
            setMappings={setSessionCourseMappings}
            sessions={sessions}
            courses={courses}
            setActiveTab={setActiveTab}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'curriculum' && (
          <CurriculumMapping
            curriculumMappings={curriculumMappings}
            setCurriculumMappings={setCurriculumMappings}
            sessions={sessions}
            courses={courses}
            subjects={subjects}
            codifications={codifications}
            setActiveTab={setActiveTab}
            showNotification={showNotification}
          />
        )}

      </div>

      {/* Floating Notifications */}
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={handleCloseNotification}
      />
    </>
  );
};

export default SDUIndex;
