import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { menuItemsData } from './menu';
import { LuChevronDown, LuChevronUp, LuFolder, LuBookOpen, LuLink, LuGlobe, LuUsers } from 'react-icons/lu';

const MenuItem = ({ item, isActive }) => {
  const Icon = item.icon;

  return (
    <li className={`menu-item ${isActive ? 'active' : ''}`}>
      <Link
        to={item.href ?? '#'}
        className={`menu-link w-full transition-all rounded-xl ${isActive
          ? '!bg-blue-50 dark:!bg-blue-950/40 !text-blue-600 dark:!text-blue-400'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:!bg-slate-50 dark:hover:!bg-slate-800/60'
          }`}
      >
        {Icon && (
          <span className="menu-icon">
            <Icon className="w-5 h-5" />
          </span>
        )}
        <span className="menu-text text-sm font-semibold truncate">{item.label}</span>
      </Link>
    </li>
  );
};

const AppMenu = () => {
  const { pathname, search } = useLocation();
  const currentUrl = pathname + search;

  const isItemActive = (item) => {
    return currentUrl === item.href || (item.href === '/sdu-erp' && (pathname === '/sdu-erp' || pathname === '/') && !search);
  };

  // Convert flat list to grouped structure based on headers
  const groupedMenu = [];
  let currentGroup = null;

  menuItemsData.forEach(item => {
    if (item.isHeader) {
      currentGroup = { ...item, children: [] };
      groupedMenu.push(currentGroup);
    } else if (currentGroup) {
      currentGroup.children.push(item);
    } else {
      groupedMenu.push(item);
    }
  });

  const [openGroups, setOpenGroups] = useState(() => {
    const initialState = {};
    groupedMenu.forEach(group => {
      if (group.isHeader && group.children) {
        if (group.key === 'header-academic' || group.children.some(child => isItemActive(child))) {
          initialState[group.key] = true;
        }
      }
    });
    return initialState;
  });

  const toggleGroup = (key) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getHeaderIcon = (label) => {
    if (label.includes('Academic')) return <LuBookOpen />;
    if (label.includes('Mapping')) return <LuLink />;
    if (label.includes('Location')) return <LuGlobe />;
    if (label.includes('Student')) return <LuUsers />;
    return <LuFolder />;
  };

  return (
    <ul className="side-nav p-3 space-y-1.5">
      {groupedMenu.map((group) => {
        if (group.isHeader) {
          const isOpen = openGroups[group.key];
          return (
            <li key={group.key} className={`menu-item ${isOpen ? 'active' : ''}`}>
              <button
                onClick={() => toggleGroup(group.key)}
                className="menu-link w-full rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="menu-icon text-xl text-slate-500">
                  {getHeaderIcon(group.label)}
                </span>
                <span className="menu-text text-sm font-extrabold text-slate-700 dark:text-slate-200 truncate whitespace-nowrap">
                  {group.label}
                </span>
                <span className="menu-arrow">
                  {isOpen ? <LuChevronUp className="w-4 h-4 text-slate-400" /> : <LuChevronDown className="w-4 h-4 text-slate-400" />}
                </span>
              </button>

              <ul className={`sub-menu transition-all ${isOpen ? 'block' : 'hidden'}`}>
                {group.children.map(child => (
                  <MenuItem key={child.key} item={child} isActive={isItemActive(child)} />
                ))}
              </ul>
            </li>
          );
        }
        return <MenuItem key={group.key} item={group} isActive={isItemActive(group)} />;
      })}
    </ul>
  );
};

export default AppMenu;