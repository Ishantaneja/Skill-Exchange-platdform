import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const userInitial = user?.email?.charAt(0)?.toUpperCase() || 'U';

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-200/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 shadow-sm" />
              <span className="text-lg font-bold text-gray-900 tracking-tight">SkillBridge</span>
            </NavLink>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/" end className={linkClass}>Home</NavLink>
              <NavLink to="/skills" className={linkClass}>Skills</NavLink>
              <NavLink to="/chat" className={linkClass}>Chat</NavLink>
              {user && (
                <>
                  <NavLink to="/requests" className={linkClass}>Requests</NavLink>
                  <NavLink to="/sessions" className={linkClass}>Sessions</NavLink>
                  <NavLink to="/profile" className={linkClass}>Profile</NavLink>
                </>
              )}
            </div>

            {/* Desktop Right */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
                      {userInitial}
                    </div>
                    <span className="text-sm text-gray-500 max-w-[180px] truncate hidden lg:inline">
                      {user.email}
                    </span>
                  </div>
                  <div className="w-px h-5 bg-gray-200" />
                  <button
                    onClick={logout}
                    className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors duration-200"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
                >
                  Sign In
                </NavLink>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 -mr-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1 shadow-lg">
            <NavLink to="/" end className={linkClass} onClick={() => setMobileOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/skills" className={linkClass} onClick={() => setMobileOpen(false)}>
              Skills
            </NavLink>
            <NavLink to="/chat" className={linkClass} onClick={() => setMobileOpen(false)}>
              Chat
            </NavLink>
            {user ? (
              <>
                <NavLink to="/requests" className={linkClass} onClick={() => setMobileOpen(false)}>
                  Requests
                </NavLink>
                <NavLink to="/sessions" className={linkClass} onClick={() => setMobileOpen(false)}>
                  Sessions
                </NavLink>
                <NavLink to="/profile" className={linkClass} onClick={() => setMobileOpen(false)}>
                  Profile
                </NavLink>
                <div className="pt-3 mt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                      {userInitial}
                    </div>
                    <span className="text-sm text-gray-500 truncate">{user.email}</span>
                  </div>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                  >
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <NavLink to="/login" className={linkClass} onClick={() => setMobileOpen(false)}>
                Sign In
              </NavLink>
            )}
          </div>
        )}
      </nav>

      {/* ── Main Content ── */}
      <main>{children}</main>
    </div>
  );
}
