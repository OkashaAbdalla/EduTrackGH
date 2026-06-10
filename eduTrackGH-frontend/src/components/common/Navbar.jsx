/**
 * Navbar Component
 * Purpose: Main navigation bar for public pages
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import ThemeSwitcher from './ThemeSwitcher';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#security', label: 'Security' },
  { href: '#about', label: 'About' },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 bg-white dark:bg-green-700 border-2 border-green-600 dark:border-transparent rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-6 h-6 text-green-600 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="text-gray-900 dark:text-white font-bold text-lg">EduTrack</span>
              <span className="text-green-600 dark:text-green-400 font-bold text-lg">GH</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
              >
                {link.label}
              </a>
            ))}
            <ThemeSwitcher />
            <Link
              to={ROUTES.LOGIN}
              className="px-4 py-2 border border-green-600 dark:border-green-700 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-600 dark:hover:bg-green-700 hover:text-white transition"
            >
              Support
            </Link>
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <ThemeSwitcher />
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
            >
              {link.label}
            </a>
          ))}
          <Link
            to={ROUTES.LOGIN}
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 font-medium"
          >
            Support / Log In
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
