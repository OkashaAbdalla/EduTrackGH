/**
 * Footer Component
 * Purpose: Footer with links and copyright
 */

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <a href="#" className="hover:text-green-600 dark:hover:text-green-400 transition">Privacy Policy</a>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <a href="#" className="hover:text-green-600 dark:hover:text-green-400 transition">Terms of Service</a>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">© 2024 EduTrack GH. Built for basic schools.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
