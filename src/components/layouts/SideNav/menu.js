import {
  LuMonitorDot,
  LuCalendar,
  LuFolderGit,
  LuBook,
  LuBookOpen,
  LuHash,
  LuLayers,
  LuGitBranch,
  LuGlobe,
  LuMapPin,
  LuNavigation,
  LuBuilding2,
  LuUserCheck
} from 'react-icons/lu';

export const menuItemsData = [
  {
    key: 'Dashboard',
    label: 'Dashboard',
    icon: LuMonitorDot,
    href: '/sdu-erp'
  },
  {
    key: 'header-academic',
    isHeader: true,
    label: 'Academic Masters'
  },
  {
    key: 'Sessions',
    label: 'Session Master',
    icon: LuCalendar,
    href: '/sdu-erp?tab=sessions'
  },
  {
    key: 'Faculties',
    label: 'Faculty Master',
    icon: LuBookOpen,
    href: '/sdu-erp?tab=faculties'
  },
  {
    key: 'Groups',
    label: 'Subject Groups',
    icon: LuFolderGit,
    href: '/sdu-erp?tab=groups'
  },
  {
    key: 'Courses',
    label: 'Courses',
    icon: LuBookOpen,
    href: '/sdu-erp?tab=courses'
  },
  {
    key: 'Specializations',
    label: 'Specialization Master',
    icon: LuBookOpen,
    href: '/sdu-erp?tab=specializations'
  },
  {
    key: 'Codifications',
    label: 'Codifications',
    icon: LuHash,
    href: '/sdu-erp?tab=codifications'
  },
  {
    key: 'SessionMapping',
    label: 'Session Mapping',
    icon: LuGitBranch,
    href: '/sdu-erp?tab=sessionCourseMappings'
  },
  {
    key: 'Curriculum',
    label: 'Curriculum',
    icon: LuLayers,
    href: '/sdu-erp?tab=curriculum'
  },
  {
    key: 'Subjects',
    label: 'Subjects',
    icon: LuBook,
    href: '/sdu-erp?tab=subjects'
  },

  {
    key: 'header-location',
    isHeader: true,
    label: 'Location Masters'
  },
  {
    key: 'CountryMaster',
    label: 'Country Master',
    icon: LuGlobe,
    href: '/sdu-erp?tab=countries'
  },
  {
    key: 'StateMaster',
    label: 'State Master',
    icon: LuMapPin,
    href: '/sdu-erp?tab=states'
  },
  {
    key: 'DistrictMaster',
    label: 'District Master',
    icon: LuNavigation,
    href: '/sdu-erp?tab=districts'
  },
  {
    key: 'CityTownMaster',
    label: 'City / Town Master',
    icon: LuBuilding2,
    href: '/sdu-erp?tab=cityTowns'
  },
  {
    key: 'header-student',
    isHeader: true,
    label: 'Admission Process'
  },
  {
    key: 'StudentAdmission',
    label: 'Enroll Process',
    icon: LuUserCheck,
    href: '/sdu-erp?tab=studentAdmission'
  },
  {
    key: 'EnrollCourse',
    label: 'Enroll Course',
    icon: LuBookOpen,
    href: '/sdu-erp?tab=enrollCourse'
  },
  {
    key: 'VerificationAdmission',
    label: 'Verification Document & Final Admission',
    icon: LuUserCheck,
    href: '/sdu-erp?tab=verificationAdmission'
  },
  {
    key: 'header-student-admission',
    isHeader: true,
    label: 'Student Admission'
  },
  {
    key: 'StudentMaster',
    label: 'Student Master',
    icon: LuUserCheck,
    href: '/sdu-erp?tab=studentMaster'
  },
  {
    key: 'StudentCurriculumMapping',
    label: 'Student Curriculum Mapping',
    icon: LuGitBranch,
    href: '/sdu-erp?tab=studentCurriculumMapping'
  }
];