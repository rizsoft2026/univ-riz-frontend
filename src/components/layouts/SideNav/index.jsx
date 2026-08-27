import { Link } from 'react-router';
import SimplebarClient from '@/components/client-wrapper/SimplebarClient';
import AppMenu from './AppMenu';
import HoverToggle from './HoverToggle';
import logoDark from '@/assets/images/logo-dark.png';
import logoLight from '@/assets/images/logo-light.png';
import logoSm from '@/assets/images/logo-sm.png';
import { GraduationCap, LogOut } from 'lucide-react';

const Sidebar = () => {
  return <aside id="app-menu" className="app-menu">
    <Link to="/" className="logo-box sticky top-0 flex min-h-topbar-height items-center justify-start px-6 backdrop-blur-xs gap-2.5">
      <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-500/20 flex-shrink-0">
        <GraduationCap className="w-5 h-5" />
      </div>
      <div className="logo-lg flex flex-col justify-center">
        <h1 className="text-xl font-extrabold text-slate-800 dark:text-white leading-none tracking-tight">UNIV-RIZ</h1>
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Portal</span>
      </div>
    </Link>

    <HoverToggle />

    <div className="relative min-h-0 flex-grow">
      <SimplebarClient className="size-full">
        <AppMenu />
      </SimplebarClient>
    </div>

    {/* Logout Section */}
    <div className="p-4 border-t border-slate-200 dark:border-slate-800">
      <button
        onClick={() => {
          localStorage.removeItem('isAuthenticated');
          window.location.href = '/login';
        }}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer text-white bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  </aside>;
};
export default Sidebar;