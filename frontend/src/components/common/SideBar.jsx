import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, CreditCard, Settings, LogOut, Menu, X, 
  ChevronRight, User, ClipboardList, Package, Users, Wrench, FileCheck, 
  Calculator, TrendingUp, Hexagon, Shield // <--- Added Shield Icon
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SideBar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserExpanded, setIsUserExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // --- Resize & Scroll Handlers ---
  useEffect(() => {
    const handleResize = () => window.innerWidth >= 1024 && setIsMobileOpen(false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved === 'true') setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.classList.toggle('sidebar-collapsed', isCollapsed);
      localStorage.setItem('sidebar-collapsed', isCollapsed);
    }
  }, [isCollapsed]);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : 'unset';
  }, [isMobileOpen]);

  // --- Menu Data Structure (Categorized for UX) ---
  const menuGroups = [
    {
      title: "Overview",
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Reports', icon: TrendingUp, path: '/reports' },
      ]
    },
    {
      title: "Sales & Billing",
      items: [
        { label: 'Invoices', icon: FileText, path: '/invoices' },
        { label: 'Quotations', icon: ClipboardList, path: '/quotations' },
        { label: 'Payments', icon: CreditCard, path: '/payments' },
      ]
    },
    {
      title: "Operations",
      items: [
        { label: 'Clients', icon: Users, path: '/clients' },
        { label: 'Items & Services', icon: Wrench, path: '/items' },
        { label: 'BOM', icon: Package, path: '/bom' },
        
        // --- ADMIN ONLY MENU ITEM ---
        ...(user?.role === 'admin' ? [
          { label: 'User Management', icon: Shield, path: '/users' }
        ] : [])
      ]
    },
    {
      title: "Finance",
      items: [
        { label: 'Expenses', icon: Calculator, path: '/expenses' },
        { label: 'Purchase Orders', icon: FileCheck, path: '/purchase-orders' },
      ]
    },
  ];

  // Settings is usually standalone
  const bottomItems = [
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileOpen(false);
  };

  // --- Reusable Components ---

  const BrandLogo = ({ className = "h-10 w-10", iconSize = 20 }) => (
    <div className={`${className} bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform transition-all duration-300 group-hover:rotate-6 group-hover:scale-110`}>
      <Hexagon size={iconSize} className="text-white fill-indigo-400" strokeWidth={1.5} />
    </div>
  );

  const NavItem = ({ item }) => {
    const active = isActive(item.path);
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        onClick={() => setIsMobileOpen(false)}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 outline-none
          ${active 
            ? 'bg-gradient-to-r from-indigo-500/10 to-transparent text-indigo-400' 
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
          }
          ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : ''}
        `}
      >
        {/* Active Indicator Line */}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
        )}

        <Icon 
          size={20} 
          className={`shrink-0 transition-transform duration-200 ${!active && 'group-hover:scale-110'} ${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-200'}`} 
          strokeWidth={active ? 2 : 1.5}
        />
        
        {(!isCollapsed || isMobileOpen) && (
          <span className={`text-sm font-medium tracking-wide truncate transition-transform duration-300 ${!active && 'group-hover:translate-x-1'}`}>
            {item.label}
          </span>
        )}

        {/* Collapsed Tooltip */}
        {isCollapsed && !isMobileOpen && (
          <div className="fixed left-16 ml-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60] shadow-xl translate-x-2 group-hover:translate-x-0 duration-200 whitespace-nowrap">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* --- Mobile Header (Sticky & Clean) --- */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg active:scale-95 transition-transform"
          >
            <Menu size={24} />
          </button>
          
          <Link to="/" className="flex items-center gap-3 group">
            <BrandLogo className="h-9 w-9" iconSize={18} />
            <span className="font-bold text-slate-800 text-lg tracking-tight">BillFlow</span>
          </Link>
        </div>
      </div>

      {/* --- Mobile Overlay (Glassmorphism) --- */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden
          ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* --- Sidebar Main Container --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#0B1120] text-slate-300 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] flex flex-col border-r border-slate-800 shadow-2xl
          ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}
          ${isMobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* 1. Header Section */}
        <div className="h-16 lg:h-20 flex items-center justify-between px-4 lg:px-5 shrink-0 border-b border-slate-800/50">
          <Link 
            to="/" 
            className={`flex items-center gap-3 group overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}
            onClick={() => setIsMobileOpen(false)}
          >
            <BrandLogo className={isCollapsed ? "h-9 w-9" : "h-9 w-9"} iconSize={20} />

            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0 fade-in-up">
                <span className="font-bold text-white text-lg leading-none tracking-tight">BillFlow</span>
              </div>
            )}
          </Link>

          {/* Collapse Toggle (Desktop) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-6 h-6 text-slate-500 hover:text-white bg-slate-800/0 hover:bg-slate-800 rounded transition-all absolute -right-0 top-13 border border-slate-700 bg-[#0B1120] shadow-sm z-50"
          >
            <ChevronRight size={14} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>

           {/* Close Button (Mobile) */}
           <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              {(!isCollapsed || isMobileOpen) && (
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 select-none">
                  {group.title}
                </div>
              )}
              {/* Divider for collapsed state to separate groups visually */}
              {isCollapsed && !isMobileOpen && idx !== 0 && (
                <div className="my-3 mx-2 border-t border-slate-800" />
              )}
              
              <div className="space-y-0.5">
                {group.items.map((item) => <NavItem key={item.path} item={item} />)}
              </div>
            </div>
          ))}

          {/* Bottom Settings Group */}
          <div className="pt-2 border-t border-slate-800/50">
            <div className="space-y-0.5">
              {bottomItems.map((item) => <NavItem key={item.path} item={item} />)}
            </div>
          </div>

        </nav>

        {/* 3. User Profile Section (Glass Card Effect) */}
        <div className="p-3 shrink-0">
          <div className={`relative rounded-xl bg-slate-800/40 border border-slate-700/50 p-3 transition-all duration-300 ${isCollapsed && !isMobileOpen ? 'bg-transparent border-0 p-0' : ''}`}>

            <div className={`flex items-center gap-3 ${isCollapsed && !isMobileOpen ? 'flex-col justify-center' : ''}`}>

              {/* Avatar with Status Dot */}
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold shadow-inner">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
                </div>
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0B1120]" />
              </div>

              {(!isCollapsed || isMobileOpen) && (
                <div className="flex-1 min-w-0 overflow-hidden">
                  <button
                    onClick={() => setIsUserExpanded(!isUserExpanded)}
                    className="w-full text-left hover:bg-slate-700/30 rounded-md p-1 -m-1 transition-colors"
                  >
                    <p className="text-sm font-semibold text-slate-200 truncate">{user?.name || 'User'}</p>
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500 truncate">{user?.email || 'user@billflow.com'}</p>
                        {user?.role === 'admin' && (
                            <span className="text-[10px] bg-indigo-900/50 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/50">Admin</span>
                        )}
                    </div>
                  </button>

                  {/* Expanded User Details */}
                  {isUserExpanded && (
                    <div className="mt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {user?.mobile && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="w-3 h-3 rounded-full bg-slate-600 flex items-center justify-center text-[8px]">📱</span>
                          <span>{user.mobile}</span>
                        </div>
                      )}
                      {user?.company && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="w-3 h-3 rounded-full bg-slate-600 flex items-center justify-center text-[8px]">🏢</span>
                          <span>{user.company}</span>
                        </div>
                      )}
                      {user?.location && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="w-3 h-3 rounded-full bg-slate-600 flex items-center justify-center text-[8px]">📍</span>
                          <span>{user.location}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Button (Logout) */}
              <button
                onClick={handleLogout}
                className={`text-slate-400 hover:text-rose-400 transition-colors ${!isCollapsed || isMobileOpen ? 'hover:bg-slate-700/50 p-1.5 rounded-md' : 'mt-2'}`}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>

          </div>
        </div>

      </aside>
    </>
  );
};

export default SideBar;