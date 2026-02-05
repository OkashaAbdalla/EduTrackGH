/**
 * Navbar Component
 * Purpose: Main navigation bar for public pages
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import ThemeSwitcher from './ThemeSwitcher';

const Navbar = () => {
  return (
    <nav className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white dark:bg-green-700 border-2 border-green-600 dark:border-transparent rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-green-600 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="text-gray-900 dark:text-white font-bold text-lg">EduTrack</span>
              <span className="text-green-600 dark:text-green-400 font-bold text-lg">GH</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">Features</a>
            <a href="#security" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">Security</a>
            <a href="#about" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">About</a>
            <ThemeSwitcher />
            <Link to={ROUTES.LOGIN} className="px-4 py-2 border border-green-600 dark:border-green-700 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-600 dark:hover:bg-green-700 hover:text-white transition">
              Support
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            <ThemeSwitcher />
            <button className="text-gray-600 dark:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

