import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  LayoutDashboard,
  Car,
  FileText,
  Calendar,
  Bell,
  History,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Garage', path: '/vehicles', icon: Car },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Alerts', path: '/notifications', icon: Bell },
    { name: 'History', path: '/renewals', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (isAdmin) {
    navLinks.push({ name: 'Admin Console', path: '/admin', icon: ShieldCheck, highlight: true });
  }

  // Mobile Bottom Navigation Bar Links (Top 5 primary mobile destinations)
  const mobileBottomBarLinks = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Garage', path: '/vehicles', icon: Car },
    { name: 'Add', path: '/vehicles/new', icon: PlusCircle, isAction: true },
    { name: 'Docs', path: '/documents', icon: FileText },
    { name: 'Alerts', path: '/notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen flex bg-zinc-50 text-zinc-900 pb-20 lg:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-zinc-900 text-zinc-100 flex-shrink-0 border-r border-zinc-800 shadow-xl">
        <div className="p-6 border-b border-zinc-800/80">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                VehicleGuard <span className="text-amber-400">LK</span>
              </span>
              <p className="text-[11px] text-amber-200/70 font-medium">Compliance Platform</p>
            </div>
          </Link>
        </div>

        {/* Desktop Quick Add Button */}
        <div className="px-5 pt-5 pb-2">
          <Link
            to="/vehicles/new"
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/20 active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4 text-zinc-950" />
            <span>Add Vehicle</span>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-950/40'
                      : link.highlight
                        ? 'text-amber-400 hover:bg-zinc-800 hover:text-amber-300'
                        : 'text-zinc-300 hover:bg-zinc-800/90 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sri Lanka Official Portal link */}
        <div className="p-4 mx-4 mb-4 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-xs">
          <div className="flex items-center justify-between text-zinc-300 mb-1">
            <span className="font-semibold text-amber-200">Gov.lk e-Services</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-zinc-400 text-[11px] mb-2 leading-relaxed">
            Direct online vehicle revenue license renewal portal.
          </p>
          <a
            href="https://eservices.motortraffic.gov.lk/"
            target="_blank"
            rel="noreferrer"
            className="text-amber-400 hover:text-amber-300 font-bold inline-block text-[11px] underline"
          >
            Visit Official Portal &rarr;
          </a>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-zinc-800/80 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-500/30 flex-shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-amber-300/70 truncate">
                {user?.role === 'ADMIN' ? 'Administrator' : 'Vehicle Owner'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile-Friendly App Top Header */}
        <header className="bg-white/95 backdrop-blur border-b border-zinc-200 px-4 py-3 sm:py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-1 rounded-xl text-zinc-700 hover:bg-zinc-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-500/20">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-base sm:text-lg text-zinc-900 tracking-tight">
                VehicleGuard <span className="text-amber-600">LK</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link
              to="/notifications"
              className="p-2 text-zinc-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </Link>
            <Link
              to="/settings"
              className="flex items-center space-x-2 p-1 pl-1.5 rounded-full hover:bg-zinc-100 transition-colors"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center border border-amber-300">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            </Link>
          </div>
        </header>

        {/* Mobile Slide-down Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-zinc-900/98 backdrop-blur text-white border-b border-zinc-800 px-4 py-3 space-y-1.5 animate-slide-down">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                      isActive ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-rose-400 hover:bg-zinc-800 mt-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-50/90">
          <Outlet />
        </main>

        {/* Native-style Mobile Bottom Navigation Tab Bar (Visible only on mobile/tablet) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb">
          {mobileBottomBarLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            if (item.isAction) {
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex flex-col items-center justify-center -mt-5"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-500/40 border-2 border-zinc-950 active:scale-95 transition-transform">
                    <Icon className="w-6 h-6 text-zinc-950" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 mt-1">{item.name}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  isActive ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                <span className="text-[10px] mt-1">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
